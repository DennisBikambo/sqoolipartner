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

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

/**
 * Utility to generate a secure extension
 */
function generateExtension(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let extension = "";
  for (let i = 0; i < 8; i++) {
    extension += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `admin-${extension}-${randomSuffix}`;
}

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
        laravelUserId: 0,
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

    // Generate extension and hash password
    const extension = generateExtension();
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
      extension,
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
        extension: extension,
        role: "super_admin",
        permissions_count: allPermissionIds.length,
      },
      credentials: {
        email: args.email,
        password: args.password,
        extension: extension,
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
        password: args.new_password,
        extension: user.extension,
      },
    };
  },
});
