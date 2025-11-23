import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type {Id} from "./_generated/dataModel";

export const logRevenue = mutation({
  args: {
    partner_id: v.id("partners"),
    user_id: v.id("users"),
    campaign_id: v.id("campaigns"),
    transaction_id: v.id("transactions"),
    amount: v.number(),
    gross_amount: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    return await ctx.db.insert("partner_revenue_logs", {
      partner_id: args.partner_id,
      user_id: args.user_id,
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


export const getPartnerEarningsSummary = query({
  handler: async (ctx) => {
    const logs = await ctx.db.query("partner_revenue_logs").collect();
    
    const total_earnings = logs.reduce((sum, log) => sum + log.amount, 0);
    const total_revenue = logs.reduce((sum, log) => sum + log.gross_amount, 0);
    
    return {
      total_earnings,
      total_revenue,
    };
  },
});

export const getSystemEarningsTimeline = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startTime = now - args.days * 24 * 60 * 60 * 1000;
    
    const logs = await ctx.db
      .query("partner_revenue_logs")
      .filter((q) => q.gte(q.field("split_timestamp"), startTime))
      .collect();
    
    // Group by date
    const groupedByDate = logs.reduce((acc, log) => {
      const date = new Date(log.split_timestamp);
      const dateKey = date.toISOString().split("T")[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = 0;
      }
      acc[dateKey] += log.gross_amount;
      
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to array and format
    return Object.entries(groupedByDate)
      .map(([date, amount]) => ({
        date,
        amount,
        formatted_date: new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
});

export const getTopEarningPartners = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const logs = await ctx.db.query("partner_revenue_logs").collect();
    
    // Group by partner
    const partnerEarningsMap = logs.reduce((acc, log) => {
      const partnerId = log.partner_id;
      
      if (!acc[partnerId]) {
        acc[partnerId] = {
          partner_id: partnerId,
          total_earnings: 0,
          campaign_ids: new Set<Id<"campaigns">>(),
          total_enrollments: 0,
        };
      }
      
      acc[partnerId].total_earnings += log.amount;
      acc[partnerId].campaign_ids.add(log.campaign_id);
      acc[partnerId].total_enrollments += 1;
      
      return acc;
    }, {} as Record<string, {
      partner_id: Id<"partners">;
      total_earnings: number;
      campaign_ids: Set<Id<"campaigns">>;
      total_enrollments: number;
    }>);
    
    // Get partner details and convert to array
    const partnersWithEarnings = await Promise.all(
      Object.values(partnerEarningsMap).map(async (p) => {
        const partner = await ctx.db.get(p.partner_id);
        return {
          partner_id: p.partner_id,
          partner_name: partner?.name || "Unknown Partner",
          total_earnings: p.total_earnings,
          total_campaigns: p.campaign_ids.size,
          total_enrollments: p.total_enrollments,
        };
      })
    );
    
    // Sort by earnings and limit
    return partnersWithEarnings
      .sort((a, b) => b.total_earnings - a.total_earnings)
      .slice(0, args.limit);
  },
});