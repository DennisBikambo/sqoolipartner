/**
 * Internal helpers for user creation — split into a separate file to avoid
 * circular `internal.user.*` references in user.ts actions.
 */
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getUserByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const insertUserRecord = internalMutation({
  args: {
    partner_id: v.id("partners"),
    email: v.string(),
    better_auth_id: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    role: v.union(
      v.literal("super_admin"),
      v.literal("partner_admin"),
      v.literal("accountant"),
      v.literal("campaign_manager"),
      v.literal("viewer"),
      v.literal("super_agent"),
      v.literal("master_agent"),
      v.literal("merchant_admin")
    ),
    permission_ids: v.array(v.id("permissions")),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      partner_id: args.partner_id,
      email: args.email,
      better_auth_id: args.better_auth_id,
      name: args.name,
      phone: args.phone,
      avatar_url: args.avatar_url,
      role: args.role,
      permission_ids: args.permission_ids,
      is_active: true,
      is_first_login: true,
      is_account_activated: true,
      last_login: undefined,
      updated_at: undefined,
    });

    await ctx.runMutation(api.notifications.createNotification, {
      partnerId: args.partner_id,
      type: "success",
      title: "User created successfully",
      message: `User with email ${args.email} has been created successfully`,
    });

    return { userId };
  },
});
