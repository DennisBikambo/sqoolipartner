import { query,mutation } from "./_generated/server";
import { v } from "convex/values";




export const createEnrollment = mutation({
  args: {
    program_id: v.id("programs"),
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
        number_of_lessons_subscribed:v.optional(v.number()),
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
