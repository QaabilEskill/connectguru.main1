import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpenCheck, Star, MessageSquare } from 'lucide-react';

export default function AdminTutor() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ students: 0, sessions: 0, completed: 0, avgScore: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/auth?redirect=/admin/tutor', { replace: true }); return; }
    (async () => {
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!role) { setIsAdmin(false); return; }
      setIsAdmin(true);
      const [{ count: students }, { count: sessions }, { count: completed }, { data: sessRows }] = await Promise.all([
        supabase.from('tutor_progress').select('user_id', { count: 'exact', head: true }),
        supabase.from('tutor_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('tutor_sessions').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('tutor_sessions').select('id,user_id,scores,summary,created_at,chapter_id').order('created_at', { ascending: false }).limit(20),
      ]);
      const scoresAvg = (sessRows ?? []).map((s: any) => {
        const sc = s.scores ?? {};
        return ((sc.speaking ?? 0) + (sc.grammar ?? 0) + (sc.fluency ?? 0) + (sc.confidence ?? 0)) / 4;
      }).filter((n) => n > 0);
      const avgScore = scoresAvg.length ? Math.round(scoresAvg.reduce((a, b) => a + b, 0) / scoresAvg.length) : 0;
      setStats({ students: students ?? 0, sessions: sessions ?? 0, completed: completed ?? 0, avgScore });
      setRecent(sessRows ?? []);
    })();
  }, [user, loading, navigate]);

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background"><Navigation />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Admin access required</h1>
          <p className="text-muted-foreground">Ask a super-admin to grant you the admin role in user_roles.</p>
        </main></div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">AI Tutor — Admin</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat icon={<Users className="h-5 w-5 text-indigo-500" />} label="Active learners" value={stats.students} />
          <Stat icon={<MessageSquare className="h-5 w-5 text-emerald-500" />} label="Total sessions" value={stats.sessions} />
          <Stat icon={<BookOpenCheck className="h-5 w-5 text-amber-500" />} label="Completed" value={stats.completed} />
          <Stat icon={<Star className="h-5 w-5 text-pink-500" />} label="Avg score" value={`${stats.avgScore}`} />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b font-semibold">Recent sessions</div>
            <div className="divide-y">
              {recent.map((s) => {
                const sc = s.scores ?? {};
                const avg = Math.round(((sc.speaking ?? 0) + (sc.grammar ?? 0) + (sc.fluency ?? 0) + (sc.confidence ?? 0)) / 4);
                return (
                  <div key={s.id} className="px-4 py-3 text-sm flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-muted-foreground truncate">{s.user_id}</div>
                      <div className="truncate">{s.summary ?? 'In progress'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{avg || '—'}</div>
                      <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
              {recent.length === 0 && <div className="px-4 py-8 text-center text-muted-foreground text-sm">No sessions yet.</div>}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">{icon}</div>
      <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-xl font-bold">{value}</div></div>
    </CardContent></Card>
  );
}
