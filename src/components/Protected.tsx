import type { ReactNode, ReactElement } from "react";
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isConvexUser } from '../types/auth.types';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement | null {
  const { user, loading, isFirstLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading) {
      // 1️⃣ Not logged in — debounce the redirect to tolerate transient null
      //    sessions during 2FA session recreation (old session deleted, new created).
      if (!user) {
        if (redirectTimerRef.current) return; // timer already pending
        redirectTimerRef.current = setTimeout(() => {
          redirectTimerRef.current = null;
          navigate('/signIn');
        }, 800);
        return;
      }
      // User is back — cancel any pending redirect
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }

      const isPartnerAdmin = user && isConvexUser(user) && user.role === 'partner_admin';

      // 2️⃣ Partner admins on first login go through onboarding
      if (isFirstLogin && isPartnerAdmin && location.pathname !== '/onboarding') {
        navigate('/onboarding');
        return;
      }

      // 3️⃣ Non-partner-admin first-logins skip onboarding entirely
      if (isFirstLogin && !isPartnerAdmin && location.pathname === '/onboarding') {
        navigate('/dashboard');
        return;
      }

      // 4️⃣ Completed onboarding should not revisit onboarding
      if (!isFirstLogin && location.pathname === '/onboarding') {
        navigate('/dashboard');
        return;
      }
    }
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [user, loading, isFirstLogin, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}