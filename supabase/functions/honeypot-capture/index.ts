import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type HoneypotPayload = {
  ip_address?: string;
  attempted_username?: string;
  attempted_password?: string;
  user_agent?: string;
  block_ip?: boolean;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Supabase server configuration is missing' }, 500);
    }

    const payload = await req.json().catch(() => ({})) as HoneypotPayload;
    const ipAddress = String(payload.ip_address || '').trim();
    const attemptedUsername = String(payload.attempted_username || '').trim() || null;
    const attemptedPassword = String(payload.attempted_password || '').trim() || null;
    const userAgent = String(payload.user_agent || '').trim() || null;
    const blockIp = Boolean(payload.block_ip);

    if (!ipAddress) {
      return json({ error: 'ip_address is required' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { error: logError } = await admin
      .from('honeypot_logs')
      .insert({
        ip_address: ipAddress,
        attempted_username: attemptedUsername,
        attempted_password: attemptedPassword,
        user_agent: userAgent,
        is_blocked: blockIp,
      });

    if (logError) throw logError;

    if (blockIp) {
      const { error: blockError } = await admin
        .from('blocked_ips')
        .upsert({
          ip_address: ipAddress,
          reason: 'Honeypot trigger on /admin',
        }, { onConflict: 'ip_address' });

      if (blockError) throw blockError;
    }

    return json({ success: true, ip_address: ipAddress, blocked: blockIp });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return json({ error: message }, 500);
  }
});