import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getAssetsByCampaign = query({
  args: { campaign_id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_campaign_id", (q) => q.eq("campaign_id", args.campaign_id))
      .collect();
  },
});

/**
 * Upsert an asset — inserts if no asset of that type exists for the campaign,
 * otherwise patches the existing record.
 */
export const saveAsset = mutation({
  args: {
    campaign_id: v.id("campaigns"),
    type: v.union(
      v.literal("qr_code"),
      v.literal("social_post"),
      v.literal("flyer"),
      v.literal("how_to_pay")
    ),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("assets")
      .withIndex("by_campaign_id", (q) => q.eq("campaign_id", args.campaign_id))
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        url: args.url,
        content: args.content,
        generated_at: Date.now(),
      });
      await ctx.runMutation(internal.systemLogs.logEvent, {
        level: "info", source: "backend",
        event_name: "assets.saveAsset",
        status: "success",
        details: JSON.stringify({ asset_id: existing._id, campaign_id: args.campaign_id, type: args.type, action: "updated" }),
      });
      return existing._id;
    }

    const id = await ctx.db.insert("assets", {
      campaign_id: args.campaign_id,
      type: args.type,
      url: args.url,
      content: args.content,
      generated_at: Date.now(),
    });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "assets.saveAsset",
      status: "success",
      details: JSON.stringify({ asset_id: id, campaign_id: args.campaign_id, type: args.type, action: "created" }),
    });
    return id;
  },
});
