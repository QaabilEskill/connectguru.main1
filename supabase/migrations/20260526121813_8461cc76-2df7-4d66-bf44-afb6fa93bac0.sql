
-- Restrict referral_codes: remove broad SELECT; redemption uses SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Anyone can check referral codes" ON public.referral_codes;

-- Remove user-facing UPDATE on subscribers (privilege escalation risk).
-- All privilege changes happen via SECURITY DEFINER functions / edge functions using service role.
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

-- Remove user-facing UPDATE on psychometric_test_attempts (state tampering risk).
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.psychometric_test_attempts;

-- Revoke EXECUTE from anon on SECURITY DEFINER functions; keep authenticated where needed.
REVOKE EXECUTE ON FUNCTION public.can_take_psychometric_test(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_test_access_token(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.consume_test_access_token(text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.activate_test_via_payment(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_referral_code(text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_psychometric_test_completed(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_test_attempts(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.can_take_psychometric_test(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_test_access_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_test_access_token(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_test_via_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_referral_code(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_psychometric_test_completed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_test_attempts(uuid) TO authenticated;
