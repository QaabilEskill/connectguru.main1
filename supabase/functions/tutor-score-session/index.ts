// Scores a completed session from REAL student data. No random / placeholder scores.
// Each score is { value, dataPoints, reason, insufficient } so the UI can explain it.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MIN_RESPONSES = 3;
const MIN_WORDS = 15;

type Score = {
  value: number | null;
  dataPoints: string[];
  reason: string;
  insufficient: boolean;
};

function insufficient(reason: string, dataPoints: string[] = []): Score {
  return { value: null, dataPoints, reason, insufficient: true };
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function countWords(s: string) {
  return (s || '').trim().split(/\s+/).filter(Boolean).length;
}
function countSentences(s: string) {
  return (s || '').split(/[.!?]+/).map((x) => x.trim()).filter(Boolean).length;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace('Bearer ', '');
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: u } = await sb.auth.getUser(token);
    if (!u?.user) return new Response(JSON.stringify({ error: 'unauth' }), { status: 401, headers: corsHeaders });
    const userId = u.user.id;

    const { sessionId } = await req.json();
    if (!sessionId) return new Response(JSON.stringify({ error: 'sessionId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: session } = await sb.from('tutor_sessions').select('*').eq('id', sessionId).eq('user_id', userId).maybeSingle();
    if (!session) return new Response(JSON.stringify({ error: 'session not found' }), { status: 404, headers: corsHeaders });

    const { data: messages } = await sb
      .from('tutor_messages')
      .select('role,content,corrections,pronunciation,created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const all = messages ?? [];
    const studentMsgs = all.filter((m) => m.role === 'student' || m.role === 'user');
    const tutorMsgs = all.filter((m) => m.role === 'tutor' || m.role === 'assistant');
    const tutorQuestions = tutorMsgs.filter((m) => (m.content || '').includes('?')).length;

    const responseCount = studentMsgs.length;
    const totalWords = studentMsgs.reduce((s, m) => s + countWords(m.content), 0);
    const totalSentences = studentMsgs.reduce((s, m) => s + countSentences(m.content), 0);
    const avgWords = responseCount ? totalWords / responseCount : 0;

    // ---- Grammar ----
    let grammar: Score;
    const totalCorrections = studentMsgs.reduce((s, m) => {
      const c = m.corrections;
      if (Array.isArray(c)) return s + c.length;
      if (c && typeof c === 'object' && Array.isArray((c as any).items)) return s + (c as any).items.length;
      return s;
    }, 0);
    if (responseCount < MIN_RESPONSES || totalWords < MIN_WORDS) {
      grammar = insufficient(
        'Not enough student responses to evaluate grammar.',
        [`${responseCount} student responses`, `${totalWords} words`],
      );
    } else {
      // Ratio of clean responses to total responses, weighted by mistake density.
      const cleanResponses = Math.max(0, responseCount - totalCorrections);
      const mistakeDensity = totalCorrections / Math.max(1, totalSentences);
      const value = clamp(100 * (cleanResponses / responseCount) - mistakeDensity * 20);
      grammar = {
        value,
        dataPoints: [
          `${responseCount} responses`,
          `${totalCorrections} grammar mistakes`,
          `${cleanResponses} clean responses`,
          `${totalSentences} sentences`,
        ],
        reason: `Score = clean/total × 100 − density × 20 (density=${mistakeDensity.toFixed(2)})`,
        insufficient: false,
      };
    }

    // ---- Fluency ----
    let fluency: Score;
    if (responseCount < MIN_RESPONSES || totalWords < MIN_WORDS) {
      fluency = insufficient(
        'Not enough speech to measure fluency.',
        [`${responseCount} responses`, `${totalWords} words`, `avg ${avgWords.toFixed(1)} words/response`],
      );
    } else {
      // Reward length (cap at 15 words/response) + sentence completion rate.
      const lengthScore = Math.min(1, avgWords / 15) * 70; // up to 70
      const completionRate = totalSentences / Math.max(1, responseCount); // sentences per response
      const completionScore = Math.min(1, completionRate) * 30; // up to 30
      fluency = {
        value: clamp(lengthScore + completionScore),
        dataPoints: [
          `${responseCount} responses`,
          `${totalWords} total words`,
          `avg ${avgWords.toFixed(1)} words/response`,
          `${totalSentences} complete sentences`,
        ],
        reason: 'Length (avg words capped at 15 → 70pts) + sentence completion (→ 30pts).',
        insufficient: false,
      };
    }

    // ---- Pronunciation ----
    let pronunciation: Score;
    const pronScores: number[] = [];
    for (const m of studentMsgs) {
      const p = m.pronunciation as any;
      if (p && typeof p === 'object') {
        if (typeof p.confidence === 'number') pronScores.push(p.confidence);
        else if (typeof p.score === 'number') pronScores.push(p.score > 1 ? p.score / 100 : p.score);
      }
    }
    if (pronScores.length === 0) {
      pronunciation = insufficient(
        'No speech-recognition confidence captured this session.',
        [`${responseCount} responses`, '0 with pronunciation data'],
      );
    } else {
      const avg = pronScores.reduce((a, b) => a + b, 0) / pronScores.length;
      pronunciation = {
        value: clamp(avg * 100),
        dataPoints: [
          `${pronScores.length} responses with STT confidence`,
          `avg confidence ${(avg * 100).toFixed(0)}%`,
        ],
        reason: 'Average speech-to-text confidence across spoken responses.',
        insufficient: false,
      };
    }

    // ---- Confidence ----
    let confidence: Score;
    if (responseCount === 0) {
      confidence = insufficient('Student did not respond.', ['0 responses']);
    } else if (tutorQuestions === 0) {
      confidence = insufficient('Tutor asked no questions yet.', [`${responseCount} responses`]);
    } else {
      const participation = Math.min(1, responseCount / tutorQuestions); // answered ratio
      const lengthFactor = Math.min(1, avgWords / 10);
      const value = clamp(participation * 60 + lengthFactor * 40);
      confidence = {
        value,
        dataPoints: [
          `${responseCount} responses to ${tutorQuestions} questions`,
          `participation ${(participation * 100).toFixed(0)}%`,
          `avg ${avgWords.toFixed(1)} words/response`,
        ],
        reason: 'Participation rate (60pts) + response length factor (40pts).',
        insufficient: false,
      };
    }

    // ---- Speaking (overall, only if any numeric subscore exists) ----
    const numeric = [grammar, fluency, pronunciation, confidence].filter((s) => !s.insufficient && s.value !== null);
    let speaking: Score;
    if (numeric.length === 0) {
      speaking = insufficient(
        'Not enough interaction to score this session.',
        [`${responseCount} responses`, `${totalWords} words`],
      );
    } else {
      const avg = numeric.reduce((a, s) => a + (s.value as number), 0) / numeric.length;
      speaking = {
        value: clamp(avg),
        dataPoints: [`average of ${numeric.length} sub-scores`],
        reason: 'Average of available sub-scores.',
        insufficient: false,
      };
    }

    // ---- Optional qualitative summary (only when there is meaningful data) ----
    let summary: string | null = null;
    let suggestions: string[] = [];
    let strengths: string[] = [];
    let weaknesses: string[] = [];

    if (responseCount >= MIN_RESPONSES && totalWords >= MIN_WORDS && OPENAI_KEY) {
      const transcript = all.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `Given this English-tutoring transcript, return STRICT JSON {"summary":"2-3 sentences","suggestions":["tip","tip","tip"],"strengths":["1-3 words"],"weaknesses":["1-3 words"]}. Do NOT invent numeric scores.\n\n${transcript}`,
            }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });
        const j = await r.json();
        const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? '{}');
        summary = parsed.summary ?? null;
        suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [];
        strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [];
        weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5) : [];
      } catch (_) { /* qualitative is optional */ }
    } else {
      summary = 'Not enough student interaction to summarise this session.';
    }

    const scores = {
      version: 2,
      meta: {
        responseCount,
        totalWords,
        totalSentences,
        tutorQuestions,
        totalCorrections,
        pronunciationSamples: pronScores.length,
        minResponses: MIN_RESPONSES,
        minWords: MIN_WORDS,
      },
      speaking,
      grammar,
      fluency,
      pronunciation,
      confidence,
      summary,
      suggestions,
      strengths,
      weaknesses,
    };

    await sb.from('tutor_sessions').update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      scores,
      summary,
      suggestions,
    }).eq('id', sessionId);

    // Progress + gamification only when we have a real overall score.
    if (!speaking.insufficient && speaking.value !== null) {
      const avg = speaking.value;
      const { data: existingProg } = await sb.from('tutor_progress').select('*').eq('user_id', userId).eq('chapter_id', session.chapter_id).maybeSingle();
      const newDifficulty = Math.max(1, Math.min(5, (existingProg?.difficulty_level ?? 1) + (avg >= 80 ? 1 : avg < 50 ? -1 : 0)));
      if (existingProg) {
        await sb.from('tutor_progress').update({
          completed: true,
          completed_at: new Date().toISOString(),
          attempts: (existingProg.attempts ?? 0) + 1,
          best_scores: scores,
          last_session_id: sessionId,
          difficulty_level: newDifficulty,
        }).eq('id', existingProg.id);
      } else {
        await sb.from('tutor_progress').insert({
          user_id: userId,
          chapter_id: session.chapter_id,
          completed: true,
          completed_at: new Date().toISOString(),
          attempts: 1,
          best_scores: scores,
          last_session_id: sessionId,
          difficulty_level: newDifficulty,
        });
      }

      const { data: mem } = await sb.from('tutor_memory').select('*').eq('user_id', userId).maybeSingle();
      const mergedStrengths = Array.from(new Set([...(mem?.strengths ?? []), ...strengths])).slice(0, 8);
      const mergedWeaknesses = Array.from(new Set([...(mem?.weaknesses ?? []), ...weaknesses])).slice(0, 8);
      const memSummary = summary ?? mem?.summary ?? '';
      if (mem) {
        await sb.from('tutor_memory').update({
          summary: memSummary,
          strengths: mergedStrengths,
          weaknesses: mergedWeaknesses,
          total_sessions: (mem.total_sessions ?? 0) + 1,
        }).eq('id', mem.id);
      } else {
        await sb.from('tutor_memory').insert({
          user_id: userId,
          summary: memSummary,
          strengths: mergedStrengths,
          weaknesses: mergedWeaknesses,
          total_sessions: 1,
        });
      }

      // Chapter completion bonus is configurable via tutor_xp_config
      let bonus = 100;
      try {
        const { data: cfg } = await sb.from('tutor_xp_config').select('value').eq('key', 'chapter_completion_bonus').maybeSingle();
        if (cfg && Number.isFinite(Number(cfg.value))) bonus = Number(cfg.value);
      } catch (_) { /* fall back to default */ }
      const xpEarned = bonus + Math.round(avg / 2);
      const { data: gam } = await sb.from('user_gamification').select('*').eq('user_id', userId).maybeSingle();
      const today = new Date().toISOString().slice(0, 10);
      if (gam) {
        const last = gam.last_active_date as string | null;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = last === today ? (gam.streak_days ?? 1) : last === yesterday ? (gam.streak_days ?? 0) + 1 : 1;
        const newXp = (gam.xp ?? 0) + xpEarned;
        const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);
        await sb.from('user_gamification').update({
          xp: newXp, level: newLevel, streak_days: newStreak, last_active_date: today,
        }).eq('user_id', userId);
      } else {
        await sb.from('user_gamification').insert({
          user_id: userId, xp: xpEarned, level: 1, streak_days: 1, last_active_date: today, badges: [],
        });
      }

      return new Response(JSON.stringify({ scores, xpEarned }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ scores, xpEarned: 0, insufficient: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
