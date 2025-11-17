/**
 * Update existing partner to have all permissions
 * Run this once to fix the existing partner that only has 1 permission
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const givePartnerAllPermissions = mutation({
  args: {
    partner_id: v.id("partners"),
  },
  handler: async (ctx, args) => {
    // Get ALL permissions
    const allPermissions = await ctx.db.query("permissions").collect();
    const allPermissionIds = allPermissions.map((p) => p._id);

    if (allPermissionIds.length === 0) {
      throw new Error("No permissions found. Run seedPermissions first.");
    }

    // Update the partner
    await ctx.db.patch(args.partner_id, {
      permission_ids: allPermissionIds,
    });

    return {
      success: true,
      message: `Partner updated with ${allPermissionIds.length} permissions`,
      permissions_count: allPermissionIds.length,
    };
  },
});

/**
 * Update ALL existing partners to have all permissions
 */
export const fixAllPartners = mutation({
  args: {},
  handler: async (ctx) => {
    // Get ALL permissions
    const allPermissions = await ctx.db.query("permissions").collect();
    const allPermissionIds = allPermissions.map((p) => p._id);

    if (allPermissionIds.length === 0) {
      throw new Error("No permissions found. Run seedPermissions first.");
    }

    // Get all partners
    const partners = await ctx.db.query("partners").collect();

    // Update each partner
    for (const partner of partners) {
      await ctx.db.patch(partner._id, {
        permission_ids: allPermissionIds,
      });
    }

    return {
      success: true,
      message: `Updated ${partners.length} partners with ${allPermissionIds.length} permissions each`,
      partners_updated: partners.length,
      permissions_per_partner: allPermissionIds.length,
    };
  },
});
