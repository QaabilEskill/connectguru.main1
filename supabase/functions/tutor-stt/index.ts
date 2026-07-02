// Whisper STT — accepts multipart audio, returns transcript.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const form = await req.formData();
    const file = form.get('audio') as File | null;
    if (!file) return new Response(JSON.stringify({ error: 'audio required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const fd = new FormData();
    fd.append('file', file, 'audio.webm');
    fd.append('model', 'whisper-1');
    fd.append('language', 'en');
    fd.append('response_format', 'json');

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: fd,
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: 'whisper', detail: t }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await r.json();
    return new Response(JSON.stringify({ text: data.text ?? '' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
