import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { 
  AuthenticatedUser, 
  ConvexPartner, 
  ConvexUser, 
  UseAuthReturn 
} from "../types/auth.types";
import handleAuthenticated from "../utils/handleAuthenticated";

// Helper to get session cookie
function getSessionCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function useAuth(): UseAuthReturn {
  const [laravelUser, setLaravelUser] = useState<AuthenticatedUser | null>(null);
  const [convexSessionToken, setConvexSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const [convexUser, setConvexUser] = useState<ConvexUser | null>(null);
  const [sessionValidated, setSessionValidated] = useState(false);

  const updateLaravelUserId = useMutation(api.partner.updateLaravelUserId);

  // ✅ Step 1: Check which auth method is active
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for Convex session cookie first
        const sessionToken = getSessionCookie('convex_session');
        
        if (sessionToken) {
          // User logged in via Convex - don't set loading false yet
          setConvexSessionToken(sessionToken);
        } else {
          // Try Laravel authentication
          const authenticatedUser = await handleAuthenticated();
          if (!authenticatedUser) {
            setError("Not authenticated");
            setLaravelUser(null);
          } else {
            setLaravelUser(authenticatedUser);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Authentication check failed");
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ✅ Step 2: Validate Convex session if token exists
  const validateSessionMutation = useMutation(api.session.validateSession);

  useEffect(() => {
    const validateConvexSession = async () => {
      if (!convexSessionToken || sessionValidated) return;

      try {
        const sessionData = await validateSessionMutation({ token: convexSessionToken });
        
        if (!sessionData || !sessionData.user) {
          // Session invalid or expired
          document.cookie = 'convex_session=; path=/; max-age=0'; // Clear cookie
          setConvexSessionToken(null);
          setConvexUser(null);
          setError("Session expired");
        } else {
          setConvexUser(sessionData.user as ConvexUser);
        }
      } catch (err) {
        console.error("Session validation error:", err);
        document.cookie = 'convex_session=; path=/; max-age=0';
        setConvexSessionToken(null);
        setConvexUser(null);
        setError("Session validation failed");
      } finally {
        // Mark validation complete and stop loading
        setSessionValidated(true);
        setLoading(false);
      }
    };

    validateConvexSession();
  }, [convexSessionToken, sessionValidated, validateSessionMutation]);

  // ✅ Step 3: Fetch Convex partner
  // - For Laravel users: fetch by email
  // - For Convex users: fetch by partner_id
  const convexPartnerForLaravel = useQuery(
    api.partner.getByEmail,
    laravelUser?.email ? { email: laravelUser.email } : "skip"
  ) as ConvexPartner | undefined | null;

  const convexPartnerForConvexUser = useQuery(
    api.partner.getById,
    convexUser?.partner_id ? { partner_id: convexUser.partner_id } : "skip"
  ) as ConvexPartner | undefined | null;

  // ✅ Step 4: Sync Laravel user ID into Convex if needed (Laravel users only)
  useEffect(() => {
    const syncLaravelIdIfNeeded = async () => {
      if (syncAttempted) return;
      if (!laravelUser || convexPartnerForLaravel === undefined || !convexPartnerForLaravel) return;

      if (convexPartnerForLaravel.laravelUserId === 0 && laravelUser.id !== 0) {
        try {
          await updateLaravelUserId({
            email: laravelUser.email,
            laravelUserId: laravelUser.id,
          });
          setSyncAttempted(true);
        } catch (err) {
          console.error("❌ Failed to sync Laravel user ID:", err);
          setError("Failed to sync user data");
        }
      }
    };

    syncLaravelIdIfNeeded();
  }, [laravelUser, convexPartnerForLaravel, updateLaravelUserId, syncAttempted]);

  // ✅ Step 5: Handle loading states
  if (loading) {
    return {
      user: null,
      partner: null,
      loading: true,
      error: null,
      isFirstLogin: false,
      loginMethod: null,
    };
  }

  // If waiting for partner data to load for Laravel user
  if (laravelUser && convexPartnerForLaravel === undefined) {
    return {
      user: null,
      partner: null,
      loading: true,
      error: null,
      isFirstLogin: false,
      loginMethod: 'laravel',
    };
  }

  // If waiting for partner data to load for Convex user
  if (convexUser && convexPartnerForConvexUser === undefined) {
    return {
      user: null,
      partner: null,
      loading: true,
      error: null,
      isFirstLogin: false,
      loginMethod: 'convex',
    };
  }


  if (convexUser) {
    return {
      user: convexUser,
      partner: convexPartnerForConvexUser || null, 
      loading: false,
      error: null,
      isFirstLogin: convexUser.is_first_login ?? false,
      loginMethod: 'convex',
    };
  }

  if (laravelUser) {
    return {
      user: laravelUser, 
      partner: convexPartnerForLaravel || null,
      loading: false,
      error: null,
      isFirstLogin: convexPartnerForLaravel?.is_first_login ?? false,
      loginMethod: 'laravel',
    };
  }

  // NOT AUTHENTICATED
  return {
    user: null,
    partner: null,
    loading: false,
    error: error || "Not authenticated",
    isFirstLogin: false,
    loginMethod: null,
  };
}