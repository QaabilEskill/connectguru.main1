
-- Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Honeypot logs
CREATE TABLE IF NOT EXISTS public.honeypot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text,
  attempted_username text,
  attempted_password text,
  user_agent text,
  is_blocked boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.honeypot_logs TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.honeypot_logs TO authenticated;
GRANT ALL ON public.honeypot_logs TO service_role;
ALTER TABLE public.honeypot_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert honeypot logs" ON public.honeypot_logs;
CREATE POLICY "Anyone can insert honeypot logs" ON public.honeypot_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view honeypot logs" ON public.honeypot_logs;
CREATE POLICY "Admins view honeypot logs" ON public.honeypot_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update honeypot logs" ON public.honeypot_logs;
CREATE POLICY "Admins update honeypot logs" ON public.honeypot_logs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete honeypot logs" ON public.honeypot_logs;
CREATE POLICY "Admins delete honeypot logs" ON public.honeypot_logs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Blocked IPs
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  reason text,
  blocked_at timestamptz NOT NULL DEFAULT now(),
  blocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.blocked_ips TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blocked_ips TO authenticated;
GRANT ALL ON public.blocked_ips TO service_role;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read blocked ips" ON public.blocked_ips;
CREATE POLICY "Anyone can read blocked ips" ON public.blocked_ips
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage blocked ips" ON public.blocked_ips;
CREATE POLICY "Admins manage blocked ips" ON public.blocked_ips
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON public.blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_honeypot_logs_created ON public.honeypot_logs(created_at DESC);
