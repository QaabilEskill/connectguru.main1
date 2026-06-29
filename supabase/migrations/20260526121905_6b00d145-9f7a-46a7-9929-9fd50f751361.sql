
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_user_metadata_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_payments_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_psychometric_orders_updated_at() FROM anon, authenticated, public;
