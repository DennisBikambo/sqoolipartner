// convex/notifications.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * CREATE NOTIFICATION
 * Creates a new notification for a partner
 */
export const createNotification = mutation({
  args: {
    partnerId: v.id("partners"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      partnerId: args.partnerId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * GET NOTIFICATIONS
 * Fetches notifications for a partner with optional filters
 */
export const getNotifications = query({
  args: {
    partnerId: v.id("partners"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { partnerId, unreadOnly, limit = 50 }) => {
    const query = ctx.db
      .query("notifications")
      .withIndex("by_partner_id", (q) => q.eq("partnerId", partnerId))
      .order("desc");

    const notifications = await query.collect();

    let filtered = notifications;

    if (unreadOnly) {
      filtered = notifications.filter((n) => !n.isRead);
    }

    const limited = limit ? filtered.slice(0, limit) : filtered;

    return limited;
  },
});

/**
 * GET UNREAD COUNT
 * Returns the count of unread notifications
 */
export const getUnreadCount = query({
  args: {
    partnerId: v.id("partners"),
  },
  handler: async (ctx, { partnerId }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_partnerId_isRead", (q) =>
        q.eq("partnerId", partnerId).eq("isRead", false)
      )
      .collect();

    return notifications.length;
  },
});

/**
 * MARK AS READ
 * Marks a single notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, { notificationId }) => {
    const notification = await ctx.db.get(notificationId);
    
    if (!notification) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(notificationId, {
      isRead: true,
    });

    return { success: true };
  },
});

/**
 * MARK ALL AS READ
 * Marks all notifications for a partner as read
 */
export const markAllAsRead = mutation({
  args: {
    partnerId: v.id("partners"),
  },
  handler: async (ctx, { partnerId }) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_partnerId_isRead", (q) =>
        q.eq("partnerId", partnerId).eq("isRead", false)
      )
      .collect();

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true })
      )
    );

    return { success: true, count: unreadNotifications.length };
  },
});

/**
 * DELETE NOTIFICATION
 * Deletes a single notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, { notificationId }) => {
    const notification = await ctx.db.get(notificationId);
    
    if (!notification) {
      throw new Error("Notification not found");
    }

    await ctx.db.delete(notificationId);

    return { success: true };
  },
});

/**
 * DELETE ALL NOTIFICATIONS
 * Deletes all notifications for a partner
 */
export const deleteAllNotifications = mutation({
  args: {
    partnerId: v.id("partners"),
  },
  handler: async (ctx, { partnerId }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_partner_id", (q) => q.eq("partnerId", partnerId))
      .collect();

    await Promise.all(
      notifications.map((notification) => ctx.db.delete(notification._id))
    );

    return { success: true, count: notifications.length };
  },
});

/**
 * DELETE READ NOTIFICATIONS
 * Deletes all read notifications for a partner
 */
export const deleteReadNotifications = mutation({
  args: {
    partnerId: v.id("partners"),
  },
  handler: async (ctx, { partnerId }) => {
    const readNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_partnerId_isRead", (q) =>
        q.eq("partnerId", partnerId).eq("isRead", true)
      )
      .collect();

    await Promise.all(
      readNotifications.map((notification) => ctx.db.delete(notification._id))
    );

    return { success: true, count: readNotifications.length };
  },
});