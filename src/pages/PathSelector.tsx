import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Mic,
  Video,
  Clock,
  FileText,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  Languages,
  Star,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function PathSelector() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth?redirect=/choose-path", { replace: true }); return; }
    void (async () => {
      const { data } = await supabase.from("subscribers").select("test_access_activated").eq("user_id", user.id).maybeSingle();
      if (!data?.test_access_activated) navigate("/test-access", { replace: true });
    })();
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Ambient light — soft radial spots, NOT a gradient wash. Provides depth
          without coloring the entire background. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[380px] w-[380px] rounded-full bg-indigo-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navigation />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-20">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14 md:mb-16">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-5 opacity-0 animate-fade-in"
              style={{ animationDelay: "60ms" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Payment confirmed — welcome aboard
            </div>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "120ms" }}
            >
              Choose your path
            </h1>
            <p
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              Two doors. One unlocks clarity about your career, the other unlocks
              confident spoken English — both included in your access.
            </p>

            {/* Trust strip */}
            <div
              className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground opacity-0 animate-fade-in"
              style={{ animationDelay: "320ms" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Lifetime access
              </span>
              <span className="hidden sm:inline h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500" /> 
              </span>
              <span className="hidden sm:inline h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Switch paths anytime
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-5 lg:gap-7">
            {/* CARD 1 — Psychometric */}
            <Card
              className="group relative overflow-hidden border border-border/60 bg-card/70 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--foreground)/0.04)_inset,0_30px_60px_-30px_hsl(var(--primary)/0.25)] transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_1px_0_0_hsl(var(--foreground)/0.06)_inset,0_40px_80px_-30px_hsl(var(--primary)/0.45)] opacity-0 animate-fade-in-up"
              style={{ animationDelay: "420ms" }}
            >
              {/* hairline top accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <CardContent className="p-6 sm:p-7 md:p-9 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                      <Brain className="h-7 w-7" />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="h-3 w-3" /> Self-discovery
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                  Psychometric Career Test
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  A scientifically validated assessment that maps your personality,
                  interests and natural aptitudes — then translates them into careers
                  that actually fit.
                </p>

                <ul className="space-y-2.5 mb-7">
                  <Benefit>Big-Five personality + interest profile</Benefit>
                  <Benefit>Aptitude scores across 8 cognitive areas</Benefit>
                  <Benefit>Personalised career match report (PDF)</Benefit>
                  <Benefit>Strengths, blind-spots and next-step playbook</Benefit>
                </ul>

                {/* meta row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> ~20 minutes
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Detailed report
                  </span>
                </div>

                <Button
                  size="lg"
                  className="mt-auto w-full justify-between h-12 rounded-xl font-semibold group/btn transition-transform duration-200 active:scale-[0.98]"
                  onClick={() => window.open("https://forms.office.com/r/aNdj3CXVJX", "_blank", "noopener,noreferrer")}
                >
                  Take the test
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Button>
              </CardContent>
            </Card>

            {/* CARD 2 — AI English Tutor */}
            <Card
              className="group relative overflow-hidden border border-indigo-500/30 bg-card/70 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--foreground)/0.04)_inset,0_30px_60px_-30px_hsl(238_84%_60%/0.35)] transition-all duration-500 hover:-translate-y-1 hover:border-indigo-400/60 hover:shadow-[0_1px_0_0_hsl(var(--foreground)/0.06)_inset,0_45px_90px_-30px_hsl(238_84%_60%/0.55)] opacity-0 animate-fade-in-up"
              style={{ animationDelay: "560ms" }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

              {/* Featured ribbon */}
              <div className="absolute top-4 right-4 z-10">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Star className="h-3 w-3 fill-current" /> Most popular
                </span>
              </div>

              <CardContent className="p-6 sm:p-7 md:p-9 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-6">
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-2xl bg-indigo-500/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative h-14 w-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                      <GraduationCap className="h-7 w-7" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                    AI English Tutor
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 font-semibold uppercase tracking-wider border border-rose-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  A one-on-one video class with a live AI mentor. Speak naturally and
                  get instant feedback on grammar, pronunciation and fluency — like
                  having a private coach on call.
                </p>

                <ul className="space-y-2.5 mb-7">
                  <Benefit tone="indigo" icon={Video}>Face-to-face video class with an AI mentor</Benefit>
                  <Benefit tone="indigo" icon={Mic}>Real-time pronunciation scoring</Benefit>
                  <Benefit tone="indigo" icon={Languages}>Sentence-level grammar correction</Benefit>
                  <Benefit tone="indigo" icon={MessageCircle}>Daily speaking practice with progress tracking</Benefit>
                </ul>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> 15-min daily classes
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Personalised path
                  </span>
                </div>

                <Button
                  size="lg"
                  className="mt-auto w-full justify-between h-12 rounded-xl font-semibold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 group/btn transition-transform duration-200 active:scale-[0.98]"
                  onClick={() => navigate("/tutor")}
                >
                  Start learning
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footnote */}
          <p
            className="text-center text-xs text-muted-foreground mt-8 sm:mt-10 opacity-0 animate-fade-in"
            style={{ animationDelay: "720ms" }}
          >
            Not sure where to start? Most learners begin with the career test — then
            pick up English practice in parallel.
          </p>
        </main>
      </div>
    </div>
  );
}

function Benefit({
  children,
  tone = "primary",
  icon: Icon = CheckCircle2,
}: {
  children: React.ReactNode;
  tone?: "primary" | "indigo";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const color =
    tone === "indigo" ? "text-indigo-500" : "text-primary";
  return (
    <li className="flex items-start gap-2.5 text-sm text-foreground/85">
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
      <span className="leading-snug">{children}</span>
    </li>
  );
}
