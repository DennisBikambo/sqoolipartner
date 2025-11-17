/**
 * Make a user a Super Administrator
 *
 * Run this via Convex CLI:
 *   npx convex run makeSuperAdmin:promoteToSuperAdmin --url https://industrious-bear-173.convex.cloud '{"email":"user@example.com"}'
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const promoteToSuperAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error(`User not found with email: ${args.email}`);
    }

    // Get the all_access.full permission
    const fullAccessPermission = await ctx.db
      .query("permissions")
      .withIndex("by_key", (q) => q.eq("key", "all_access.full"))
      .unique();

    if (!fullAccessPermission) {
      throw new Error("all_access.full permission not found. Run seedPermissions first.");
    }

    // Get all permissions (super admin should have all)
    const allPermissions = await ctx.db.query("permissions").collect();
    const allPermissionIds = allPermissions.map((p) => p._id);

    // Update the user
    await ctx.db.patch(user._id, {
      role: "super_admin",
      permission_ids: allPermissionIds,
      is_active: true,
      is_account_activated: true,
    });

    return {
      success: true,
      message: `User ${args.email} is now a Super Administrator`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "super_admin",
        permissions_count: allPermissionIds.length,
      },
    };
  },
});

/**
 * List all users (to find email addresses)
 */
export const listUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    return users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
      is_account_activated: u.is_account_activated,
    }));
  },
});
