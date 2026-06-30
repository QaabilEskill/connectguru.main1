import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type AccessKind = 'test' | 'course';

interface RequireAccessProps {
  kind: AccessKind;
  children: React.ReactNode;
}

/**
 * Backend-validated route guard. Reads the latest access flags
 * directly from `subscribers` (RLS-protected, user can only read own row)
 * — never trusts client state alone.
 *
 * - kind="test"   → requires subscribers.test_access_activated = true
 * - kind="course" → requires subscribers.college_dashboard_access = true
 *                   OR profiles.has_paid_access = true
 *
 * Unauthenticated → /auth
 * Not authorized  → /test-access
 */
const RequireAccess: React.FC<RequireAccessProps> = ({ kind, children }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (authLoading) return;
      if (!user) {
        if (!cancelled) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }
      try {
        if (kind === 'test') {
          const { data } = await supabase
            .from('subscribers')
            .select('test_access_activated')
            .eq('user_id', user.id)
            .maybeSingle();
          if (!cancelled) setAllowed(!!data?.test_access_activated);
        } else {
          const [{ data: sub }, { data: prof }] = await Promise.all([
            supabase
              .from('subscribers')
              .select('college_dashboard_access, subscribed')
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('profiles')
              .select('has_paid_access')
              .eq('user_id', user.id)
              .maybeSingle(),
          ]);
          const ok =
            !!sub?.college_dashboard_access ||
            !!prof?.has_paid_access ||
            !!sub?.subscribed;
          if (!cancelled) setAllowed(ok);
        }
      } catch (err) {
        console.error('RequireAccess verify error:', err);
        if (!cancelled) setAllowed(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, kind, location.pathname]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!allowed) {
    return <Navigate to="/test-access" replace />;
  }

  return <>{children}</>;
};

export default RequireAccess;
