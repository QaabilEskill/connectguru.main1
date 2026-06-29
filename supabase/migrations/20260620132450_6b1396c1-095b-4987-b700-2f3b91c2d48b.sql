
ALTER TABLE public.tutor_progress
  ADD COLUMN IF NOT EXISTS last_message_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_beat_summary text,
  ADD COLUMN IF NOT EXISTS resumable boolean NOT NULL DEFAULT false;

UPDATE public.tutor_chapters SET is_active = false WHERE chapter_number > 20;
