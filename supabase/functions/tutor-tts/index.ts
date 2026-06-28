// Tutor TTS — Lovable AI Gateway (openai/gpt-4o-mini-tts, voice: ash).
// Streams MP3 back to the client so the existing <audio> playback pipeline
// (useVoiceLoop) works unchanged across desktop and mobile.
//
// DAY 1 CACHE: when the client passes `cacheable: true` (currently only Day 1
// static teaching beats), the synthesised MP3 is persisted to Supabase Storage
// (bucket `tutor-tts-cache`) keyed by sha256(voice+model+spoken text). Repeat
// requests for the same text are served from storage with no upstream TTS
// call — eliminating regeneration of Day 1 audio across sessions/students and
// dramatically reducing TTS credit usage. Streaming requests and any
// non-cacheable request (corrections, doubts, dynamic praise) still go live.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { normalizeForTts, type TutorVoiceGender } from '../_shared/ttsNormalize.ts';

// Primary: OpenAI direct (Ash voice via gpt-4o-mini-tts). The Lovable AI
// Gateway was returning 402 "Not enough credits" which caused the Day 1
// "Voice hiccup" toast on every beat. We now call OpenAI directly with the
// existing OPENAI_API_KEY secret. Lovable gateway is kept as a fallback only.
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Single locked voice across desktop, mobile, start, resume, and retake.
const VOICE_ID = 'ash';
const VOICE_LABEL = 'Ash (openai gpt-4o-mini-tts - primary)';
const VOICE_GENDER: TutorVoiceGender = 'male';
const OPENAI_TTS_MODEL = 'gpt-4o-mini-tts';
const TTS_MODEL = 'openai/gpt-4o-mini-tts';
const TTS_SPEED = 1.4;
const CACHE_BUCKET = 'tutor-tts-cache';
const CACHE_VERSION = 'v1';

// Defensive: strip any non-ASCII from a string before using it as a header value.
const asciiHeader = (s: string) => s.replace(/[^\x20-\x7E]/g, '-');

const supabaseAdmin = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })
  : null;

let bucketEnsured = false;
async function ensureBucket() {
  if (bucketEnsured || !supabaseAdmin) return;
  try {
    const { data, error } = await supabaseAdmin.storage.getBucket(CACHE_BUCKET);
    if (!data && error) {
      await supabaseAdmin.storage.createBucket(CACHE_BUCKET, { public: false });
    }
  } catch (e) {
    // If the bucket already exists or RPC hiccups, we still mark as ensured —
    // subsequent download/upload calls will surface real errors.
    console.warn('[tutor-tts] ensureBucket warning', e);
  }
  bucketEnsured = true;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cacheKeyFor(spoken: string, hash: string) {
  return `${CACHE_VERSION}/${VOICE_ID}/${TTS_MODEL.replace(/[^a-z0-9._-]/gi, '_')}/${hash}.mp3`;
}

async function readCached(key: string): Promise<Uint8Array | null> {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin.storage.from(CACHE_BUCKET).download(key);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  } catch {
    return null;
  }
}

async function writeCached(key: string, bytes: Uint8Array): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.storage.from(CACHE_BUCKET).upload(
      key,
      new Blob([bytes], { type: 'audio/mpeg' }),
      { contentType: 'audio/mpeg', upsert: true, cacheControl: '31536000' },
    );
  } catch (e) {
    console.warn('[tutor-tts] cache write failed', e);
  }
}

const INSTRUCTIONS =
  'You are a warm, energetic, professional English tutor in a live one-on-one spoken lesson with an Indian student. ' +
  'Read the ENTIRE input as ONE continuous spoken thought from first word to last — never as separate clips or a list of sentences. ' +
  'Start the very first word immediately with zero opening silence, and finish cleanly with no trailing silence. ' +
  'Between sentences and explanation clauses keep only the tiniest natural beat (well under 200ms) — never a dramatic pause, never a paragraph break, never a stop, never a gap that sounds like the recording restarted. ' +
  'Pace: brisk and lively, but every word fully and clearly pronounced — never slur, drop, skip, or trail off. ' +
  'Voice: natural, friendly, confident, neutral clear English with excellent Hinglish pronunciation. No robotic delivery, no foreign accent, consistent volume from first word to last.';

async function synthOpenAI(text: string, stream = false, signal?: AbortSignal) {
  return await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      input: text,
      voice: VOICE_ID,
      response_format: stream ? 'pcm' : 'mp3',
      ...(stream ? { stream_format: 'sse' } : {}),
      speed: TTS_SPEED,
      instructions: INSTRUCTIONS,
    }),
    signal,
  });
}

async function synthLovable(text: string, stream = false, signal?: AbortSignal) {
  return await fetch('https://ai.gateway.lovable.dev/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: text,
      voice: VOICE_ID,
      response_format: stream ? 'pcm' : 'mp3',
      ...(stream ? { stream_format: 'sse' } : {}),
      speed: TTS_SPEED,
      instructions: INSTRUCTIONS,
    }),
    signal,
  });
}

async function synthWithRetry(text: string, stream = false, signal?: AbortSignal) {
  // Prefer OpenAI direct (the Lovable gateway is returning 402 for this
  // workspace). Fall back to the Lovable gateway only if OpenAI is not
  // configured or hard-fails.
  const tryOnce = async (fn: typeof synthOpenAI) => {
    let r = await fn(text, stream, signal);
    if (r.ok) return r;
    if (r.status >= 500 || r.status === 408 || r.status === 429) {
      console.warn(`[tutor-tts] retrying ${fn === synthOpenAI ? 'openai' : 'lovable'} after status=${r.status}`);
      await new Promise((res) => setTimeout(res, 250));
      r = await fn(text, stream, signal);
    }
    return r;
  };

  if (OPENAI_API_KEY) {
    const r = await tryOnce(synthOpenAI);
    if (r.ok) return r;
    const detail = await r.clone().text().catch(() => '');
    console.warn(`[tutor-tts] openai failed status=${r.status} body=${detail.slice(0, 200)}`);
    if (LOVABLE_API_KEY) {
      console.warn('[tutor-tts] falling back to Lovable gateway');
      return await tryOnce(synthLovable);
    }
    return r;
  }
  if (LOVABLE_API_KEY) return await tryOnce(synthLovable);
  return new Response('no tts provider configured', { status: 500 });
}

function buildAudioResponse(body: BodyInit, spokenB64: string, cacheStatus: 'hit' | 'miss' | 'bypass', stream: boolean) {
  return new Response(body, {
    headers: {
      ...corsHeaders,
      'Content-Type': stream ? 'text/event-stream' : 'audio/mpeg',
      'Cache-Control': stream
        ? 'no-store, no-transform'
        : (cacheStatus === 'hit' ? 'public, max-age=31536000, immutable' : 'no-store'),
      'X-Voice-Used': asciiHeader(VOICE_LABEL),
      'X-Voice-Id': asciiHeader(VOICE_ID),
      'X-Voice-Gender': VOICE_GENDER,
      'X-Spoken-Text-B64': spokenB64,
      'X-TTS-Cache': cacheStatus,
      'Access-Control-Expose-Headers': 'X-Voice-Used, X-Voice-Id, X-Voice-Gender, X-Spoken-Text-B64, X-TTS-Cache',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!OPENAI_API_KEY && !LOVABLE_API_KEY) {
      console.error('[tutor-tts] no TTS provider key configured (OPENAI_API_KEY/LOVABLE_API_KEY)');
      return new Response(JSON.stringify({ fallback: true, error: 'tts_not_configured' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const body = await req.json();
    const text: string = body?.text;
    const strict: boolean = body?.strict === true;
    const stream: boolean = body?.stream === true;
    const cacheable: boolean = body?.cacheable === true && !stream;
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const spoken = strict ? text : normalizeForTts(text, VOICE_GENDER);
    const spokenB64 = btoa(unescape(encodeURIComponent(spoken)));
    console.log(`[tutor-tts][SYNC] stream=${stream} strict=${strict} cacheable=${cacheable} input_len=${text.length} spoken_len=${spoken.length}`);

    // ── CACHE READ (Day 1 only — gated by cacheable flag from client) ──
    let cacheKey: string | null = null;
    if (cacheable) {
      await ensureBucket();
      const hash = await sha256Hex(`${VOICE_ID}|${TTS_MODEL}|${TTS_SPEED}|${spoken}`);
      cacheKey = cacheKeyFor(spoken, hash);
      const cachedBytes = await readCached(cacheKey);
      if (cachedBytes && cachedBytes.byteLength > 0) {
        console.log(`[tutor-tts] cache HIT key=${cacheKey} bytes=${cachedBytes.byteLength}`);
        return buildAudioResponse(cachedBytes, spokenB64, 'hit', false);
      }
      console.log(`[tutor-tts] cache MISS key=${cacheKey}`);
    }

    const r = await synthWithRetry(spoken, stream, req.signal);
    if (r.ok && r.body) {
      console.log(`[tutor-tts] voice=${VOICE_LABEL} gender=${VOICE_GENDER} ok cacheable=${cacheable}`);
      // Cacheable path: buffer the MP3, persist to storage, then return the bytes.
      if (cacheable && cacheKey) {
        const bytes = new Uint8Array(await r.arrayBuffer());
        // Fire-and-forget write so first request isn't slowed by upload.
        writeCached(cacheKey, bytes).catch((e) => console.warn('[tutor-tts] async cache write', e));
        return buildAudioResponse(bytes, spokenB64, 'miss', false);
      }
      return buildAudioResponse(r.body, spokenB64, 'bypass', stream);
    }

    const detail = await r.text().catch(() => '');
    console.error(`[tutor-tts] failed status=${r.status} body=${detail.slice(0, 400)}`);
    // Return 200 + fallback flag so the client can keep the lesson flowing
    // instead of throwing "Audio Unavailable" and stalling the loop.
    return new Response(JSON.stringify({ fallback: true, error: 'tts_upstream', status: r.status }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[tutor-tts] exception', e);
    return new Response(JSON.stringify({ fallback: true, error: String(e) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
