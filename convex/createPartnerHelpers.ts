/**
 * Internal helpers for partner creation — split from createPartner.ts to avoid
 * circular `internal.createPartner.*` references in the action.
 */
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createPartnerAndGetPermissions = internalMutation({
  args: {
    partner_name: v.string(),
    partner_email: v.string(),
    partner_phone: v.string(),
    partner_username: v.string(),
    admin_email: v.string(),
    partner_permission_ids: v.optional(v.array(v.id("permissions"))),
    admin_permission_ids: v.optional(v.array(v.id("permissions"))),
  },
  handler: async (ctx, args) => {
    const existingPartner = await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("email"), args.partner_email))
      .first();
    if (existingPartner) {
      throw new Error(`Partner with email ${args.partner_email} already exists`);
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.admin_email))
      .unique();
    if (existingUser) {
      throw new Error(`User with email ${args.admin_email} already exists`);
    }

    const allPermissions = await ctx.db.query("permissions").collect();
    const allPermissionIds = allPermissions.map((p) => p._id);

    const partnerPermissions =
      args.partner_permission_ids?.length
        ? args.partner_permission_ids
        : allPermissionIds;

    const adminPermissions =
      args.admin_permission_ids?.length
        ? args.admin_permission_ids
        : allPermissionIds;

    const partnerId = await ctx.db.insert("partners", {
      name: args.partner_name,
      email: args.partner_email,
      phone: args.partner_phone,
      username: args.partner_username,
      is_first_login: true,
      permission_ids: partnerPermissions,
    });

    return { partnerId, adminPermissions };
  },
});

export const insertPartnerAdminUser = internalMutation({
  args: {
    partner_id: v.id("partners"),
    email: v.string(),
    better_auth_id: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    permission_ids: v.array(v.id("permissions")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("users", {
      partner_id: args.partner_id,
      email: args.email,
      better_auth_id: args.better_auth_id,
      name: args.name,
      phone: args.phone,
      role: "partner_admin",
      permission_ids: args.permission_ids,
      is_active: true,
      is_first_login: true,
      is_account_activated: true,
      last_login: undefined,
      updated_at: undefined,
    });
  },
});
