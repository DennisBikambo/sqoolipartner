// convex/partner.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * READ all partners
 */
export const getAllPartners = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partners").collect();
  },
});

/**
 * CHECK if user exists in partners table (basic auth simulation)
 */
export const authenticateUser = query({
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
