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

  // ✅ Step 1: Get Laravel user (from Laravel session)
  useEffect(() => {
    const checkLaravelAuth = async () => {
      try {
        const authenticatedUser = await handleAuthenticated();
        if (!authenticatedUser) {
          setError("Not authenticated");
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

  // ✅ Step 2: Check Convex partner using email (more reliable than Laravel ID when it's 0)
  const convexPartner = useQuery(
    api.partner.getByEmail,
    laravelUser?.email ? { email: laravelUser.email } : "skip"
  ) as ConvexPartner | undefined | null;

  // ✅ Step 3: If laravelUserId = 0 in Convex, update it with the real Laravel ID
  useEffect(() => {
    const syncLaravelIdIfNeeded = async () => {
      // Only attempt sync once per session
      if (syncAttempted) return;
      
      // Wait until we have both Laravel user and Convex partner
      if (!laravelUser || convexPartner === undefined) return;

      // If partner not found in Convex, nothing to update
      if (!convexPartner) return;

      // Check if laravelUserId needs updating
      if (convexPartner.laravelUserId === 0 && laravelUser.id !== 0) {
        console.log("🛠 Updating Convex laravelUserId from 0 to", laravelUser.id);

        try {
          await updateLaravelUserId({
            email: laravelUser.email,
            laravelUserId: laravelUser.id,
          });

          console.log("✅ Laravel user ID synced successfully");
          setSyncAttempted(true);
        } catch (err) {
          console.error("❌ Failed to sync Laravel user ID:", err);
          setError("Failed to sync user data");
        }
      }
    };

    syncLaravelIdIfNeeded();
  }, [laravelUser, convexPartner, updateLaravelUserId, syncAttempted]);

  // ✅ Step 4: Handle return states
  if (loading || convexPartner === undefined) {
    return { user: null, partner: null, loading: true, error: null };
  }

  if (error && !laravelUser) {
    return { user: null, partner: null, loading: false, error };
  }

  if (!convexPartner) {
    return {
      user: laravelUser,
      partner: null,
      loading: false,
      error: "Partner not found in Convex",
    };
  }

  return {
    user: laravelUser,
    partner: convexPartner,
    loading: false,
    error: null,
  };
}