// Tutor chat — calls OpenAI with chapter system prompt + memory + history.
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
    if (!u?.user) return new Response(JSON.stringify({ error: 'unauth' }), { status: 401, headers: corsHeaders });
    const userId = u.user.id;

    const { sessionId, chapterId, userMessage, inputMode } = await req.json();
    if (!sessionId || !chapterId) {
      return new Response(JSON.stringify({ error: 'missing params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const [{ data: chapter }, { data: memory }, { data: profile }, { data: history }, { data: session }] = await Promise.all([
      sb.from('tutor_chapters').select('*').eq('id', chapterId).maybeSingle(),
      sb.from('tutor_memory').select('*').eq('user_id', userId).maybeSingle(),
      sb.from('profiles').select('full_name').eq('user_id', userId).maybeSingle(),
      sb.from('tutor_messages').select('role,content,corrections').eq('session_id', sessionId).order('created_at', { ascending: true }).limit(40),
      sb.from('tutor_sessions').select('id,user_id,chapter_id').eq('id', sessionId).eq('user_id', userId).eq('chapter_id', chapterId).maybeSingle(),
    ]);

    if (!chapter) return new Response(JSON.stringify({ error: 'chapter not found' }), { status: 404, headers: corsHeaders });
    if (!session) return new Response(JSON.stringify({ error: 'session not found' }), { status: 404, headers: corsHeaders });

    // EMPTY-CHAPTER SHORT-CIRCUIT — if the chapter has no script yet, do not
    // call the model and do not produce any spoken/text reply. The lesson is
    // marked complete immediately so no voice plays and no caption appears.
    const promptText = String(chapter.system_prompt ?? '').trim();
    const isEmptyChapter = !promptText
      || /lesson content not yet provided/i.test(promptText)
      || /=== LESSON SCRIPT \(verbatim\) ===\s*\(\s*\)\s*=== END LESSON SCRIPT ===/i.test(promptText)
      || /=== LESSON SCRIPT \(verbatim\) ===\s*=== END LESSON SCRIPT ===/i.test(promptText);
    if (isEmptyChapter) {
      return new Response(JSON.stringify({
        reply: '',
        complete: true,
        beatType: 'introduction',
        awaitingStudentResponse: false,
        studentAnswerCorrect: true,
        corrections: {
          studentAnswerCorrect: true,
          needsRepeat: false,
          correctedSentence: '',
          beatType: 'introduction',
          awaitingStudentResponse: false,
          lastQuestion: '',
          inputMode: inputMode === 'voice' ? 'voice' : inputMode === 'system' ? 'system' : 'text',
        },
        empty: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Resolve the student's real name with multiple fallbacks so the tutor
    // never says the literal word "Student" when any name is available.
    const meta: any = u.user.user_metadata ?? {};
    const rawName: string =
      (profile?.full_name && String(profile.full_name).trim()) ||
      (meta.full_name && String(meta.full_name).trim()) ||
      (meta.name && String(meta.name).trim()) ||
      (u.user.email ? String(u.user.email).split('@')[0].replace(/[._-]+/g, ' ') : '') ||
      '';
    const firstName = rawName ? rawName.split(/\s+/)[0] : '';
    const studentName = firstName
      ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
      : 'Student';
    const hasRealName = Boolean(firstName);
    const memSummary = memory?.summary ? `\nWhat you remember about ${studentName}: ${memory.summary}` : '';
    const strengths = memory?.strengths?.length ? `\nStrengths: ${memory.strengths.join(', ')}` : '';
    const weaknesses = memory?.weaknesses?.length ? `\nWeak areas (focus on these gently): ${memory.weaknesses.join(', ')}` : '';
    const lastAssistant = [...(history ?? [])].reverse().find((m) => m.role === 'assistant');
    const lastCorr: any = lastAssistant?.corrections ?? {};
    const pendingRepeat = Boolean(lastCorr.needsRepeat);
    const pendingSentence = String(lastCorr.correctedSentence ?? '');
    const lastBeatType: string = String(lastCorr.beatType ?? '');
    const lastAwaiting: boolean = Boolean(lastCorr.awaitingStudentResponse);
    // The literal text of the most recent question we asked. Used so the model
    // can evaluate the student's current answer semantically against that
    // specific prompt, not against the entire chapter context.
    const lastQuestionText: string = String(lastCorr.lastQuestion ?? (lastBeatType === 'question' ? (lastAssistant?.content ?? '') : ''));

    const historyLen = (history ?? []).length;
    const isFirstBeat = historyLen === 0;
    const isAutoAdvance = (!userMessage || userMessage === '') && inputMode === 'system' && historyLen > 0;
    const isStudentAnswer = Boolean(userMessage) && (inputMode === 'voice' || inputMode === 'text');

    const memSummaryLine = isFirstBeat ? '' : (memory?.summary ? `\nWhat you remember about ${studentName}: ${memory.summary}` : '');

    const system = `You are an Indian English tutor (Hinglish-speaking) teaching ONE student one-on-one. Mix Hindi+English (Hinglish) naturally. Keep English grammar correct, warmth in Hinglish.

OFFICIAL CURRICULUM (teach EXACTLY this, line by line — do not skip, shorten, paraphrase, or invent):
${chapter.system_prompt}

Student name: ${studentName}. ${hasRealName ? `ALWAYS address the student as "${studentName}" ONLY in greetings, praise, encouragement, corrections and farewells (e.g. "Hello ${studentName}", "Very good ${studentName}", "Acha koshish ${studentName}"). NEVER insert "${studentName}" into LESSON ANSWER TEMPLATES, example sentences, or curriculum content. The template "I am a student." MUST stay "I am a student." — do NOT change it to "I am ${studentName}." Likewise never substitute the name into "I live in...", "I am a student of Class ___", or any other model answer. NEVER use the literal placeholder words "Student", "student", "Hello Student", "Hi Student", "Welcome Student", "dear student", "bachcha" as a vocative — use "${studentName}" by name for greetings/praise/corrections only.` : 'No real name is on file — you may use "Student" as a neutral address.'}${memSummaryLine}${strengths}${weaknesses}

Latest student input mode: ${inputMode === 'voice' ? 'VOICE transcription' : inputMode === 'system' ? (isFirstBeat ? 'SYSTEM start-of-chapter (no prior history — deliver the chapter\'s FIRST beat from the very beginning)' : 'SYSTEM auto-advance (no student input — deliver next beat)') : 'text'}.
${isFirstBeat ? `\nFIRST BEAT RULE: This is the START of the chapter. There is NO prior history. The student has just (re)started. Deliver the chapter's opening line verbatim. beatType="introduction", awaitingStudentResponse=false.` : ''}
${pendingRepeat ? `\nREPEAT PENDING: last tutor turn asked student to repeat: "${pendingSentence}". Verify the repeat now. If wrong, correct again (needsRepeat=true, studentAnswerCorrect=false, awaitingStudentResponse=true, beatType="question"). Do NOT advance until correct.` : ''}
${isStudentAnswer && lastQuestionText ? `\nLAST QUESTION YOU ASKED (evaluate the student's CURRENT message against THIS question only): "${lastQuestionText}"` : ''}

CRITICAL RULES — follow every turn without exception:

1. BEAT TYPES — classify what YOU are about to deliver:
   - "introduction" → greeting / chapter intro line. Do NOT ask anything.
   - "explanation" → teaching content / example / rule. Do NOT ask anything.
   - "question" → a real question that requires the student to answer/repeat/translate/speak.

2. ONE CONTINUOUS SPOKEN SEGMENT PER TURN — deliver all consecutive non-interactive curriculum lines that belong together (intro, explanation, examples, transitions) as one natural spoken segment. Do NOT stop after every sentence. Stop only when you reach a real Student Response / speaking prompt, then include that prompt and wait.

3. WAITING RULE — set awaitingStudentResponse based on beatType:
   - introduction → FALSE only when the segment contains no student speaking prompt
   - explanation  → FALSE only when the segment contains no student speaking prompt
   - question     → TRUE when the segment ends at a real Student Response / speaking prompt
   IMPORTANT: Do NOT classify "Ready?", rhetorical checks, quoted example questions, or lesson setup lines as question. Only use beatType="question" when the student must answer/repeat/speak now, usually near "Student Response", "your turn", "ab aap jawab dijiye", "repeat kijiye", "boliye", or an equivalent direct practice instruction.

4. SEMANTIC ANSWER EVALUATION — when isStudentAnswer is true (the student just spoke/typed), evaluate their reply against LAST QUESTION YOU ASKED using MEANING, not exact wording. Mark studentAnswerCorrect=TRUE when ANY of these hold:
   (a) The reply directly answers the question, in ANY form: short ("Mumbai"), long ("I live in Mumbai"), Hinglish ("Main Mumbai mein rehta hu"), partial-but-on-topic ("Mumbai mein"), or a synonym.
   (b) The reply repeats the requested phrase with the correct meaning, even if the student adds filler ("ok ji Very Good Morning").
   (c) The grammar is imperfect but the intent matches — accept and gently model the correct full sentence as part of your praise, then advance.
   Examples — ALL of these are CORRECT for "Where do you live?": "Mumbai", "I live in Mumbai", "I'm from Mumbai", "Main Mumbai mein rehta hu", "Mumbai city", "Mumbai mein", "i live mumbai".
   Mark studentAnswerCorrect=FALSE ONLY when ALL of these hold:
     - The reply is off-topic / nonsense / silence / doesn't address the question at all, OR
     - It contains a concrete grammar / word error you can name in one short Hinglish line.
   If unsure → treat as CORRECT.

5. NEVER mark wrong during introductions, explanations, or system auto-advances. NEVER add "choti si galti" or "sahi sentence hai" or "Please repeat" unless rule 4's FALSE conditions are met.

5a. POSITIVE-ONLY FEEDBACK WHEN CORRECT — CRITICAL:
    When studentAnswerCorrect=TRUE you MUST use praise-only language. You are FORBIDDEN from using ANY of these phrases (English or Hinglish) in the reply:
      "Good try", "Nice try", "Nice attempt", "Acha koshish", "Acchi koshish", "Achhi koshish",
      "Try again", "Phir se", "Repeat kijiye", "Please repeat",
      "There is a mistake", "There is a small mistake", "Small mistake", "choti si galti", "choti galti", "Yaha galti hai", "galti hai",
      "Sahi sentence hai", "The correct sentence is", "Correct sentence is".
    Instead use ONE of these natural positive openers (mix Hinglish naturally), then deliver the NEXT curriculum beat:
      "Great, ${studentName}!", "Excellent, ${studentName}!", "Perfect, ${studentName}!", "Well done, ${studentName}!", "That's correct, ${studentName}!", "Shabaash, ${studentName}!", "Bahut acha, ${studentName}!", "Very good, ${studentName}!".
    A correct answer MUST result in pure praise + the next curriculum beat — never a correction phrasing.

6. CORRECT-ANSWER FORMAT: short Hinglish praise using name ("Shabaash ${studentName}!" / "Excellent ${studentName}!" / "Very good ${studentName}!") then deliver the NEXT curriculum beat.

7. WRONG-ANSWER FORMAT (only when rule 4 FALSE conditions met):
   "Acha koshish ${studentName}! Yaha choti si galti hai — <one-line Hinglish reason>. Sahi sentence hai: <correct English>. Ab aap repeat kijiye: <correct English>."
   Set needsRepeat=true, studentAnswerCorrect=false, awaitingStudentResponse=true, beatType="question".

8. SYSTEM AUTO-ADVANCE: if inputMode="system" and there is prior history, deliver the NEXT continuous curriculum segment now. Continue through consecutive explanation/example lines so the tutor does not create separate audio clips for every sentence. Stop only at a real Student Response / speaking prompt. Do NOT praise, do NOT correct, do NOT re-greet.

9. NEVER read the whole chapter or ask multiple questions in one reply. No markdown, bullets, emojis, stage directions.

10. When the ENTIRE chapter has been delivered through the final line, set chapterComplete=true.

11. If your reply IS a question, also fill "lastQuestion" with the EXACT question text you are asking (so the next turn can evaluate the answer). Otherwise leave lastQuestion as "".

Last beat info: prevBeatType="${lastBeatType}", prevAwaiting=${lastAwaiting}.

Return ONLY valid JSON:
{
  "reply": "short spoken tutor reply",
  "beatType": "introduction" | "explanation" | "question",
  "awaitingStudentResponse": true | false,
  "studentAnswerCorrect": true | false,
  "needsRepeat": true | false,
  "correctedSentence": "correct sentence or empty string",
  "lastQuestion": "exact question text you just asked, or empty string",
  "chapterComplete": true | false
}`;

    const lastAssistantText: string = String(lastAssistant?.content ?? '').trim();
    const autoAdvanceUserMsg = lastAssistantText
      ? `[SYSTEM: previous spoken segment finished playing. Your PREVIOUS assistant message was:\n"""\n${lastAssistantText}\n"""\nDeliver the NEXT continuous curriculum segment that comes AFTER that text in the OFFICIAL CURRICULUM. Do NOT repeat, rephrase, or echo the previous segment. Do NOT greet, praise, or correct. Continue through consecutive teaching/example lines as one natural explanation, and stop only when the next real Student Response / speaking prompt is reached. If the segment ends with a student prompt, set beatType="question" and awaitingStudentResponse=true.]`
      : '[SYSTEM: previous spoken segment finished playing. Deliver the next continuous curriculum segment now. Do not greet again, do not praise, do not correct. Stop only at a real Student Response / speaking prompt.]';

    const callModel = async (extraNudge?: string) => {
      const msgs: Array<{ role: string; content: string }> = [{ role: 'system', content: system + (extraNudge ? `\n\n${extraNudge}` : '') }];
      (history ?? []).forEach((m) => msgs.push({ role: m.role, content: m.content }));
      if (userMessage) msgs.push({ role: 'user', content: userMessage });
      else if (isAutoAdvance) msgs.push({ role: 'user', content: autoAdvanceUserMsg });
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: msgs,
          temperature: 0,
          max_tokens: 520,
          response_format: { type: 'json_object' },
        }),
      });
      return r;
    };

    let r = await callModel();
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: 'openai', detail: t }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    let data = await r.json();
    let raw: string = data.choices?.[0]?.message?.content?.trim() ?? '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { reply: raw }; }

    // Anti-loop guard: if auto-advance produced the SAME line as the last
    // assistant beat (model echoing the curriculum cursor), retry once with
    // a stronger "skip past this line" instruction. Without this the lesson
    // gets stuck (e.g. at "Pattern yaad rakho: I live in + Area + City").
    const normalize = (s: string) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (isAutoAdvance && lastAssistantText && normalize(parsed.reply) === normalize(lastAssistantText)) {
      const nudge = `ANTI-LOOP OVERRIDE: The model just tried to repeat the previous beat verbatim:\n"""\n${lastAssistantText}\n"""\nThat beat is ALREADY DELIVERED. You MUST emit the strictly NEXT curriculum line that follows it. Skip past it entirely. If the next curriculum line is an example, deliver the example. If the next line asks the student to speak/answer, deliver that prompt with beatType="question" and awaitingStudentResponse=true. Never re-emit the same beat.`;
      const r2 = await callModel(nudge);
      if (r2.ok) {
        const data2 = await r2.json();
        const raw2: string = data2.choices?.[0]?.message?.content?.trim() ?? '{}';
        try {
          const parsed2 = JSON.parse(raw2);
          if (normalize(parsed2.reply) !== normalize(lastAssistantText)) {
            data = data2; raw = raw2; parsed = parsed2;
          }
        } catch { /* keep first response */ }
      }
    }

    const reply = String(parsed.reply ?? "Let's continue one step at a time.").replace(/^[\s"']+|[\s"']+$/g, '');
    const isComplete = Boolean(parsed.chapterComplete) || /\[CHAPTER_COMPLETE\]|<<<LESSON_COMPLETE>>>/i.test(reply);
    let cleanReply = reply.replace(/\[CHAPTER_COMPLETE\]|<<<LESSON_COMPLETE>>>/gi, '').trim();
    // Safety net: if a real name exists, replace ONLY clear vocative uses of
    // "student" (e.g. "Hello student", "dear student,") with the student's
    // first name. We must NEVER touch the word inside lesson answer templates
    // like "I am a student." or "I am a student of Class 9" — that turned
    // the template into "I am Ayan." which is wrong content.
    if (hasRealName) {
      cleanReply = cleanReply
        .replace(/\b(Hello|Hi|Hey|Welcome(?: back)?|Namaste|Shabaash|Excellent|Very good|Great(?: job)?|Good job|Well done|Bahut acha|Wah|Acha koshish|Dear)\s+(?:dear\s+)?students?\b/gi, (_m, g1) => `${g1} ${studentName}`)
        .replace(/\bdear students?\b/gi, `dear ${studentName}`);
    }

    const isExplicitStudentPrompt = (text: string) => {
      const lower = text.toLowerCase();
      return /\(\s*student\s*response\s*\)/i.test(text)
        || /\byour turn\b/.test(lower)
        || /\bnow\s+.*\b(answer|respond|repeat|speak|say|practice|turn)\b/.test(lower)
        || /\bab\s+.*\b(jawab|boliye|bolna|repeat|bataiye|practice|kijiye|dijiye)\b/.test(lower)
        || /\baap\s+.*\b(jawab|boliye|bolna|repeat|bataiye|practice|kijiye|dijiye)\b/.test(lower);
    };
    const isNonInteractiveQuestion = (text: string) => {
      const lower = text.toLowerCase().trim();
      return /^ready\??$/.test(lower)
        || /\bready\?\s*(let'?s|chaliye|start|shuru)/i.test(text)
        || /\biska matlab\b|\bmeans\b|\bjaise\b|\bfor example\b/i.test(text);
    };
    const explicitPrompt = isExplicitStudentPrompt(cleanReply);
    let beatType = ['introduction', 'explanation', 'question'].includes(parsed.beatType) ? parsed.beatType : (explicitPrompt ? 'question' : 'explanation');
    if (explicitPrompt) beatType = 'question';
    if (beatType === 'question' && !explicitPrompt && !/\?/.test(cleanReply)) beatType = 'explanation';
    if (beatType === 'question' && !explicitPrompt && isNonInteractiveQuestion(cleanReply)) beatType = 'explanation';
    let awaiting = beatType === 'question' && (explicitPrompt || parsed.awaitingStudentResponse === true);

    // HARD GUARD — the very first beat of a chapter must always be the
    // introduction. The model occasionally jumps straight to a question on
    // beat 1, which makes the tutor "skip the intro and immediately ask".
    // Force-introduction here regardless of what the model returned.
    if (isFirstBeat) {
      beatType = 'introduction';
      awaiting = false;
    }
    // Capture the literal question text so the NEXT turn can evaluate the
    // student's answer against this exact prompt (semantic match, not whole
    // chapter context).
    const lastQuestion = beatType === 'question'
      ? String(parsed.lastQuestion || cleanReply).slice(0, 400)
      : '';
    const correction = {
      studentAnswerCorrect: parsed.studentAnswerCorrect !== false,
      needsRepeat: Boolean(parsed.needsRepeat),
      correctedSentence: String(parsed.correctedSentence ?? ''),
      beatType,
      awaitingStudentResponse: awaiting,
      lastQuestion,
      inputMode: inputMode === 'voice' ? 'voice' : inputMode === 'system' ? 'system' : 'text',
    };

    // Persist user msg + reply
    if (userMessage) {
      await sb.from('tutor_messages').insert({
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: userMessage,
        pronunciation: inputMode === 'voice' ? { evaluatedFromSpeechTranscript: true } : null,
      });
    }
    await sb.from('tutor_messages').insert({ session_id: sessionId, user_id: userId, role: 'assistant', content: cleanReply, corrections: correction });

    return new Response(JSON.stringify({
      reply: cleanReply,
      complete: isComplete,
      beatType,
      awaitingStudentResponse: awaiting,
      studentAnswerCorrect: correction.studentAnswerCorrect,
      corrections: correction,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
