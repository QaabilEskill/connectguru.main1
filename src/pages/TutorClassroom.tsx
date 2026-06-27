import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AIOrb from '@/components/tutor/AIOrb';
import StudentTile, { StudentTileHandle } from '@/components/tutor/StudentTile';
import ControlsDock from '@/components/tutor/ControlsDock';
import CaptionBar from '@/components/tutor/CaptionBar';
import RealtimeFeedback from '@/components/tutor/RealtimeFeedback';
import { AskDoubtDialog, SaveWordDialog, NotesPanel, type Transcript } from '@/components/tutor/ClassroomToolkit';
import { useVoiceLoop, type LessonState } from '@/hooks/useVoiceLoop';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TutorClassroom() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as 'start' | 'resume' | 'retake' | null) ?? 'start';
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [caption, setCaption] = useState<{ text: string; who: 'tutor' | 'you' | null }>({ text: '', who: null });
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [, setLessonState] = useState<LessonState>('IDLE');
  const [isResuming, setIsResuming] = useState(false);
  const [resumeReady, setResumeReady] = useState(false);
  const [resumeAwaiting, setResumeAwaiting] = useState(false);
  const [resumeBeatType, setResumeBeatType] = useState<string | undefined>(undefined);
  const [lastCorrections, setLastCorrections] = useState<any | null>(null);

  // Progress
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  const [totalDays, setTotalDays] = useState<number | null>(null);
  const [progressPct, setProgressPct] = useState<number>(0);

  // Toolkit state
  const [transcript, setTranscript] = useState<Transcript>([]);
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [showDoubt, setShowDoubt] = useState(false);
  const [showSaveWord, setShowSaveWord] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const studentRef = useRef<StudentTileHandle | null>(null);
  // Holds the URL of the student's most recent recorded answer so they can
  // replay it during the lesson. Old URL is revoked when a new one arrives,
  // and the whole thing is cleared on chapter completion.
  const [lastStudentAudioUrl, setLastStudentAudioUrl] = useState<string | null>(null);
  const lastStudentAudioUrlRef = useRef<string | null>(null);
  const studentPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const setLatestStudentAudio = useCallback((blob: Blob | null) => {
    if (lastStudentAudioUrlRef.current) {
      try { URL.revokeObjectURL(lastStudentAudioUrlRef.current); } catch { /* noop */ }
      lastStudentAudioUrlRef.current = null;
    }
    if (studentPlaybackRef.current) {
      try { studentPlaybackRef.current.pause(); } catch { /* noop */ }
      studentPlaybackRef.current = null;
    }
    if (!blob) { setLastStudentAudioUrl(null); return; }
    const url = URL.createObjectURL(blob);
    lastStudentAudioUrlRef.current = url;
    setLastStudentAudioUrl(url);
  }, []);
  const playLastStudentResponse = useCallback(() => {
    const url = lastStudentAudioUrlRef.current;
    if (!url) return;
    const el = new Audio(url);
    (el as any).playsInline = true;
    el.setAttribute('playsinline', '');
    el.volume = 1.0;
    studentPlaybackRef.current = el;
    el.onended = () => { studentPlaybackRef.current = null; };
    el.play().catch(() => { /* noop */ });
  }, []);
  useEffect(() => () => {
    if (lastStudentAudioUrlRef.current) {
      try { URL.revokeObjectURL(lastStudentAudioUrlRef.current); } catch { /* noop */ }
    }
  }, []);
  const completingRef = useRef(false);
  const autoStartedRef = useRef(false);
  // Guards against duplicate session creation when this effect re-runs because
  // `user` or other dep references change (Supabase emits SIGNED_IN twice on
  // mount, which previously inserted a fresh tutor_sessions row each time and
  // made the voice loop restart the lesson from line 1 mid-narration).
  const sessionBootRef = useRef<string | null>(null);


  const markChapterResumable = useCallback(async (activeSessionId: string, messageCount: number, summary: string | null = null) => {
    if (!user || !chapterId) return;
    await supabase.from('tutor_progress').upsert({
      user_id: user.id,
      chapter_id: chapterId,
      completed: false,
      resumable: true,
      last_session_id: activeSessionId,
      last_message_index: messageCount,
      last_beat_summary: summary,
    }, { onConflict: 'user_id,chapter_id' });
  }, [user, chapterId]);

  const voice = useVoiceLoop({
    sessionId,
    chapterId: chapterId ?? null,
    onAssistantText: (t) => {
      setCaption({ text: t, who: 'tutor' });
      setTranscript((prev) => [...prev, { who: 'tutor', text: t, at: Date.now() }]);
    },
    onUserText: (t) => {
      setCaption({ text: t, who: 'you' });
      setTranscript((prev) => [...prev, { who: 'you', text: t, at: Date.now() }]);
    },
    onLessonStateChange: setLessonState,
    onCorrections: (c) => setLastCorrections(c),
    onStudentAudio: (blob) => setLatestStudentAudio(blob),
    onTtsFailure: () => {
      toast({
        title: 'Voice hiccup',
        description: 'A line had trouble playing — continuing the lesson. Tap Repeat any time to hear it again.',
      });
    },
    onComplete: async () => {
      if (completingRef.current) return;
      completingRef.current = true;
      // Clear all student voice recordings — they must NOT persist across
      // chapters. Next lesson starts with a clean slate.
      setLatestStudentAudio(null);
      toast({ title: 'Chapter complete! 🎉', description: 'Scoring your session…' });
      try {
        if (user && chapterId) {
          await supabase.from('tutor_progress').upsert({
            user_id: user.id, chapter_id: chapterId, completed: true, resumable: false,
          }, { onConflict: 'user_id,chapter_id' });
        }
        await supabase.functions.invoke('tutor-score-session', { body: { sessionId } });
      } catch (e) { console.error(e); }
      navigate(`/tutor/results/${sessionId}`, { replace: true });
    },
  });

  // Load chapter + start/resume/retake a session
  useEffect(() => {
    if (loading || !chapterId) return;
    if (!user) { navigate('/auth?redirect=/tutor', { replace: true }); return; }
    // Only boot one session per (chapter, mode) — see sessionBootRef comment.
    const bootKey = `${chapterId}::${mode}`;
    if (sessionBootRef.current === bootKey) return;
    sessionBootRef.current = bootKey;
    (async () => {

      const [{ data: chap }, { data: allChapters }, { data: progRows }] = await Promise.all([
        supabase.from('tutor_chapters').select('title,chapter_number').eq('id', chapterId).maybeSingle(),
        supabase.from('tutor_chapters').select('id,chapter_number').eq('is_active', true).order('chapter_number', { ascending: true }),
        supabase.from('tutor_progress').select('chapter_id,completed').eq('user_id', user.id),
      ]);
      setChapterTitle(chap?.title ?? '');
      const total = allChapters?.length ?? 0;
      setTotalDays(total);
      setDayNumber(chap?.chapter_number ?? null);
      const completed = (progRows ?? []).filter((r: any) => r.completed).length;
      setProgressPct(total > 0 ? Math.round((completed / total) * 100) : 0);

      // RESUME: reuse the chapter's saved session for any chapter/day,
      // hydrate transcript from tutor_messages, then continue from the last
      // saved beat instead of restarting.
      if (mode === 'resume') {
        const { data: savedProgress } = await supabase
          .from('tutor_progress')
          .select('last_session_id,last_message_index,resumable')
          .eq('user_id', user.id)
          .eq('chapter_id', chapterId)
          .maybeSingle();
        let existing: { id: string } | null = savedProgress?.last_session_id ? { id: savedProgress.last_session_id } : null;
        if (!existing) {
          const { data: recent } = await supabase
            .from('tutor_sessions')
            .select('id')
            .eq('user_id', user.id)
            .eq('chapter_id', chapterId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          existing = recent;
        }
        if (existing?.id) {
          const { data: msgs } = await supabase
            .from('tutor_messages')
            .select('role,content,created_at,corrections')
            .eq('session_id', existing.id)
            .order('created_at', { ascending: true });
          const savedCount = savedProgress?.last_message_index ?? msgs?.length ?? 0;
          const hydratedMsgs = savedCount > 0 ? (msgs ?? []).slice(0, savedCount) : (msgs ?? []);
          if (hydratedMsgs.length) {
            setTranscript(hydratedMsgs.map((m: any) => ({ who: m.role === 'assistant' ? 'tutor' : 'you', text: m.content, at: new Date(m.created_at).getTime() })));
            const lastTutor = [...hydratedMsgs].reverse().find((m: any) => m.role === 'assistant');
            if (lastTutor) {
              setCaption({ text: lastTutor.content, who: 'tutor' });
              const corrections = (lastTutor as any).corrections ?? null;
              setLastCorrections(corrections);
              setResumeAwaiting(Boolean(corrections?.awaitingStudentResponse));
              setResumeBeatType(corrections?.beatType);
              setIsResuming(true);
              setResumeReady(true);
            }
          }
          setSessionId(existing.id);
          return;
        }
        // No resumable session exists — surface a clear message and bail out
        // instead of silently restarting the chapter. Resume must NEVER share
        // logic with Start/Retake.
        toast({ title: 'Nothing to resume', description: 'Starting a fresh class instead.' });
      }

      // RETAKE / START: always insert a brand-new session. tutor-chat's
      // isFirstBeat path (no prior history) restarts the chapter from line 1.
      const { data: sess, error } = await supabase.from('tutor_sessions').insert({
        user_id: user.id, chapter_id: chapterId, status: 'active',
      }).select('id').single();
      if (error || !sess) { toast({ title: 'Could not start session', variant: 'destructive' }); return; }
      setSessionId(sess.id);
      await markChapterResumable(sess.id, 0, null);
    })();
  }, [user, loading, chapterId, navigate, toast, mode, markChapterResumable]);

  // Persist resumable progress markers after every turn. Resume reads these to
  // pick up where the student stopped; the home page shows "In progress" pill.
  useEffect(() => {
    if (!user || !chapterId || !sessionId || transcript.length === 0) return;
    const lastTutor = [...transcript].reverse().find((t) => t.who === 'tutor');
    void supabase.from('tutor_progress').upsert({
      user_id: user.id,
      chapter_id: chapterId,
      completed: false,
      resumable: true,
      last_session_id: sessionId,
      last_message_index: transcript.length,
      last_beat_summary: lastTutor?.text?.slice(0, 280) ?? null,
    }, { onConflict: 'user_id,chapter_id' });
  }, [transcript, user, chapterId, sessionId]);

  const beginCall = async () => {
    if (!sessionId || !chapterId) return;
    if (started) return;
    setStarted(true);
    setCountdown(null);
    const { data, error } = await supabase.functions.invoke('tutor-chat', {
      body: { sessionId, chapterId, userMessage: '', inputMode: 'system' },
    });
    if (error) { toast({ title: 'Tutor unavailable', description: error.message, variant: 'destructive' }); return; }
    const greeting = (data as any).reply as string;
    const awaiting = Boolean((data as any).awaitingStudentResponse);
    const beatType = (data as any).beatType as string | undefined;
    await voice.start(greeting, awaiting, beatType);
  };

  // RESUME path: do NOT call tutor-chat (that would re-greet from line 1).
  // Replay the last tutor message from the hydrated transcript and put the
  // student straight back into listening mode at the same question.
  const resumeCall = async () => {
    if (!sessionId) return;
    if (started) return;
    const lastTutor = [...transcript].reverse().find((t) => t.who === 'tutor');
    if (!lastTutor) { await beginCall(); return; }
    setStarted(true);
    setCountdown(null);
    setCaption({ text: lastTutor.text, who: 'tutor' });
    await voice.start(lastTutor.text, resumeAwaiting, resumeBeatType, false);
  };

  useEffect(() => {
    if (!sessionId || started || autoStartedRef.current) return;
    autoStartedRef.current = true;
    const launch = () => (isResuming && resumeReady ? resumeCall() : beginCall());
    // 1) Fire immediately — desktop and most browsers allow this when the
    //    classroom was opened via the user's "Start lesson" tap on Tutor Home
    //    (the activation token is still valid through the SPA navigation).
    launch();
    // 2) Safety net for strict autoplay policies (some mobile browsers / PWAs
    //    drop the activation across async chapter-load awaits). If after 600ms
    //    the tutor still hasn't begun speaking, retry on the very next tap /
    //    keypress / touch — no UI prompt required.
    const guard = window.setTimeout(() => {
      if (voice.status !== 'idle') return; // already speaking — nothing to do
      const retry = () => {
        document.removeEventListener('pointerdown', retry, true);
        document.removeEventListener('keydown', retry, true);
        document.removeEventListener('touchstart', retry, true);
        if (voice.status === 'idle') launch();
      };
      document.addEventListener('pointerdown', retry, true);
      document.addEventListener('keydown', retry, true);
      document.addEventListener('touchstart', retry, true);
    }, 600);
    return () => window.clearTimeout(guard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isResuming, resumeReady]);

  const endCall = async () => {
    // HARD STOP — kill all audio / mic / timers FIRST so nothing keeps playing
    // while we persist progress or navigate. voice.stop() aborts the in-flight
    // TTS fetch, pauses & detaches any <audio> elements, stops the recorder,
    // closes the media stream and AudioContext, and clears the prefetched
    // next-beat promise.
    completingRef.current = true;
    try { voice.stop(); } catch { /* noop */ }
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    // Clear any cached student-response audio so nothing can be replayed.
    setLatestStudentAudio(null);
    // Navigate immediately — the user must see the classroom close instantly.
    navigate('/tutor', { replace: true });
    // Persist resume marker in the background; failures here must NOT delay
    // navigation or revive audio.
    if (sessionId) {
      const lastTutor = [...transcript].reverse().find((t) => t.who === 'tutor');
      void markChapterResumable(sessionId, transcript.length, lastTutor?.text?.slice(0, 280) ?? null);
    }
  };

  // When the SaveWord dialog closes, refresh saved-words list for this session.
  const refreshSavedWords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tutor_vocab')
      .select('word, created_at')
      .eq('user_id', user.id)
      .eq('chapter_id', chapterId!)
      .order('created_at', { ascending: false })
      .limit(50);
    setSavedWords((data ?? []).map((r: any) => r.word));
  };

  useEffect(() => { if (user && chapterId) refreshSavedWords(); /* eslint-disable-next-line */ }, [user, chapterId]);

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 bg-slate-900/60 backdrop-blur flex-shrink-0">
        <button onClick={endCall} className="flex items-center gap-1.5 text-xs sm:text-sm text-white/70 hover:text-white shrink-0">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Exit class</span><span className="sm:hidden">Exit</span>
        </button>
        <div className="flex flex-col items-center text-center px-2 flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-medium truncate w-full">{chapterTitle}</div>
          {dayNumber && totalDays ? (
            <div className="mt-1 flex items-center gap-2 w-full max-w-[260px]">
              <span className="text-[10px] sm:text-xs text-white/70 whitespace-nowrap">Day {dayNumber} of {totalDays}</span>
              <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-[10px] sm:text-xs text-white/70 whitespace-nowrap">{progressPct}%</span>
            </div>
          ) : null}
        </div>
        <div className="w-12 sm:w-20 shrink-0" />
      </header>

      <div className="flex-1 relative p-2 sm:p-3 md:p-6 flex flex-col gap-2 md:gap-3 min-h-0 overflow-hidden">
        <RealtimeFeedback status={voice.status} micLevel={voice.micLevel} lastCorrections={lastCorrections} />

        <div className="relative flex-1 min-h-0">
          <div className="relative w-full h-full min-h-0 md:pr-[calc(33%+0.75rem)]">
            <AIOrb status={voice.status === 'paused' ? 'idle' : voice.status} />
            <CaptionBar text={caption.text} who={caption.who} />
          </div>
          <div className="absolute top-2 right-2 w-24 h-32 sm:w-28 sm:h-40 md:top-0 md:right-0 md:w-1/3 md:h-full overflow-hidden rounded-xl md:rounded-2xl shadow-xl border border-white/15 z-20 bg-slate-900">
            <StudentTile ref={studentRef} micLevel={voice.micLevel} />
          </div>
        </div>

        <div className="flex items-center justify-center pb-[max(env(safe-area-inset-bottom),0.25rem)] flex-shrink-0">
          {!started ? (
            <Button size="lg" onClick={beginCall} disabled={!sessionId} className="h-12 sm:h-14 px-6 sm:px-8 rounded-full text-sm sm:text-base font-semibold gap-2">
              {sessionId
                ? countdown && countdown > 0
                  ? `Lesson starts in ${countdown}…`
                  : 'Starting…'
                : 'Preparing…'}
            </Button>
          ) : (
            <ControlsDock
              muted={voice.muted}
              onMute={voice.toggleMute}
              onEnd={endCall}
              status={voice.status}
              paused={voice.paused}
              onPause={voice.pause}
              onResume={voice.resume}
              onRepeat={voice.repeat}
              onPrevious={() => {
                const tutorTurns = transcript.filter((t) => t.who === 'tutor');
                if (tutorTurns.length < 2) {
                  toast({ title: 'No previous question yet' });
                  return;
                }
                const prev = tutorTurns[tutorTurns.length - 2];
                setCaption({ text: prev.text, who: 'tutor' });
                voice.goPrevious(prev.text);
              }}
              onAskDoubt={() => { voice.pause(); setShowDoubt(true); }}
              onSaveWord={() => setShowSaveWord(true)}
              onOpenNotes={() => setShowNotes(true)}
              speakerOn={voice.speakerOn}
              onToggleSpeaker={voice.toggleSpeaker}
              onPlayMyResponse={playLastStudentResponse}
              hasMyResponse={Boolean(lastStudentAudioUrl)}
            />
          )}
        </div>
      </div>

      <AskDoubtDialog
        open={showDoubt}
        onOpenChange={(b) => {
          setShowDoubt(b);
          // When the doubt dialog closes, automatically resume the lesson where we paused.
          if (!b && voice.paused) voice.resume();
        }}
        chapterId={chapterId ?? null}
        onSpeakAnswer={(t) => { void voice.speak(t); }}
      />

      <SaveWordDialog
        open={showSaveWord}
        onOpenChange={(b) => { setShowSaveWord(b); if (!b) refreshSavedWords(); }}
        chapterId={chapterId ?? null}
      />

      <NotesPanel
        open={showNotes}
        onOpenChange={setShowNotes}
        transcript={transcript}
        savedWords={savedWords}
      />
    </div>
  );
}

