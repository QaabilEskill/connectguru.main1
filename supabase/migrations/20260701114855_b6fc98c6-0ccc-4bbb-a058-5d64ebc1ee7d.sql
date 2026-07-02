REVOKE EXECUTE ON FUNCTION public.get_leaderboard(int) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated;