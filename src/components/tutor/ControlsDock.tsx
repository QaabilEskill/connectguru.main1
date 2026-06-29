import {
  Mic, MicOff, PhoneOff, Volume2, VolumeX,
  Pause, Play, Repeat2, Sparkles, BookMarked, NotebookPen, SkipBack, PlayCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Premium classroom control dock.
 *
 * Each action has a distinct semantic color, a soft glassy surface, a glow
 * ring on hover, and a subtle press-down feel. Functionality is unchanged —
 * this is purely a visual + interaction polish layer.
 */

type ToneKey = 'red' | 'green' | 'blue' | 'violet' | 'slate' | 'amber' | 'emerald';

const TONES: Record<ToneKey, {
  // resting glass surface
  surface: string;
  // text + icon color
  text: string;
  // hover background
  hover: string;
  // ring + glow on hover/focus
  ring: string;
  // shadow color (used as drop glow)
  shadow: string;
  // active indicator dot
  dot: string;
}> = {
  red:     { surface: 'bg-rose-500/12 border-rose-400/30',       text: 'text-rose-200',     hover: 'hover:bg-rose-500/25 hover:border-rose-300/50',     ring: 'focus-visible:ring-rose-400/60',     shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(244,63,94,0.55)]',   dot: 'bg-rose-400' },
  green:   { surface: 'bg-emerald-500/12 border-emerald-400/30', text: 'text-emerald-200',  hover: 'hover:bg-emerald-500/25 hover:border-emerald-300/50', ring: 'focus-visible:ring-emerald-400/60', shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.55)]', dot: 'bg-emerald-400' },
  emerald: { surface: 'bg-emerald-500/15 border-emerald-400/40', text: 'text-emerald-100',  hover: 'hover:bg-emerald-500/30 hover:border-emerald-300/60', ring: 'focus-visible:ring-emerald-400/60', shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)]',  dot: 'bg-emerald-400' },
  blue:    { surface: 'bg-sky-500/12 border-sky-400/30',         text: 'text-sky-200',      hover: 'hover:bg-sky-500/25 hover:border-sky-300/50',       ring: 'focus-visible:ring-sky-400/60',     shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(56,189,248,0.55)]', dot: 'bg-sky-400' },
  violet:  { surface: 'bg-violet-500/12 border-violet-400/30',   text: 'text-violet-200',   hover: 'hover:bg-violet-500/25 hover:border-violet-300/50', ring: 'focus-visible:ring-violet-400/60',  shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(139,92,246,0.55)]', dot: 'bg-violet-400' },
  slate:   { surface: 'bg-white/8 border-white/15',              text: 'text-white/85',     hover: 'hover:bg-white/15 hover:border-white/25',           ring: 'focus-visible:ring-white/40',       shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(255,255,255,0.25)]', dot: 'bg-white/80' },
  amber:   { surface: 'bg-amber-500/12 border-amber-400/30',     text: 'text-amber-200',    hover: 'hover:bg-amber-500/25 hover:border-amber-300/50',   ring: 'focus-visible:ring-amber-400/60',   shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(251,191,36,0.55)]', dot: 'bg-amber-400' },
};

function DockButton({
  tone, icon: Icon, label, onClick, title, iconOnly = false, primary = false,
}: {
  tone: ToneKey;
  icon: LucideIcon;
  label: ReactNode;
  onClick?: () => void;
  title: string;
  iconOnly?: boolean;
  primary?: boolean;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={[
        'group relative inline-flex items-center justify-center gap-2',
        iconOnly ? 'h-11 w-11 p-0' : 'h-11 px-4',
        'rounded-full border backdrop-blur-md',
        'text-[13px] font-medium tracking-tight',
        'transition-all duration-200 ease-out',
        'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)]',
        'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        t.surface, t.text, t.hover, t.ring, t.shadow,
        primary ? 'ring-1 ring-inset ring-white/10' : '',
      ].join(' ')}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 group-active:scale-95" />
      {!iconOnly && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="hidden sm:block h-7 w-px bg-white/10 mx-1" />;
}

export default function ControlsDock({
  muted, onMute, onEnd, status,
  paused, onPause, onResume, onRepeat, onPrevious,
  onAskDoubt, onSaveWord, onOpenNotes,
  speakerOn = true, onToggleSpeaker,
  onPlayMyResponse, hasMyResponse = false,
}: {
  muted: boolean;
  onMute: () => void;
  onEnd: () => void;
  status: 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused';
  paused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onRepeat?: () => void;
  onPrevious?: () => void;
  onAskDoubt?: () => void;
  onSaveWord?: () => void;
  onOpenNotes?: () => void;
  speakerOn?: boolean;
  onToggleSpeaker?: () => void;
  onPlayMyResponse?: () => void;
  hasMyResponse?: boolean;
}) {
  const label =
    paused ? 'Paused' :
    status === 'speaking' ? 'Tutor speaking…' :
    status === 'thinking' ? 'Thinking…' :
    status === 'listening' ? 'Listening — speak now' : 'Ready';

  const statusTone =
    paused ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]' :
    status === 'speaking' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse' :
    status === 'thinking' ? 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)] animate-pulse' :
    status === 'listening' ? 'bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.7)] animate-pulse' :
    'bg-white/50';

  return (
    <div
      className="
        relative flex flex-wrap items-center justify-center gap-2.5
        px-3 py-2.5 sm:px-4 sm:py-3 rounded-[28px]
        bg-gradient-to-b from-slate-900/85 to-slate-950/90
        backdrop-blur-xl border border-white/10
        shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]
        max-w-full
      "
    >
      {/* Status pill */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/85 text-xs sm:text-sm order-first basis-full sm:basis-auto justify-center">
        <span className={`relative inline-block h-2 w-2 rounded-full ${statusTone}`} />
        <Volume2 className={`h-3.5 w-3.5 ${status === 'speaking' ? 'text-emerald-300' : 'opacity-60'}`} />
        <span className="font-medium tracking-tight">{label}</span>
      </div>

      <Divider />

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {/* Microphone — green */}
        <DockButton
          tone={muted ? 'red' : 'green'}
          icon={muted ? MicOff : Mic}
          label={muted ? 'Unmute' : 'Mic on'}
          onClick={onMute}
          title={muted ? 'Unmute microphone' : 'Mute microphone'}
          iconOnly
        />

        {/* Speaker — emerald. Default ON, persists across the lesson. */}
        {onToggleSpeaker && (
          <DockButton
            tone={speakerOn ? 'emerald' : 'slate'}
            icon={speakerOn ? Volume2 : VolumeX}
            label={speakerOn ? 'Speaker' : 'Speaker off'}
            onClick={onToggleSpeaker}
            title={speakerOn ? 'Speaker on (loud)' : 'Speaker off — tap to enable'}
          />
        )}

        {/* Pause / Resume — amber (pause) or emerald (resume) */}
        {paused && onResume ? (
          <DockButton tone="emerald" icon={Play} label="Resume" onClick={onResume} title="Resume lesson" primary />
        ) : onPause ? (
          <DockButton tone="amber" icon={Pause} label="Pause" onClick={onPause} title="Pause lesson" />
        ) : null}

        {/* Previous — blue. Goes back one step/question only. */}
        {onPrevious && (
          <DockButton tone="blue" icon={SkipBack} label="Previous" onClick={onPrevious} title="Go back to previous question" />
        )}

        {/* Repeat — blue */}
        {onRepeat && (
          <DockButton tone="blue" icon={Repeat2} label="Repeat" onClick={onRepeat} title="Repeat last response" />
        )}

        {/* Play my response — emerald. Replays the student's most recent
            recorded answer. Only shown once we have one captured. */}
        {onPlayMyResponse && hasMyResponse && (
          <DockButton tone="emerald" icon={PlayCircle} label="My answer" onClick={onPlayMyResponse} title="Play my last response" />
        )}

        {/* Ask Doubt — violet */}
        {onAskDoubt && (
          <DockButton tone="violet" icon={Sparkles} label="Ask Doubt" onClick={onAskDoubt} title="Ask a doubt" />
        )}

        {/* Vocabulary — white/slate */}
        {onSaveWord && (
          <DockButton tone="slate" icon={BookMarked} label="Vocabulary" onClick={onSaveWord} title="Save a word to vocabulary" />
        )}

        {/* Notes — white/slate */}
        {onOpenNotes && (
          <DockButton tone="slate" icon={NotebookPen} label="Notes" onClick={onOpenNotes} title="Today's learning" />
        )}

        <Divider />

        {/* End Class — red */}
        <DockButton tone="red" icon={PhoneOff} label="End Class" onClick={onEnd} title="End class" />
      </div>
    </div>
  );
}
