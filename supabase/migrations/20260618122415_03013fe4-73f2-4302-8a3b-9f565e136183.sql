CREATE OR REPLACE FUNCTION public.sync_psychometric_attempt_limit(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_count int;
  v_last timestamptz;
BEGIN
  SELECT COUNT(*), MAX(completed_at)
  INTO v_completed_count, v_last
  FROM public.psychometric_test_attempts
  WHERE user_id = p_user_id AND completed = true;

  UPDATE public.subscribers
  SET psychometric_tests_used = v_completed_count,
      psychometric_tests_allowed = 2,
      attempt_limit_reached = v_completed_count >= 2,
      last_psychometric_attempt_at = v_last,
      psychometric_test_completed = v_completed_count > 0,
      psychometric_test_completed_date = COALESCE(v_last, psychometric_test_completed_date),
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

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
    WHERE user_id = NEW.user_id
      AND completed = true
      AND (TG_OP = 'INSERT' OR id <> NEW.id);

    IF v_completed_count >= 2 THEN
      RAISE EXCEPTION 'Maximum Attempt Limit Reached'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_psychometric_attempt_limit ON public.psychometric_test_attempts;
DROP TRIGGER IF EXISTS trg_enforce_psy_limit ON public.psychometric_test_attempts;
CREATE TRIGGER trg_enforce_psychometric_attempt_limit
BEFORE INSERT OR UPDATE OF completed ON public.psychometric_test_attempts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_psychometric_attempt_limit();

CREATE OR REPLACE FUNCTION public.generate_test_access_token(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access boolean;
  v_access_method text;
  v_token text;
  v_expires_at timestamptz;
  v_completed_count int;
BEGIN
  PERFORM public.sync_psychometric_attempt_limit(p_user_id);

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
    PERFORM public.sync_psychometric_attempt_limit(p_user_id);

    RETURN json_build_object(
      'success', false,
      'error', 'Maximum Attempt Limit Reached',
      'locked', true,
      'attempts_used', v_completed_count,
      'attempts_allowed', 2,
      'attempts_remaining', 0
    );
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + interval '15 minutes';

  UPDATE public.test_access_tokens
  SET used = true, used_at = now()
  WHERE user_id = p_user_id AND used = false;

  INSERT INTO public.test_access_tokens (user_id, token, expires_at, access_method)
  VALUES (p_user_id, v_token, v_expires_at, COALESCE(v_access_method, 'direct'));

  RETURN json_build_object(
    'success', true,
    'token', v_token,
    'expires_at', v_expires_at,
    'attempts_used', v_completed_count,
    'attempts_allowed', 2,
    'attempts_remaining', GREATEST(0, 2 - v_completed_count)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_test_access_token(p_token text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record record;
  v_completed_count int;
  v_user_email text;
  v_next_attempt int;
BEGIN
  PERFORM public.sync_psychometric_attempt_limit(p_user_id);

  SELECT COUNT(*) INTO v_completed_count
  FROM public.psychometric_test_attempts
  WHERE user_id = p_user_id AND completed = true;

  IF v_completed_count >= 2 THEN
    PERFORM public.sync_psychometric_attempt_limit(p_user_id);
    RETURN json_build_object(
      'success', false,
      'error', 'Maximum Attempt Limit Reached',
      'locked', true,
      'attempts_used', v_completed_count,
      'attempts_allowed', 2,
      'attempts_remaining', 0
    );
  END IF;

  SELECT * INTO v_record
  FROM public.test_access_tokens
  WHERE token = p_token AND user_id = p_user_id
  FOR UPDATE;

  IF v_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token');
  END IF;

  IF v_record.used THEN
    RETURN json_build_object('success', false, 'error', 'Token already used');
  END IF;

  IF v_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Token expired');
  END IF;

  UPDATE public.test_access_tokens
  SET used = true, used_at = now()
  WHERE id = v_record.id;

  SELECT email INTO v_user_email FROM public.profiles WHERE user_id = p_user_id;

  SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_next_attempt
  FROM public.psychometric_test_attempts
  WHERE user_id = p_user_id;

  INSERT INTO public.psychometric_test_attempts
    (user_id, email, attempt_number, completed, started_at, completed_at)
  VALUES
    (p_user_id, v_user_email, v_next_attempt, true, now(), now());

  v_completed_count := v_completed_count + 1;
  PERFORM public.sync_psychometric_attempt_limit(p_user_id);

  RETURN json_build_object(
    'success', true,
    'attempts_used', v_completed_count,
    'attempts_allowed', 2,
    'attempts_remaining', GREATEST(0, 2 - v_completed_count),
    'locked', v_completed_count >= 2
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_psychometric_test_completed(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_count int;
  v_last timestamptz;
BEGIN
  PERFORM public.sync_psychometric_attempt_limit(user_id_param);

  SELECT COUNT(*), MAX(completed_at)
  INTO v_completed_count, v_last
  FROM public.psychometric_test_attempts
  WHERE user_id = user_id_param AND completed = true;

  IF v_completed_count >= 2 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Maximum Attempt Limit Reached',
      'attempts_used', v_completed_count,
      'attempts_allowed', 2,
      'attempts_remaining', 0,
      'locked', true,
      'last_attempt_at', v_last
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'attempts_used', v_completed_count,
    'attempts_allowed', 2,
    'attempts_remaining', GREATEST(0, 2 - v_completed_count),
    'locked', false,
    'last_attempt_at', v_last
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
  v_used int;
  v_last timestamptz;
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
    'last_attempt_at', v_last,
    'message', CASE WHEN COALESCE(v_used, 0) >= 2 THEN 'Maximum Attempt Limit Reached' ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_psychometric_attempt_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_test_access_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_test_access_token(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_psychometric_test_completed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_psychometric_attempt_status(uuid) TO authenticated;