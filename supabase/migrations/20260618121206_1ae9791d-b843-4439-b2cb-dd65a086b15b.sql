
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS attempt_limit_reached boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_psychometric_attempt_at timestamptz;

CREATE OR REPLACE FUNCTION public.enforce_psychometric_attempt_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_count int;
BEGIN
  IF NEW.completed IS TRUE THEN
    SELECT COUNT(*) INTO v_completed_count
    FROM public.psychometric_test_attempts
    WHERE user_id = NEW.user_id AND completed = true
      AND (TG_OP = 'INSERT' OR id <> NEW.id);

    IF v_completed_count >= 2 THEN
      RAISE EXCEPTION 'Maximum Psychometric Test Attempts Reached'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_psy_limit ON public.psychometric_test_attempts;
CREATE TRIGGER trg_enforce_psy_limit
BEFORE INSERT OR UPDATE ON public.psychometric_test_attempts
FOR EACH ROW EXECUTE FUNCTION public.enforce_psychometric_attempt_limit();

CREATE OR REPLACE FUNCTION public.can_take_psychometric_test(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.psychometric_test_attempts
  WHERE user_id = user_id_param AND completed = true;
  RETURN v_count < 2;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_test_access_token(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access BOOLEAN;
  v_access_method TEXT;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_completed_count INT;
BEGIN
  SELECT test_access_activated, test_access_method
  INTO v_has_access, v_access_method
  FROM public.subscribers
  WHERE user_id = p_user_id;

  IF NOT COALESCE(v_has_access, false) THEN
    RETURN json_build_object('success', false, 'error', 'Access not activated');
  END IF;

  SELECT COUNT(*) INTO v_completed_count
  FROM public.psychometric_test_attempts
  WHERE user_id = p_user_id AND completed = true;

  IF v_completed_count >= 2 THEN
    UPDATE public.subscribers
    SET attempt_limit_reached = true, updated_at = now()
    WHERE user_id = p_user_id;

    RETURN json_build_object(
      'success', false,
      'error', 'Maximum Psychometric Test Attempts Reached',
      'locked', true,
      'attempts_used', v_completed_count,
      'attempts_allowed', 2
    );
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + interval '15 minutes';

  UPDATE public.test_access_tokens
  SET used = true, used_at = now()
  WHERE user_id = p_user_id AND used = false;

  INSERT INTO public.test_access_tokens (user_id, token, expires_at, access_method)
  VALUES (p_user_id, v_token, v_expires_at, v_access_method);

  RETURN json_build_object(
    'success', true,
    'token', v_token,
    'expires_at', v_expires_at,
    'attempts_used', v_completed_count,
    'attempts_allowed', 2
  );
END;
$$;

DROP FUNCTION IF EXISTS public.mark_psychometric_test_completed(uuid);
CREATE FUNCTION public.mark_psychometric_test_completed(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_count INT;
  v_user_email TEXT;
  v_next_attempt INT;
BEGIN
  SELECT COUNT(*) INTO v_completed_count
  FROM public.psychometric_test_attempts
  WHERE user_id = user_id_param AND completed = true;

  IF v_completed_count >= 2 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Maximum Psychometric Test Attempts Reached',
      'attempts_used', v_completed_count,
      'attempts_allowed', 2,
      'locked', true
    );
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = user_id_param;

  SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_next_attempt
  FROM public.psychometric_test_attempts
  WHERE user_id = user_id_param;

  INSERT INTO public.psychometric_test_attempts
    (user_id, email, attempt_number, completed, started_at, completed_at)
  VALUES
    (user_id_param, v_user_email, v_next_attempt, true, now(), now());

  v_completed_count := v_completed_count + 1;

  UPDATE public.subscribers
  SET psychometric_test_completed = true,
      psychometric_test_completed_date = now(),
      last_psychometric_attempt_at = now(),
      attempt_limit_reached = (v_completed_count >= 2),
      updated_at = now()
  WHERE user_id = user_id_param;

  RETURN json_build_object(
    'success', true,
    'attempts_used', v_completed_count,
    'attempts_allowed', 2,
    'locked', v_completed_count >= 2
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_psychometric_attempt_status(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used INT;
  v_last TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*), MAX(completed_at)
  INTO v_used, v_last
  FROM public.psychometric_test_attempts
  WHERE user_id = p_user_id AND completed = true;

  RETURN json_build_object(
    'attempts_used', COALESCE(v_used, 0),
    'attempts_allowed', 2,
    'attempts_remaining', GREATEST(0, 2 - COALESCE(v_used, 0)),
    'locked', COALESCE(v_used, 0) >= 2,
    'last_attempt_at', v_last
  );
END;
$$;

UPDATE public.subscribers s
SET attempt_limit_reached = true,
    last_psychometric_attempt_at = sub.last_at,
    updated_at = now()
FROM (
  SELECT user_id, COUNT(*) AS c, MAX(completed_at) AS last_at
  FROM public.psychometric_test_attempts
  WHERE completed = true
  GROUP BY user_id
) sub
WHERE s.user_id = sub.user_id AND sub.c >= 2;
