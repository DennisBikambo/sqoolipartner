import { createClient } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins/two-factor";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";
import type { GenericCtx } from "@convex-dev/better-auth";
import authConfig from "./auth.config";

/**
 * Better Auth component client — wraps the betterAuth Convex component.
 * Provides adapter(), getAuth(), registerRoutes(), etc.
 */
export const authComponent = createClient<DataModel>(components.betterAuth);

/**
 * Auth factory — called per-request with the Convex ctx.
 * Returns a fully configured Better Auth instance backed by Convex.
 */
export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    appName: "Sqooli",
    baseURL: process.env.SITE_URL,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({ authConfig }),
      crossDomain({ siteUrl: process.env.SITE_URL ?? "http://localhost:5173" }),
      twoFactor({ issuer: "Sqooli" }),
    ],
  });

/**
 * getCurrentUser — bridges Better Auth identity to the app's users table.
 * Called by useAuth hook on the frontend after authentication.
 *
 * identity.subject is the Better Auth user ID stored as better_auth_id.
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const appUser = await ctx.db
      .query("users")
      .withIndex("by_better_auth_id", (q) =>
        q.eq("better_auth_id", identity.subject)
      )
      .unique();

    if (!appUser) return null;

    const partner = appUser.partner_id
      ? await ctx.db.get(appUser.partner_id)
      : null;

    return { user: appUser, partner };
  },
});
