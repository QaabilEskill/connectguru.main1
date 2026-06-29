import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Mic } from 'lucide-react';

/**
 * StudentTile — minimal, premium voice waveform.
 *
 * 24 thin vertical bars, microphone-reactive, GPU-friendly (transform:
 * scaleY only). Idle = subtle oscillation; active = mic-driven heights.
 * Designed to match modern AI voice assistants (clean, no decorative blobs).
 */

export type StudentTileHandle = {
  getStream: () => MediaStream | null;
  getVideoEl: () => HTMLVideoElement | null;
};

type Props = {
  compact?: boolean;
  /** Microphone RMS level 0..1 — drives bar height when student speaks. */
  micLevel?: number;
};

const BAR_COUNT = 24;

const StudentTile = forwardRef<StudentTileHandle, Props>(function StudentTile(props, ref) {
  useImperativeHandle(ref, () => ({
    getStream: () => null,
    getVideoEl: () => null,
  }));

  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const micLevelRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => { micLevelRef.current = props.micLevel ?? 0; }, [props.micLevel]);

  useEffect(() => {
    // Single 60fps loop — animate per-bar scaleY using a smooth sine + mic.
    let t = 0;
    const loop = () => {
      t += 0.06;
      const level = Math.min(1, Math.max(0, micLevelRef.current));
      // Idle floor so the waveform always has a gentle pulse.
      const idle = 0.12;
      // Active gain — clamps bars within the tile.
      const active = Math.min(0.9, level * 4.0);
      for (let i = 0; i < BAR_COUNT; i++) {
        const el = barsRef.current[i];
        if (!el) continue;
        // Each bar has its own phase for a wave-like feel.
        const phase = i * 0.42;
        const wave = (Math.sin(t + phase) + 1) / 2; // 0..1
        const idleH = idle + wave * 0.12; // subtle idle motion
        const activeH = idle + 0.15 + wave * active; // mic-driven
        const h = idleH + (activeH - idleH) * Math.min(1, level * 8);
        el.style.transform = `scaleY(${h.toFixed(3)})`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      aria-label="Voice waveform"
    >
      {/* Soft ambient glow behind the waveform */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.10) 0%, rgba(99,102,241,0.06) 40%, transparent 75%)',
        }}
      />

      {/* Waveform */}
      <div className="absolute inset-0 flex items-center justify-center gap-[3px] sm:gap-1 px-6">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <span
            key={i}
            ref={(el) => { barsRef.current[i] = el; }}
            className="block rounded-full bg-gradient-to-t from-sky-400 to-indigo-300"
            style={{
              width: 3,
              height: '46%',
              transformOrigin: 'center',
              transform: 'scaleY(0.12)',
              transition: 'transform 60ms linear',
              boxShadow: '0 0 8px rgba(125,211,252,0.45)',
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* Subtle label */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/5 backdrop-blur text-white/80 text-[10px] font-medium flex items-center gap-1 border border-white/10">
        <Mic className="h-2.5 w-2.5 text-sky-300" />
        Your voice
      </div>
    </div>
  );
});

export default StudentTile;
