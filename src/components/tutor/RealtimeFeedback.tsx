import { useEffect, useState } from 'react';

type Status = 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused';

export default function RealtimeFeedback({
  status,
  micLevel,
  lastCorrections,
}: {
  status: Status;
  micLevel: number;
  lastCorrections: any | null;
}) {
  const [lowSince, setLowSince] = useState<number | null>(null);

  useEffect(() => {
    if (status !== 'listening') { setLowSince(null); return; }
    if (micLevel < 0.02) {
      if (lowSince === null) setLowSince(performance.now());
    } else {
      setLowSince(null);
    }
  }, [micLevel, status, lowSince]);

  const showGrammar = lastCorrections && lastCorrections.studentAnswerCorrect === false;

  const items: Array<{ color: 'green' | 'yellow' | 'red'; text: string }> = [];
  if (status === 'listening') {
    if (micLevel > 0.06) items.push({ color: 'green', text: 'Good — clear voice' });
    else if (micLevel > 0.025) items.push({ color: 'green', text: 'Listening…' });
    else if (lowSince && performance.now() - lowSince > 1500) items.push({ color: 'yellow', text: 'Speak a bit louder' });
  }
  if (showGrammar) {
    items.push({ color: 'red', text: 'Grammar correction below' });
  }

  if (!items.length) return null;

  const dot = (c: 'green' | 'yellow' | 'red') =>
    c === 'green' ? 'bg-emerald-400' : c === 'yellow' ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <div className="pointer-events-none absolute top-2 right-2 md:right-[calc(33%+1rem)] flex flex-col gap-1.5 z-30">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 border border-white/15 text-[10px] sm:text-xs text-white shadow-lg backdrop-blur">
          <span className={`h-2 w-2 rounded-full ${dot(it.color)} ${it.color === 'green' ? 'animate-pulse' : ''}`} />
          <span>{it.text}</span>
        </div>
      ))}
    </div>
  );
}
