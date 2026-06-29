import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Zap,
  Sparkles,
  Brain,
  GraduationCap,
  MessageSquare,
  Star,
  ArrowRight,
  Check,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import Navigation from '@/components/Navigation';
import { toast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/*  Animated trust counter                                            */
/* ------------------------------------------------------------------ */
function Counter({ to, suffix = '+', duration = 1600 }: { to: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <span className="tabular-nums">
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Password strength                                                 */
/* ------------------------------------------------------------------ */
function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too short', 'Weak', 'Okay', 'Strong', 'Excellent'];
  const colors = [
    'bg-muted',
    'bg-destructive/70',
    'bg-secondary',
    'bg-primary/70',
    'bg-primary',
  ];
  return { score, label: labels[score], color: colors[score] };
}

/* ------------------------------------------------------------------ */
/*  Floating Label Input  (uses design tokens)                        */
/* ------------------------------------------------------------------ */
type FloatProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  rightSlot?: React.ReactNode;
};
const FloatingInput = React.forwardRef<HTMLInputElement, FloatProps>(
  ({ label, rightSlot, id, className = '', ...props }, ref) => {
    return (
      <div className="relative group">
        <input
          ref={ref}
          id={id}
          placeholder=" "
          {...props}
          className={`peer block w-full rounded-xl border border-border bg-card
                      px-4 pt-5 pb-2 text-[15px] text-foreground shadow-sm
                      outline-none transition-all duration-200
                      hover:border-primary/40
                      focus:border-primary focus:ring-4 focus:ring-primary/15
                      ${rightSlot ? 'pr-11' : ''} ${className}`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-3.5 origin-[0] -translate-y-0 scale-100
                     font-['Inter',sans-serif] text-[15px] text-muted-foreground transition-all duration-200
                     peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100
                     peer-focus:top-1.5 peer-focus:scale-[0.78] peer-focus:text-primary
                     peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:scale-[0.78] peer-[:not(:placeholder-shown)]:text-muted-foreground"
        >
          {label}
        </label>
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{rightSlot}</div>
        )}
      </div>
    );
  },
);
FloatingInput.displayName = 'FloatingInput';

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */
const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { user, userProfile, signIn, signUp, signInWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(redirectTo);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error, data } = await signIn(email, password);
        if (!error && data?.user) navigate(redirectTo);
      } else {
        if (!fullName || !phoneNumber) {
          toast({
            title: 'Missing information',
            description: 'Please fill in your full name and phone number.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, {
          full_name: fullName,
          phone_number: phoneNumber,
        });
        if (!error) {
          toast({
            title: '🎉 Welcome aboard!',
            description: 'Check your inbox to verify your account.',
          });
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (userProfile !== null) navigate(redirectTo, { replace: true });
  }, [user, userProfile, navigate, redirectTo]);

  const testimonials = [
    {
      name: 'Ananya R.',
      role: 'IELTS 8.0 · Now at Deloitte',
      quote:
        'The psychometric report nailed my strengths. Six weeks with the AI tutor and my speaking score jumped two bands.',
      initials: 'AR',
    },
    {
      name: 'Rahul M.',
      role: 'Placed at Infosys · 12 LPA',
      quote:
        'Felt like having a personal coach on tap. The career outcomes are real — I had three offers before graduation.',
      initials: 'RM',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden mesh-background text-foreground">
      <Navigation />
      {/* Page-scoped keyframes */}
      <style>{`
        @keyframes auth-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes auth-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .auth-fade-up { opacity: 0; animation: auth-fade-up 0.7s cubic-bezier(.2,.7,.2,1) forwards; }
        .auth-float { animation: auth-float 6s ease-in-out infinite; }
        .auth-grid {
          background-image:
            linear-gradient(to right, hsl(var(--border) / 0.6) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.6) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: radial-gradient(ellipse at 30% 30%, black 30%, transparent 75%);
        }
        /* ---- Dark mode polish for left showcase panel ---- */
        .dark .auth-showcase {
          background-color: hsl(222 47% 7%);
          background-image:
            radial-gradient(ellipse at 20% 0%, hsl(217 91% 60% / 0.18), transparent 55%),
            radial-gradient(ellipse at 90% 100%, hsl(217 91% 50% / 0.12), transparent 55%);
          border-right-color: hsl(217 32% 18%);
          backdrop-filter: none;
        }
        .dark .auth-showcase .auth-grid {
          background-image:
            linear-gradient(to right, hsl(210 40% 98% / 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(210 40% 98% / 0.06) 1px, transparent 1px);
        }
        .dark .auth-showcase .floating-card {
          background: hsl(222 47% 10%);
          border-color: hsl(217 32% 22%);
          box-shadow: 0 1px 0 hsl(210 40% 98% / 0.04) inset, 0 8px 24px -12px hsl(0 0% 0% / 0.6);
        }
        .dark .auth-showcase .glass-card {
          background: hsl(222 47% 10%) !important;
          border-color: hsl(217 32% 22%) !important;
          box-shadow: 0 1px 0 hsl(210 40% 98% / 0.04) inset, 0 8px 24px -12px hsl(0 0% 0% / 0.6) !important;
        }
        .dark .auth-showcase .auth-muted-strong { color: hsl(215 25% 78%); }
        .dark .auth-showcase .auth-muted-soft { color: hsl(215 20% 70%); }
        .dark .auth-showcase .text-muted-foreground { color: hsl(215 22% 76%); }
        .dark .auth-showcase .text-foreground\\/80 { color: hsl(210 40% 96% / 0.92); }
      `}</style>

      {/* Soft ConnectGuru ambient lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* ============================================================ */}
        {/* LEFT — Brand showcase                                        */}
        {/* ============================================================ */}
        <aside className="auth-showcase relative hidden flex-col justify-between overflow-hidden border-r border-border/60 bg-card/40 px-10 py-12 backdrop-blur-xl lg:flex xl:px-14">
          <div className="absolute inset-0 auth-grid opacity-70" />

          <div className="relative">
            <div className="auth-fade-up flex items-center gap-3">
              <BrandLogo size={36} />
              <span className="font-['Playfair_Display',serif] text-[17px] font-semibold tracking-tight text-foreground">
                ConnectGuru
              </span>
            </div>
          </div>

          <div className="relative">
            {/* Removing cohort notification text */}

            <h1
              className="auth-fade-up max-w-xl font-['Playfair_Display',serif] text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground xl:text-[52px]"
              style={{ animationDelay: '120ms' }}
            >
              Start your learning journey with{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  ConnectGuru
                </span>
              </span>
            </h1>

            <p
              className="auth-fade-up mt-5 max-w-md font-['Inter',sans-serif] text-[16px] leading-relaxed text-muted-foreground"
              style={{ animationDelay: '200ms' }}
            >
              Discover your strengths with science-backed psychometric testing, then sharpen them with
              a personal AI English tutor — built for students who want real career outcomes.
            </p>

            {/* Floating feature cards */}
            <div className="relative mt-10 grid max-w-md grid-cols-2 gap-4">
              <div
                className="auth-fade-up auth-float floating-card"
                style={{ animationDelay: '280ms' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground soft-glow">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="mt-3 text-[14px] font-semibold text-foreground">Psychometric Test</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Personality, aptitude & career fit, scored in minutes.
                </div>
              </div>

              <div
                className="auth-fade-up auth-float floating-card"
                style={{ animationDelay: '360ms', animationDuration: '0.7s, 7s' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="mt-3 text-[14px] font-semibold text-foreground">AI English Tutor</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Speak, write & get instant, kind feedback 24/7.
                </div>
              </div>
            </div>

            {/* Animated trust counters */}
            <div
              className="auth-fade-up mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6"
              style={{ animationDelay: '440ms' }}
            >
              <div>
                <div className="font-['Playfair_Display',serif] text-[28px] font-semibold tracking-tight text-foreground">
                  <Counter to={2000} />
                </div>
                <div className="mt-0.5 text-[11.5px] uppercase tracking-wider text-muted-foreground">
                  Students Guided
                </div>
              </div>
              <div>
                <div className="font-['Playfair_Display',serif] text-[28px] font-semibold tracking-tight text-foreground">
                  <Counter to={600} />
                </div>
                <div className="mt-0.5 text-[11.5px] uppercase tracking-wider text-muted-foreground">
                  Assessments
                </div>
              </div>
              <div>
                <div className="font-['Playfair_Display',serif] text-[28px] font-semibold tracking-tight text-foreground">
                  <Counter to={250} />
                </div>
                <div className="mt-0.5 text-[11.5px] uppercase tracking-wider text-muted-foreground">
                  AI Tutor Hours
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div
            className="auth-fade-up relative mt-12 max-w-md space-y-3"
            style={{ animationDelay: '560ms' }}
          >
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="glass-card flex gap-3 !p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-[12px] font-semibold text-primary-foreground">
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-3 w-3 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <blockquote className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
                    "{t.quote}"
                  </blockquote>
                  <figcaption className="mt-1.5 text-[12px] text-muted-foreground">
                    {"\n"}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </aside>

        {/* ============================================================ */}
        {/* RIGHT — Auth form                                            */}
        {/* ============================================================ */}
        <main className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="w-full max-w-[440px]">
            {/* Mobile logo */}
            <div className="auth-fade-up mb-8 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2.5">
                <BrandLogo size={32} />
                <span className="font-['Playfair_Display',serif] text-[15px] font-semibold text-foreground">
                  {"\n"}
                </span>
              </div>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-medium text-muted-foreground hover:text-primary"
              >
                {isLogin ? 'Create account' : 'Sign in'}
              </button>
            </div>

            <div className="auth-fade-up" style={{ animationDelay: '80ms' }}>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                {isLogin ? 'Welcome back' : 'Get started — free'}
              </div>
              <h2 className="mt-3 font-['Playfair_Display',serif] text-[30px] font-semibold leading-tight tracking-tight text-foreground">
                {isLogin ? 'Sign in to continue' : 'Create your account'}
              </h2>
              <p className="mt-1.5 font-['Inter',sans-serif] text-[14.5px] text-muted-foreground">
                {isLogin
                  ? 'Pick up where you left off in your learning path.'
                  : 'Takes under a minute. No credit card required.'}
              </p>
            </div>

            {/* Google */}
            <div className="auth-fade-up mt-7" style={{ animationDelay: '160ms' }}>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-xl
                           border border-border bg-card text-[14.5px] font-medium text-foreground shadow-sm
                           transition-all duration-300
                           hover:-translate-y-[1px] hover:border-primary/40 hover:shadow-md
                           active:translate-y-0 disabled:opacity-60"
              >
                {googleLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                    </svg>
                    Continue with Google
                    <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div
              className="auth-fade-up my-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
              style={{ animationDelay: '220ms' }}
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
              or with email
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
            </div>

            {/* Form */}
            <form
              onSubmit={handleEmailAuth}
              className="auth-fade-up space-y-3.5"
              style={{ animationDelay: '280ms' }}
            >
              {!isLogin && (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <FloatingInput
                    id="fullname"
                    label="Full name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <FloatingInput
                    id="phone"
                    label="Phone number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
              )}

              <FloatingInput
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div className="space-y-2">
                <FloatingInput
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                {!isLogin && password.length > 0 && (
                  <div className="px-1">
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < strength.score ? strength.color : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11.5px]">
                      <span className="text-muted-foreground">Password strength</span>
                      <span className="font-medium text-foreground">{strength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="group relative mt-2 h-12 w-full overflow-hidden rounded-xl
                           bg-primary text-[14.5px] font-semibold text-primary-foreground
                           shadow-[var(--shadow-md)]
                           transition-all duration-300
                           hover:-translate-y-[1px] hover:bg-primary/90 hover:shadow-[var(--shadow-glow)]
                           active:translate-y-0 disabled:opacity-70"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      {isLogin ? 'Signing in…' : 'Creating account…'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign in' : 'Create account'}
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_30%,hsl(0_0%_100%/0.18)_50%,transparent_70%)] transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
              </Button>
            </form>

            {/* Toggle */}
            <p
              className="auth-fade-up mt-6 text-center text-[13.5px] text-muted-foreground"
              style={{ animationDelay: '440ms' }}
            >
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail('');
                  setPassword('');
                  setFullName('');
                  setPhoneNumber('');
                }}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Auth;
