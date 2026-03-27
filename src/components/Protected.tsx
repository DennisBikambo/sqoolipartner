import type { ReactNode, ReactElement } from "react";
import { useEffect } from 'react';
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

  useEffect(() => {
    if (!loading) {
      // 1️⃣ Not logged in
      if (!user) {
        navigate('/signIn');
        return;
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