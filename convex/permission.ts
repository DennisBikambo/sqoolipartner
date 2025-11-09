import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * 📄 Get all permissions (optionally filtered by category or default flag)
 */
export const getPermissions = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("users"),
        v.literal("campaigns"),
        v.literal("programs"),
        v.literal("wallet"),
        v.literal("dashboard"),
        v.literal("settings"),
        v.literal("all_access")
      )
    ),
    is_default: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("permissions")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    }

    if (args.is_default !== undefined) {
      return await ctx.db
        .query("permissions")
        .withIndex("by_is_default", (q) =>
          q.eq("is_default", args.is_default!)
        )
        .collect();
    }

    return await ctx.db.query("permissions").collect();
  },
});


export const getAllPermissions = query({
  handler: async (ctx) => {
    return await ctx.db.query("permissions").collect();
  },
});

export const getPermissionsByIds = query({
  args: { permission_ids: v.array(v.id("permissions")) },
  handler: async (ctx, args) => {
    const permissions = await Promise.all(
      args.permission_ids.map(id => ctx.db.get(id))
    );
    return permissions.filter(Boolean);
  },
});
