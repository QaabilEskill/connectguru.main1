
CREATE TABLE public.tutor_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  summary text,
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  facts jsonb DEFAULT '{}'::jsonb,
  total_sessions int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_memory TO authenticated;
GRANT ALL ON public.tutor_memory TO service_role;
ALTER TABLE public.tutor_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memory" ON public.tutor_memory FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read memory" ON public.tutor_memory FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tutor_memory_updated BEFORE UPDATE ON public.tutor_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tutor_vocab (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid REFERENCES public.tutor_chapters(id) ON DELETE SET NULL,
  word text NOT NULL,
  meaning text,
  example text,
  hindi text,
  mastered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, word)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_vocab TO authenticated;
GRANT ALL ON public.tutor_vocab TO service_role;
ALTER TABLE public.tutor_vocab ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vocab" ON public.tutor_vocab FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.tutor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid REFERENCES public.tutor_chapters(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_notes TO authenticated;
GRANT ALL ON public.tutor_notes TO service_role;
ALTER TABLE public.tutor_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.tutor_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tutor_notes_updated BEFORE UPDATE ON public.tutor_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  xp int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  streak_days int NOT NULL DEFAULT 0,
  last_active_date date,
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_gamification TO authenticated;
GRANT ALL ON public.user_gamification TO service_role;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gamification" ON public.user_gamification FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read gamification" ON public.user_gamification FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER user_gamification_updated BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tutor_progress ADD COLUMN IF NOT EXISTS difficulty_level int NOT NULL DEFAULT 1;
ALTER TABLE public.tutor_messages ADD COLUMN IF NOT EXISTS pronunciation jsonb;
ALTER TABLE public.tutor_sessions ADD COLUMN IF NOT EXISTS emotion_samples jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.tutor_chapters ADD COLUMN IF NOT EXISTS source_pdf_path text;

CREATE POLICY "admin read sessions" ON public.tutor_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read progress" ON public.tutor_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read messages" ON public.tutor_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage chapters" ON public.tutor_chapters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage tutor-pdfs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'tutor-pdfs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'tutor-pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users own recordings" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'tutor-recordings' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'tutor-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
