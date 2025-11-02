import { mutation, query } from "./_generated/server";
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

export const getByCampaign = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partner_revenue_logs")
      .withIndex("by_campaign_id", (q) => q.eq("campaign_id", args.campaignId))
      .collect();
  },
});

export const getByPartner = query({
  args: {
    partnerId: v.id("partners"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partner_revenue_logs")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partnerId))
      .collect();
  },
});