export default function CaptionBar({ text, who }: { text: string; who: 'tutor' | 'you' | null }) {
  if (!text) return null;
  return (
    <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 max-w-3xl w-[94%] md:w-[88%] px-3 py-2 md:px-5 md:py-3 rounded-xl bg-black/75 backdrop-blur text-white shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2">
      {who && <div className="text-[10px] uppercase tracking-wider text-white/50 mb-0.5">{who === 'tutor' ? 'Orb' : 'You'}</div>}
      <p className="text-sm md:text-base leading-snug">{text}</p>
    </div>
  );
}
