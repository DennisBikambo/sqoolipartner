// convex/withdrawalLimits.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

    return await ctx.db.insert("withdrawal_limits", {
      ...args,
      updated_at: now,
    });
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

    return await ctx.db.patch(id, {
      ...patches,
      updated_at: new Date().toISOString(),
    });
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
