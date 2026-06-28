import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Transcript = { who: 'tutor' | 'you'; text: string; at: number }[];

export function AskDoubtDialog({
  open, onOpenChange, chapterId, onSpeakAnswer,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  chapterId: string | null;
  onSpeakAnswer: (text: string) => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');

  const ask = async () => {
    const question = q.trim();
    if (!question) return;
    setLoading(true);
    setAnswer('');
    try {
      const { data, error } = await supabase.functions.invoke('tutor-doubt', { body: { chapterId, question } });
      if (error) throw error;
      const a = (data as any)?.answer as string;
      setAnswer(a ?? '');
      if (a) await onSpeakAnswer(a);
    } catch (e: any) {
      toast({ title: 'Could not answer doubt', description: e?.message ?? String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(b) => { onOpenChange(b); if (!b) { setQ(''); setAnswer(''); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ask a doubt</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">Lesson stays paused on this question — the tutor will answer your doubt and you'll return to where you left off.</p>
        <Textarea
          placeholder='e.g. "What is the difference between May and Please?"'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          disabled={loading}
        />
        {answer && (
          <div className="text-sm bg-muted rounded-md p-3 max-h-48 overflow-auto whitespace-pre-wrap">{answer}</div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Close</Button>
          <Button onClick={ask} disabled={loading || !q.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {loading ? 'Asking…' : 'Ask'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SaveWordDialog({
  open, onOpenChange, chapterId,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  chapterId: string | null;
}) {
  const { toast } = useToast();
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [hindi, setHindi] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const w = word.trim();
    if (!w) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error('Not signed in');
      const { error } = await supabase.from('tutor_vocab').insert({
        user_id: u.user.id,
        chapter_id: chapterId,
        word: w,
        meaning: meaning.trim() || null,
        example: example.trim() || null,
        hindi: hindi.trim() || null,
      });
      if (error) throw error;
      toast({ title: 'Word saved 📝', description: w });
      setWord(''); setMeaning(''); setExample(''); setHindi('');
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Could not save', description: e?.message ?? String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to vocabulary notebook</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Word" value={word} onChange={(e) => setWord(e.target.value)} />
          <Input placeholder="Meaning (English)" value={meaning} onChange={(e) => setMeaning(e.target.value)} />
          <Input placeholder="Hindi meaning (optional)" value={hindi} onChange={(e) => setHindi(e.target.value)} />
          <Textarea placeholder="Example sentence (optional)" value={example} onChange={(e) => setExample(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !word.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}Save Word
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NotesPanel({
  open, onOpenChange, transcript, savedWords,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  transcript: Transcript;
  savedWords: string[];
}) {
  const tutorLines = transcript.filter((t) => t.who === 'tutor');
  const questions = tutorLines.filter((l) => /\?/.test(l.text));
  const concepts = tutorLines.filter((l) => !/\?/.test(l.text));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[88vw] sm:w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>📚 Today's Learning</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-4 text-sm">
          <section>
            <h3 className="font-semibold mb-2">Key concepts</h3>
            {concepts.length === 0 ? (
              <p className="text-xs text-muted-foreground">Concepts will appear as the tutor teaches.</p>
            ) : (
              <ul className="space-y-1.5 list-disc list-inside">
                {concepts.slice(-12).map((c, i) => (<li key={i}>{c.text}</li>))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="font-semibold mb-2">Practice questions</h3>
            {questions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No questions yet.</p>
            ) : (
              <ul className="space-y-1.5 list-disc list-inside">
                {questions.slice(-12).map((c, i) => (<li key={i}>{c.text}</li>))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="font-semibold mb-2">Vocabulary saved this session</h3>
            {savedWords.length === 0 ? (
              <p className="text-xs text-muted-foreground">Tap "Save Word" while the tutor uses a new word.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {savedWords.map((w, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{w}</span>
                ))}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
