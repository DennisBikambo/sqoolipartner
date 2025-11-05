import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { AuthenticatedUser, ConvexPartner, UseAuthReturn } from "../types/auth.types";
import handleAuthenticated from "../utils/handleAuthenticated";

export function useAuth(): UseAuthReturn {
  const [laravelUser, setLaravelUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncAttempted, setSyncAttempted] = useState(false);

  const updateLaravelUserId = useMutation(api.partner.updateLaravelUserId);

  // ✅ Step 1: Fetch Laravel-authenticated user
  useEffect(() => {
    const checkLaravelAuth = async () => {
      try {
        const authenticatedUser = await handleAuthenticated();
        if (!authenticatedUser) {
          setError("Not authenticated");
          setLaravelUser(null);
        } else {
          setLaravelUser(authenticatedUser);
        }
      } catch {
        setError("Authentication check failed");
      } finally {
        setLoading(false);
      }
    };

    checkLaravelAuth();
  }, []);

  // ✅ Step 2: Fetch matching Convex partner record
  const convexPartner = useQuery(
    api.partner.getByEmail,
    laravelUser?.email ? { email: laravelUser.email } : "skip"
  ) as ConvexPartner | undefined | null;

  // ✅ Step 3: Sync Laravel user ID into Convex if needed
  useEffect(() => {
    const syncLaravelIdIfNeeded = async () => {
      if (syncAttempted) return;
      if (!laravelUser || convexPartner === undefined || !convexPartner) return;

      if (convexPartner.laravelUserId === 0 && laravelUser.id !== 0) {
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
  }, [laravelUser, convexPartner, updateLaravelUserId, syncAttempted]);

  // ✅ Step 4: Derive `isFirstLogin` from Convex (source of truth)
  const isFirstLogin = convexPartner?.is_first_login ?? false;

  // ✅ Step 5: Handle loading & error states cleanly
  if (loading || convexPartner === undefined) {
    return {
      user: null,
      partner: null,
      loading: true,
      error: null,
      isFirstLogin: false,
    };
  }

  if (error && !laravelUser) {
    return {
      user: null,
      partner: null,
      loading: false,
      error,
      isFirstLogin: false,
    };
  }

  // ✅ Step 6: Return unified auth data
  return {
    user: laravelUser,
    partner: convexPartner,
    loading: false,
    error: null,
    isFirstLogin,
  };
}
