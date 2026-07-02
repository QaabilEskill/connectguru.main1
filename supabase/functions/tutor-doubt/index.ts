// Tutor doubt — answers a student doubt WITHOUT touching lesson state or messages.
// Used by the "Ask Doubt" button in the classroom. Read-only: does not write tutor_messages,
// does not advance the lesson, does not update progress.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace('Bearer ', '');
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: u } = await sb.auth.getUser(token);
    if (!u?.user) {
      return new Response(JSON.stringify({ error: 'unauth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { chapterId, question } = await req.json();
    const q = String(question ?? '').trim();
    if (!q) {
      return new Response(JSON.stringify({ error: 'missing question' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let chapterContext = '';
    if (chapterId) {
      const { data: chapter } = await sb
        .from('tutor_chapters')
        .select('title,subtitle,description')
        .eq('id', chapterId)
        .maybeSingle();
      if (chapter) {
        chapterContext = `\nCurrent chapter: ${chapter.title}${chapter.subtitle ? ' — ' + chapter.subtitle : ''}.${chapter.description ? '\n' + chapter.description : ''}`;
      }
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are an Indian English (Hinglish) tutor answering a student doubt during a live lesson. ' +
              'Answer the doubt clearly in 2-4 short sentences. Mix Hindi + English naturally. ' +
              'Do NOT advance any lesson, do NOT ask a new question — just answer the doubt and finish.' +
              chapterContext,
          },
          { role: 'user', content: q },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: 'openai_error', detail: t }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const json = await res.json();
    const answer = json?.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't process that doubt right now.";
    return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
