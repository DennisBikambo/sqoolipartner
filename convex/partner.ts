// convex/partner.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ✅ READ all partners
 */
export const getAllPartners = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partners").collect();
  },
});

/**
 * ✅ GET partner by name (for display or verification)
 */
export const getPartnerId = query({
  args: { user_name: v.string() },
  handler: async (ctx, args) => {
    const partner = await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("name"), args.user_name))
      .first();

    if (!partner) {
      return { authenticated: false };
    }
    return { authenticated: true, partner };
  },
});

/**
 * ✅ FETCH a partner by email (used for login syncing)
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});


export const completeOnboarding = mutation({
  args: { partnerId: v.id("partners"), userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.partnerId, { is_first_login: false });
    await ctx.db.patch(args.userId, { is_first_login: false });
  },
});


export const getById = query({
  args: { partner_id: v.id("partners") },
  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partner_id);
    return partner;
  },
});
