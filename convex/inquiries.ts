import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitPartnershipInquiry = mutation({
  args: {
    org_name: v.string(),
    email: v.string(),
    partnership_type: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("partner_inquiries", {
      org_name: args.org_name,
      email: args.email,
      partnership_type: args.partnership_type,
      message: args.message,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    return { success: true };
  },
});
