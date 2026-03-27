import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

/**
 * Convex auth config — tells Convex how to validate JWTs issued by Better Auth.
 * Enables ctx.auth.getUserIdentity() in queries/mutations/actions.
 */
const authConfig = {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;

export default authConfig;
