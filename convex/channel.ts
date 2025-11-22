// convex/channel.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * CREATE a new channel
 */
export const createChannel = mutation({
  args: {
    partnerId: v.id("partners"),
    name: v.string(),
    code: v.string(),
    subchannels: v.array(v.string()),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const channelId = await ctx.db.insert("channels", {
      partnerId: args.partnerId,
      name: args.name,
      code: args.code,
      subchanells: args.subchannels,
      description: args.description,
    });
    return channelId;
  },
});

/**
 * READ all channels for a partner
 */
export const getChannelsByPartner = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_partner_id", (q) => q.eq("partnerId", args.partnerId))
      .collect();
  },
});

/**
 * READ a single channel by ID
 */
export const getChannelById = query({
  args: { id: v.id("channels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * UPDATE a channel
 */
export const updateChannel = mutation({
  args: {
    id: v.id("channels"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    subchannels: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.code !== undefined) updateData.code = updates.code;
    if (updates.subchannels !== undefined) updateData.subchanells = updates.subchannels;
    if (updates.description !== undefined) updateData.description = updates.description;

    await ctx.db.patch(id, updateData);
    return { success: true };
  },
});

/**
 * DELETE a channel
 */
export const deleteChannel = mutation({
  args: { id: v.id("channels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * GET channel by code
 */
export const getChannelByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .filter((q) => q.eq(q.field("code"), args.code))
      .first();
  },
});