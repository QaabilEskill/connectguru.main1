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

  // Fetch when drawer opens, and subscribe to XP changes for live updates.
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
            className="gap-1.5 h-9 px-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-amber-500/40 hover:border-amber-500/60 hover:shadow-md transition-all"
            aria-label="Open live leaderboard"
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold hidden sm:inline">Leaderboard</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 border-l bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-xl"
      >
        <div className="relative h-full flex flex-col">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute top-40 -left-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

          <SheetHeader className="px-5 pt-6 pb-4 border-b border-border/50 relative">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span>Live Leaderboard</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
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
            <div className="border-t border-border/50 p-3 bg-background/60 backdrop-blur">
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
        'border border-border/60 bg-card/70 backdrop-blur-sm',
        'hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5',
        isMe && 'ring-2 ring-primary/60 border-primary/60 bg-primary/5',
        isGold && 'bg-gradient-to-r from-amber-50 via-yellow-50 to-transparent dark:from-amber-950/30 dark:via-yellow-950/20 border-amber-400/50',
        isSilver && 'bg-gradient-to-r from-slate-100 to-transparent dark:from-slate-800/40 border-slate-400/40',
        isBronze && 'bg-gradient-to-r from-orange-100/70 to-transparent dark:from-orange-950/30 border-orange-500/30',
        compact && 'py-2'
      )}
    >
      {/* Rank / medal */}
      <div className="shrink-0 w-10 flex items-center justify-center">
        {isGold ? (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/40">
            <Crown className="h-5 w-5 text-white drop-shadow" />
          </div>
        ) : isSilver ? (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center shadow-md">
            <Medal className="h-5 w-5 text-white drop-shadow" />
          </div>
        ) : isBronze ? (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 flex items-center justify-center shadow-md">
            <Medal className="h-5 w-5 text-white drop-shadow" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            {row.rank}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className={cn(
        'shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-inner',
        'bg-gradient-to-br',
        isGold ? 'from-amber-400 to-orange-500'
          : isSilver ? 'from-slate-400 to-slate-600'
          : isBronze ? 'from-orange-400 to-red-500'
          : 'from-primary/70 to-primary'
      )}>
        {initials}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="font-semibold text-sm truncate">
            {row.display_name}
            {isMe && <span className="ml-1.5 text-[10px] font-bold text-primary uppercase tracking-wide">You</span>}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">Lv {row.level} · 🔥 {row.streak_days}d</div>
      </div>

      {/* XP */}
      <div className={cn(
        'shrink-0 text-right',
        podium ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
      )}>
        <div className="text-sm font-bold tabular-nums">{row.xp.toLocaleString()}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">XP</div>
      </div>
    </div>
  );
}
