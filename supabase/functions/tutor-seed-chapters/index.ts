// One-off admin function: refresh tutor_chapters from the bundled course
// content (chapters_data.ts). Idempotent — safe to re-run any time.
// Updates both the title and the system_prompt for each chapter_number, and
// inserts missing chapter rows so the DB matches the seed exactly.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { CHAPTERS } from './chapters_data.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const results: Array<{ chapter_number: number; action: string; ok: boolean; error?: string }> = [];

    for (const c of CHAPTERS) {
      const { data: existing } = await sb
        .from('tutor_chapters')
        .select('id')
        .eq('chapter_number', c.chapter_number)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await sb
          .from('tutor_chapters')
          .update({
            title: c.title,
            system_prompt: c.system_prompt,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        results.push({ chapter_number: c.chapter_number, action: 'update', ok: !error, error: error?.message });
      } else {
        const { error } = await sb.from('tutor_chapters').insert({
          chapter_number: c.chapter_number,
          title: c.title,
          system_prompt: c.system_prompt,
          is_active: true,
        });
        results.push({ chapter_number: c.chapter_number, action: 'insert', ok: !error, error: error?.message });
      }
    }

    // Deactivate any chapter beyond what the seed defines.
    const maxNum = Math.max(...CHAPTERS.map((c) => c.chapter_number));
    await sb.from('tutor_chapters').update({ is_active: false }).gt('chapter_number', maxNum);

    return new Response(JSON.stringify({ updated: results.length, results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
