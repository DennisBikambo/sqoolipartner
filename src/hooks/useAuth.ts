import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "../lib/auth-client";
import type { ConvexPartner, ConvexUser, UseAuthReturn } from "../types/auth.types";

/**
 * useAuth — primary auth hook.
 *
 * Uses Better Auth's useSession() for the authenticated session, then
 * fetches the app-level user + partner from the Convex `users` table
 * via getCurrentUser (bridged by better_auth_id).
 *
 * Returns the same shape as before so all existing consumers work unchanged.
 */
export function useAuth(): UseAuthReturn {
  const { data: session, isPending } = authClient.useSession();

  // Only run the Convex query when Better Auth has confirmed a session
  const appData = useQuery(
    api.auth.getCurrentUser,
    session ? undefined : "skip"
  );

  // Loading: Better Auth is resolving, or session exists but Convex query is in-flight
  const loading = isPending || (!!session && appData === undefined);

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

  if (!session || !appData?.user) {
    return {
      user: null,
      partner: null,
      loading: false,
      error: "Not authenticated",
      isFirstLogin: false,
      loginMethod: null,
    };
  }

  return {
    user: appData.user as ConvexUser,
    partner: (appData.partner as ConvexPartner) ?? null,
    loading: false,
    error: null,
    isFirstLogin: appData.user.is_first_login ?? false,
    loginMethod: "convex",
  };
}
