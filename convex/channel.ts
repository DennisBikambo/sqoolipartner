// convex/channel.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── CHANNELS ──────────────────────────────────────────────────────────────────

/**
 * CREATE a new channel
 */
export const createChannel = mutation({
  args: {
    partnerId: v.id("partners"),
    name: v.string(),
    code: v.string(),
    description: v.string(),
    created_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const channelId = await ctx.db.insert("channels", {
      partnerId: args.partnerId,
      name: args.name,
      code: args.code,
      description: args.description,
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: args.created_by,
    });
    return channelId;
  },
});

/**
 * READ all channels for a partner (optionally filtered by is_active)
 */
export const getChannelsByPartner = query({
  args: {
    partnerId: v.id("partners"),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.is_active !== undefined) {
      return await ctx.db
        .query("channels")
        .withIndex("by_partner_id", (q) => q.eq("partnerId", args.partnerId))
        .filter((q) => q.eq(q.field("is_active"), args.is_active!))
        .collect();
    }
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

/**
 * UPDATE a channel
 */
export const updateChannel = mutation({
  args: {
    id: v.id("channels"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    created_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.code !== undefined) patch.code = updates.code;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.created_by !== undefined) patch.created_by = updates.created_by;
    await ctx.db.patch(id, patch);
    return { success: true };
  },
});

/**
 * DEACTIVATE a channel (soft delete)
 */
export const deactivateChannel = mutation({
  args: { id: v.id("channels"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.id);
    if (!channel) throw new Error("Channel not found");
    await ctx.db.patch(args.id, { is_active: false, deactivation_reason: args.reason });
    return { success: true };
  },
});

/**
 * ACTIVATE a channel
 */
export const activateChannel = mutation({
  args: { id: v.id("channels") },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.id);
    if (!channel) throw new Error("Channel not found");
    await ctx.db.patch(args.id, { is_active: true });
    return { success: true };
  },
});

/**
 * DELETE a channel permanently
 */
export const deleteChannel = mutation({
  args: { id: v.id("channels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ── SUBCHANNELS ───────────────────────────────────────────────────────────────

/**
 * CREATE a sub-channel
 */
export const createSubchannel = mutation({
  args: {
    channel_id: v.id("channels"),
    partner_id: v.id("partners"),
    name: v.string(),
    prefix_code: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("subchannels", {
      channel_id: args.channel_id,
      partner_id: args.partner_id,
      name: args.name,
      prefix_code: args.prefix_code,
      description: args.description,
      is_active: true,
      created_at: new Date().toISOString(),
    });
    return id;
  },
});

/**
 * READ sub-channels for a channel (optionally filtered by is_active)
 */
export const getSubchannelsByChannel = query({
  args: {
    channel_id: v.id("channels"),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.is_active !== undefined) {
      return await ctx.db
        .query("subchannels")
        .withIndex("by_channel_id", (q) => q.eq("channel_id", args.channel_id))
        .filter((q) => q.eq(q.field("is_active"), args.is_active!))
        .collect();
    }
    return await ctx.db
      .query("subchannels")
      .withIndex("by_channel_id", (q) => q.eq("channel_id", args.channel_id))
      .collect();
  },
});

/**
 * UPDATE a sub-channel
 */
export const updateSubchannel = mutation({
  args: {
    id: v.id("subchannels"),
    name: v.optional(v.string()),
    prefix_code: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.prefix_code !== undefined) patch.prefix_code = updates.prefix_code;
    if (updates.description !== undefined) patch.description = updates.description;
    await ctx.db.patch(id, patch);
    return { success: true };
  },
});

/**
 * DEACTIVATE a sub-channel
 */
export const deactivateSubchannel = mutation({
  args: { id: v.id("subchannels"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { is_active: false, deactivation_reason: args.reason });
    return { success: true };
  },
});

/**
 * ACTIVATE a sub-channel
 */
export const activateSubchannel = mutation({
  args: { id: v.id("subchannels") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { is_active: true });
    return { success: true };
  },
});

/**
 * DELETE a sub-channel permanently
 */
export const deleteSubchannel = mutation({
  args: { id: v.id("subchannels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
