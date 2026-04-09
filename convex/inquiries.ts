import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const submitPartnershipInquiry = mutation({
  args: {
    org_name: v.string(),
    email: v.string(),
    partnership_type: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("partner_inquiries", {
      org_name: args.org_name,
      email: args.email,
      partnership_type: args.partnership_type,
      message: args.message,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "inquiries.submitPartnershipInquiry",
      status: "success",
      details: JSON.stringify({ id, org_name: args.org_name, email: args.email, partnership_type: args.partnership_type }),
    });
    return { success: true };
  },
});
