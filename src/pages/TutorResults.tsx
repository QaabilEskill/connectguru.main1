import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

type Score = {
  value: number | null;
  dataPoints?: string[];
  reason?: string;
  insufficient?: boolean;
};

type Session = {
  id: string;
  scores: any;
  summary: string | null;
  suggestions: string[] | null;
  chapter_id: string;
};

function asScore(raw: any): Score {
  if (raw == null) return { value: null, insufficient: true, reason: 'No data.' };
  if (typeof raw === 'number') return { value: raw }; // legacy v1
  return raw as Score;
}

function ScoreCard({ label, score }: { label: string; score: Score }) {
  if (score.insufficient || score.value == null) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <AlertCircle className="h-4 w-4" />
            <div className="text-xs uppercase tracking-wider font-semibold">{label}</div>
          </div>
          <div className="text-sm font-medium mb-1">Not enough data available to calculate this score.</div>
          {score.reason && <div className="text-xs text-muted-foreground">{score.reason}</div>}
          {!!score.dataPoints?.length && (
            <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
              {score.dataPoints.map((d, i) => <li key={i}>• {d}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
          <div className="text-3xl font-bold text-primary">{score.value}</div>
        </div>
        {!!score.dataPoints?.length && (
          <ul className="text-xs text-muted-foreground space-y-0.5 mb-1">
            {score.dataPoints.map((d, i) => <li key={i}>• {d}</li>)}
          </ul>
        )}
        {score.reason && <div className="text-[11px] text-muted-foreground/80 italic">{score.reason}</div>}
      </CardContent>
    </Card>
  );
}

export default function TutorResults() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    let tries = 0;
    const fetchOnce = async () => {
      const { data } = await supabase.from('tutor_sessions').select('id,scores,summary,suggestions,chapter_id').eq('id', sessionId).maybeSingle();
      if (data?.scores && Object.keys(data.scores).length > 0) {
        setSession(data as any);
        setLoading(false);
        return true;
      }
      return false;
    };
    (async () => {
      const ok = await fetchOnce();
      if (ok) return;
      const interval = setInterval(async () => {
        tries++;
        const done = await fetchOnce();
        if (done || tries > 8) clearInterval(interval);
        if (tries > 8) setLoading(false);
      }, 1500);
    })();
  }, [sessionId]);

  const s = session?.scores ?? {};
  const items: Array<[string, Score]> = [
    ['Speaking', asScore(s.speaking)],
    ['Grammar', asScore(s.grammar)],
    ['Confidence', asScore(s.confidence)],
    ['Fluency', asScore(s.fluency)],
    ['Pronunciation', asScore(s.pronunciation)],
  ];
  const meta = s.meta;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold mb-3">
            <CheckCircle2 className="h-3.5 w-3.5" /> Class complete
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your performance</h1>
        </div>

        {loading ? (
          <Card><CardContent className="p-8 text-center"><Sparkles className="h-8 w-8 mx-auto text-primary animate-pulse mb-2" /><p>Scoring your session…</p></CardContent></Card>
        ) : (
          <>
            {meta && (
              <Card className="mb-4">
                <CardContent className="p-4 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span><b className="text-foreground">{meta.responseCount}</b> responses</span>
                  <span><b className="text-foreground">{meta.totalWords}</b> words</span>
                  <span><b className="text-foreground">{meta.totalSentences}</b> sentences</span>
                  <span><b className="text-foreground">{meta.tutorQuestions}</b> tutor questions</span>
                  <span><b className="text-foreground">{meta.totalCorrections}</b> grammar corrections</span>
                  <span><b className="text-foreground">{meta.pronunciationSamples}</b> STT samples</span>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {items.map(([label, score]) => <ScoreCard key={label} label={label} score={score} />)}
            </div>

            {session?.summary && (
              <Card className="mb-4">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{session.summary}</p>
                </CardContent>
              </Card>
            )}
            {!!session?.suggestions?.length && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Suggestions to improve</h3>
                  <ul className="space-y-2">
                    {session!.suggestions!.map((sg, i) => (
                      <li key={i} className="flex gap-2 text-sm"><span className="text-primary">→</span>{sg}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/tutor')}>Back to chapters</Button>
              <Button onClick={() => navigate(`/tutor/classroom/${session?.chapter_id}`)}>Retake chapter</Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
