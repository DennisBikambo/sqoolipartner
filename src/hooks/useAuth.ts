import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { AuthenticatedUser } from "../types/auth.types";
import handleAuthenticated from "../utils/handleAuthenticated";

export function useAuth() {
  const [laravelUser, setLaravelUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step 1️⃣: Fetch Laravel-authenticated user
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

  // Step 2️⃣: Use the Laravel user's ID to query Convex
  const convexAuth = useQuery(
    api.partner.authenticateUser,
    laravelUser?.id ? { laravelUserId: laravelUser.id } : "skip"
  );


  // Step 3️⃣: Handle Convex states
  if (loading || convexAuth === undefined) {
    return { user: null, partner: null, loading: true, error: null };
  }

  if (error) {
    return { user: null, partner: null, loading: false, error };
  }

  if (!convexAuth?.authenticated) {
    return { user: laravelUser, partner: null, loading: false, error: "Partner not found in Convex" };
  }
  

  return {
    user: convexAuth.partner,       
    loading: false,
    error: null,
  };
}
