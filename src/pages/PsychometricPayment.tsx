import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Award, TrendingUp, CheckCircle, MessageCircle, Target, Lightbulb, Gift, Ticket, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  PSYCHOMETRIC_CURRENCY,
  PSYCHOMETRIC_FLOW_TYPE,
  PSYCHOMETRIC_ORIGINAL_PRICE,
  PSYCHOMETRIC_PRICE,
  PSYCHOMETRIC_PRICE_IN_PAISE,
  formatRupees,
  paiseToRupees,
} from '@/config/pricing';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: { description?: string };
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { email: string };
  theme: { color: string };
  handler: (response: RazorpayPaymentResponse) => Promise<void>;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void) => void;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : typeof error === 'string' ? error : fallback;

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const clearStaleCheckoutState = () => {
  try {
    Object.keys(localStorage)
      .filter((key) => /razorpay|checkout|payment|order/i.test(key))
      .forEach((key) => localStorage.removeItem(key));
    Object.keys(sessionStorage)
      .filter((key) => /razorpay|checkout|payment|order/i.test(key))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn('[Payment] Could not clear stale checkout state', error);
  }
};

const loadRazorpayScript = () => new Promise<boolean>((resolve) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
  if (existing) {
    existing.addEventListener('load', () => resolve(true), { once: true });
    existing.addEventListener('error', () => resolve(false), { once: true });
    return;
  }
  const script = document.createElement('script');
  script.src = RAZORPAY_SCRIPT_SRC;
  script.async = true;
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const PsychometricPayment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState('');
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const checkAccess = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('subscribers')
        .select('test_access_activated')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.test_access_activated) {
        setHasAccess(true);
        return;
      }
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // If not signed in, send to auth first; come back here after login.
    if (!user) {
      navigate('/auth?redirect=/test-access', { replace: true });
      return;
    }
    void checkAccess();
  }, [user, navigate, checkAccess]);

  const handleRedeemCode = async () => {
    if (!referralCode.trim()) {
      toast({ title: "Enter Code", description: "Please enter a referral code", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Sign In Required", description: "Please sign in first", variant: "destructive" });
      navigate('/auth');
      return;
    }

    setRedeemingCode(true);
    try {
      const { data, error } = await supabase.rpc('redeem_referral_code', {
        p_code: referralCode.trim().toUpperCase(),
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      if (result.success) {
        toast({ title: "🎉 Code Redeemed!", description: "Access activated. Choose your path…" });
        setHasAccess(true);
        navigate('/choose-path');
      } else {
        toast({ title: "Invalid Code", description: result.error || "This code is invalid or already used", variant: "destructive" });
      }
    } catch (error: unknown) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to redeem code"), variant: "destructive" });
    } finally {
      setRedeemingCode(false);
    }
  };

  // Load Razorpay Checkout SDK once and remove any stale local checkout cache.
  useEffect(() => {
    clearStaleCheckoutState();
    void loadRazorpayScript();
  }, []);

  const handlePay = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    clearStaleCheckoutState();
    const sdkReady = await loadRazorpayScript();
    if (!sdkReady || !window.Razorpay) {
      toast({ title: 'Payment unavailable', description: 'Please refresh and try again.', variant: 'destructive' });
      return;
    }
    setPaying(true);
    try {
      // 1. Create order on backend
      const { data: orderData, error: orderErr } = await supabase.functions.invoke(
        'create-razorpay-order',
        { body: { flow_type: PSYCHOMETRIC_FLOW_TYPE, expected_amount: PSYCHOMETRIC_PRICE_IN_PAISE } }
      );
      if (orderErr || !orderData?.success) {
        throw new Error(orderData?.error || orderErr?.message || 'Could not start payment');
      }
      const backendAmount = Number(orderData.amount);
      console.info('[Payment] Order amount check', {
        frontendAmount: PSYCHOMETRIC_PRICE_IN_PAISE,
        backendAmount,
        razorpayOrderAmount: orderData.amount,
        orderId: orderData.order_id,
      });
      if (backendAmount !== PSYCHOMETRIC_PRICE_IN_PAISE || orderData.currency !== PSYCHOMETRIC_CURRENCY) {
        console.error('[Payment] Amount mismatch before checkout', {
          frontendAmount: PSYCHOMETRIC_PRICE_IN_PAISE,
          backendAmount,
          backendCurrency: orderData.currency,
        });
        throw new Error('PAYMENT_AMOUNT_MISMATCH');
      }

      // 2. Open Razorpay Checkout (UPI / QR / Cards / Netbanking auto-enabled)
      const rzp = new window.Razorpay({
        key: orderData.key_id,
        order_id: orderData.order_id,
        amount: backendAmount,
        currency: orderData.currency,
        name: 'ConnectGuru',
        description: 'Psychometric Career Test',
        prefill: { email: user.email ?? '' },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  flow_type: PSYCHOMETRIC_FLOW_TYPE,
                  expected_amount: PSYCHOMETRIC_PRICE_IN_PAISE,
                },
              }
            );
            console.info('[Payment] Verification amount check', {
              frontendAmount: PSYCHOMETRIC_PRICE_IN_PAISE,
              verificationAmount: verifyData?.amount,
              orderId: response.razorpay_order_id,
            });
            if (verifyErr || !verifyData?.success) {
              throw new Error(verifyData?.error || verifyErr?.message || 'Verification failed');
            }
            toast({ title: '🎉 Payment Verified', description: 'Choose your learning path…' });
            setHasAccess(true);
            navigate('/choose-path');
          } catch (e: unknown) {
            console.error('[Payment] Verification failed', e);
            toast({ title: 'Verification failed', description: 'We could not verify your payment. If money was deducted, please contact support with your payment ID.', variant: 'destructive' });
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      rzp.on('payment.failed', (resp) => {
        toast({ title: 'Payment failed', description: resp?.error?.description || 'Try again', variant: 'destructive' });
        setPaying(false);
      });
      rzp.open();
    } catch (err: unknown) {
      console.error('[Payment] Checkout failed', err);
      const message = getErrorMessage(err, 'Could not start payment');
      const description = message === 'PAYMENT_AMOUNT_MISMATCH'
        ? 'Payment price could not be confirmed. Please refresh and try again.'
        : 'Could not start payment. Please try again in a moment.';
      toast({ title: 'Payment error', description, variant: 'destructive' });
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user already has access, show success + button to open the test
  if (hasAccess) {
    const goChoose = () => navigate('/choose-path');
    const benefits = [
      { icon: Brain, label: "Comprehensive Assessment", text: "Scientific personality analysis across 4 core dimensions" },
      { icon: Target, label: "Personalized Results", text: "Career recommendations tailored to your unique profile" },
      { icon: Award, label: "Detailed Report", text: "Strengths breakdown with a clear career roadmap" },
      { icon: TrendingUp, label: "Expert Insights", text: "Actionable next steps for your future" },
    ];

    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Ambient success glow background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-green-500/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <Navigation />
        <main className="container mx-auto px-4 py-12 sm:py-20">
          <div className="max-w-xl mx-auto text-center">
            <div className="relative">
              {/* Soft outer glow behind card */}
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-b from-green-500/10 via-emerald-500/5 to-transparent blur-2xl opacity-60" />

              <Card className="relative border border-green-500/15 bg-card/95 backdrop-blur-sm shadow-xl shadow-green-500/5">
                <CardContent className="p-10 sm:p-14">
                  {/* Animated Success Icon */}
                  <div className="relative mx-auto mb-8 w-28 h-28">
                    {/* Pulsing glow ring */}
                    <div className="absolute inset-0 rounded-full bg-green-500/10 animate-success-glow" />
                    <div className="absolute inset-2 rounded-full bg-green-500/5 animate-success-glow" style={{ animationDelay: '0.5s' }} />
                    {/* Main icon container */}
                    <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30 border border-green-200/60 dark:border-green-800/40 animate-success-pop">
                      <svg
                        className="w-14 h-14 text-green-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" className="opacity-15" />
                        <path
                          d="M8 12.5l2.5 2.5 5-6"
                          strokeDasharray="30"
                          strokeDashoffset="30"
                          className="animate-check-draw"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="animate-fade-in-up space-y-3 mb-8" style={{ animationDelay: '0.3s' }}>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      Access Granted
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Access activated</h2>
                    <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                      Your Psychometric Test access is now live. Here's everything waiting for you.
                    </p>
                  </div>

                  {/* Benefits Grid */}
                  <div className="grid sm:grid-cols-2 gap-3 text-left mb-10 animate-fade-in" style={{ animationDelay: '0.55s' }}>
                    {benefits.map((b, i) => (
                      <div
                        key={i}
                        className="group flex items-start gap-3.5 p-4 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/50 hover:border-primary/30 hover:bg-muted/60 transition-all duration-300"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <b.icon className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground mb-0.5">{b.label}</p>
                          <p className="text-sm text-muted-foreground leading-snug">{b.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="animate-fade-in-up space-y-3" style={{ animationDelay: '0.75s' }}>
                    <Button onClick={goChoose} className="w-full premium-button group text-base py-6" size="lg">
                      Choose your path
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      If the test doesn't open, please allow pop-ups for this site.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const whatYouGet = [
    'Comprehensive personality analysis across 4 dimensions',
    'Scientific assessment based on globally recognized psychometric tools',
    'Personalized career recommendations based on your profile',
    'Detailed report with strengths and career roadmap',
    'Analysis of Interests, Aptitude, Personality & Future Goals',
    'Stream-wise career guidance (Commerce, Science, Arts, IT)',
    'Expert insights and actionable next steps',
    'Covers modern fields like AI, FinTech, Data Science',
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative brand glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
          }}
        />
      </div>

      <Navigation />

      <main className="container mx-auto px-4 py-6 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Career Discovery · Scientifically Backed
            </div>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg shadow-primary/30 bg-gradient-to-br from-primary to-primary/70 ring-1 ring-white/10">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-secondary">
                Psychometric Career
              </span>
              <br />
              <span className="text-foreground">Guidance Program</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover your strengths, interests, and personality through a scientific assessment — and make the right career decision at the right time.
            </p>
          </div>

          {/* What You Get Section */}
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-center mb-8">✨ What You Get</h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {whatYouGet.map((item, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-3 p-4 bg-card/80 backdrop-blur rounded-xl border border-border/60 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-300 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'forwards' }}
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm sm:text-base">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Payment Section */}
          <div className="flex justify-center mb-14">
            <div className="w-full max-w-lg">
              <div className="relative">
                {/* Glow ring behind card */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-primary/60 to-secondary opacity-40 blur-xl" />
                <Card className="relative border-2 border-primary/30 bg-card/90 backdrop-blur shadow-2xl">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                  <CardHeader className="text-center pt-8">
                    <CardTitle className="text-2xl">Psychometric Assessment</CardTitle>
                    <CardDescription>Complete personality and career analysis</CardDescription>
                    <div className="mt-4">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-xl sm:text-2xl font-bold text-muted-foreground line-through">{formatRupees(PSYCHOMETRIC_ORIGINAL_PRICE)}</span>
                        <span className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{formatRupees(PSYCHOMETRIC_PRICE)}</span>
                      </div>
                      <span className="text-muted-foreground">one-time payment · lifetime access</span>
                    </div>
                  </CardHeader>

                <CardContent className="space-y-6">
                  {/* Razorpay Checkout */}
                  <div className="bg-muted/30 p-6 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-primary mb-4 text-center text-lg">💳 Pay with Razorpay</h3>
                    {!user ? (
                      <Button onClick={() => navigate('/auth')} className="w-full" size="lg">
                        Sign In to Pay
                      </Button>
                    ) : (
                      <Button onClick={handlePay} disabled={paying} className="w-full" size="lg">
                        {paying ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                        ) : (
                          <>Pay {formatRupees(PSYCHOMETRIC_PRICE)} Securely</>
                        )}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      UPI · QR · Cards · Netbanking — verified server-side.
                    </p>
                  </div>

                  {/* Referral Code Section */}
                  <div className="bg-muted/30 p-6 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-primary mb-4 text-center text-lg flex items-center justify-center gap-2">
                      <Ticket className="w-5 h-5" />
                      Have a Referral Code?
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Enter your referral code to get free access — no payment needed!
                    </p>
                    <div className="space-y-3">
                      <Input
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="text-center font-mono text-lg tracking-wider"
                        maxLength={10}
                      />
                      <Button
                        onClick={handleRedeemCode}
                        disabled={redeemingCode || !referralCode.trim()}
                        className="w-full"
                        variant="outline"
                        size="lg"
                      >
                        {redeemingCode ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Verifying...
                          </div>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-2" />
                            Redeem Code
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Secure payment • Instant access
                  </p>
                </CardContent>
              </Card>
              </div>
            </div>
          </div>


          {/* Program Benefits */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Career Guidance Program?</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Scientific & Reliable
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Based on globally recognized psychometric tools with personalized reports and actionable roadmaps.</p>
                </CardContent>
              </Card>

              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Future-Ready Careers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Includes modern fields like AI, FinTech, Data Science, and Entrepreneurship for tomorrow's opportunities.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-primary/5 border border-border/50">
                <CardContent className="p-4 text-center">
                  <Lightbulb className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Clarity</h3>
                  <p className="text-sm text-muted-foreground">No more confusion about career decisions</p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border border-border/50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Confidence</h3>
                  <p className="text-sm text-muted-foreground">Make informed choices with scientific reports</p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border border-border/50">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Career Roadmap</h3>
                  <p className="text-sm text-muted-foreground">Know exactly what to do after Class 10/12</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Program Outcome */}
          <div className="mb-12">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Program Outcome</CardTitle>
                <CardDescription>By the end of this program, students will:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Identify their best-fit stream and careers</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Receive detailed personalized report with strengths</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Get clear action plan for higher studies</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Build job readiness and career alignment</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <div className="flex justify-center mt-8">
            <div className="w-full max-w-lg">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-center">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href="https://wa.me/918302304020"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800 dark:text-green-200">WhatsApp Support</p>
                      <p className="text-sm text-green-600 dark:text-green-300">+91 83023 04020</p>
                    </div>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PsychometricPayment;
