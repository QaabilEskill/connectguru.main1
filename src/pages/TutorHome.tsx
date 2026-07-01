import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Flame, Lock, Play, Sparkles, Trophy, BookOpen, GraduationCap } from 'lucide-react';
import LeaderboardDrawer from '@/components/tutor/LeaderboardDrawer';

type Chapter = { id: string; chapter_number: number; title: string; subtitle: string | null; estimated_minutes: number | null };
type Progress = { chapter_id: string; completed: boolean; resumable?: boolean; last_message_index?: number; last_beat_summary?: string | null; last_session_id?: string | null };
type Gam = { xp: number; level: number; streak_days: number };

export default function TutorHome() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [gam, setGam] = useState<Gam>({ xp: 0, level: 1, streak_days: 0 });
  const [busy, setBusy] = useState(true);

  const loadAll = useCallback(async (uid: string) => {
    const { data: sub } = await supabase.from('subscribers').select('test_access_activated').eq('user_id', uid).maybeSingle();
    if (!sub?.test_access_activated) { navigate('/test-access', { replace: true }); return; }
    const [{ data: chs }, { data: pr }, { data: g }] = await Promise.all([
      supabase.from('tutor_chapters').select('id,chapter_number,title,subtitle,estimated_minutes').eq('is_active', true).order('chapter_number'),
      supabase.from('tutor_progress').select('chapter_id,completed,resumable,last_message_index,last_beat_summary,last_session_id').eq('user_id', uid),
      supabase.from('user_gamification').select('xp,level,streak_days').eq('user_id', uid).maybeSingle(),
    ]);
    setChapters((chs ?? []) as Chapter[]);
    const map: Record<string, Progress> = {};
    (pr ?? []).forEach((p: any) => (map[p.chapter_id] = p));
    setProgress(map);
    if (g) setGam(g as Gam);
    setBusy(false);
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/auth?redirect=/tutor', { replace: true }); return; }
    void loadAll(user.id);
  }, [user, loading, navigate, loadAll]);

  // Refetch progress when the page becomes visible again (mobile back-nav,
  // bfcache restore, tab focus). Without this, Resume/Retake buttons stay
  // stale after exiting a class and returning to /tutor.
  useEffect(() => {
    if (!user) return;
    const refetch = () => { if (document.visibilityState === 'visible') void loadAll(user.id); };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) void loadAll(user.id); };
    document.addEventListener('visibilitychange', refetch);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', refetch);
    return () => {
      document.removeEventListener('visibilitychange', refetch);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', refetch);
    };
  }, [user, loadAll]);

  // Live-refresh the user's own XP/level whenever their gamification row changes.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`gam-me-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_gamification', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        const row = (payload.new ?? payload.old) as Partial<Gam> | undefined;
        if (row && typeof row.xp === 'number') {
          setGam({ xp: row.xp ?? 0, level: row.level ?? 1, streak_days: row.streak_days ?? 0 });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);


  const startChapter = (id: string, mode: 'start' | 'resume' | 'retake' = 'start') =>
    navigate(`/tutor/classroom/${id}?mode=${mode}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-x-hidden">
      <Navigation />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 md:py-12 w-full min-w-0">
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="min-w-0 w-full sm:w-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] sm:text-xs font-semibold mb-2">
              <Sparkles className="h-3 w-3" /> AI English Tutor · Live Class
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">Welcome back 👋</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Pick a chapter to start a one-on-one video class.</p>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto items-center">
            <StatCard icon={<Trophy className="h-4 w-4 text-amber-500" />} label="XP" value={gam.xp} />
            <LeaderboardDrawer currentUserId={user?.id} />
            <StatCard icon={<GraduationCap className="h-4 w-4 text-indigo-500" />} label="Level" value={gam.level} />
            <StatCard icon={<Flame className="h-4 w-4 text-orange-500" />} label="Streak" value={`${gam.streak_days}d`} />
            <Button variant="outline" size="sm" onClick={() => navigate('/tutor/vocab')}><BookOpen className="h-4 w-4 mr-1" />Vocab</Button>
          </div>
        </div>

        {busy ? (
          <div className="grid grid-cols-1 gap-3 w-full min-w-0">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse w-full min-w-0" />)}</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 w-full min-w-0">
            {chapters.map((ch, idx) => {
              const p = progress[ch.id];
              const done = p?.completed;
              const prevDone = idx === 0 || progress[chapters[idx - 1].id]?.completed;
              const canResume = Boolean(p?.resumable || p?.last_session_id) && !done;
              const hasAnyProgress = Boolean(p);
              const locked = !prevDone && !done && !hasAnyProgress;
              return (
                <Card key={ch.id} className={`w-full min-w-0 transition-all hover:shadow-md ${done ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/10' : ''} ${locked ? 'opacity-60' : ''}`}>
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg ${done ? 'bg-emerald-500 text-white' : locked ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'}`}>
                      {done ? <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /> : locked ? <Lock className="h-4 w-4 sm:h-5 sm:w-5" /> : ch.chapter_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h3 className="font-semibold truncate text-sm sm:text-base min-w-0">{ch.title}</h3>
                        {done && <Badge variant="outline" className="text-[10px] sm:text-xs text-emerald-600 border-emerald-500/40 shrink-0">Done</Badge>}
                        {canResume && <Badge variant="outline" className="text-[10px] sm:text-xs text-amber-600 border-amber-500/40 shrink-0">In progress</Badge>}
                      </div>
                      {ch.subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{ch.subtitle}</p>}
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">~{ch.estimated_minutes ?? 15} min · Live AI class</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                      {canResume && !locked && (
                        <Button onClick={() => startChapter(ch.id, 'resume')} disabled={locked} size="sm" variant="default" className="gap-1 h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm">
                          <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Resume
                        </Button>
                      )}
                      {hasAnyProgress ? (
                        <Button onClick={() => startChapter(ch.id, 'retake')} disabled={locked} size="sm" variant="outline" className="gap-1 h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm">
                          <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Retake
                        </Button>
                      ) : (
                        <Button onClick={() => startChapter(ch.id, 'start')} disabled={locked} size="sm" className="gap-1 h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm">
                          <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Start
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="px-3 py-2 rounded-xl border bg-card flex items-center gap-2 min-w-[78px]">
      {icon}
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}
