/**
 * Create a Super Admin User
 *
 * This mutation creates a new super admin user with full system access.
 * Super admins don't need to be associated with a partner.
 *
 * Run this via Convex dashboard or CLI:
 *   npx convex run createSuperAdmin:createSuperAdminUser \
 *     '{"email":"admin@sqooli.com","name":"Super Admin","password":"YourSecurePassword123!"}'
 */

import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { internal as _internal } from "./_generated/api";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internal = _internal as any;
import { createAuth } from "./auth";

/**
 * Create a Super Admin User
 */
export const createSuperAdminUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error(`User with email ${args.email} already exists`);
    }

    // Get or create a system partner for super admins
    let systemPartner = await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("name"), "System"))
      .first();

    if (!systemPartner) {
      // Create a system partner if it doesn't exist
      const systemPartnerId = await ctx.db.insert("partners", {
        name: "System",
        email: "system@sqooli.com",
        phone: "",
        is_first_login: false,
        username: "system",
        permission_ids: [],
      });
      systemPartner = await ctx.db.get(systemPartnerId);
    }

    if (!systemPartner) {
      throw new Error("Failed to create or retrieve system partner");
    }

    // Get all permissions
    const allPermissions = await ctx.db.query("permissions").collect();
    const allPermissionIds = allPermissions.map((p) => p._id);

    // Hash password
    const password_hash = bcrypt.hashSync(args.password, 10);

    // Create the super admin user
    const userId = await ctx.db.insert("users", {
      partner_id: systemPartner._id,
      email: args.email,
      password_hash,
      name: args.name,
      phone: args.phone,
      role: "super_admin",
      permission_ids: allPermissionIds,
      is_active: true,
      is_first_login: true,
      is_account_activated: true,
      last_login: undefined,
      updated_at: undefined,
    });

    return {
      success: true,
      message: "Super Admin user created successfully",
      user: {
        id: userId,
        email: args.email,
        name: args.name,
        role: "super_admin",
        permissions_count: allPermissionIds.length,
      },
      credentials: {
        email: args.email,
        extension: systemPartner.username,
      },
    };
  },
});

/**
 * List all super admin users
 */
export const listSuperAdmins = query({
  args: {},
  handler: async (ctx) => {
    const superAdmins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "super_admin"))
      .collect();

    return superAdmins.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      extension: u.extension,
      is_active: u.is_active,
      is_account_activated: u.is_account_activated,
      last_login: u.last_login,
      permissions_count: u.permission_ids.length,
    }));
  },
});

/**
 * Reset super admin password
 */
export const resetSuperAdminPassword = mutation({
  args: {
    email: v.string(),
    new_password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error(`User not found with email: ${args.email}`);
    }

    if (user.role !== "super_admin") {
      throw new Error("User is not a super admin");
    }

    const password_hash = bcrypt.hashSync(args.new_password, 10);

    await ctx.db.patch(user._id, {
      password_hash,
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Password reset successfully for ${args.email}`,
      credentials: {
        email: args.email,
        extension: user.extension,
      },
    };
  },
});

// ── Internal helpers for migration ────────────────────────────────────────────

export const getSuperAdminByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const linkBetterAuthId = internalMutation({
  args: { userId: v.id("users"), better_auth_id: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { better_auth_id: args.better_auth_id });
  },
});

/**
 * Migrate an existing user to Better Auth.
 * Run via CLI:
 *   npx convex run createSuperAdmin:migrateToBetterAuth \
 *     '{"email":"admin@example.com","password":"NewPassword123!"}'
 */
export const migrateToBetterAuth = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.runQuery(
      internal.createSuperAdmin.getSuperAdminByEmail,
      { email: args.email }
    );

    if (!existingUser) {
      throw new Error(`No user found with email: ${args.email}`);
    }

    if (existingUser.better_auth_id) {
      return { success: true, message: "User already has a Better Auth account — no migration needed." };
    }

    const auth = createAuth(ctx as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baResult = await (auth.api.signUpEmail as any)({
      body: { email: args.email, password: args.password, name: existingUser.name },
    });

    const better_auth_id: string = baResult?.user?.id ?? "";
    if (!better_auth_id) {
      throw new Error("Better Auth did not return a user ID. Check BETTER_AUTH_SECRET is set.");
    }

    await ctx.runMutation(internal.createSuperAdmin.linkBetterAuthId, {
      userId: existingUser._id,
      better_auth_id,
    });

    return {
      success: true,
      message: `${existingUser.name} (${args.email}) is now registered in Better Auth. Use the new password to sign in.`,
    };
  },
});
