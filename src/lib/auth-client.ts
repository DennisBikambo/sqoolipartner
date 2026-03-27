import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";

/**
 * Better Auth browser client.
 *
 * baseURL points to the Convex HTTP deployment (where Better Auth routes are mounted).
 * Falls back to VITE_CONVEX_URL as the site URL for local dev.
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL as string,
  plugins: [
    convexClient(),
    crossDomainClient(),
    twoFactorClient(),
  ],
});
