import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ➕ Create an audit log entry
 */
export const createAuditLog = mutation({
  args: {
    user_id: v.id("users"),
    partner_id: v.id("partners"),
    action: v.string(), // e.g., "user.created"
    entity_type: v.string(), // e.g., "user", "campaign"
    entity_id: v.optional(v.string()),
    details: v.optional(v.string()),
    ip_address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const created_at = new Date().toISOString();

    const auditId = await ctx.db.insert("audit_logs", {
      ...args,
      created_at,
    });

    return {
      message: "Audit log created successfully",
      auditId,
    };
  },
});

/**
 * 📄 Get all audit logs (optionally filtered by user or partner)
 */
export const getAuditLogs = query({
  args: {
    user_id: v.optional(v.id("users")),
    partner_id: v.optional(v.id("partners")),
  },
  handler: async (ctx, args) => {
    let logs;

    if (args.user_id) {
      logs = await ctx.db
        .query("audit_logs")
        .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id!))
        .collect();
    } else if (args.partner_id) {
      logs = await ctx.db
        .query("audit_logs")
        .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partner_id!))
        .collect();
    } else {
      logs = await ctx.db.query("audit_logs").collect();
    }

    // Enrich each log with the acting user's name and avatar
    return await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.user_id);
        return {
          ...log,
          userName: user?.name ?? "Unknown",
          userAvatar: (user as { avatar_url?: string } | null)?.avatar_url ?? null,
          userInitials: user?.name
            ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
            : "?",
        };
      })
    );
  },
});

/**
 * 📄 Get audit logs by action type
 */
export const getAuditLogsByAction = query({
  args: { action: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audit_logs")
      .withIndex("by_action", (q) => q.eq("action", args.action))
      .collect();
  },
});
