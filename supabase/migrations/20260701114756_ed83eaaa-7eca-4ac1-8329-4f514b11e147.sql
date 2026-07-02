
-- XP configuration (admin-editable via SQL/dashboard)
CREATE TABLE IF NOT EXISTS public.tutor_xp_config (
  key text PRIMARY KEY,
  value integer NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tutor_xp_config TO authenticated;
GRANT ALL ON public.tutor_xp_config TO service_role;
ALTER TABLE public.tutor_xp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_config_read_all_auth" ON public.tutor_xp_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "xp_config_admin_write" ON public.tutor_xp_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.tutor_xp_config(key,value,description) VALUES
  ('correct_answer_xp', 20, 'XP awarded for each correctly answered tutor question'),
  ('chapter_completion_bonus', 100, 'Bonus XP awarded when a chapter is completed'),
  ('lesson_completion_bonus', 30, 'Bonus XP for finishing a lesson within a chapter'),
  ('event_bonus', 0, 'Bonus XP for special events'),
  ('penalty', 0, 'XP deducted for penalties')
ON CONFLICT (key) DO NOTHING;

-- SECURITY DEFINER function to expose a safe leaderboard (name + xp + level only)
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit int DEFAULT 100)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  xp integer,
  level integer,
  streak_days integer,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.user_id,
    COALESCE(NULLIF(split_part(COALESCE(p.full_name, ''), ' ', 1), ''), split_part(COALESCE(p.email,'student'), '@', 1), 'Student') AS display_name,
    COALESCE(g.xp, 0) AS xp,
    COALESCE(g.level, 1) AS level,
    COALESCE(g.streak_days, 0) AS streak_days,
    RANK() OVER (ORDER BY COALESCE(g.xp,0) DESC, g.updated_at ASC) AS rank
  FROM public.user_gamification g
  LEFT JOIN public.profiles p ON p.user_id = g.user_id
  ORDER BY xp DESC, g.updated_at ASC
  LIMIT GREATEST(1, LEAST(p_limit, 500));
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated, anon;

-- Enable realtime on user_gamification so leaderboard refreshes live
ALTER TABLE public.user_gamification REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='user_gamification';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_gamification';
  END IF;
END $$;

-- Auto-create a gamification row for every new authenticated user so they appear on the leaderboard immediately
CREATE OR REPLACE FUNCTION public.ensure_user_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_gamification(user_id, xp, level, streak_days, badges)
  VALUES (NEW.user_id, 0, 1, 0, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_gamification_on_profile ON public.profiles;
CREATE TRIGGER ensure_gamification_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_user_gamification();

-- Backfill existing users
INSERT INTO public.user_gamification(user_id, xp, level, streak_days, badges)
SELECT p.user_id, 0, 1, 0, '[]'::jsonb
FROM public.profiles p
LEFT JOIN public.user_gamification g ON g.user_id = p.user_id
WHERE g.user_id IS NULL;

-- Atomic XP increment helper (used by edge functions)
CREATE OR REPLACE FUNCTION public.increment_user_xp(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_gamification(user_id, xp, level, streak_days, badges, last_active_date)
  VALUES (p_user_id, GREATEST(p_amount, 0), 1, 0, '[]'::jsonb, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
    SET xp = GREATEST(0, public.user_gamification.xp + p_amount),
        level = GREATEST(1, FLOOR(GREATEST(0, public.user_gamification.xp + p_amount) / 500.0)::int + 1),
        last_active_date = CURRENT_DATE,
        updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_user_xp(uuid, integer) TO service_role;
