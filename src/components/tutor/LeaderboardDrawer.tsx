import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type Row = {
  user_id: string;
  display_name: string;
  xp: number;
  level: number;
  streak_days: number;
  rank: number;
};

interface Props {
  currentUserId?: string | null;
  /** Optional custom trigger. If omitted a compact trophy button is rendered. */
  trigger?: React.ReactNode;
}

export default function LeaderboardDrawer({ currentUserId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: 100 });
    if (!error && Array.isArray(data)) setRows(data as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchBoard();

    const scheduleRefetch = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => { void fetchBoard(); }, 400);
    };

    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_gamification' }, scheduleRefetch)
      .subscribe();

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [open, fetchBoard]);

  const myRow = useMemo(() => rows.find((r) => r.user_id === currentUserId) ?? null, [rows, currentUserId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9 px-2.5 rounded-xl bg-primary/5 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 hover:shadow-md transition-all"
            aria-label="Open live leaderboard"
          >
            <Trophy className="h-4 w-4" />
            <span className="text-xs font-semibold hidden sm:inline">Leaderboard</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 border-l border-border/60 hero-gradient backdrop-blur-xl"
      >
        <div className="relative h-full flex flex-col">
          {/* Ambient glow tuned to brand primary */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute top-40 -left-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />

          <SheetHeader className="px-5 pt-6 pb-4 border-b border-border/50 relative">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <div className="h-9 w-9 rounded-xl premium-gradient flex items-center justify-center shadow-lg shadow-primary/30">
                <Trophy className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="gradient-text">Live Leaderboard</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Live
              </span>
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-1">Top learners updated in real-time. Answer correctly to climb the ranks.</p>
          </SheetHeader>

          <ScrollArea className="flex-1 relative">
            <div className="px-4 py-4 space-y-2">
              {loading && rows.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
                ))
              ) : rows.length === 0 ? (
                <div className="text-center py-16 text-sm text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No learners yet. Be the first!
                </div>
              ) : (
                rows.map((r) => <LeaderRow key={r.user_id} row={r} isMe={r.user_id === currentUserId} />)
              )}
            </div>
          </ScrollArea>

          {myRow && (
            <div className="border-t border-border/50 p-3 bg-card/60 backdrop-blur">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Your position</div>
              <LeaderRow row={myRow} isMe compact />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LeaderRow({ row, isMe, compact }: { row: Row; isMe?: boolean; compact?: boolean }) {
  const initials = (row.display_name || 'S').trim().slice(0, 1).toUpperCase();
  const isGold = row.rank === 1;
  const isSilver = row.rank === 2;
  const isBronze = row.rank === 3;
  const podium = isGold || isSilver || isBronze;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all',
        'border border-border/60 bg-card/80 backdrop-blur-sm',
        'hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5',
        isMe && 'ring-2 ring-primary/60 border-primary/60 bg-primary/5',
        isGold && 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/40',
        isSilver && 'bg-gradient-to-r from-primary/[0.06] to-transparent border-primary/25',
        isBronze && 'bg-gradient-to-r from-secondary/10 to-transparent border-secondary/30',
        compact && 'py-2'
      )}
    >
      {/* Rank / medal */}
      <div className="shrink-0 w-10 flex items-center justify-center">
        {isGold ? (
          <div className="h-9 w-9 rounded-full premium-gradient flex items-center justify-center shadow-md shadow-primary/40">
            <Crown className="h-5 w-5 text-primary-foreground drop-shadow" />
          </div>
        ) : isSilver ? (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center shadow-md">
            <Medal className="h-5 w-5 text-primary-foreground drop-shadow" />
          </div>
        ) : isBronze ? (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-md">
            <Medal className="h-5 w-5 text-secondary-foreground drop-shadow" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            {row.rank}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className={cn(
        'shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner',
        'bg-gradient-to-br',
        isGold ? 'from-primary to-primary-glow text-primary-foreground'
          : isSilver ? 'from-primary/70 to-primary text-primary-foreground'
          : isBronze ? 'from-secondary to-secondary/80 text-secondary-foreground'
          : 'from-primary/70 to-primary text-primary-foreground'
      )}>
        {initials}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="font-semibold text-sm truncate text-foreground">
            {row.display_name}
            {isMe && <span className="ml-1.5 text-[10px] font-bold text-primary uppercase tracking-wide">You</span>}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">Lv {row.level} · 🔥 {row.streak_days}d</div>
      </div>

      {/* XP */}
      <div className={cn(
        'shrink-0 text-right',
        podium ? 'text-primary' : 'text-foreground'
      )}>
        <div className="text-sm font-bold tabular-nums">{row.xp.toLocaleString()}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">XP</div>
      </div>
    </div>
  );
}
