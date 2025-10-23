'use client';
import type {ReactNode} from "react"
import {  useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import handleAuthenticated from '../utils/handleAuthenticated';
import type { AuthenticatedUser } from '../types/auth.types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticatedUser = await handleAuthenticated();

      if (!authenticatedUser) {
        router('/signIn');
      } else {
        setUser(authenticatedUser);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
