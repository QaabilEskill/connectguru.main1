import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ArrowLeft, Brain, ShieldCheck, Loader2, Lock } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AttemptStatus = {
  attempts_used: number;
  attempts_allowed: number;
  attempts_remaining: number;
  locked: boolean;
  last_attempt_at: string | null;
};

const PsychometricTestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [status, setStatus] = useState<AttemptStatus | null>(null);
  const [marking, setMarking] = useState(false);
  const iframeWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Psychometric Career Test | ConnectGuru';
  }, []);

  const refreshStatus = async (uid: string) => {
    const { data } = await supabase.rpc('get_psychometric_attempt_status', { p_user_id: uid });
    if (data) setStatus(data as unknown as AttemptStatus);
  };

  useEffect(() => {
    const checkAccess = async () => {
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
        setHasAccess(data?.test_access_activated || false);
        await refreshStatus(user.id);
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAccess();
  }, [user]);

  // Anti-tamper: disable right-click, copy & devtools shortcuts only on this page
  useEffect(() => {
    if (!testStarted) return;
    const blockContext = (e: MouseEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||
        (e.ctrlKey && ['u', 's'].includes(k))
      ) {
        e.preventDefault();
      }
    };
    const blockCopy = (e: ClipboardEvent) => e.preventDefault();
    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('keydown', blockKeys);
    document.addEventListener('copy', blockCopy);
    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('copy', blockCopy);
    };
  }, [testStarted]);

  // Countdown timer
  useEffect(() => {
    if (!testStarted || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [testStarted, secondsLeft]);

  const handleLaunchTest = async () => {
    if (!user) return;
    if (status?.locked) {
      toast({
        title: 'Maximum Attempt Limit Reached',
        description: 'You have already completed the maximum allowed number of attempts (2).',
        variant: 'destructive',
      });
      return;
    }
    setLaunching(true);
    try {
      const { data: genData, error: genErr } = await supabase.rpc(
        'generate_test_access_token',
        { p_user_id: user.id }
      );
      if (genErr) throw genErr;
      const gen = genData as { success: boolean; token?: string; error?: string; locked?: boolean };
      if (!gen?.success || !gen.token) {
        if (gen?.locked) {
          await refreshStatus(user.id);
          toast({
            title: 'Maximum Attempt Limit Reached',
            description: 'You have already completed the maximum allowed number of attempts (2).',
            variant: 'destructive',
          });
          return;
        }
        throw new Error(gen?.error || 'Could not generate access token');
      }

      const { data: consumeData, error: consumeErr } = await supabase.rpc(
        'consume_test_access_token',
        { p_token: gen.token, p_user_id: user.id }
      );
      if (consumeErr) throw consumeErr;
      const consumed = consumeData as { success: boolean; error?: string; locked?: boolean };
      if (!consumed?.success) {
        if (consumed?.locked) {
          await refreshStatus(user.id);
          toast({
            title: 'Maximum Attempt Limit Reached',
            description: 'You have already completed the maximum allowed number of attempts (2).',
            variant: 'destructive',
          });
          return;
        }
        throw new Error(consumed?.error || 'Token validation failed');
      }

      // The attempt is now recorded server-side. Refresh status and open the test.
      await refreshStatus(user.id);
      setSecondsLeft(15 * 60);
      setTestStarted(true);
    } catch (err: any) {
      toast({
        title: 'Unable to start test',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLaunching(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!user) return;
    setMarking(true);
    try {
      await refreshStatus(user.id);
      toast({
        title: 'Attempt saved',
        description: 'Your attempt has been recorded.',
      });
      setTestStarted(false);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to take the psychometric test.
            </p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Access Required</h2>
              <p className="text-muted-foreground mb-6">
                You need to complete payment or use a referral code to access the test.
              </p>
              <Button onClick={() => navigate('/test-access')} size="lg">
                Get Access Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status?.locked) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <Card className="border-2 border-destructive/30">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                  <Lock className="w-12 h-12 text-destructive" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Maximum Attempt Limit Reached</h2>
              <p className="text-muted-foreground mb-2">
                You have already completed the maximum allowed number of attempts (2).
              </p>
              <p className="text-muted-foreground mb-6">
                If you believe this is a mistake, please contact support.
              </p>
              <div className="inline-block bg-muted/40 rounded-lg px-4 py-3 text-sm">
                <div><strong>Attempts Used:</strong> {status.attempts_used} / {status.attempts_allowed}</div>
                <div><strong>Status:</strong> Locked</div>
                {status.last_attempt_at && (
                  <div><strong>Last Attempt:</strong> {new Date(status.last_attempt_at).toLocaleString()}</div>
                )}
              </div>
              <div className="mt-6">
                <a
                  href="https://wa.me/918302304020"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 font-medium hover:underline"
                >
                  Need Help? WhatsApp: +91 83023 04020
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Secure test view
  if (testStarted) {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return (
      <div className="min-h-screen bg-background select-none">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Secure session
            </div>
            <div className="text-sm font-mono">
              Time left: {mins}:{secs.toString().padStart(2, '0')}
            </div>
          </div>
          <div
            ref={iframeWrapperRef}
            className="relative w-full rounded-lg overflow-hidden border-2 border-primary/20 bg-card"
            style={{ height: '80vh' }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <iframe
              src="https://forms.office.com/r/aNdj3CXVJX"
              title="Psychometric Test"
              className="w-full h-full border-0"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              referrerPolicy="no-referrer"
            />
            {/* Overlay to discourage drag/inspect on iframe chrome */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            This session is private to your account and will expire automatically.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <Button
              onClick={handleMarkCompleted}
              disabled={marking}
              size="lg"
              variant="default"
            >
              {marking ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving attempt...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  I have submitted the test
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Click after you submit the form to close this session. This attempt has already been counted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <Brain className="w-12 h-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">
              🧠 Psychometric Career Test
            </CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto">
              Your access is activated! Click the button below to start your secure test session.
            </CardDescription>
            {status && (
              <div className="mt-3 inline-flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Attempts Used: <strong className="text-foreground">{status.attempts_used} / {status.attempts_allowed}</strong>
                <span>·</span>
                <span>Remaining: <strong className="text-foreground">{status.attempts_remaining}</strong></span>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Access Activated ✅</h3>
              <p className="text-muted-foreground mb-4">
                Click the button below to start your secure 15-minute session.
              </p>
              <Button
                onClick={handleLaunchTest}
                disabled={launching}
                size="lg"
                className="font-semibold"
              >
                {launching ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Preparing secure session...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Start Psychometric Test
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Secure one-time access · session expires in 15 minutes
              </p>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
              <h4 className="font-semibold mb-2">📋 Instructions:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Answer all questions honestly for accurate results</li>
                <li>• The test takes approximately 15-20 minutes</li>
                <li>• Ensure a quiet environment for best results</li>
                <li>• Your responses are confidential and secure</li>
                <li>• Do not refresh or close the page during the test</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Card>
            <CardContent className="p-4">
              <a
                href="https://wa.me/918302304020"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <span className="text-green-600 font-medium">Need Help? WhatsApp: +91 83023 04020</span>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PsychometricTestPage;
