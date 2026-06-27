import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { applyVoiceGender } from '@/lib/tts/normalize';

type Status = 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused';
export type LessonState =
  | 'IDLE'
  | 'INTRODUCTION'
  | 'EXPLANATION'
  | 'QUESTION'
  | 'WAITING_FOR_STUDENT'
  | 'CORRECTING_ANSWER'
  | 'NEXT_QUESTION'
  | 'PAUSED';

const SUPA_FN = 'https://rfvgznythdlmmbtfbpzc.supabase.co/functions/v1';

const TTS_LEADING_SILENCE_MS = 30;
const TTS_INTERNAL_SILENCE_MS = 180;
const TTS_TRAILING_SILENCE_MS = 50;
const TTS_SILENCE_FRAME_MS = 10;
const TTS_SILENCE_RMS_THRESHOLD = 0.0075;
const STREAM_TTS_SAMPLE_RATE = 24000;

type PreparedTtsAudio = {
  text: string;
  url: string;
  contentType: string;
  optimized: boolean;
  durationMs: number;
  createdAt: number;
};

type PrefetchedNextBeat = {
  chat: Promise<any>;
  audio: Promise<PreparedTtsAudio | null>;
};

/**
 * Strip placeholder / formatting artifacts that the model sometimes leaves in
 * lesson copy ("Good job ........... Ayan", "---", "____", "***"). These read
 * out loud as "dot dot dot dot" in TTS and ruin the lesson. We sanitize only
 * the text sent to TTS; the on-screen caption keeps the original.
 *
 * Rules:
 *  - Collapse runs of dots (>=2) → single space (so "Good job .... Ayan" → "Good job Ayan").
 *    A SINGLE "." stays so normal sentence endings are preserved.
 *  - Collapse runs of dashes/underscores/asterisks/tildes/equals (>=2) → space.
 *  - Strip stray decorative chars: •, ►, ▶, ★, ☆, ■, □, ●, ○, ▪, ▫.
 *  - Collapse repeated whitespace, trim.
 */
export function sanitizeForTts(input: string): string {
  if (!input) return '';
  let s = input;
  // Repeated dots: 2 or more → space (handles "..", "...", "...........")
  s = s.replace(/\.{2,}/g, ' ');
  // Unicode horizontal ellipsis
  s = s.replace(/\u2026+/g, ' ');
  // Repeated dashes / en/em dashes / underscores / asterisks / tildes / equals (2+)
  s = s.replace(/[-\u2013\u2014_*~=]{2,}/g, ' ');
  // Decorative bullets / arrows
  s = s.replace(/[\u2022\u25BA\u25B6\u2605\u2606\u25A0\u25A1\u25CF\u25CB\u25AA\u25AB]/g, ' ');
  // Markdown-ish leftovers (#, >) at line starts
  s = s.replace(/(^|\n)\s*[#>]+\s*/g, '$1');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  // Tidy a leftover " ," or " ." created by the strips above
  s = s.replace(/\s+([,.;:!?])/g, '$1');
  return s;
}

export function useVoiceLoop(opts: {
  sessionId: string | null;
  chapterId: string | null;
  onAssistantText: (text: string) => void;
  onUserText: (text: string) => void;
  onComplete: () => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onTtsFailure?: () => void;
  onDebug?: (patch: Record<string, string>) => void;
  onLessonStateChange?: (state: LessonState) => void;
  onCorrections?: (corrections: any) => void;
  onMicLevel?: (level: number) => void;
  onStudentAudio?: (blob: Blob) => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [lessonState, setLessonStateRaw] = useState<LessonState>('IDLE');
  const [paused, setPaused] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const lessonStateCb = opts.onLessonStateChange;
  const micCb = opts.onMicLevel;
  const setLessonState = useCallback((s: LessonState) => {
    setLessonStateRaw(s);
    lessonStateCb?.(s);
  }, [lessonStateCb]);
  const [muted, setMuted] = useState(false);


  // Speaker on/off. We play the ElevenLabs MP3 natively through the <audio>
  // element on every device — no Web Audio compressor or gain stage. The
  // previous mobile boost graph (compressor threshold -20dB / ratio 4:1 + 2.6x
  // gain) was squashing speech dynamics and clipping, which made mobile
  // playback sound muddy and unintelligible even though the source MP3 is
  // identical to desktop. Native playback gives mobile the same clean audio
  // desktop already has.
  const [speakerOn, setSpeakerOn] = useState(true);
  const speakerOnRef = useRef(true);
  const ttsGainRef = useRef<GainNode | null>(null);
  const ttsSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppedRef = useRef(false);
  const pausedRef = useRef(false);
  const discardNextBlobRef = useRef(false);
  const speakingRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const maxRecTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastAssistantRef = useRef<string>('');
  const lastWaitingRef = useRef<boolean>(false);
  // Silent media element + URL — keeps the iOS/Android audio session in the
  // "media playback" category so SpeechSynthesis routes to the LOUD SPEAKER
  // instead of the earpiece while a mic stream is active.
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const silentUrlRef = useRef<string | null>(null);
  // AbortController for any in-flight tutor-tts fetch. On Exit / stop we abort
  // it so a late-arriving audio blob can NEVER be turned into a fresh <audio>
  // element that plays after the user has left the classroom.
  const ttsAbortRef = useRef<AbortController | null>(null);
  const ttsAbortControllersRef = useRef<Set<AbortController>>(new Set());
  const preparedTtsUrlsRef = useRef<Set<string>>(new Set());
  const ttsStreamAbortRef = useRef<AbortController | null>(null);
  const ttsStreamSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const ttsStreamGainRef = useRef<GainNode | null>(null);
  const prefetchedQueueRef = useRef<PrefetchedNextBeat[]>([]);
  const prefetchTailRef = useRef<Promise<void> | null>(null);
  // Every <audio> element we ever construct for TTS playback goes in here.
  // cleanup() iterates the set and pauses/detaches each one — this closes
  // the race where speak() creates a fresh Audio AFTER cleanup has already
  // nulled ttsAudioRef.current, leaving an orphan element playing in the
  // background that no ref could reach.
  const allTtsAudioElsRef = useRef<Set<HTMLAudioElement>>(new Set());

  const stopStreamingTts = () => {
    if (ttsStreamAbortRef.current) {
      try { ttsStreamAbortRef.current.abort(); } catch { /* noop */ }
      ttsStreamAbortRef.current = null;
    }
    ttsStreamSourcesRef.current.forEach((source) => {
      try { source.onended = null; source.stop(); } catch { /* noop */ }
      try { source.disconnect(); } catch { /* noop */ }
    });
    ttsStreamSourcesRef.current.clear();
  };

  const cleanup = useCallback(() => {
    stoppedRef.current = true;
    pausedRef.current = true;
    // Abort any in-flight TTS fetch so its .then never constructs a new Audio.
    if (ttsAbortRef.current) { try { ttsAbortRef.current.abort(); } catch { /* noop */ } ttsAbortRef.current = null; }
    stopStreamingTts();
    ttsAbortControllersRef.current.forEach((controller) => { try { controller.abort(); } catch { /* noop */ } });
    ttsAbortControllersRef.current.clear();
    // Cancel any browser SpeechSynthesis utterances just in case.
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    // Pause + detach EVERY TTS audio element we ever created, not just the
    // current ref. This catches the orphan-element race in speak().
    allTtsAudioElsRef.current.forEach((el) => {
      try { el.pause(); } catch { /* noop */ }
      try { el.currentTime = 0; } catch { /* noop */ }
      try { el.onended = null; el.onerror = null; el.onpause = null; } catch { /* noop */ }
      try { el.src = ''; } catch { /* noop */ }
      try { el.removeAttribute('src'); el.load(); } catch { /* noop */ }
    });
    allTtsAudioElsRef.current.clear();
    ttsAudioRef.current = null;
    preparedTtsUrlsRef.current.forEach((url) => { try { URL.revokeObjectURL(url); } catch { /* noop */ } });
    preparedTtsUrlsRef.current.clear();
    // Diagnostic snapshot — proves every audio surface is inactive at the
    // moment Exit ran. Remove once the bug is confirmed gone in production.
    try {
      // eslint-disable-next-line no-console
      console.log('[voice cleanup]', {
        speechSpeaking: window.speechSynthesis?.speaking,
        speechPending: window.speechSynthesis?.pending,
        audioCtxState: audioCtxRef.current?.state ?? 'null',
        liveAudioEls: allTtsAudioElsRef.current.size,
        micTracks: streamRef.current ? (streamRef.current as MediaStream).getTracks().length : 0,
      });
    } catch { /* noop */ }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    if (maxRecTimerRef.current) { window.clearTimeout(maxRecTimerRef.current); maxRecTimerRef.current = null; }
    if (micSourceRef.current) { try { micSourceRef.current.disconnect(); } catch { /* noop */ } micSourceRef.current = null; }
    if (analyserRef.current) { try { analyserRef.current.disconnect(); } catch { /* noop */ } analyserRef.current = null; }
    if (silentAudioRef.current) {
      try { silentAudioRef.current.pause(); } catch { /* noop */ }
      try { silentAudioRef.current.src = ''; silentAudioRef.current.load(); } catch { /* noop */ }
      silentAudioRef.current = null;
    }
    if (silentUrlRef.current) { try { URL.revokeObjectURL(silentUrlRef.current); } catch { /* noop */ } silentUrlRef.current = null; }
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    // Drop any prefetched next-beat promises so their resolution can't be used.
    prefetchedQueueRef.current = [];
    prefetchTailRef.current = null;
    speakInFlightRef.current = false;
    speakingRef.current = false;
  }, []);

  // Build a 1-second silent WAV blob so we can loop it through a media element
  // without bundling any binary asset. The element being "playing" is what
  // claims the media audio session on iOS/Android.
  const makeSilentWavUrl = (): string => {
    const sr = 22050;
    const samples = sr;
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); view.setUint32(4, 36 + samples * 2, true);
    w(8, 'WAVE'); w(12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sr, true); view.setUint32(28, sr * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    w(36, 'data'); view.setUint32(40, samples * 2, true);
    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  };

  const encodePcm16Wav = useCallback((pcm: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcm.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcm.length * 2, true);
    let offset = 44;
    for (let i = 0; i < pcm.length; i += 1, offset += 2) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }, []);

  const optimizeTtsBlob = useCallback(async (blob: Blob): Promise<{ blob: Blob; optimized: boolean; durationMs: number }> => {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return { blob, optimized: false, durationMs: 0 };
    const decodeCtx = new Ctor({ latencyHint: 'playback', sampleRate: 44100 });
    try {
      const decoded: AudioBuffer = await decodeCtx.decodeAudioData(await blob.arrayBuffer());
      const channels = decoded.numberOfChannels;
      const sampleRate = decoded.sampleRate;
      const total = decoded.length;
      if (!total) return { blob, optimized: false, durationMs: 0 };

      // Mix to mono for stable speech/silence analysis and native playback.
      const mono = new Float32Array(total);
      for (let ch = 0; ch < channels; ch += 1) {
        const data = decoded.getChannelData(ch);
        for (let i = 0; i < total; i += 1) mono[i] += data[i] / channels;
      }

      const frame = Math.max(128, Math.floor(sampleRate * (TTS_SILENCE_FRAME_MS / 1000)));
      const voiced = new Uint8Array(Math.ceil(total / frame));
      for (let frameIndex = 0; frameIndex < voiced.length; frameIndex += 1) {
        const start = frameIndex * frame;
        const end = Math.min(total, start + frame);
        let sum = 0;
        let peak = 0;
        for (let i = start; i < end; i += 1) {
          const v = mono[i];
          sum += v * v;
          const abs = Math.abs(v);
          if (abs > peak) peak = abs;
        }
        const rms = Math.sqrt(sum / Math.max(1, end - start));
        if (rms >= TTS_SILENCE_RMS_THRESHOLD || peak >= TTS_SILENCE_RMS_THRESHOLD * 2.5) voiced[frameIndex] = 1;
      }

      let firstVoiced = 0;
      while (firstVoiced < voiced.length && !voiced[firstVoiced]) firstVoiced += 1;
      let lastVoiced = voiced.length - 1;
      while (lastVoiced >= 0 && !voiced[lastVoiced]) lastVoiced -= 1;
      if (firstVoiced >= voiced.length || lastVoiced < firstVoiced) {
        return { blob, optimized: false, durationMs: decoded.duration * 1000 };
      }

      const keepLeadingFrames = Math.ceil(TTS_LEADING_SILENCE_MS / TTS_SILENCE_FRAME_MS);
      const keepInternalFrames = Math.ceil(TTS_INTERNAL_SILENCE_MS / TTS_SILENCE_FRAME_MS);
      const keepTrailingFrames = Math.ceil(TTS_TRAILING_SILENCE_MS / TTS_SILENCE_FRAME_MS);
      const chunks: Array<[number, number]> = [];

      const pushChunk = (startFrame: number, endFrame: number) => {
        const start = Math.max(0, Math.floor(startFrame * frame));
        const end = Math.min(total, Math.ceil((endFrame + 1) * frame));
        if (end > start) chunks.push([start, end]);
      };

      pushChunk(Math.max(0, firstVoiced - keepLeadingFrames), firstVoiced - 1);
      let cursor = firstVoiced;
      for (let i = firstVoiced; i <= lastVoiced; i += 1) {
        if (voiced[i]) continue;
        const silenceStart = i;
        while (i <= lastVoiced && !voiced[i]) i += 1;
        const silenceEnd = i - 1;
        if (silenceStart > cursor) pushChunk(cursor, silenceStart - 1);
        const keep = Math.min(keepInternalFrames, silenceEnd - silenceStart + 1);
        if (keep > 0) pushChunk(silenceStart, silenceStart + keep - 1);
        cursor = silenceEnd + 1;
      }
      if (cursor <= lastVoiced) pushChunk(cursor, lastVoiced);
      pushChunk(lastVoiced + 1, Math.min(voiced.length - 1, lastVoiced + keepTrailingFrames));

      const outLen = chunks.reduce((sum, [start, end]) => sum + (end - start), 0);
      if (outLen <= 0 || outLen >= total - frame) {
        return { blob, optimized: false, durationMs: decoded.duration * 1000 };
      }

      const out = new Float32Array(outLen);
      let write = 0;
      chunks.forEach(([start, end], idx) => {
        const len = end - start;
        out.set(mono.subarray(start, end), write);
        // Tiny 5ms equal-power-ish fades only at cut boundaries to prevent clicks.
        const fade = Math.min(Math.floor(sampleRate * 0.005), Math.floor(len / 2));
        if (idx > 0) {
          for (let i = 0; i < fade; i += 1) out[write + i] *= i / fade;
        }
        if (idx < chunks.length - 1) {
          for (let i = 0; i < fade; i += 1) out[write + len - 1 - i] *= i / fade;
        }
        write += len;
      });

      return { blob: encodePcm16Wav(out, sampleRate), optimized: true, durationMs: (out.length / sampleRate) * 1000 };
    } catch (e) {
      console.warn('[tutor-tts] decode/trim failed — using source audio', e);
      return { blob, optimized: false, durationMs: 0 };
    } finally {
      try { await decodeCtx.close(); } catch { /* noop */ }
    }
  }, [encodePcm16Wav]);

  useEffect(() => () => cleanup(), [cleanup]);

  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const prepareTtsAudio = useCallback(async (rawText: string, signal?: AbortSignal): Promise<PreparedTtsAudio | null> => {
    const text = rawText;
    if (!text || stoppedRef.current || pausedRef.current) return null;
    const startedAt = performance.now();
    const token = (await supabase.auth.getSession()).data.session?.access_token ?? '';
    if (signal?.aborted || stoppedRef.current || pausedRef.current) return null;
    const ac = new AbortController();
    const onAbort = () => ac.abort();
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    ttsAbortRef.current = ac;
    ttsAbortControllersRef.current.add(ac);
    try {
      const doFetch = () => fetch(`${SUPA_FN}/tutor-tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, strict: true }),
        signal: ac.signal,
      });
      let res: Response;
      try {
        res = await doFetch();
      } catch (e) {
        if (stoppedRef.current || pausedRef.current || ac.signal.aborted) throw e;
        console.warn('[tutor-tts] fetch failed once — retrying', e);
        res = await doFetch();
      }
      if (stoppedRef.current || pausedRef.current || ac.signal.aborted) return null;
      const ct = res.headers.get('content-type') ?? '';
      if (res.ok && ct.includes('application/json')) {
        try { console.warn('[tutor-tts] fallback response', await res.json()); } catch { /* noop */ }
        return null;
      }
      if (!res.ok || !ct.includes('audio')) {
        console.warn(`[tutor-tts] non-ok status=${res.status}`);
        return null;
      }

      const spokenB64 = res.headers.get('X-Spoken-Text-B64');
      let spoken = text;
      if (spokenB64) {
        try { spoken = decodeURIComponent(escape(atob(spokenB64))); } catch { /* keep fallback */ }
      }
      if (spoken !== rawText) throw new Error('CAPTION/TTS mismatch (server)');

      const sourceBlob = await res.blob();
      if (stoppedRef.current || pausedRef.current || ac.signal.aborted) return null;
      const optimized = await optimizeTtsBlob(sourceBlob);
      if (stoppedRef.current || pausedRef.current || ac.signal.aborted) return null;
      const url = URL.createObjectURL(optimized.blob);
      preparedTtsUrlsRef.current.add(url);
      try {
        opts.onDebug?.({
          ttsMs: String(Math.round(performance.now() - startedAt)),
          ttsOptimized: optimized.optimized ? 'yes' : 'no',
          ttsDurationMs: String(Math.round(optimized.durationMs)),
        });
      } catch { /* noop */ }
      return {
        text,
        url,
        contentType: optimized.blob.type || ct,
        optimized: optimized.optimized,
        durationMs: optimized.durationMs,
        createdAt: Date.now(),
      };
    } finally {
      if (signal) signal.removeEventListener('abort', onAbort);
      ttsAbortControllersRef.current.delete(ac);
      if (ttsAbortRef.current === ac) ttsAbortRef.current = null;
    }
  }, [optimizeTtsBlob, opts]);

  // Prefetch the NEXT tutor beat and its decoded/trimmed TTS audio while the
  // current audio is still playing. Root cause of the long inter-beat pauses:
  // the old pipeline waited for <audio>.ended, THEN ran tutor-chat, THEN fetched
  // tutor-tts, THEN blob/decoded/played. Now the next clip is already prepared
  // before current playback ends, so transitions usually only pay play() time.
  const kickPrefetchNextBeat = useCallback(() => {
    if (!opts.sessionId || !opts.chapterId) return;
    if (prefetchedQueueRef.current.length > 0 || prefetchTailRef.current) return;
    const chat = supabase.functions.invoke('tutor-chat', {
      body: { sessionId: opts.sessionId, chapterId: opts.chapterId, userMessage: '', inputMode: 'system' },
    });
    const audio = chat.then(async ({ data, error }) => {
      if (error || stoppedRef.current || pausedRef.current) return null;
      const rawReply = (data as any)?.reply as string;
      const reply = applyVoiceGender(rawReply, 'male');
      if (!reply) return null;
      return prepareTtsAudio(reply);
    }).catch((e) => {
      if (!stoppedRef.current && !pausedRef.current) console.warn('[tutor-tts] prefetch failed', e);
      return null;
    });
    prefetchedQueueRef.current = [{ chat, audio }];
  }, [opts.sessionId, opts.chapterId, prepareTtsAudio]);


  // Build (or reuse) the loudness-boost graph for a given <audio> element.
  // src → DynamicsCompressor (tames peaks so we can push average level) → Gain
  // → destination. Compressor settings are tuned for speech intelligibility,
  // not music coloration.
  // Intentionally no Web Audio processing on the TTS element. Routing the
  // <audio> through createMediaElementSource + compressor + gain on mobile
  // degraded clarity (compression artifacts + clipping at 2.6x). Letting the
  // element play directly to the device output preserves the original
  // ElevenLabs quality on every device.
  const wireBoostGraph = (_el: HTMLAudioElement) => false;

  const setSpeakerEnabled = useCallback((on: boolean) => {
    speakerOnRef.current = on;
    setSpeakerOn(on);
    // Apply immediately to any currently-playing TTS.
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.muted = !on; } catch { /* noop */ }
      try { ttsAudioRef.current.volume = on ? 1.0 : 0.0; } catch { /* noop */ }
    }
    if (ttsStreamGainRef.current) {
      try { ttsStreamGainRef.current.gain.setTargetAtTime(on ? 1 : 0, ttsStreamGainRef.current.context.currentTime, 0.01); } catch { /* noop */ }
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setSpeakerEnabled(!speakerOnRef.current);
  }, [setSpeakerEnabled]);
  // Guards against overlapping speak() calls (e.g. a stray re-trigger) playing
  // the same sentence twice. Also tracks the last spoken text so an immediate
  // duplicate request within a short window is ignored — explicit repeats go
  // through the dedicated repeat() method which bypasses this.
  const speakInFlightRef = useRef(false);
  const lastSpokenAtRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });

  const concatFloatChunks = (chunks: Float32Array[], total: number): Float32Array => {
    const out = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  };

  const streamTtsAudio = useCallback(async (text: string, onStarted?: () => void): Promise<boolean> => {
    const token = (await supabase.auth.getSession()).data.session?.access_token ?? '';
    if (stoppedRef.current || pausedRef.current) return false;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return false;
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new Ctor({ latencyHint: 'interactive', sampleRate: STREAM_TTS_SAMPLE_RATE });
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    if (!ttsStreamGainRef.current || ttsStreamGainRef.current.context !== ctx) {
      try { ttsStreamGainRef.current?.disconnect(); } catch { /* noop */ }
      const gain = ctx.createGain();
      gain.gain.value = speakerOnRef.current ? 1 : 0;
      gain.connect(ctx.destination);
      ttsStreamGainRef.current = gain;
    }

    const ac = new AbortController();
    ttsStreamAbortRef.current = ac;
    ttsAbortControllersRef.current.add(ac);
    let playhead = 0;
    let started = false;
    let scheduledAny = false;
    let pendingByte = new Uint8Array(0);
    let pendingSamples = new Float32Array(0);
    let heldSilence: Float32Array[] = [];
    let heldSilenceLen = 0;
    const frameSamples = Math.max(120, Math.floor(STREAM_TTS_SAMPLE_RATE * (TTS_SILENCE_FRAME_MS / 1000)));
    const maxInternalSilence = Math.floor(STREAM_TTS_SAMPLE_RATE * (TTS_INTERNAL_SILENCE_MS / 1000));
    const maxTrailingSilence = Math.floor(STREAM_TTS_SAMPLE_RATE * (TTS_TRAILING_SILENCE_MS / 1000));
    const silenceThreshold = 0.0045;

    const scheduleSamples = (samples: Float32Array) => {
      if (!samples.length || stoppedRef.current || pausedRef.current) return;
      if (!started) {
        started = true;
        try { onStarted?.(); } catch { /* noop */ }
      }
      scheduledAny = true;
      const buffer = ctx.createBuffer(1, samples.length, STREAM_TTS_SAMPLE_RATE);
      buffer.copyToChannel(new Float32Array(samples), 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ttsStreamGainRef.current!);
      ttsStreamSourcesRef.current.add(source);
      source.onended = () => {
        ttsStreamSourcesRef.current.delete(source);
        try { source.disconnect(); } catch { /* noop */ }
      };
      const startAt = playhead > 0
        ? Math.max(playhead, ctx.currentTime + 0.005)
        : ctx.currentTime + 0.035;
      try { source.start(startAt); } catch { return; }
      playhead = startAt + buffer.duration;
    };

    const flushHeldSilence = (limitSamples: number, output: Float32Array[], outputLen: { value: number }) => {
      if (!heldSilenceLen) return;
      let remaining = Math.min(limitSamples, heldSilenceLen);
      for (const chunk of heldSilence) {
        if (remaining <= 0) break;
        const part = remaining >= chunk.length ? chunk : chunk.slice(0, remaining);
        output.push(part);
        outputLen.value += part.length;
        remaining -= part.length;
      }
      heldSilence = [];
      heldSilenceLen = 0;
    };

    const processSamples = (incoming: Float32Array, done = false) => {
      let samples = incoming;
      if (pendingSamples.length) {
        const merged = new Float32Array(pendingSamples.length + incoming.length);
        merged.set(pendingSamples);
        merged.set(incoming, pendingSamples.length);
        samples = merged;
        pendingSamples = new Float32Array(0);
      }
      const output: Float32Array[] = [];
      const outputLen = { value: 0 };
      let offset = 0;
      while (offset + frameSamples <= samples.length) {
        const frame = samples.slice(offset, offset + frameSamples);
        offset += frameSamples;
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < frame.length; i += 1) {
          const v = frame[i];
          sum += v * v;
          const abs = Math.abs(v);
          if (abs > peak) peak = abs;
        }
        const rms = Math.sqrt(sum / frame.length);
        const silent = rms < silenceThreshold && peak < silenceThreshold * 2.5;
        if (silent) {
          if (!started) continue;
          const remaining = maxInternalSilence - heldSilenceLen;
          if (remaining > 0) {
            const part = remaining >= frame.length ? frame : frame.slice(0, remaining);
            heldSilence.push(part);
            heldSilenceLen += part.length;
          }
          continue;
        }
        flushHeldSilence(maxInternalSilence, output, outputLen);
        output.push(frame);
        outputLen.value += frame.length;
      }
      pendingSamples = offset < samples.length ? samples.slice(offset) : new Float32Array(0);
      if (done) {
        if (pendingSamples.length) {
          output.push(pendingSamples);
          outputLen.value += pendingSamples.length;
          pendingSamples = new Float32Array(0);
        }
        flushHeldSilence(maxTrailingSilence, output, outputLen);
      }
      if (outputLen.value > 0) scheduleSamples(concatFloatChunks(output, outputLen.value));
    };

    const handleEventPayload = (rawData: string) => {
      if (!rawData || rawData === '[DONE]') return;
      let payload: { type?: string; audio?: string } | null = null;
      try { payload = JSON.parse(rawData); } catch { return; }
      if (payload?.type !== 'speech.audio.delta' || !payload.audio) return;
      const binary = atob(payload.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const merged = new Uint8Array(pendingByte.length + bytes.length);
      merged.set(pendingByte);
      merged.set(bytes, pendingByte.length);
      const usable = merged.length - (merged.length % 2);
      pendingByte = usable < merged.length ? merged.slice(usable) : new Uint8Array(0);
      if (usable <= 0) return;
      const view = new DataView(merged.buffer, merged.byteOffset, usable);
      const floats = new Float32Array(usable / 2);
      for (let i = 0; i < floats.length; i += 1) floats[i] = view.getInt16(i * 2, true) / 32768;
      processSamples(floats);
    };

    try {
      const res = await fetch(`${SUPA_FN}/tutor-tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, strict: true, stream: true }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body || !(res.headers.get('content-type') ?? '').includes('text/event-stream')) return false;
      const spokenB64 = res.headers.get('X-Spoken-Text-B64');
      if (spokenB64) {
        let spoken = text;
        try { spoken = decodeURIComponent(escape(atob(spokenB64))); } catch { /* keep fallback */ }
        if (spoken !== text) throw new Error('CAPTION/TTS mismatch (stream)');
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      const consumeBufferedEvents = () => {
        const normalized = buffer.replace(/\r\n/g, '\n');
        const blocks = normalized.split('\n\n');
        buffer = blocks.pop() ?? '';
        for (const eventBlock of blocks) {
          const data = eventBlock
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('');
          handleEventPayload(data);
        }
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (stoppedRef.current || pausedRef.current || ac.signal.aborted) return false;
        buffer += value;
        consumeBufferedEvents();
      }
      if (buffer.trim()) {
        const data = buffer.replace(/\r\n/g, '\n')
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('');
        handleEventPayload(data);
      }
      processSamples(new Float32Array(0), true);
      if (!scheduledAny) return false;
      const drainMs = Math.max(0, Math.ceil((playhead - ctx.currentTime) * 1000) + 25);
      if (drainMs > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, drainMs));
      }
      return !stoppedRef.current && !pausedRef.current;
    } catch (e) {
      if (!stoppedRef.current && !pausedRef.current && !ac.signal.aborted) console.warn('[tutor-tts] stream failed', e);
      return false;
    } finally {
      ttsAbortControllersRef.current.delete(ac);
      if (ttsStreamAbortRef.current === ac) ttsStreamAbortRef.current = null;
    }
  }, []);

  const speak = useCallback(async (rawText: string, options?: { force?: boolean; prepared?: PreparedTtsAudio | Promise<PreparedTtsAudio | null> | null; onStarted?: () => void }): Promise<boolean> => {
    const text = rawText;
    if (!text) return false;
    const force = options?.force === true;

    // Dedup guards (all bypassed when force=true, i.e. explicit user action
    // such as Repeat / Previous / Resume). Once a line finishes playing it
    // will NEVER auto-play again — only forced replays can do that.
    if (!force) {
      if (speakInFlightRef.current) return false;
      if (lastSpokenAtRef.current.text === text && lastSpokenAtRef.current.at > 0) return false;
    }
    speakInFlightRef.current = true;
    lastSpokenAtRef.current = { text, at: Date.now() };
    lastAssistantRef.current = text;
    setStatus('speaking');
    speakingRef.current = true;
    opts.onSpeakStart?.();

    // AUDIO_COMPLETED gate. Only flips true when the server returned audio
    // AND the <audio> element fired 'ended'. Any other path (fetch failure,
    // play() rejection, quota_exceeded, mid-clip error) leaves this false
    // so callers MUST NOT advance to the next caption / beat / question.
    let audioCompleted = false;
    let prepared: PreparedTtsAudio | null = null;
    try {
      if (!options?.prepared) {
        audioCompleted = await streamTtsAudio(text, options?.onStarted);
      }
      if (!audioCompleted) stopStreamingTts();
      const maybePrepared = audioCompleted ? null : await options?.prepared;
      if (maybePrepared) {
        if (maybePrepared.text === text) prepared = maybePrepared;
        else {
          preparedTtsUrlsRef.current.delete(maybePrepared.url);
          try { URL.revokeObjectURL(maybePrepared.url); } catch { /* noop */ }
        }
      }
      if (!audioCompleted && !prepared) prepared = await prepareTtsAudio(text);
      if (stoppedRef.current) { speakInFlightRef.current = false; speakingRef.current = false; setStatus('idle'); opts.onSpeakEnd?.(); return false; }
      if (!audioCompleted && prepared) {
        const url = prepared.url;
        if (ttsAudioRef.current) {
          try { ttsAudioRef.current.pause(); } catch { /* noop */ }
        }
        try { ttsSourceRef.current?.disconnect(); } catch { /* noop */ }
        try { ttsGainRef.current?.disconnect(); } catch { /* noop */ }
        ttsSourceRef.current = null;
        ttsGainRef.current = null;
        const el = new Audio(url);
        (el as any).playsInline = true;
        el.setAttribute('playsinline', '');
        el.preload = 'auto';
        el.volume = 1.0;
        el.muted = !speakerOnRef.current;
        ttsAudioRef.current = el;
        allTtsAudioElsRef.current.add(el);
        // Hard gate: if cleanup ran between blob() and now, do NOT play.
        // The element is already in the set so any later cleanup also catches it.
        if (stoppedRef.current) {
          try { el.pause(); } catch { /* noop */ }
          try { el.src = ''; el.load(); } catch { /* noop */ }
          allTtsAudioElsRef.current.delete(el);
          preparedTtsUrlsRef.current.delete(url);
          try { URL.revokeObjectURL(url); } catch { /* noop */ }
          speakInFlightRef.current = false; speakingRef.current = false;
          setStatus('idle'); opts.onSpeakEnd?.();
          return false;
        }
        try { if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume(); } catch { /* noop */ }
        wireBoostGraph(el);
        try {
          if ('mediaSession' in navigator) {
            (navigator as any).mediaSession.playbackState = 'playing';
          }
        } catch { /* noop */ }
        try {
          await el.play();
          try { options?.onStarted?.(); } catch { /* noop */ }
          // play() resolves only after playback actually started. If cleanup
          // ran while we awaited, kill it immediately so no audio leaks out.
          if (stoppedRef.current) {
            try { el.pause(); } catch { /* noop */ }
            try { el.src = ''; el.load(); } catch { /* noop */ }
            allTtsAudioElsRef.current.delete(el);
            preparedTtsUrlsRef.current.delete(url);
            try { URL.revokeObjectURL(url); } catch { /* noop */ }
            speakInFlightRef.current = false; speakingRef.current = false;
            setStatus('idle'); opts.onSpeakEnd?.();
            return false;
          }
          await new Promise<void>((resolve) => {
            let settled = false;
            const finish = (ok: boolean) => {
              if (settled) return;
              settled = true;
              if (ok) audioCompleted = true;
              resolve();
            };
            el.onended = () => finish(true);
            el.onerror = () => finish(false);
            el.onpause = () => {
              if (el.ended) { finish(true); return; }
              if (pausedRef.current || stoppedRef.current) finish(false);
            };
          });
        } catch {
          /* play() failed — audioCompleted stays false */
        } finally {
          allTtsAudioElsRef.current.delete(el);
          preparedTtsUrlsRef.current.delete(url);
          try { URL.revokeObjectURL(url); } catch { /* noop */ }
        }
      }
    } catch {
      /* server fetch failed — audioCompleted stays false */
    }

    if (!audioCompleted && !stoppedRef.current && !pausedRef.current) {
      // TTS audio did not complete (network blip, upstream failure, etc.).
      // Keep the lesson moving: mark as completed so the loop advances to
      // the next beat. Surface a soft notification, do NOT show a permanent
      // "Audio Unavailable" UI that traps the student.
      try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
      console.warn('[tutor-tts] audio did not complete — advancing anyway to keep lesson alive');
      opts.onTtsFailure?.();
      audioCompleted = true;
    }

    speakingRef.current = false;
    speakInFlightRef.current = false;
    lastSpokenAtRef.current = { text, at: Date.now() };
    opts.onSpeakEnd?.();
    return audioCompleted;
  }, [opts, prepareTtsAudio, streamTtsAudio]);

  const startListeningRef = useRef<() => void>(() => {});
  const autoAdvanceRef = useRef<() => void>(() => {});

  function isExplicitStudentPrompt(reply: string) {
    const text = reply.toLowerCase();
    return /\(\s*student\s*response\s*\)/i.test(reply)
      || /\byour turn\b/.test(text)
      || /\bnow\s+.*\b(answer|respond|repeat|speak|say|practice|turn)\b/.test(text)
      || /\bab\s+.*\b(jawab|boliye|bolna|repeat|bataiye|practice|kijiye|dijiye)\b/.test(text)
      || /\baap\s+.*\b(jawab|boliye|bolna|repeat|bataiye|practice|kijiye|dijiye)\b/.test(text);
  }

  function classify(reply: string, beatTypeFromServer?: string, awaitingFromServer?: boolean) {
    const explicitPrompt = isExplicitStudentPrompt(reply);
    const validBeat = beatTypeFromServer === 'introduction' || beatTypeFromServer === 'explanation' || beatTypeFromServer === 'question';
    const beat: 'introduction' | 'explanation' | 'question' =
      validBeat ? beatTypeFromServer : explicitPrompt ? 'question' : 'explanation';
    const mustWait = beat === 'question' && explicitPrompt;
    return { beat, mustWait };
  }

  const autoAdvance = useCallback(async () => {
    if (stoppedRef.current || pausedRef.current || !opts.sessionId || !opts.chapterId) return;
    setStatus('thinking');
    try {
      // Use the prefetched reply + prepared audio if available — this removes
      // the fetch/decode/playback gap between consecutive tutor beats.
      const pending = prefetchedQueueRef.current.shift() ?? null;
      const chatPromise = pending?.chat ?? supabase.functions.invoke('tutor-chat', {
            body: { sessionId: opts.sessionId, chapterId: opts.chapterId, userMessage: '', inputMode: 'system' },
          });
      const { data, error } = await chatPromise;
      if (error) throw error;
      if (pausedRef.current || stoppedRef.current) return;
      const rawReply = (data as any).reply as string;
      // CAPTION/TTS PARITY: apply male gender rewrite (karungi→karunga,
      // jaungi→jaunga, sikhaungi→sikhaunga, bataungi→bataunga, ...) BEFORE
      // showing the caption AND before TTS so the displayed text and the
      // spoken text are byte-identical.
      const reply = applyVoiceGender(rawReply, 'male');
      const complete = (data as any).complete as boolean;
      const { beat, mustWait } = classify(reply, (data as any).beatType, (data as any).awaitingStudentResponse);
      setLessonState(beat === 'introduction' ? 'INTRODUCTION' : beat === 'explanation' ? 'EXPLANATION' : 'QUESTION');
      lastWaitingRef.current = mustWait;
      if (!complete && !mustWait) kickPrefetchNextBeat();
      let captionShown = false;
      const showCaption = () => {
        if (captionShown) return;
        captionShown = true;
        opts.onAssistantText(reply);
      };
      const audioOk = await speak(reply, { prepared: pending?.audio ?? null, onStarted: showCaption });
      showCaption();
      if (pausedRef.current || stoppedRef.current) return;
      // HARD GATE: do not advance if audio did not finish playing. The TTS
      // failure callback already paused the loop and surfaced an error to the
      // student; we just bail here.
      if (!audioOk) return;
      if (complete) { setLessonState('IDLE'); opts.onComplete(); return; }
      if (mustWait) {
        prefetchedQueueRef.current = [];
        prefetchTailRef.current = null;
        setLessonState('WAITING_FOR_STUDENT');
        setStatus('listening');
        startListeningRef.current();
      } else {
        autoAdvanceRef.current();
      }
    } catch (e) {
      console.error('[autoAdvance]', e);
      prefetchedQueueRef.current = [];
      prefetchTailRef.current = null;
      if (pausedRef.current || stoppedRef.current) return;
      setLessonState('WAITING_FOR_STUDENT');
      setStatus('listening');
      startListeningRef.current();
    }
  }, [opts, speak, setLessonState, kickPrefetchNextBeat]);

  const handleBlob = useCallback(async (blob: Blob) => {
    if (stoppedRef.current || pausedRef.current || !opts.sessionId || !opts.chapterId) return;
    setStatus('thinking');
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'utt.webm');
      const sttRes = await fetch(`${SUPA_FN}/tutor-stt`, {
        method: 'POST', body: fd,
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}` },
      });
      const stt = await sttRes.json();
      const userText = (stt.text ?? '').trim();
      if (!userText || userText.length < 2) {
        if (pausedRef.current || stoppedRef.current) return;
        setLessonState('WAITING_FOR_STUDENT');
        setStatus('listening');
        return startListeningRef.current();
      }
      opts.onUserText(userText);
      // Only expose the recording AFTER we've confirmed it transcribed to
      // a non-empty utterance — keeps the "play my last answer" button
      // tied to a real student response, not background noise.
      try { opts.onStudentAudio?.(blob); } catch { /* noop */ }

      const { data, error } = await supabase.functions.invoke('tutor-chat', {
        body: { sessionId: opts.sessionId, chapterId: opts.chapterId, userMessage: userText, inputMode: 'voice' },
      });
      if (error) throw error;
      if (pausedRef.current || stoppedRef.current) return;
      const rawReply = (data as any).reply as string;
      const reply = applyVoiceGender(rawReply, 'male');
      const complete = (data as any).complete as boolean;
      const corrections = (data as any).corrections ?? null;
      const { beat, mustWait } = classify(reply, (data as any).beatType, (data as any).awaitingStudentResponse);
      const wasCorrect = (data as any).studentAnswerCorrect !== false;
      opts.onCorrections?.({ ...(corrections ?? {}), studentAnswerCorrect: wasCorrect });
      setLessonState(!wasCorrect ? 'CORRECTING_ANSWER' : beat === 'question' ? 'NEXT_QUESTION' : beat === 'introduction' ? 'INTRODUCTION' : 'EXPLANATION');
      lastWaitingRef.current = mustWait;
      if (!complete && !mustWait) kickPrefetchNextBeat();
      let captionShown = false;
      const showCaption = () => {
        if (captionShown) return;
        captionShown = true;
        opts.onAssistantText(reply);
      };
      const audioOk = await speak(reply, { onStarted: showCaption });
      showCaption();
      if (pausedRef.current || stoppedRef.current) return;
      if (!audioOk) return; // HARD GATE — see autoAdvance().
      if (complete) { setLessonState('IDLE'); opts.onComplete(); return; }
      if (mustWait) {
        prefetchedQueueRef.current = [];
        prefetchTailRef.current = null;
        setLessonState('WAITING_FOR_STUDENT');
        setStatus('listening');
        startListeningRef.current();
      } else {
        autoAdvanceRef.current();
      }
    } catch (e) {
      console.error(e);
      prefetchedQueueRef.current = [];
      prefetchTailRef.current = null;
      if (pausedRef.current || stoppedRef.current) return;
      setLessonState('WAITING_FOR_STUDENT');
      setStatus('listening');
      startListeningRef.current();
    }
  }, [opts, speak, setLessonState, kickPrefetchNextBeat]);

  const startListening = useCallback(async () => {
    if (stoppedRef.current || pausedRef.current || muted) return;
    // If a previous recorder is still active for any reason, stop it so we
    // never run two recorders on the same stream (silently breaks the 2nd).
    if (recRef.current && recRef.current.state === 'recording') {
      try { discardNextBlobRef.current = true; recRef.current.stop(); } catch { /* noop */ }
    }
    // Cancel previous tick/silence loop + drop the previous analyser source
    // node. Creating a fresh MediaStreamSource on the same stream every turn
    // without disconnecting the previous one starves the new analyser of
    // audio on some browsers — silence detection then never fires and the
    // recording is never finalized (= "later responses are not recorded").
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (maxRecTimerRef.current) { window.clearTimeout(maxRecTimerRef.current); maxRecTimerRef.current = null; }
    if (micSourceRef.current) { try { micSourceRef.current.disconnect(); } catch { /* noop */ } micSourceRef.current = null; }
    if (analyserRef.current) { try { analyserRef.current.disconnect(); } catch { /* noop */ } analyserRef.current = null; }

    if (!streamRef.current) {
      try {
        // IMPORTANT: explicit constraints so the browser does NOT switch the page into
        // "voice communication" mode (which routes TTS to the earpiece on mobile).
        // We disable AGC/echoCancel/noiseSuppression — those hint the OS to use the
        // comms audio route. Combined with latencyHint:'playback' below and the silent
        // media element, TTS stays on the loud media speaker.
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
          } as MediaTrackConstraints,
        });
      } catch (e) { console.error('mic denied', e); return; }
    }
    // Make sure the mic track is live before we attach a recorder/analyser
    // to it. A stale ended track silently produces no data on later turns.
    const liveTrack = streamRef.current.getAudioTracks().find((t) => t.readyState === 'live' && !t.muted);
    if (!liveTrack) {
      try { streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
      streamRef.current = null;
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
          } as MediaTrackConstraints,
        });
      } catch (e) { console.error('mic re-acquire failed', e); return; }
    }

    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const rec = new MediaRecorder(streamRef.current, { mimeType: mime });
    recRef.current = rec;
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      if (maxRecTimerRef.current) { window.clearTimeout(maxRecTimerRef.current); maxRecTimerRef.current = null; }
      const blob = new Blob(chunksRef.current, { type: mime });
      if (discardNextBlobRef.current) { discardNextBlobRef.current = false; return; }
      if (blob.size > 2000) handleBlob(blob);
      else { if (!stoppedRef.current && !pausedRef.current) { setStatus('listening'); startListening(); } }
    };
    // Use a 250ms timeslice so ondataavailable fires continuously. Without
    // it, if silence detection ever misses (e.g. AudioContext suspended on
    // mobile after TTS), there's still real audio in chunksRef when we
    // force-stop, so the response is never lost.
    try { rec.start(250); } catch { try { rec.start(); } catch { /* noop */ } }
    setStatus('listening');

    if (!audioCtxRef.current) {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtxRef.current = new Ctor({ latencyHint: 'playback', sampleRate: 44100 });
    }
    const ctx = audioCtxRef.current!;
    // Mobile browsers can leave the AudioContext suspended after TTS audio
    // plays — the analyser then returns flat data and silence is never
    // detected. Resuming here keeps silence detection alive for every turn.
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { /* noop */ } }
    const src = ctx.createMediaStreamSource(streamRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    micSourceRef.current = src;
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let silentSince: number | null = null;
    let everSpoke = false;
    const tick = () => {
      if (rec.state !== 'recording') return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / data.length);
      setMicLevel(rms);
      micCb?.(rms);
      const now = performance.now();
      if (rms > 0.04) { everSpoke = true; silentSince = null; }
      else if (everSpoke) {
        if (silentSince == null) silentSince = now;
        // Drop end-of-turn silence threshold from 1400ms to 700ms. Still
        // long enough that a natural mid-sentence pause doesn't cut the
        // student off, but ~700ms snappier than before.
        else if (now - silentSince > 700) { rec.stop(); return; }
      } else {
        silentSince = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Safety net: hard-stop after 20s so a missed silence-detection (analyser
    // starved, tab backgrounded, etc.) can NEVER leave a turn permanently
    // stuck with an open recorder and no blob produced.
    maxRecTimerRef.current = window.setTimeout(() => {
      if (rec.state === 'recording') {
        try { rec.stop(); } catch { /* noop */ }
      }
    }, 20000);
  }, [muted, handleBlob, micCb]);

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  useEffect(() => { autoAdvanceRef.current = autoAdvance; }, [autoAdvance]);

  const start = useCallback(async (rawGreeting: string, awaiting: boolean = false, beatTypeFromServer?: string, emitCaption: boolean = true) => {
    stoppedRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    // Gender-correct the greeting so caption text == TTS text == spoken audio.
    const greeting = applyVoiceGender(rawGreeting, 'male');
    try {
      // Use 'playback' latencyHint so the audio session is classified as MEDIA, not voice-comms.
      if (!audioCtxRef.current) {
        const Ctor = (window.AudioContext || (window as any).webkitAudioContext);
        audioCtxRef.current = new Ctor({ latencyHint: 'playback', sampleRate: 44100 });
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      if (!silentAudioRef.current) {
        const url = makeSilentWavUrl();
        silentUrlRef.current = url;
        const el = new Audio(url);
        el.loop = true;
        el.preload = 'auto';
        el.volume = 0.01;
        (el as any).playsInline = true;
        el.setAttribute('playsinline', '');
        try {
          if ('mediaSession' in navigator) {
            (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({ title: 'Lesson', artist: 'AI Tutor' });
            (navigator as any).mediaSession.playbackState = 'playing';
          }
        } catch { /* noop */ }
        silentAudioRef.current = el;
        try { await el.play(); } catch (e) { console.warn('[audio] silent loop play failed', e); }
      }
    } catch { /* noop */ }
    const { beat, mustWait } = classify(greeting, beatTypeFromServer, awaiting);
    setLessonState(beat === 'question' ? 'QUESTION' : beat === 'introduction' ? 'INTRODUCTION' : 'EXPLANATION');
    lastWaitingRef.current = mustWait;
    if (!mustWait) kickPrefetchNextBeat();
    let captionShown = false;
    const showCaption = () => {
      if (captionShown || !emitCaption) return;
      captionShown = true;
      opts.onAssistantText(greeting);
    };
    const audioOk = await speak(greeting, { onStarted: showCaption });
    showCaption();
    if (pausedRef.current || stoppedRef.current) return;
    if (!audioOk) return; // HARD GATE — never advance past silent greeting audio.
    if (mustWait) {
      setLessonState('WAITING_FOR_STUDENT');
      setStatus('listening');
      startListening();
    } else {
      autoAdvance();
    }
  }, [speak, startListening, autoAdvance, setLessonState, kickPrefetchNextBeat]);

  const stop = useCallback(() => { cleanup(); setStatus('idle'); setLessonState('IDLE'); }, [cleanup, setLessonState]);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  // Pause: halt speech + mic without losing session state. Does NOT advance.
  const pause = useCallback(() => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    setPaused(true);
    if (ttsAbortRef.current) { try { ttsAbortRef.current.abort(); } catch { /* noop */ } ttsAbortRef.current = null; }
    stopStreamingTts();
    ttsAbortControllersRef.current.forEach((controller) => { try { controller.abort(); } catch { /* noop */ } });
    ttsAbortControllersRef.current.clear();
    prefetchedQueueRef.current = [];
    prefetchTailRef.current = null;
    preparedTtsUrlsRef.current.forEach((url) => { try { URL.revokeObjectURL(url); } catch { /* noop */ } });
    preparedTtsUrlsRef.current.clear();
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    if (ttsAudioRef.current) { try { ttsAudioRef.current.pause(); } catch { /* noop */ } }
    if (recRef.current && recRef.current.state === 'recording') {
      discardNextBlobRef.current = true;
      try { recRef.current.stop(); } catch { /* noop */ }
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setLessonState('PAUSED');
    setStatus('paused');
  }, [setLessonState]);

  // Resume: replay last assistant line (so student remembers context), then continue.
  const resume = useCallback(async () => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    const text = lastAssistantRef.current;
    const wasWaiting = lastWaitingRef.current;
    if (text) {
      setLessonState(wasWaiting ? 'QUESTION' : 'EXPLANATION');
      const audioOk = await speak(text, { force: true });
      if (!audioOk) return;
    }
    if (pausedRef.current || stoppedRef.current) return;
    if (wasWaiting) {
      setLessonState('WAITING_FOR_STUDENT');
      setStatus('listening');
      startListeningRef.current();
    } else {
      autoAdvanceRef.current();
    }
  }, [speak, setLessonState]);

  // Repeat: just replay last assistant text. Do NOT change lesson state or advance.
  const repeat = useCallback(async () => {
    const text = lastAssistantRef.current;
    if (!text) return;
    // Pause mic listening for the duration so we don't capture our own audio.
    const wasListening = status === 'listening';
    if (recRef.current && recRef.current.state === 'recording') {
      discardNextBlobRef.current = true;
      try { recRef.current.stop(); } catch { /* noop */ }
    }
    // Student explicitly asked to hear the same line again — force bypasses
    // the duplicate-text guard inside speak().
    const audioOk = await speak(text, { force: true });
    if (!audioOk) return;
    if (wasListening && !pausedRef.current && !stoppedRef.current) {
      setStatus('listening');
      startListeningRef.current();
    }
  }, [speak, status]);

  // Go back one step: speak the supplied previous tutor line and, if it was
  // a question, resume listening so the student can answer it again. Does NOT
  // touch server-side lesson cursor — overall progress is preserved.
  const goPrevious = useCallback(async (prevText: string) => {
    if (!prevText) return;
    // Hard-interrupt any in-flight tutor speech AND any pending autoAdvance
    // call so the previous line can play immediately and the loop does not
    // race forward to the next beat after we replay it.
    //
    // Trick: briefly flip pausedRef true while we pause the current <audio>
    // element. That makes the el.onpause handler in the OLD speak() promise
    // resolve with audioCompleted=false, and the caller (autoAdvance /
    // handleBlob) hits its `if (!audioOk) return;` guard and exits cleanly
    // — no TTS failure toast, no auto-advance, no double speak.
    pausedRef.current = true;
    if (ttsAbortRef.current) { try { ttsAbortRef.current.abort(); } catch { /* noop */ } ttsAbortRef.current = null; }
    stopStreamingTts();
    ttsAbortControllersRef.current.forEach((controller) => { try { controller.abort(); } catch { /* noop */ } });
    ttsAbortControllersRef.current.clear();
    prefetchedQueueRef.current = [];
    prefetchTailRef.current = null;
    preparedTtsUrlsRef.current.forEach((url) => { try { URL.revokeObjectURL(url); } catch { /* noop */ } });
    preparedTtsUrlsRef.current.clear();
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch { /* noop */ }
      try { ttsAudioRef.current.currentTime = 0; } catch { /* noop */ }
    }
    if (recRef.current && recRef.current.state === 'recording') {
      discardNextBlobRef.current = true;
      try { recRef.current.stop(); } catch { /* noop */ }
    }
    // Yield one microtask so the old promise can observe the interrupt without
    // adding an audible artificial delay before the replay starts.
    await new Promise<void>((r) => queueMicrotask(r));
    pausedRef.current = false;
    speakInFlightRef.current = false;
    speakingRef.current = false;
    lastSpokenAtRef.current = { text: '', at: 0 };

    const mustWait = /\?/.test(prevText);
    lastAssistantRef.current = prevText;
    lastWaitingRef.current = mustWait;
    setLessonState(mustWait ? 'QUESTION' : 'EXPLANATION');
    const audioOk = await speak(prevText, { force: true });
    if (!audioOk) return;
    if (pausedRef.current || stoppedRef.current) return;
    if (mustWait) {
      setLessonState('WAITING_FOR_STUDENT');
      setStatus('listening');
      startListeningRef.current();
    }
  }, [speak, setLessonState]);

  return {
    status, lessonState, muted, paused, micLevel,
    speakerOn, toggleSpeaker, setSpeakerEnabled,
    toggleMute, start, stop, speak, pause, resume, repeat, goPrevious,
  };
}


