import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any; data?: any }>;
  signUp: (email: string, password: string, userData: { full_name: string; phone_number?: string; user_type?: string; education_level?: string; semester?: string; other_details?: string; wants_psychometric_test?: boolean }) => Promise<{ error: any }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  loading: boolean;
  userProfile: any;
  subscriptionData: any;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

type AuthProxyAction = 'signin' | 'signup';

type AuthProxyPayload = {
  action: AuthProxyAction;
  email: string;
  password: string;
  options?: {
    emailRedirectTo?: string;
    data?: Record<string, unknown>;
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isFailedFetchError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.toLowerCase().includes('failed to fetch');
};

const clearStoredAuthState = () => {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
      .forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Unable to clear stored auth state:', error);
  }
};

const createAuthError = (message: string, status = 400) => new AuthError(message, status);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const showSignInErrorToast = (message: string) => {
    let errorTitle = 'Login Failed';
    let errorMessage = message;

    if (message.includes('Email not confirmed')) {
      errorTitle = 'Email Not Verified';
      errorMessage = "Please check your email and click the verification link before signing in. Check your spam folder if you don't see it.";
    } else if (message.includes('Invalid login credentials')) {
      errorTitle = 'Invalid Credentials';
      errorMessage = 'Please check your email and password and try again.';
    }

    toast({
      title: errorTitle,
      description: errorMessage,
      variant: 'destructive',
      duration: 8000,
    });
  };

  const showSignUpErrorToast = (message: string) => {
    let errorTitle = 'Registration Failed';
    let errorMessage = message;

    if (message.includes('email rate limit exceeded') || message.includes('rate limit')) {
      errorTitle = 'Too Many Attempts';
      errorMessage = "Please wait a few minutes before trying again. You've reached the email limit.";
    } else if (message.includes('Error sending confirmation email') || message.includes('SMTP') || message.includes('BadCredentials')) {
      errorTitle = 'Email Service Issue';
      errorMessage = 'There\'s a temporary issue with our email service. Please try again in a few minutes or contact support.';
    } else if (message.includes('User already registered')) {
      errorTitle = 'Account Already Exists';
      errorMessage = 'An account with this email already exists. Please try logging in instead.';
    } else if (message.includes('Password should be at least')) {
      errorTitle = 'Password Too Short';
      errorMessage = 'Password must be at least 6 characters long.';
    } else if (message.includes('Invalid email')) {
      errorTitle = 'Invalid Email';
      errorMessage = 'Please enter a valid email address.';
    } else if (message.includes('Database error') || message.includes('trigger') || message.includes('constraint')) {
      toast({
        title: '🎉 Registration Successful!',
        description: 'Welcome to ConnectGuru! Please check your email to verify your account.',
        className: 'border-green-500 bg-green-50 text-green-800 shadow-lg ring-2 ring-green-200',
        duration: 8000,
      });
      return;
    }

    toast({
      title: errorTitle,
      description: errorMessage,
      variant: 'destructive',
      duration: 8000,
    });
  };

  const setSessionFromProxyResponse = async (proxyData: any) => {
    const proxySession = proxyData?.session;

    if (!proxySession?.access_token || !proxySession?.refresh_token) {
      return;
    }

    const { error } = await supabase.auth.setSession({
      access_token: proxySession.access_token,
      refresh_token: proxySession.refresh_token,
    });

    if (error) {
      throw error;
    }
  };

  const invokeAuthProxy = async (payload: AuthProxyPayload) => {
    const { data, error } = await supabase.functions.invoke('auth-proxy', {
      body: payload,
    });

    if (error) {
      throw error;
    }

    if (data?.error) {
      throw createAuthError(data.error, data.status ?? 400);
    }

    return data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change:', event, currentSession);

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setSubscriptionData(null);
          setLoading(false);
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
            checkSubscriptionStatus();
          }, 0);
        } else {
          setUserProfile(null);
          setSubscriptionData(null);
        }

        setLoading(false);
      }
    );

    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
            clearStoredAuthState();
            setSession(null);
            setUser(null);
            setUserProfile(null);
            setSubscriptionData(null);
          }
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            fetchUserProfile(currentSession.user.id);
            checkSubscriptionStatus();
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (isFailedFetchError(error)) {
          clearStoredAuthState();
        }
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setSubscriptionData(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Profile fetch result:', { data, error });

      const { data: subscriberByUser } = await supabase
        .from('subscribers')
        .select('psychometric_result_paid, subscribed, subscription_tier, psychometric_tests_allowed, psychometric_tests_used, college_dashboard_access, psychometric_test_completed')
        .eq('user_id', userId)
        .maybeSingle();

      let subscriberData = subscriberByUser;
      if (!subscriberData) {
        const { data: currentUser } = await supabase.auth.getUser();
        const userEmail = currentUser?.user?.email || null;
        if (userEmail) {
          const { data: subscriberByEmail } = await supabase
            .from('subscribers')
            .select('psychometric_result_paid, subscribed, subscription_tier, psychometric_tests_allowed, psychometric_tests_used, college_dashboard_access, psychometric_test_completed')
            .eq('email', userEmail)
            .maybeSingle();
          subscriberData = subscriberByEmail || null;
        }
      }

      if (!data && !error) {
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser?.user) {
          console.error('No authenticated user found when creating profile');
          return;
        }

        const userType = currentUser.user.user_metadata?.user_type || 'student';
        const educationLevel = currentUser.user.user_metadata?.education_level || null;
        const semester = currentUser.user.user_metadata?.semester || null;

        console.log('Creating profile with metadata:', {
          userType,
          educationLevel,
          semester,
          metadata: currentUser.user.user_metadata,
        });

        const meta = currentUser.user.user_metadata || {};
        const providerName =
          (currentUser.user.app_metadata as any)?.provider ||
          (currentUser.user.identities && currentUser.user.identities[0]?.provider) ||
          'email';
        const googleAvatar = meta.avatar_url || meta.picture || null;
        const googleFullName = meta.full_name || meta.name || currentUser.user.email?.split('@')[0] || 'Learner';

        const newProfile: any = {
          user_id: userId,
          email: currentUser.user.email || null,
          full_name: meta.full_name || googleFullName,
          user_type: userType,
          education_level: educationLevel,
          semester,
          other_details: meta.other_details || null,
          phone_number: meta.phone_number || null,
          detailed_info: {
            avatar_url: googleAvatar,
            provider: providerName,
          },
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('*')
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          setUserProfile(null);
          return;
        }

        const enhancedProfile = {
          ...inserted,
          psychometric_result_paid: subscriberData?.psychometric_result_paid || false,
          college_dashboard_access: subscriberData?.college_dashboard_access || false,
          psychometric_test_completed: subscriberData?.psychometric_test_completed || false,
          has_paid_access: subscriberData?.subscribed || false,
        };

        setUserProfile(enhancedProfile);
        return;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        setUserProfile(null);
        return;
      }

      const enhancedProfile = {
        ...data,
        psychometric_result_paid: subscriberData?.psychometric_result_paid || false,
        college_dashboard_access: subscriberData?.college_dashboard_access || false,
        psychometric_test_completed: subscriberData?.psychometric_test_completed || false,
        has_paid_access: subscriberData?.subscribed || false,
      };

      setUserProfile(enhancedProfile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUserProfile(null);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      setSubscriptionData(data);

      if (user) {
        await fetchUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error in checkSubscriptionStatus:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
      await checkSubscriptionStatus();
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (!error) {
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        });
        return { error, data };
      }

      showSignInErrorToast(error.message);
      return { error, data };
    } catch (error) {
      if (!isFailedFetchError(error)) {
        showSignInErrorToast(error instanceof Error ? error.message : 'An unexpected error occurred.');
        return { error };
      }

      try {
        clearStoredAuthState();
        const proxyData = await invokeAuthProxy({ action: 'signin', email, password });
        await setSessionFromProxyResponse(proxyData);

        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        });

        return { error: null, data: proxyData };
      } catch (proxyError) {
        showSignInErrorToast(proxyError instanceof Error ? proxyError.message : 'Failed to sign in.');
        return { error: proxyError };
      }
    }
  };

  const signUp = async (email: string, password: string, userData: { full_name: string; phone_number?: string; user_type?: string; education_level?: string; semester?: string; other_details?: string; wants_psychometric_test?: boolean }) => {
    const redirectUrl = `${window.location.origin}/auth?verified=true&user_type=${userData.user_type}&education_level=${userData.education_level}`;
    const authPayload = {
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          user_type: userData.user_type || 'student',
          education_level: userData.education_level,
          semester: userData.semester,
          other_details: userData.other_details,
          wants_psychometric_test: userData.wants_psychometric_test,
        },
      },
    };

    try {
      const { error } = await supabase.auth.signUp(authPayload);

      if (!error) {
        toast({
          title: '🎉 Registration Successful!',
          description: 'Welcome to ConnectGuru! You can now start using the platform immediately.',
          className: 'border-green-500 bg-green-50 text-green-800 shadow-lg ring-2 ring-green-200',
          duration: 8000,
        });
        return { error };
      }

      showSignUpErrorToast(error.message);
      if (error.message.includes('Database error') || error.message.includes('trigger') || error.message.includes('constraint')) {
        return { error: null };
      }
      return { error };
    } catch (error) {
      if (!isFailedFetchError(error)) {
        showSignUpErrorToast(error instanceof Error ? error.message : 'An unexpected error occurred.');
        return { error };
      }

      try {
        const proxyData = await invokeAuthProxy({ action: 'signup', ...authPayload });
        await setSessionFromProxyResponse(proxyData);

        toast({
          title: '🎉 Registration Successful!',
          description: proxyData?.session
            ? 'Welcome to ConnectGuru! Your account is ready to use.'
            : 'Welcome to ConnectGuru! Please check your email to verify your account.',
          className: 'border-green-500 bg-green-50 text-green-800 shadow-lg ring-2 ring-green-200',
          duration: 8000,
        });

        return { error: null };
      } catch (proxyError) {
        const message = proxyError instanceof Error ? proxyError.message : 'An unexpected error occurred. Please try again.';
        showSignUpErrorToast(message);
        if (message.includes('Database error') || message.includes('trigger') || message.includes('constraint')) {
          return { error: null };
        }
        return { error: proxyError };
      }
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        toast({
          title: 'Reset Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reset Email Sent',
          description: 'Please check your email for password reset instructions.',
        });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async (redirectPath: string = '/dashboard') => {
    try {
      const redirectTo = `${window.location.origin}/auth?google=1&redirect=${encodeURIComponent(redirectPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) {
        toast({
          title: 'Google Sign-in Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
      return { error };
    } catch (error: any) {
      toast({
        title: 'Google Sign-in Failed',
        description: error?.message || 'Unable to start Google sign-in.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);

      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    loading,
    userProfile,
    subscriptionData,
    refreshProfile,
    checkSubscription: checkSubscriptionStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};