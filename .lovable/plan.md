
This is a large, multi-system stabilization. To avoid breaking working code, I want to confirm scope before editing. Here is the focused plan I will execute exactly — nothing more, nothing less — and I will not touch lesson content, scoring, course flow, or unrelated subsystems.

## 1. Voice / TTS reliability ("Audio Unavailable")

**Server (`supabase/functions/tutor-tts/index.ts`)**
- Keep voice `ash` on `openai/gpt-4o-mini-tts` (already correct).
- Set `speed: 1.4` (currently 1.3).
- Tighten the `instructions` prompt to enforce one continuous flow with sub-300ms inter-sentence beats.
- On upstream failure, retry once (same body) before returning an error.
- Return a structured JSON `{ fallback: true, error }` with HTTP 200 on terminal upstream failure so the client can gracefully fall back instead of throwing.
- Keep the strict-text contract and `X-Spoken-Text-B64` header.

**Client (`src/hooks/useVoiceLoop.ts`)**
- On TTS fetch: if response is JSON / non-audio / not OK, automatically retry once. If still failing, mark `audioCompleted = true` so the lesson does NOT stall, log a warning, and surface a one-time toast (no permanent "Audio Unavailable" UI).
- Never silently fail mid-lesson; the loop always advances.
- Exit / cleanup: already aborts in-flight fetches and tears down every `<audio>` element + mic + AudioContext — verified. I'll additionally clear the prefetch promise and reject pending `speak()` awaits so nothing resumes after Exit.

## 2. Grammar evaluation correctness

**Server (`supabase/functions/tutor-chat/index.ts` — system prompt for the correction beat)**
- Add an explicit two-stage instruction:
  1. First produce a JSON judgment: `{ correct: true|false, reason }` based on the student's transcribed text vs. the expected answer (allow natural variations).
  2. Only if `correct === false` say "There is a small mistake, {name}…" and show the correct sentence.
  3. If `correct === true`, respond with one of: "Great, {name}!", "Excellent!", "Perfect!", "Well done!", "That's correct!" and continue to the next step.
- Forbid hardcoded "Good try" / "small mistake" phrasing when the answer is correct.
- Pass the actual transcribed student text (already done via `tutor-stt`) so the model evaluates the real spoken answer.

## 3. Student tile — minimal waveform animation

**`src/components/tutor/StudentTile.tsx`**
- Remove orbit rings, particles, blobs, waves, and the "AI Classroom" label.
- Replace with ~24 thin vertical bars (rounded ends, soft glow) centered in the tile, reactive to a `micLevel` prop (0–1). Idle = small subtle oscillation; speaking = taller bars driven by mic level + per-bar phase offset.
- Uses one `requestAnimationFrame` loop with `transform: scaleY()` on bars for 60 FPS, no layout thrash.
- Reads `micLevel` from `useVoiceLoop` (already exposed via `onMicLevel`) — wire it through `TutorClassroom`.

## 4. Exit cleanup

Already largely correct in `useVoiceLoop.cleanup()`. I will additionally:
- Reject any pending `speak()` awaiter so the lesson loop doesn't try to advance after exit.
- Ensure `prefetchedNextRef` is dropped (already done) AND any `tutor-chat` in-flight request is aborted.

## 5. Out of scope (will NOT change)

- Lesson content, lesson topics, scoring rubric, course progression, vocabulary, pricing, payments, auth, RLS, DB schema.
- Visual design of pages other than the Student tile.
- I will not attempt a full automated end-to-end QA harness in this single pass — there is no Playwright auth path available for an unmanaged Supabase project and the lessons require live mic input. I will perform a build verification and review the changed code paths. Live human QA on real devices remains required for "production-ready" sign-off.

## Technical notes

- Files changed: `supabase/functions/tutor-tts/index.ts`, `supabase/functions/tutor-chat/index.ts`, `src/hooks/useVoiceLoop.ts`, `src/components/tutor/StudentTile.tsx`, `src/pages/TutorClassroom.tsx` (only to pipe `micLevel` to `StudentTile`).
- No DB migrations.
- No new dependencies.

Please confirm and I will implement exactly the above. If you want any of the "out of scope" items included (e.g. a Playwright QA pass on public routes only), tell me which ones.
