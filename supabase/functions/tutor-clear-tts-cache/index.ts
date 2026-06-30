// One-off: clear the tutor-tts-cache storage bucket so old lesson MP3s are removed.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET = 'tutor-tts-cache';

async function listAll(sb: ReturnType<typeof createClient>, prefix = ''): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb.storage.from(BUCKET).list(prefix, { limit: 1000, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null || item.metadata === null) {
        // folder — recurse
        const nested = await listAll(sb, path);
        out.push(...nested);
      } else {
        out.push(path);
      }
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const paths = await listAll(sb);
    let removed = 0;
    for (let i = 0; i < paths.length; i += 100) {
      const batch = paths.slice(i, i + 100);
      const { error } = await sb.storage.from(BUCKET).remove(batch);
      if (!error) removed += batch.length;
    }
    return new Response(JSON.stringify({ ok: true, removed, total: paths.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
