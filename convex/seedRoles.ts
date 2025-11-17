// convex/seedRoles.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * 🌱 Seed default roles with their respective permissions
 * This should be run once to initialize the roles table
 */
export const seedDefaultRoles = mutation({
  args: {},
  handler: async (ctx) => {
    // First, check if roles already exist to avoid duplication
    const existingRoles = await ctx.db.query("roles").collect();
    if (existingRoles.length > 0) {
      return {
        message: "Roles already seeded. Skipping.",
        existingCount: existingRoles.length,
      };
    }

    // Get all permissions to map them to roles
    const allPermissions = await ctx.db.query("permissions").collect();

    // Helper function to get all permissions in certain categories
    const getPermissionsByCategories = (
      categories: string[],
      levels?: string[]
    ) => {
      return allPermissions
        .filter(
          (p) =>
            categories.includes(p.category) &&
            (!levels || levels.includes(p.level))
        )
        .map((p) => p._id);
    };

    const now = new Date().toISOString();

    // Define default roles with their permissions
    const defaultRoles = [
      {
        name: "super_admin",
        display_name: "Super Administrator",
        description:
          "Ultimate administrative access with all permissions across the entire system. Can manage all partners, users, campaigns, wallet, programs, and settings without restrictions.",
        permission_ids: allPermissions.map((p) => p._id), // All permissions including all_access.full
        is_system_role: true,
        is_active: true,
        created_at: now,
      },
      {
        name: "partner_admin",
        display_name: "Partner Administrator",
        description:
          "Full administrative access to all partner features including user management, campaigns, wallet, and settings.",
        permission_ids: allPermissions.map((p) => p._id), // All permissions
        is_system_role: true,
        is_active: true,
        created_at: now,
      },
      {
        name: "accountant",
        display_name: "Accountant",
        description:
          "Access to financial data including wallet, transactions, and revenue reports. Can view campaigns and programs.",
        permission_ids: [
          ...getPermissionsByCategories(["wallet"], ["read", "write", "admin"]),
          ...getPermissionsByCategories(["dashboard"], ["read"]),
          ...getPermissionsByCategories(["campaigns"], ["read"]),
          ...getPermissionsByCategories(["programs"], ["read"]),
        ],
        is_system_role: true,
        is_active: true,
        created_at: now,
      },
      {
        name: "campaign_manager",
        display_name: "Campaign Manager",
        description:
          "Can create, edit, and manage campaigns. Has read access to programs and dashboard.",
        permission_ids: [
          ...getPermissionsByCategories(["campaigns"], [
            "read",
            "write",
            "admin",
          ]),
          ...getPermissionsByCategories(["programs"], ["read"]),
          ...getPermissionsByCategories(["dashboard"], ["read"]),
          ...getPermissionsByCategories(["users"], ["read"]),
        ],
        is_system_role: true,
        is_active: true,
        created_at: now,
      },
      {
        name: "viewer",
        display_name: "Viewer",
        description:
          "Read-only access to dashboard, campaigns, and programs. Cannot make any modifications.",
        permission_ids: getPermissionsByCategories(
          ["dashboard", "campaigns", "programs"],
          ["read"]
        ),
        is_system_role: true,
        is_active: true,
        created_at: now,
      },
      {
        name: "super_agent",
        display_name: "Super Agent",
        description:
          "Advanced agent role with campaign management and user creation abilities.",
        permission_ids: [
          ...getPermissionsByCategories(["campaigns"], [
            "read",
            "write",
            "admin",
          ]),
          ...getPermissionsByCategories(["users"], ["read", "write"]),
          ...getPermissionsByCategories(["dashboard"], ["read"]),
          ...getPermissionsByCategories(["programs"], ["read"]),
        ],
        is_system_role: true,
        is_active: true,
        created_at: now,
      },
      {
        name: "master_agent",
        display_name: "Master Agent",
        description:
          "Senior agent role with full campaign access and limited user management.",
        permission_ids: [
          ...getPermissionsByCategories(["campaigns"], [
            "read",
            "write",
            "admin",
          ]),
          ...getPermissionsByCategories(["users"], ["read", "write"]),
          ...getPermissionsByCategories(["dashboard"], ["read", "write"]),
          ...getPermissionsByCategories(["programs"], ["read", "write"]),
          ...getPermissionsByCategories(["wallet"], ["read"]),
        ],
        is_system_role: true,
        is_active: true,
        created_at: now,
      },
      {
        name: "merchant_admin",
        display_name: "Merchant Administrator",
        description:
          "Merchant-specific admin with access to campaigns, programs, and financial data.",
        permission_ids: [
          ...getPermissionsByCategories(["campaigns"], [
            "read",
            "write",
            "admin",
          ]),
          ...getPermissionsByCategories(["programs"], ["read", "write"]),
          ...getPermissionsByCategories(["wallet"], ["read", "write"]),
          ...getPermissionsByCategories(["dashboard"], ["read", "write"]),
          ...getPermissionsByCategories(["users"], ["read"]),
        ],
        is_system_role: true,
        is_active: true,
        created_at: now,
      },
    ];

    // Insert all roles
    const insertedRoles = await Promise.all(
      defaultRoles.map((role) => ctx.db.insert("roles", role))
    );

    return {
      message: "Default roles seeded successfully",
      rolesCreated: insertedRoles.length,
      roles: defaultRoles.map((r, i) => ({
        id: insertedRoles[i],
        name: r.name,
        display_name: r.display_name,
        permissionCount: r.permission_ids.length,
      })),
    };
  },
});

/**
 * 🔄 Helper function to get role permissions for user assignment
 */
export const getRolePermissions = mutation({
  args: {
    role_name: v.union(
      v.literal("super_admin"),
      v.literal("partner_admin"),
      v.literal("accountant"),
      v.literal("campaign_manager"),
      v.literal("viewer"),
      v.literal("super_agent"),
      v.literal("master_agent"),
      v.literal("merchant_admin")
    ),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.role_name))
      .unique();

    if (!role) {
      throw new Error(`Role "${args.role_name}" not found`);
    }

    return {
      role_id: role._id,
      permission_ids: role.permission_ids,
    };
  },
});
