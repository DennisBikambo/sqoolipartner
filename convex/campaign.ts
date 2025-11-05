// convex/campaign.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { generateWhatsAppQRCode, generatePaymentQRCode ,socialPostGenerator} from "../src/services/qrCodeService";


function generatePromoCode(base: string): string {
  const random = Math.floor(100 + Math.random() * 900);
  return `${base.replace(/\s+/g, "").toUpperCase().slice(0, 8)}${random}`;
}

export const createCampaign = mutation({
  args: {
    partner_id: v.id("partners"),
    program_id: v.id("programs"),
    name: v.string(),
    duration_start: v.string(),
    duration_end: v.string(),
    target_signups: v.number(),
    whatsapp_number: v.string(),
    promo_code: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partner_id);
    if (!partner) throw new Error("Partner not found");

    const program = await ctx.db.get(args.program_id);
    if (!program) throw new Error("Program not found");

    const start = new Date(args.duration_start);
    const end = new Date(args.duration_end);
    const programStart = new Date(program.start_date);
    const programEnd = new Date(program.end_date);
    if (start < programStart || end > programEnd) {
      throw new Error("Campaign duration must be within program duration");
    }

    let promoCode = generatePromoCode(args.name);
    promoCode = promoCode.toUpperCase();

    const existing = await ctx.db
      .query("campaigns")
      .withIndex("by_promo_code", (q) => q.eq("promo_code", promoCode))
      .first();
    if (existing) throw new Error("Promo code already exists");

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const dailyTarget = Math.ceil(args.target_signups / days);
    const bundledOffers = { min_lessons: 5, total_price: 1000 };
    const discountRule = { price_per_lesson: 200 };
    const revenueProjection = args.target_signups * 1000;
    const revenueShare = { partner_percentage: 20, sqooli_percentage: 80 };

    const campaignId = await ctx.db.insert("campaigns", {
      name: args.name,
      program_id: args.program_id,
      partner_id: args.partner_id,
      promo_code: promoCode,
      target_signups: args.target_signups,
      daily_target: dailyTarget,
      bundled_offers: bundledOffers,
      discount_rule: discountRule,
      revenue_projection: revenueProjection,
      revenue_share: revenueShare,
      whatsapp_number: args.whatsapp_number,
      duration_start: args.duration_start,
      duration_end: args.duration_end,
      status: "draft",
    });

    // 🔹 Generate assets
    const whatsappQRUrl = await generateWhatsAppQRCode(args.whatsapp_number, promoCode, args.name);
    const paymentQRUrl = await generatePaymentQRCode("4092033", 1000, promoCode);
    const socialPosterUrl = socialPostGenerator({
      campaignName: args.name,
      promoCode,
      whatsappNumber: args.whatsapp_number,
      programName: program.name,
    });

    const now = Date.now();
    const assetTemplates = [
      { type: "qr_code" as const, content: "WhatsApp QR Code", url: whatsappQRUrl },
      { type: "qr_code" as const, content: "Payment QR Code", url: paymentQRUrl },
      { type: "social_post" as const, content: "Branded campaign poster", url: socialPosterUrl },
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

export const getCampaignByPartner = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partnerId))
      .first();
  },
});