// Tutor TTS — Lovable AI Gateway (openai/gpt-4o-mini-tts, voice: ash).
// Streams MP3 back to the client so the existing <audio> playback pipeline
// (useVoiceLoop) works unchanged across desktop and mobile.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { normalizeForTts, type TutorVoiceGender } from '../_shared/ttsNormalize.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

// Single locked voice across desktop, mobile, start, resume, and retake.
// Ash is treated as male so the shared normalizer keeps Hinglish verb forms
// (karunga, etc.) consistent with the previous George configuration.
const VOICE_ID = 'ash';
const VOICE_LABEL = 'Ash (openai gpt-4o-mini-tts - primary)';
const VOICE_GENDER: TutorVoiceGender = 'male';
const TTS_MODEL = 'openai/gpt-4o-mini-tts';

// Defensive: strip any non-ASCII from a string before using it as a header value.
const asciiHeader = (s: string) => s.replace(/[^\x20-\x7E]/g, '-');

async function synth(text: string, stream = false, signal?: AbortSignal) {
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
      speed: 1.4,
      instructions:
        'You are a warm, energetic, professional English tutor in a live one-on-one spoken lesson with an Indian student. ' +
        'Read the ENTIRE input as ONE continuous spoken thought from first word to last — never as separate clips or a list of sentences. ' +
        'Start the very first word immediately with zero opening silence, and finish cleanly with no trailing silence. ' +
        'Between sentences and explanation clauses keep only the tiniest natural beat (well under 200ms) — never a dramatic pause, never a paragraph break, never a stop, never a gap that sounds like the recording restarted. ' +
        'Pace: brisk and lively, but every word fully and clearly pronounced — never slur, drop, skip, or trail off. ' +
        'Voice: natural, friendly, confident, neutral clear English with excellent Hinglish pronunciation. No robotic delivery, no foreign accent, consistent volume from first word to last.',
    }),
    signal,
  });
}

async function synthWithRetry(text: string, stream = false, signal?: AbortSignal) {
  // One automatic retry on transient upstream failure (5xx / network).
  let r = await synth(text, stream, signal);
  if (r.ok) return r;
  const status = r.status;
  if (status >= 500 || status === 408 || status === 429) {
    console.warn(`[tutor-tts] retrying after status=${status}`);
    await new Promise((res) => setTimeout(res, 250));
    r = await synth(text, stream, signal);
  }
  return r;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) {
      console.error('[tutor-tts] LOVABLE_API_KEY missing');
      // 200 + fallback so the client can degrade gracefully instead of stalling the lesson.
      return new Response(JSON.stringify({ fallback: true, error: 'tts_not_configured' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const body = await req.json();
    const text: string = body?.text;
    const strict: boolean = body?.strict === true;
    const stream: boolean = body?.stream === true;
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const spoken = strict ? text : normalizeForTts(text, VOICE_GENDER);
    console.log(`[tutor-tts][SYNC] stream=${stream} strict=${strict} input_len=${text.length} spoken_len=${spoken.length} input_words=${(text.match(/\S+/g)||[]).length} spoken_words=${(spoken.match(/\S+/g)||[]).length}`);

    const r = await synthWithRetry(spoken, stream, req.signal);
    if (r.ok && r.body) {
      console.log(`[tutor-tts] voice=${VOICE_LABEL} gender=${VOICE_GENDER} ok`);
      const spokenB64 = btoa(unescape(encodeURIComponent(spoken)));
      return new Response(r.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': stream ? 'text/event-stream' : 'audio/mpeg',
          'Cache-Control': stream ? 'no-store, no-transform' : 'no-store',
          'X-Voice-Used': asciiHeader(VOICE_LABEL),
          'X-Voice-Id': asciiHeader(VOICE_ID),
          'X-Voice-Gender': VOICE_GENDER,
          'X-Spoken-Text-B64': spokenB64,
          'Access-Control-Expose-Headers': 'X-Voice-Used, X-Voice-Id, X-Voice-Gender, X-Spoken-Text-B64',
        },
      });
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
