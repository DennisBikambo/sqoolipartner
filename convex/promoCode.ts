import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * CREATE: Add a promo code to a campaign
 */
export const createPromoCode = mutation({
  args: {
    campaign_id: v.id("campaigns"),
    code: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if code already exists
    const existing = await ctx.db
      .query("promo_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) {
      throw new Error(`Promo code "${args.code}" already exists`);
    }

    return await ctx.db.insert("promo_codes", {
      campaign_id: args.campaign_id,
      code: args.code.toUpperCase(),
      label: args.label,
      description: args.description,
      is_active: true,
      created_at: new Date().toISOString(),
    });
  },
});

/**
 * READ: Get all promo codes for a campaign
 */
export const getPromoCodesByCampaign = query({
  args: { campaign_id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promo_codes")
      .withIndex("by_campaign_id", (q) => q.eq("campaign_id", args.campaign_id))
      .collect();
  },
});

/**
 * READ: Get a promo code by code string
 */
export const getPromoCodeByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promo_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

/**
 * UPDATE: Toggle promo code active status
 */
export const togglePromoCodeStatus = mutation({
  args: {
    id: v.id("promo_codes"),
  },
  handler: async (ctx, args) => {
    const promoCode = await ctx.db.get(args.id);
    if (!promoCode) {
      throw new Error("Promo code not found");
    }

    await ctx.db.patch(args.id, {
      is_active: !promoCode.is_active,
    });

    return { success: true, is_active: !promoCode.is_active };
  },
});

/**
 * UPDATE: Edit promo code
 */
export const updatePromoCode = mutation({
  args: {
    id: v.id("promo_codes"),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const promoCode = await ctx.db.get(args.id);
    if (!promoCode) {
      throw new Error("Promo code not found");
    }

    const updates: {
      label?: string;
      description?: string;
    } = {};

    if (args.label !== undefined) updates.label = args.label;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

/**
 * DELETE: Remove a promo code
 */
export const deletePromoCode = mutation({
  args: { id: v.id("promo_codes") },
  handler: async (ctx, args) => {
    const promoCode = await ctx.db.get(args.id);
    if (!promoCode) {
      throw new Error("Promo code not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
