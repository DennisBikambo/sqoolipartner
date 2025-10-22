import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const logRevenue = mutation({
  args: {
    partner_id: v.id("partners"),
    campaign_id: v.id("campaigns"),
    transaction_id: v.id("transactions"),
    amount: v.number(),
    gross_amount: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now(); 

    return await ctx.db.insert("partner_revenue_logs", {
      partner_id: args.partner_id,
      campaign_id: args.campaign_id,
      transaction_id: args.transaction_id,
      amount: args.amount,
      gross_amount: args.gross_amount,
      split_timestamp: timestamp, 
    });
  },
});
