import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navigation from "@/components/Navigation";
import DarkModeToggle from "@/components/DarkModeToggle";
import {
  ArrowRight,
  Brain,
  GraduationCap,
  Mic,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Star,
  BookOpen,
  Trophy,
  Users,
  HeartHandshake,
  PenLine,
  Languages,
  Video,
  MessageCircle,
  Quote,
  BadgeCheck,
  Activity,
  Waves,
} from "lucide-react";

/* -------------------- helpers -------------------- */

function useCountUp(target: number, durationMs = 1600, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return value;
}

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setInView(true),
      { threshold, rootMargin: "0px 0px -5% 0px" }
    );
    io.observe(ref.current);
    const fallback = window.setTimeout(() => setInView(true), 1200);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [inView, threshold]);
  return { ref, inView };
}

function formatCompact(n: number, suffix = "+") {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (n >= 1000) return `${Math.round(n / 1000)}k${suffix}`;
  return `${n.toLocaleString()}${suffix}`;
}

function Stat({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const v = useCountUp(value, 1600, inView);
  return (
    <div
      ref={ref}
      className="opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-2xl md:text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
        {formatCompact(v)}
      </div>
      <div className="text-[10px] md:text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.18em] mt-1">
        {label}
      </div>
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* -------------------- Cinematic brand reveal -------------------- */
/* Plays once per browser, then stays static forever.               */

function BrandReveal() {
  const word = "ConnectGuru";
  const [played, setPlayed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem("cg_brand_revealed") === "1";
  });

  useEffect(() => {
    if (played) return;
    const t = window.setTimeout(() => {
      window.sessionStorage.setItem("cg_brand_revealed", "1");
      setPlayed(true);
    }, word.length * 70 + 1400);
    return () => window.clearTimeout(t);
  }, [played]);

  if (played) {
    return (
      <span className="relative inline-block text-primary italic">
        {word}
        <svg
          aria-hidden
          viewBox="0 0 300 14"
          preserveAspectRatio="none"
          className="absolute left-0 -bottom-2 w-full h-[10px] text-primary/70"
        >
          <path
            d="M2 8 C 70 2, 150 12, 298 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="relative inline-block text-primary italic align-baseline">
      <span className="sr-only">{word}</span>
      <span aria-hidden className="inline-flex">
        {word.split("").map((ch, i) => (
          <span
            key={i}
            className="inline-block opacity-0 translate-y-[0.35em] blur-[6px] [animation:brandLetter_700ms_cubic-bezier(0.2,0.7,0.2,1)_forwards]"
            style={{ animationDelay: `${300 + i * 70}ms` }}
          >
            {ch}
          </span>
        ))}
      </span>
      <svg
        aria-hidden
        viewBox="0 0 300 14"
        preserveAspectRatio="none"
        className="absolute left-0 -bottom-2 w-full h-[10px] text-primary/70"
      >
        <path
          d="M2 8 C 70 2, 150 12, 298 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset="1"
          style={{
            animation: "brandUnderline 1100ms cubic-bezier(0.65,0,0.35,1) forwards",
            animationDelay: `${300 + word.length * 70 + 80}ms`,
          }}
        />
      </svg>
      <style>{`
        @keyframes brandLetter {
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes brandUnderline {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </span>
  );
}

/* -------------------- Hero product preview tile -------------------- */

// Module-level cache so the demo audio is fetched at most once per page load.
let demoAudioUrlPromise: Promise<string> | null = null;
const DEMO_TTS_TEXT = "Hi, I'm your English teacher.";
const SUPABASE_FN_URL = "https://rfvgznythdlmmbtfbpzc.supabase.co/functions/v1/tutor-tts";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmd6bnl0aGRsbW1idGZicHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzA4OTksImV4cCI6MjA5MTE0Njg5OX0.-YR1m32GHUOKELXPa19wuYJHGY9Vi-vUl7P7xnhw4jg";

function fetchDemoAudio(): Promise<string> {
  if (demoAudioUrlPromise) return demoAudioUrlPromise;
  demoAudioUrlPromise = (async () => {
    const res = await fetch(SUPABASE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ text: DEMO_TTS_TEXT }),
    });
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  })().catch((e) => {
    demoAudioUrlPromise = null;
    throw e;
  });
  return demoAudioUrlPromise;
}

// Browser SpeechSynthesis fallback if the edge function fails.
function speakFallback(onEnd: () => void) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) { onEnd(); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(DEMO_TTS_TEXT);
    u.lang = 'en-US';
    u.rate = 1;
    u.onend = onEnd;
    u.onerror = () => onEnd();
    synth.speak(u);
  } catch {
    onEnd();
  }
}

function HeroPreviewTile() {
  // ---- Voice demo (Ash · openai/gpt-4o-mini-tts via tutor-tts edge fn) ----
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);

  // Warm cache after mount (not in click handler, to keep first click instant).
  useEffect(() => {
    fetchDemoAudio().catch(() => {});
  }, []);

  const playDemo = async () => {
    // Create the Audio element synchronously inside the gesture so iOS/Safari
    // allow playback even after the await below.
    if (speaking) return;
    setSpeaking(true);
    const a = audioRef.current ?? new Audio();
    a.preload = 'auto';
    a.onended = () => setSpeaking(false);
    a.onerror = () => setSpeaking(false);
    audioRef.current = a;

    try {
      if (!a.src) {
        setLoadingVoice(true);
        const url = await fetchDemoAudio();
        a.src = url;
        setLoadingVoice(false);
      }
      a.currentTime = 0;
      await a.play();
    } catch {
      setLoadingVoice(false);
      // Fallback: browser TTS so the demo always speaks.
      speakFallback(() => setSpeaking(false));
    }
  };

  useEffect(() => () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  return (
    <div className="relative">
      {/* floating chips */}
      <div className="hidden md:flex absolute -left-6 top-8 items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border shadow-sm animate-[float_6s_ease-in-out_infinite]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[11px] font-semibold">Live session · 1,284 online</span>
      </div>
      <div className="hidden md:flex absolute -right-4 bottom-10 items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border shadow-sm animate-[float_7s_ease-in-out_infinite] [animation-delay:600ms]">
        <BadgeCheck className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold">Pronunciation 9.1 / 10</span>
      </div>

      <div className="relative rounded-3xl border border-border bg-card shadow-xl shadow-foreground/5 overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider">
            connectguru.org / classroom
          </div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.16em]">
            ● Live
          </span>
        </div>

        <div className="p-6 flex flex-col items-center justify-center text-center gap-4">
          {/* Animated AI orb */}
          <div
            className="relative w-28 h-28"
            style={{ animation: 'float 4s ease-in-out infinite' }}
          >
            <span
              className="absolute -inset-3 rounded-full blur-2xl"
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)',
                animation: `orbGlow ${speaking ? '1.1s' : '2.6s'} ease-in-out infinite`,
              }}
            />
            {speaking && (
              <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping" />
            )}
            <span
              className="absolute inset-1 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 32% 28%, hsl(var(--primary-foreground) / 0.9), hsl(var(--primary)) 55%, hsl(var(--primary) / 0.75) 100%)',
                boxShadow:
                  '0 10px 30px -6px hsl(var(--primary) / 0.55), inset -8px -10px 20px hsl(var(--primary) / 0.55), inset 5px 7px 16px hsl(var(--primary-foreground) / 0.45)',
                transform: speaking ? 'scale(1.07)' : 'scale(1)',
                transition: 'transform 500ms cubic-bezier(.2,.7,.2,1)',
              }}
            />
            <span
              className="absolute rounded-full pointer-events-none"
              style={{
                top: '18%', left: '22%', width: '34%', height: '22%',
                background: 'radial-gradient(ellipse at center, hsl(var(--primary-foreground) / 0.85), transparent 70%)',
                filter: 'blur(2px)',
              }}
            />
          </div>

          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
              AI Mentor
            </div>
            <div className="text-base font-semibold mt-0.5">"{DEMO_TTS_TEXT}"</div>
          </div>

          {/* Animated waveform lines */}
          <div className="flex items-end gap-1 h-8">
            {[40, 70, 55, 92, 64, 82, 50, 78, 46].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-primary rounded-full"
                style={{
                  height: `${h}%`,
                  animation: speaking
                    ? `bounce 0.9s ease-in-out ${i * 70}ms infinite`
                    : 'none',
                  opacity: speaking ? 1 : 0.45,
                  transition: 'opacity 300ms',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={playDemo}
            disabled={loadingVoice || speaking}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] px-4 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
            aria-label="Play AI mentor voice demo"
          >
            <span className="text-[10px] leading-none">{speaking ? '●' : '▶'}</span>
            {loadingVoice ? 'Loading…' : speaking ? 'Playing…' : 'Play Demo'}
          </button>

          <style>{`
            @keyframes orbGlow {
              0%, 100% { opacity: 0.55; transform: scale(1); }
              50% { opacity: 0.95; transform: scale(1.08); }
            }
            @keyframes bounce {
              0%, 100% { transform: scaleY(0.5); }
              50% { transform: scaleY(1.2); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}


/* -------------------- Interactive product card (tilt) -------------------- */

function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1100px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateY(-4px)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1100px) rotateX(0) rotateY(0) translateY(0)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), hsl(var(--primary) / 0.08), transparent 45%)",
        }}
      />
      {children}
    </div>
  );
}

/* -------------------- page -------------------- */

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-jakarta antialiased overflow-x-hidden">
      <Navigation />
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>

      {/* ============== HERO ============== */}
      <section className="relative pt-24 pb-14 md:pt-28 md:pb-16 px-6 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-24 left-1/4 h-[380px] w-[380px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-1/2 -right-32 h-[320px] w-[320px] rounded-full bg-primary/5 blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT */}
          <div className="lg:col-span-7">
            <div
              className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/15 mb-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "60ms" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <span className="text-primary text-[10px] font-bold tracking-[0.18em] uppercase">
                AI-Powered Education Platform · v2.4
              </span>
            </div>

            <h1
              className="font-instrument text-[2.6rem] sm:text-5xl md:text-6xl lg:text-[4.4rem] leading-[1.04] tracking-tight mb-5 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "140ms" }}
            >
              Master your future with{" "}
              <BrandReveal /> AI.
            </h1>

            <p
              className="max-w-xl text-[15px] md:text-base text-muted-foreground leading-relaxed mb-7 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "240ms" }}
            >
              AI-driven psychometric career guidance and real-time English mastery —
              one platform, two flagship products, designed for the next generation
              of confident learners.
            </p>

            <div
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "340ms" }}
            >
              <button
                onClick={() => navigate("/test-access")}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
              >
                <Brain className="w-4 h-4" />
                Start Career Assessment
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("/tutor")}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-card border border-border text-foreground rounded-xl font-semibold hover:border-primary/60 hover:text-primary active:scale-[0.98] transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                Try AI English Tutor
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* condensed stats + trust inline */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border/60 max-w-lg">
              <Stat value={2000} label="Students Guided" delay={0} />
              <Stat value={600} label="Assessments" delay={120} />
              <Stat value={250} label="AI Hours" delay={240} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> ISO-aligned
              </span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500" /> 4.9 mentor rating
              </span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 45+ partner colleges
              </span>
            </div>
          </div>

          {/* RIGHT product preview */}
          <div
            className="lg:col-span-5 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "420ms" }}
          >
            <HeroPreviewTile />
          </div>
        </div>
      </section>

      {/* ============== FLAGSHIP DUAL PRODUCT ============== */}
      <section id="features" className="py-20 px-6 bg-muted/40 border-y border-border/60">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-12">
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-3">
              Two Flagship Products
            </div>
            <h2 className="font-instrument text-4xl md:text-5xl tracking-tight">
              Designed like real products,{" "}
              <span className="italic text-primary">not features.</span>
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Psychometric */}
            <Reveal>
              <TiltCard>
                <article className="group h-full bg-card rounded-[28px] p-8 md:p-9 border border-border hover:border-primary/40 transition-colors duration-500 shadow-sm hover:shadow-2xl">
                  <div className="flex items-start justify-between mb-7">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
                      <Brain className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                      <Activity className="w-3 h-3" /> 24 min · adaptive
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-[26px] font-bold mb-2 tracking-tight">
                    Psychometric Career Test
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed text-[15px]">
                    A scientific roadmap of your potential. We analyse personality,
                    cognitive strengths and interests — then translate them into
                    careers that actually fit.
                  </p>

                  <div className="bg-muted/60 rounded-2xl p-5 mb-6 border border-border/70">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.18em]">
                        Personality Profile
                      </span>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                        98% Accuracy
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {[
                        { label: "Analytical Reasoning", value: 85 },
                        { label: "Leadership Quotient", value: 92 },
                        { label: "Creative Logic", value: 78 },
                      ].map((b) => (
                        <div key={b.label}>
                          <div className="w-full bg-card rounded-full h-2 overflow-hidden border border-border">
                            <Bar value={b.value} />
                          </div>
                          <div className="flex justify-between text-[11px] font-semibold text-foreground/70 mt-1.5">
                            <span>{b.label}</span>
                            <span className="tabular-nums">{b.value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/70">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.18em] mb-1.5">
                        Top Career Matches
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Product Designer", "Systems Architect", "Research Lead"].map(
                          (c) => (
                            <span
                              key={c}
                              className="text-[11px] font-medium px-2 py-1 rounded-md bg-card border border-border"
                            >
                              {c}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/test-access")}
                    className="text-primary font-bold inline-flex items-center gap-1.5 group-hover:gap-3 transition-all"
                  >
                    View sample report <ArrowRight className="w-4 h-4" />
                  </button>
                </article>
              </TiltCard>
            </Reveal>

            {/* AI English Tutor */}
            <Reveal delay={120}>
              <TiltCard>
                <article className="group h-full bg-card rounded-[28px] p-8 md:p-9 border border-border hover:border-primary/40 transition-colors duration-500 shadow-sm hover:shadow-2xl relative overflow-hidden">
                  <div className="flex items-start justify-between mb-7">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground">
                      <Mic className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <Star className="w-3 h-3 fill-current" /> Flagship
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-[26px] font-bold mb-2 tracking-tight">
                    AI English Tutor
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed text-[15px]">
                    A 1:1 video classroom with a live AI mentor. Real-time grammar
                    correction, pronunciation scoring and natural speaking practice —
                    like a private coach on call.
                  </p>

                  <div className="bg-slate-900 rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 flex items-end gap-1 h-6">
                      <span className="w-1 bg-primary/80 rounded-full animate-bounce" style={{ height: "40%" }} />
                      <span
                        className="w-1 bg-primary rounded-full animate-bounce"
                        style={{ height: "85%", animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-1 bg-primary/60 rounded-full animate-bounce"
                        style={{ height: "55%", animationDelay: "0.2s" }}
                      />
                    </div>

                    <div className="space-y-3.5">
                      <div className="bg-primary/15 border border-primary/30 px-3 py-2 rounded-lg text-sm italic text-slate-100">
                        "I <span className="line-through decoration-rose-400">goes</span> to the market yesterday…"
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                          AI
                        </div>
                        <div className="text-sm text-slate-200 leading-relaxed">
                          Nice start! Try:{" "}
                          <span className="text-primary font-bold">
                            "I went to the market."
                          </span>
                          <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                            Pronunciation 8.4 · Grammar +1
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {[
                      { icon: Video, label: "Live AI classroom" },
                      { icon: Languages, label: "Grammar correction" },
                      { icon: Mic, label: "Pronunciation score" },
                      { icon: MessageCircle, label: "Daily speaking" },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 rounded-lg bg-muted/60 border border-border/70 hover:border-primary/40 hover:bg-muted transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        {label}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate("/tutor")}
                    className="text-primary font-bold inline-flex items-center gap-1.5 group-hover:gap-3 transition-all"
                  >
                    Enter AI classroom <ArrowRight className="w-4 h-4" />
                  </button>
                </article>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== LEARNING SOLUTIONS ============== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
              <div className="max-w-xl">
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-3">
                  Learning Solutions
                </div>
                <h2 className="font-instrument text-4xl md:text-5xl tracking-tight">
                  Built for holistic{" "}
                  <span className="italic text-primary">student success.</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-sm">
                Six focused modules that wrap academics with the skills modern
                institutions actually need.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: "Memory & Study Skills",
                copy: "Evidence-based techniques to improve retention, focus and learning efficiency.",
              },
              {
                icon: Trophy,
                title: "Exam Excellence",
                copy: "Strategic planning and stress management for sustained academic performance.",
              },
              {
                icon: HeartHandshake,
                title: "Life Skills",
                copy: "Confidence, communication, leadership and emotional intelligence in practice.",
              },
              {
                icon: ShieldCheck,
                title: "Cybersecurity Awareness",
                copy: "Essential digital literacy and online safety for the modern student.",
              },
              {
                icon: PenLine,
                title: "Career Counselling",
                copy: "1:1 guidance paired with our psychometric report for a clear, confident path.",
              },
              {
                icon: Users,
                title: "Mentor Network",
                copy: "Access to industry mentors who've walked the path you're considering.",
              },
            ].map(({ icon: Icon, title, copy }, i) => (
              <Reveal key={title} delay={i * 80}>
                {/*
                  Stripe/Linear-style product card:
                  - Resting elevation is almost flat (1px hairline shadow) so a
                    grid of six cards reads as a calm catalogue, not a billboard.
                  - On hover the card lifts ~4px, the border darkens, a deeper
                    shadow blooms, a primary hairline scales in across the top,
                    the icon tile flips to a primary tint, the icon nudges &
                    scales, and a "Learn more" affordance slides in.
                  - All transitions share 500ms cubic-bezier(0.22,1,0.36,1)
                    so the choreography feels orchestrated, not noisy.
                  - No gradients. No new colors. Tokens only.
                */}
                <article
                  className="group relative h-full p-7 rounded-2xl border border-border/70 bg-card overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-foreground/15 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.18)]"
                >
                  {/* Top primary hairline — scales from left on hover */}
                  <span
                    aria-hidden
                    className="absolute top-0 left-6 right-6 h-px bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  />
                  {/* Soft corner glyph that fades in on hover for depth */}
                  <span
                    aria-hidden
                    className="absolute -top-px -right-px w-16 h-16 rounded-bl-2xl border-l border-b border-border/0 group-hover:border-border/60 transition-colors duration-500"
                  />

                  <div className="flex items-start justify-between mb-6">
                    <div className="relative w-11 h-11 rounded-xl border border-border bg-background flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:shadow-[0_8px_20px_-12px_hsl(var(--primary)/0.45)]">
                      <Icon className="w-5 h-5 text-foreground/80 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-primary group-hover:scale-110 group-hover:-rotate-3" />
                    </div>
                    <span className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground/55 mt-1">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2.5 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {copy}
                  </p>

                  {/* Hover-revealed micro-CTA — Stripe/Linear pattern */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
                    Learn more
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1" />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* ============== TESTIMONIALS — dark marquee ============== */}
      <section
        className="relative py-24 md:py-28 overflow-hidden"
        style={{ backgroundColor: "#08142B" }}
      >
        {/* subtle dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* edge fades */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-24 md:w-40 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, #08142B 0%, rgba(8,20,43,0) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-24 md:w-40 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, #08142B 0%, rgba(8,20,43,0) 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 mb-14 md:mb-16">
          <Reveal className="max-w-3xl">
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-4 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Voices of Success
            </div>
            <h2 className="font-instrument text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-white">
              Trusted by students,{" "}
              <span className="italic text-primary">loved by educators.</span>
            </h2>
            <p className="mt-5 text-white/60 text-base md:text-lg max-w-xl leading-relaxed">
              Real stories from learners, parents, and mentors building their future with ConnectGuru.
            </p>
          </Reveal>
        </div>

        {/* draggable / swipeable rows with slow auto-scroll */}
        <div className="relative space-y-6">
          <DraggableMarquee items={testimonials} direction="left" speedPxPerSec={22} />
          <DraggableMarquee items={[...testimonials].reverse()} direction="right" speedPxPerSec={16} />
        </div>
      </section>

      {/* ============== CONVERSION CTA — editorial ============== */}
      <section className="py-24 px-6">
        <Reveal>
          <div className="max-w-6xl mx-auto relative">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.05] rounded-[36px] overflow-hidden"
              style={{
                backgroundImage:
                  "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            />
            <div className="relative rounded-[36px] border border-border bg-card p-10 md:p-16 grid md:grid-cols-12 gap-10 items-center shadow-sm">
              <div className="md:col-span-7">
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-4 inline-flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Get Started
                </div>
                <h2 className="font-instrument text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.05] tracking-tight mb-5">
                  Ready to transform <br />
                  <span className="italic text-primary">your academic journey?</span>
                </h2>
                <p className="text-muted-foreground max-w-lg mb-7 text-[15px] md:text-base leading-relaxed">
                  Join thousands of learners using ConnectGuru to choose the right
                  career and speak English with confidence.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/test-access")}
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    Take the Career Test
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => navigate("/tutor")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border text-foreground rounded-xl font-semibold hover:border-primary/60 hover:text-primary active:scale-[0.98] transition-all"
                  >
                    Try the AI Tutor
                  </button>
                </div>
              </div>

              <div className="md:col-span-5">
                <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-4">
                  {[
                    { k: "Average accuracy", v: "98%" },
                    { k: "Avg. fluency gain · 30 days", v: "+38%" },
                    { k: "Active learners this week", v: "1,284" },
                    { k: "Avg. mentor rating", v: "4.9 / 5" },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex items-center justify-between text-sm border-b border-border/70 last:border-0 pb-3 last:pb-0"
                    >
                      <span className="text-muted-foreground">{row.k}</span>
                      <span className="font-bold tabular-nums">{row.v}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                    <Waves className="w-3.5 h-3.5 text-primary" />
                    Updated live · last 5 minutes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

/* -------------------- bits -------------------- */

function Bar({ value }: { value: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  return (
    <div
      ref={ref}
      className="bg-primary h-full transition-[width] duration-[1200ms] ease-out"
      style={{ width: inView ? `${value}%` : "0%" }}
    />
  );
}

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  institution: string;
  credibility: string;
};

function DraggableMarquee({
  items,
  direction = "left",
  speedPxPerSec = 22,
}: {
  items: Testimonial[];
  direction?: "left" | "right";
  speedPxPerSec?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const widthRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);

  const loop = [...items, ...items];

  useEffect(() => {
    const dir = direction === "left" ? -1 : 1;
    // Seed right-direction at -width so we slide from negative to 0 then wrap.
    let seeded = false;
    let last = performance.now();
    let raf = 0;

    const measure = () => {
      if (trackRef.current) {
        widthRef.current = trackRef.current.scrollWidth / 2;
        if (!seeded && dir === 1 && widthRef.current > 0) {
          offsetRef.current = -widthRef.current;
          seeded = true;
        } else if (!seeded && dir === -1) {
          seeded = true;
        }
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = widthRef.current;
      if (w > 0 && !pausedRef.current && !draggingRef.current) {
        offsetRef.current += dir * speedPxPerSec * dt;
      }
      if (w > 0) {
        if (offsetRef.current <= -w) offsetRef.current += w;
        else if (offsetRef.current >= 0) offsetRef.current -= w;
      }
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [direction, speedPxPerSec]);

  const clearResume = () => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    clearResume();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    offsetRef.current += dx;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    // brief settle before auto-resume
    clearResume();
    resumeTimerRef.current = window.setTimeout(() => { /* resume */ }, 200);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        ref={trackRef}
        className="flex gap-5 md:gap-6 w-max will-change-transform"
      >
        {loop.map((t, i) => (
          <figure
            key={`${t.name}-${i}`}
            className="group/card relative w-[320px] md:w-[400px] shrink-0 rounded-2xl p-7 md:p-8 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 50px -20px rgba(0,0,0,0.6)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.45)";
              e.currentTarget.style.boxShadow =
                "0 1px 0 rgba(255,255,255,0.1) inset, 0 30px 70px -20px hsl(var(--primary) / 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.boxShadow =
                "0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 50px -20px rgba(0,0,0,0.6)";
            }}
          >
            <Quote
              aria-hidden
              className="absolute top-5 right-5 w-5 h-5 text-white/15 transition-colors duration-500 group-hover/card:text-primary/40"
            />

            <div className="flex items-center gap-1 mb-5 text-amber-400">
              {[...Array(5)].map((_, j) => (
                <Star
                  key={j}
                  className="w-4 h-4 fill-current animate-[starShimmer_2.6s_ease-in-out_infinite]"
                  style={{ animationDelay: `${j * 160}ms` }}
                />
              ))}
            </div>
            <blockquote className="text-[15px] md:text-[16px] leading-relaxed text-white/85 mb-7 min-h-[5.5rem] pointer-events-none">
              "{t.quote}"
            </blockquote>
            <figcaption className="flex items-center gap-3.5 pt-5 border-t border-white/10 pointer-events-none">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-105"
                style={{
                  backgroundColor: "hsl(var(--primary) / 0.18)",
                  color: "hsl(var(--primary))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                }}
                aria-hidden
              >
                {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="font-semibold text-sm text-white truncate">
                    {t.name}
                  </div>
                  <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                </div>
                <div className="text-[12px] text-white/55 truncate">
                  {t.role}{t.role && t.institution && " · "}{t.institution}
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}


const testimonials = [
  {
    quote:
      "The AI tutor feels like talking to a real person. My fluency improved in weeks, not months.",
    name: "Rahul Sharma",
    role: "\n",
    institution: "",
    credibility: "30-day streak · Fluency 8.7",
  },
  {
    quote:
      "The psychometric report was eerily accurate. It helped me choose my major with confidence.",
    name: "Priya Mehta",
    role: "MS",
    institution: "",
    credibility: "Verified learner · 2024",
  },
  {
    quote:
      "Premium tools that actually deliver. ConnectGuru is the future of student counselling.",
    name: "Arjun Singh",
    role: "Founder",
    institution: "Sprintly Labs",
    credibility: "Early access · cohort 02",
  },
  {
    quote:
      "The interactive approach to life skills is exactly what the modern curriculum lacks.",
    name: "Sanya Gupta",
    role: "Design Student",
    institution: "NID Ahmedabad",
    credibility: "Top 5% engagement",
  },
  {
    quote:
      "Our students engage with the AI mentor more than any tool we've introduced in five years.",
    name: "Dr. Arpita Sen",
    role: "\n",
    institution: "",
    credibility: "Educator partner",
  },
  {
    quote:
      "The career match section gave my child a clear, confident direction. Worth every minute.",
    name: "Neha Kapoor",
    role: "\n",
    institution: "",
    credibility: "Verified family account",
  },
];

export default Index;
