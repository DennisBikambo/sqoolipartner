// convex/campaign.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { generateWhatsAppQRCode, generatePaymentQRCode } from "../src/services/qrCodeService";

function generatePromoCode(base: string): string {
  const random = Math.floor(100 + Math.random() * 900);
  return `${base.replace(/\s+/g, "").toUpperCase().slice(0, 8)}${random}`;
}

export const createCampaign = mutation({
  args: {
    partner_id: v.id("partners"),
    program_id: v.id("programs"),
    user_id: v.optional(v.id("users")),
    name: v.string(),
    description: v.optional(v.string()),
    target_signups: v.number(),
    channel_id: v.id("channels"),
    subchannel: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partner_id);
    if (!partner) throw new Error("Partner not found");

    const program = await ctx.db.get(args.program_id);
    if (!program) throw new Error("Program not found");

    const channel = await ctx.db.get(args.channel_id);
    if (!channel) throw new Error("Channel not found");

    // Auto-generate promo code
    let promoCode = generatePromoCode(args.name);
    promoCode = promoCode.toUpperCase();

    const existing = await ctx.db
      .query("campaigns")
      .withIndex("by_promo_code", (q) => q.eq("promo_code", promoCode))
      .first();
    if (existing) throw new Error("Promo code already exists");

    // Auto-calculate campaign metrics based on program
    const duration_start = program.start_date;
    const duration_end = program.end_date;
    
    const start = new Date(duration_start);
    const end = new Date(duration_end);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const dailyTarget = Math.ceil(args.target_signups / days);
    
    // Pricing from program
    const pricePerLesson = program.pricing;
    const bundledOffers = { 
      min_lessons: 5, 
      total_price: pricePerLesson * 5 
    };
    const discountRule = { 
      price_per_lesson: pricePerLesson 
    };
    
    // Revenue calculations
    const revenueProjection = args.target_signups * bundledOffers.total_price;
    const revenueShare = { 
      partner_percentage: 20, 
      sqooli_percentage: 80 
    };

    // Use partner's default WhatsApp number or system default
    const whatsapp_number = partner.phone || "+254104010203";

    const campaignId = await ctx.db.insert("campaigns", {
      name: args.name,
      description: args.description,
      program_id: args.program_id,
      partner_id: args.partner_id,
      channel_id: args.channel_id,
      user_id: args.user_id,
      promo_code: promoCode,
      target_signups: args.target_signups,
      daily_target: dailyTarget,
      bundled_offers: bundledOffers,
      discount_rule: discountRule,
      revenue_projection: revenueProjection,
      revenue_share: revenueShare,
      whatsapp_number: whatsapp_number,
      duration_start: duration_start,
      duration_end: duration_end,
      status: "draft",
    });

    await ctx.runMutation(api.notifications.createNotification, {
      partnerId: args.partner_id,
      type: "campaign",
      title: "Campaign Created",
      message: `Your campaign "${args.name}" has been created and is pending approval.`,
    });

    // Generate only WhatsApp and Payment QR codes
    const whatsappQRUrl = await generateWhatsAppQRCode(whatsapp_number, promoCode, args.name);
    const paymentQRUrl = await generatePaymentQRCode("4092033", bundledOffers.total_price, promoCode);

    const now = Date.now();
    const assetTemplates = [
      { 
        type: "qr_code" as const, 
        content: "WhatsApp QR Code", 
        url: whatsappQRUrl 
      },
      { 
        type: "how_to_pay" as const, 
        content: `Paybill: 4092033\nAccount: [Transaction ID]\nAmount: KES ${bundledOffers.total_price}\nPromo Code: ${promoCode}`, 
        url: paymentQRUrl 
      },
    ];

    for (const asset of assetTemplates) {
      await ctx.db.insert("assets", {
        campaign_id: campaignId,
        type: asset.type,
        url: asset.url,
        content: asset.content,
        generated_at: now,
      });
    }

    return campaignId;
  },
});

/**
 * READ all campaigns
 */
export const getAllCampaigns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("campaigns").collect();
  },
});

/**
 * READ a single campaign by ID
 */
export const getCampaignById = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * READ campaigns by partner
 */
export const getCampaignsByPartner = query({
  args: { partner_id: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partner_id))
      .collect();
  },
});

export const getCampaignsByProgram = query({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_program_id", (q) => q.eq("program_id", args.programId))
      .collect();
  },
});

export const getCampaignsByUser = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .collect();
  },
});

/**
 * UPDATE campaign status (for approval workflow)
 */
export const updateCampaignStatus = mutation({
  args: {
    id: v.id("campaigns"),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("expired")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return { success: true };
  },
});

/**
 * DELETE a campaign
 */
export const deleteCampaign = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * GET assets for a campaign
 */
export const getCampaignAssets = query({
  args: { campaign_id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_campaign_id", (q) => q.eq("campaign_id", args.campaign_id))
      .collect();
  },
});

/**
 * GET campaign by promo code
 */
export const getCampaignByPromoCode = query({
  args: { promo_code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_promo_code", (q) => q.eq("promo_code", args.promo_code))
      .first();
  },
});

export const getCampaignEarnings = query({
  args: {
    partner_id: v.id("partners"),
  },
  handler: async (ctx, { partner_id }) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .collect();

    const campaignEarnings = await Promise.all(
      campaigns.map(async (campaign) => {
        const enrollments = await ctx.db
          .query("program_enrollments")
          .withIndex("by_campaign_id", (q) => q.eq("campaign_id", campaign._id))
          .filter((q) => q.eq(q.field("status"), "redeemed"))
          .collect();

        const transactions = campaign.promo_code
          ? await ctx.db
              .query("transactions")
              .withIndex("by_campaign_code", (q) => q.eq("campaign_code", campaign.promo_code!))
              .filter((q) => q.eq(q.field("status"), "Success"))
              .collect()
          : [];

        const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
        const partnerEarnings = totalRevenue * (campaign.revenue_share.partner_percentage / 100);

        return {
          campaign_id: campaign._id,
          campaign_name: campaign.name,
          promo_code: campaign.promo_code,
          status: campaign.status,
          enrollments: enrollments.length,
          total_revenue: totalRevenue,
          partner_earnings: partnerEarnings,
          target_signups: campaign.target_signups,
          conversion_rate: campaign.target_signups > 0 
            ? (enrollments.length / campaign.target_signups) * 100 
            : 0,
        };
      })
    );

    return campaignEarnings.sort((a, b) => b.partner_earnings - a.partner_earnings);
  },
});