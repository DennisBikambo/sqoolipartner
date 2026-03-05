import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type {
  ConvexPartner,
  ConvexUser,
  UseAuthReturn
} from "../types/auth.types";

function getSessionCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function useAuth(): UseAuthReturn {
  const [convexSessionToken, setConvexSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convexUser, setConvexUser] = useState<ConvexUser | null>(null);
  const [sessionValidated, setSessionValidated] = useState(false);

  const validateSessionMutation = useMutation(api.session.validateSession);

  useEffect(() => {
    const token = getSessionCookie('convex_session');
    if (token) {
      setConvexSessionToken(token);
    } else {
      setError("Not authenticated");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const validateConvexSession = async () => {
      if (!convexSessionToken || sessionValidated) return;

      try {
        const sessionData = await validateSessionMutation({ token: convexSessionToken });
        if (!sessionData || !sessionData.user) {
          document.cookie = 'convex_session=; path=/; max-age=0';
          setConvexSessionToken(null);
          setConvexUser(null);
          setError("Session expired");
        } else {
          setConvexUser(sessionData.user as ConvexUser);
        }
      } catch {
        document.cookie = 'convex_session=; path=/; max-age=0';
        setConvexSessionToken(null);
        setConvexUser(null);
        setError("Session validation failed");
      } finally {
        setSessionValidated(true);
        setLoading(false);
      }
    };

    validateConvexSession();
  }, [convexSessionToken, sessionValidated, validateSessionMutation]);

  const convexPartner = useQuery(
    api.partner.getById,
    convexUser?.partner_id ? { partner_id: convexUser.partner_id } : "skip"
  ) as ConvexPartner | undefined | null;

  if (loading) {
    return { user: null, partner: null, loading: true, error: null, isFirstLogin: false, loginMethod: null };
  }

  if (convexUser && convexPartner === undefined) {
    return { user: null, partner: null, loading: true, error: null, isFirstLogin: false, loginMethod: 'convex' };
  }

  if (convexUser) {
    return {
      user: convexUser,
      partner: convexPartner || null,
      loading: false,
      error: null,
      isFirstLogin: convexUser.is_first_login ?? false,
      loginMethod: 'convex',
    };
  }

  return { user: null, partner: null, loading: false, error: error || "Not authenticated", isFirstLogin: false, loginMethod: null };
}
