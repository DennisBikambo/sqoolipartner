// convex/withdrawalLimits.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * CREATE WITHDRAWAL LIMIT 
 */
export const createLimit = mutation({
  args: {
    partner_id: v.optional(v.id("partners")),
    min_withdrawal_amount: v.number(),
    max_withdrawal_amount: v.number(),
    daily_limit: v.number(),
    monthly_limit: v.number(),
    processing_days: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const id = await ctx.db.insert("withdrawal_limits", {
      ...args,
      updated_at: now,
    });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "withdrawalLimits.createLimit",
      status: "success",
      details: JSON.stringify({ id, partner_id: args.partner_id, min: args.min_withdrawal_amount, max: args.max_withdrawal_amount }),
    });
    return id;
  },
});

/**
 * UPDATE WITHDRAWAL LIMIT
 */
export const updateLimit = mutation({
  args: {
    id: v.id("withdrawal_limits"),
    patches: v.object({
      min_withdrawal_amount: v.optional(v.number()),
      max_withdrawal_amount: v.optional(v.number()),
      daily_limit: v.optional(v.number()),
      monthly_limit: v.optional(v.number()),
      processing_days: v.optional(v.number()),
      is_active: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, patches }) => {
    const limit = await ctx.db.get(id);
    if (!limit) throw new Error("Withdrawal limit not found");

    const result = await ctx.db.patch(id, {
      ...patches,
      updated_at: new Date().toISOString(),
    });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "withdrawalLimits.updateLimit",
      status: "success",
      details: JSON.stringify({ id, fields: Object.keys(patches) }),
    });
    return result;
  },
});

/**
 * GET ACTIVE LIMIT FOR PARTNER
 * Partner limit overrides global
 */
export const getActiveLimit = query({
  args: {
    partner_id: v.id("partners"),
  },
  handler: async (ctx, { partner_id }) => {
    // Look for partner-specific limit
    const partnerLimit = await ctx.db
      .query("withdrawal_limits")
      .withIndex("by_partner_id", q => q.eq("partner_id", partner_id))
      .filter(q => q.eq(q.field("is_active"), true))
      .first();

    if (partnerLimit) return partnerLimit;

    // Fallback → global limit (partner_id = undefined)
    const globalLimit = await ctx.db
      .query("withdrawal_limits")
      .withIndex("by_is_active", q => q.eq("is_active", true))
      .filter(q => q.eq(q.field("partner_id"), undefined))
      .first();

    return globalLimit;
  },
});
