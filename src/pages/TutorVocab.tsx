import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Check } from 'lucide-react';

type Vocab = { id: string; word: string; meaning: string | null; example: string | null; hindi: string | null; mastered: boolean };

export default function TutorVocab() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Vocab[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/auth?redirect=/tutor/vocab', { replace: true }); return; }
    (async () => {
      const { data } = await supabase.from('tutor_vocab').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setItems((data ?? []) as Vocab[]);
    })();
  }, [user, loading, navigate]);

  const toggleMastered = async (v: Vocab) => {
    await supabase.from('tutor_vocab').update({ mastered: !v.mastered }).eq('id', v.id);
    setItems((arr) => arr.map((x) => x.id === v.id ? { ...x, mastered: !x.mastered } : x));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <button onClick={() => navigate('/tutor')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" />Back</button>
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2"><BookOpen className="h-7 w-7 text-primary" />Your Vocabulary</h1>
        <p className="text-muted-foreground mb-6">Words your tutor highlighted during classes.</p>
        {items.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No words saved yet. Complete a chapter to start building your vocab!</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {items.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{v.word}</div>
                    {v.meaning && <div className="text-sm text-muted-foreground">{v.meaning}</div>}
                    {v.hindi && <div className="text-sm italic text-primary mt-0.5">{v.hindi}</div>}
                    {v.example && <div className="text-xs text-muted-foreground mt-1">e.g., {v.example}</div>}
                  </div>
                  <Button variant={v.mastered ? 'default' : 'outline'} size="sm" onClick={() => toggleMastered(v)} className="gap-1">
                    <Check className="h-3.5 w-3.5" />{v.mastered ? 'Mastered' : 'Mark'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
