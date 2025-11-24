import { query,mutation } from "./_generated/server";
import { v } from "convex/values";




export const createEnrollment = mutation({
  args: {
    program_id: v.id("programs"),
    user_id: v.id("users"),
    campaign_id: v.id("campaigns"),
    redeem_code: v.string(),
    transaction_id: v.optional(v.id("transactions")),
    status: v.union(
      v.literal("pending"),
      v.literal("redeemed"),
      v.literal("expired")
    ),
    meta: v.optional(
      v.object({
        phone: v.optional(v.string()),
        payment_amount: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("program_enrollments", args);
  },
});



export const listByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, { campaignId }) => {
    // Fetch all enrollments for this campaign
    const enrollments = await ctx.db
      .query("program_enrollments")
      .withIndex("by_campaign_id", (q) => q.eq("campaign_id", campaignId))
      .collect();

    // Get campaign to trace back to its partner
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    // Fetch the partner for the campaign
    const partner = await ctx.db.get(campaign.partner_id);

    // Return enrollments enriched with partner info
    return enrollments.map((enrollment) => ({
      ...enrollment,
      partner_name: partner ? partner.name : "Unknown Partner",
      campaign_name: campaign.name,
    }));
  },
});

export const getEarningsTimeline = query({
  args: {
    partner_id: v.id("partners"),
    days: v.optional(v.number()), // Default to 30 days
  },
  handler: async (ctx, { partner_id, days = 30 }) => {
    // Get all campaigns for partner
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .collect();

    
    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTimestamp = startDate.getTime();

    // Get all transactions in date range
    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .filter((q) => 
        q.and(
          q.gte(q.field("_creationTime"), startTimestamp),
          q.eq(q.field("status"), "Success")
        )
      )
      .collect();

    // Group by date
    const earningsByDate: Record<string, number> = {};
    
    allTransactions.forEach((transaction) => {
      const date = new Date(transaction._creationTime);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Find matching campaign to get revenue share
      const campaign = campaigns.find(c => c.promo_code === transaction.campaign_code);
      const partnerShare = campaign 
        ? (transaction.amount * campaign.revenue_share.partner_percentage) / 100
        : transaction.amount * 0.2; // Default 20%
      
      earningsByDate[dateKey] = (earningsByDate[dateKey] || 0) + partnerShare;
    });

    // Convert to array and sort by date
    const timeline = Object.entries(earningsByDate)
      .map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimals
        formatted_date: new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fill in missing dates with 0
    const filledTimeline: Array<{ date: string; amount: number; formatted_date: string }> = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const existing = timeline.find(t => t.date === dateKey);
      
      filledTimeline.push({
        date: dateKey,
        amount: existing?.amount || 0,
        formatted_date: currentDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledTimeline;
  },
});

export const getEnrollmentByTransactionId = query({
  args: { transaction_id: v.id("transactions") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("program_enrollments")
      .withIndex("by_transaction_id", (q) => q.eq("transaction_id", args.transaction_id))
      .first();
    
    return enrollment;
  },
});
