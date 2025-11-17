// convex/seedPermissions.ts
import { mutation } from "./_generated/server";

/**
 * 🌱 Seed all system permissions
 * This should be run BEFORE seeding roles to ensure all permissions exist
 */
export const seedPermissions = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if permissions already exist
    const existingPermissions = await ctx.db.query("permissions").collect();
    if (existingPermissions.length > 0) {
      return {
        message: "Permissions already seeded. Skipping.",
        existingCount: existingPermissions.length,
      };
    }

    // Define all system permissions
    const permissions = [
      // All Access Permissions (Super Admin)
      {
        key: "all_access.full",
        name: "Full System Access",
        description: "Complete unrestricted access to all system features and data",
        category: "all_access" as const,
        level: "full" as const,
        is_default: false,
      },
      {
        key: "all_access.admin",
        name: "Administrative Access",
        description: "Administrative access to all system features",
        category: "all_access" as const,
        level: "admin" as const,
        is_default: false,
      },

      // Dashboard Permissions
      {
        key: "dashboard.read",
        name: "Dashboard Read",
        description: "View dashboard and analytics",
        category: "dashboard" as const,
        level: "read" as const,
        is_default: true,
      },
      {
        key: "dashboard.write",
        name: "Dashboard Write",
        description: "Modify dashboard settings and preferences",
        category: "dashboard" as const,
        level: "write" as const,
        is_default: false,
      },
      {
        key: "dashboard.admin",
        name: "Dashboard Admin",
        description: "Full control over dashboard configuration",
        category: "dashboard" as const,
        level: "admin" as const,
        is_default: false,
      },

      // User Permissions
      {
        key: "users.read",
        name: "Users Read",
        description: "View user profiles and data",
        category: "users" as const,
        level: "read" as const,
        is_default: false,
      },
      {
        key: "users.write",
        name: "Users Write",
        description: "Create and update users",
        category: "users" as const,
        level: "write" as const,
        is_default: false,
      },
      {
        key: "users.admin",
        name: "Users Admin",
        description: "Full user management including deletion and role assignment",
        category: "users" as const,
        level: "admin" as const,
        is_default: false,
      },

      // Campaign Permissions
      {
        key: "campaigns.read",
        name: "Campaigns Read",
        description: "View campaigns and their details",
        category: "campaigns" as const,
        level: "read" as const,
        is_default: true,
      },
      {
        key: "campaigns.write",
        name: "Campaigns Write",
        description: "Create and update campaigns",
        category: "campaigns" as const,
        level: "write" as const,
        is_default: false,
      },
      {
        key: "campaigns.admin",
        name: "Campaigns Admin",
        description: "Full campaign management including deletion and status changes",
        category: "campaigns" as const,
        level: "admin" as const,
        is_default: false,
      },

      // Program Permissions
      {
        key: "programs.read",
        name: "Programs Read",
        description: "View programs and curricula",
        category: "programs" as const,
        level: "read" as const,
        is_default: true,
      },
      {
        key: "programs.write",
        name: "Programs Write",
        description: "Create and update programs",
        category: "programs" as const,
        level: "write" as const,
        is_default: false,
      },
      {
        key: "programs.admin",
        name: "Programs Admin",
        description: "Full program management including deletion and curriculum changes",
        category: "programs" as const,
        level: "admin" as const,
        is_default: false,
      },

      // Wallet Permissions
      {
        key: "wallet.read",
        name: "Wallet Read",
        description: "View wallet balance and transaction history",
        category: "wallet" as const,
        level: "read" as const,
        is_default: false,
      },
      {
        key: "wallet.write",
        name: "Wallet Write",
        description: "Manage wallet settings and initiate withdrawals",
        category: "wallet" as const,
        level: "write" as const,
        is_default: false,
      },
      {
        key: "wallet.admin",
        name: "Wallet Admin",
        description: "Full wallet management including all financial operations",
        category: "wallet" as const,
        level: "admin" as const,
        is_default: false,
      },

      // Settings Permissions
      {
        key: "settings.read",
        name: "Settings Read",
        description: "View system and account settings",
        category: "settings" as const,
        level: "read" as const,
        is_default: true,
      },
      {
        key: "settings.write",
        name: "Settings Write",
        description: "Modify account and partner settings",
        category: "settings" as const,
        level: "write" as const,
        is_default: false,
      },
      {
        key: "settings.admin",
        name: "Settings Admin",
        description: "Full control over all system settings",
        category: "settings" as const,
        level: "admin" as const,
        is_default: false,
      },
    ];

    // Insert all permissions
    const insertedPermissions = await Promise.all(
      permissions.map((perm) => ctx.db.insert("permissions", perm))
    );

    return {
      message: "Permissions seeded successfully",
      permissionsCreated: insertedPermissions.length,
      permissions: permissions.map((p, i) => ({
        id: insertedPermissions[i],
        key: p.key,
        name: p.name,
        category: p.category,
        level: p.level,
      })),
    };
  },
});

/**
 * 🔄 Get permission by key
 */
export const getPermissionByKey = mutation({
  args: {},
  handler: async (ctx) => {
    const allAccessFull = await ctx.db
      .query("permissions")
      .withIndex("by_key", (q) => q.eq("key", "all_access.full"))
      .unique();

    return allAccessFull;
  },
});
