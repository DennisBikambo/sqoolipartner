/**
 * Developer Account Setup
 *
 * Creates the developer monitoring account using DEV_EMAIL from Convex env vars.
 * The email is never hardcoded — it lives only in the environment.
 *
 * Run once via CLI:
 *   npx convex run createDevAccount:createDevAccount '{"password":"YourSecurePassword123!"}'
 *
 * To check if it was created:
 *   npx convex run createDevAccount:getDevAccount
 */

import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { createAuth } from "./auth";

/**
 * Server-side check — returns true/false only, never leaks the email to the client.
 * Used by DevMonitorSection to gate access without hardcoding anything.
 */
export const isDevUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return false;
    return identity.email === process.env.DEV_EMAIL;
  },
});

/**
 * Creates the developer account. Run once.
 */
export const createDevAccount = action({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const devEmail = process.env.DEV_EMAIL;
    if (!devEmail) throw new Error("DEV_EMAIL env var is not set in Convex dashboard.");

    // Check if already exists
    const existing = await ctx.runQuery(internal.createDevAccount.getDevUserByEmail, { email: devEmail });
    if (existing) {
      return { success: false, message: `Dev account already exists: ${devEmail}` };
    }

    // Get or create system partner (same one super admins use)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = internal as any;
    let systemPartner = await ctx.runQuery(self.createDevAccount.getSystemPartner, {});
    if (!systemPartner) {
      const systemPartnerId = await ctx.runMutation(self.createDevAccount.createSystemPartner, {});
      systemPartner = await ctx.runQuery(self.createDevAccount.getSystemPartnerById, { id: systemPartnerId });
    }
    if (!systemPartner) {
      throw new Error("Failed to create system partner.");
    }

    // Get all permissions
    const allPermissionIds = await ctx.runQuery(self.createDevAccount.getAllPermissionIds, {});

    // Register with Better Auth
    const auth = createAuth(ctx as unknown as Parameters<typeof createAuth>[0]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baResult = await (auth.api.signUpEmail as any)({
      body: { email: devEmail, password: args.password, name: "Developer" },
    });

    const better_auth_id: string = baResult?.user?.id ?? "";
    if (!better_auth_id) {
      throw new Error("Better Auth did not return a user ID. Check BETTER_AUTH_SECRET is set.");
    }

    // Insert into users table
    const userId = await ctx.runMutation(self.createDevAccount.insertDevUser, {
      email: devEmail,
      better_auth_id,
      partner_id: systemPartner._id,
      permission_ids: allPermissionIds,
    });

    return {
      success: true,
      message: `Developer account created. Sign in with the email set in DEV_EMAIL env var.`,
      userId,
    };
  },
});

/**
 * Check what developer account exists (safe — never returns the email, just status).
 */
export const getDevAccount = query({
  args: {},
  handler: async (ctx) => {
    const devEmail = process.env.DEV_EMAIL;
    if (!devEmail) return { configured: false };

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", devEmail))
      .unique();

    return {
      configured: true,
      exists: !!user,
      has_better_auth: !!user?.better_auth_id,
    };
  },
});

// ── Internal helpers ──────────────────────────────────────────────────────────

export const getDevUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", args.email))
      .unique();
  },
});

export const getSystemPartner = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("partners")
      .filter(q => q.eq(q.field("name"), "System"))
      .first();
  },
});

export const getAllPermissionIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const perms = await ctx.db.query("permissions").collect();
    return perms.map(p => p._id);
  },
});

export const createSystemPartner = internalMutation({
  args: {},
  handler: async (ctx) => {
    return ctx.db.insert("partners", {
      name: "System",
      email: "system@sqooli.com",
      phone: "",
      is_first_login: false,
      username: "system",
      permission_ids: [],
    });
  },
});

export const getSystemPartnerById = internalQuery({
  args: { id: v.id("partners") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const insertDevUser = internalMutation({
  args: {
    email: v.string(),
    better_auth_id: v.string(),
    partner_id: v.id("partners"),
    permission_ids: v.array(v.id("permissions")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("users", {
      partner_id: args.partner_id,
      email: args.email,
      better_auth_id: args.better_auth_id,
      name: "Developer",
      role: "super_admin",
      permission_ids: args.permission_ids,
      is_active: true,
      is_first_login: false,
      is_account_activated: true,
    });
  },
});
