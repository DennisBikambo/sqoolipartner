// convex/partner.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ✅ READ all partners
 */
export const getAllPartners = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partners").collect();
  },
});

/**
 * ✅ CHECK if user exists in partners table (basic auth simulation)
 */
export const authenticateUser = query({
  args: { laravelUserId: v.number() },
  handler: async (ctx, args) => {
    const partner = await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("laravelUserId"), args.laravelUserId))
      .first();

    if (!partner) {
      return { authenticated: false };
    }
    return { authenticated: true, partner };
  },
});

/**
 * ✅ GET partner by name (for display or verification)
 */
export const getPartnerId = query({
  args: { user_name: v.string() },
  handler: async (ctx, args) => {
    const partner = await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("name"), args.user_name))
      .first();

    if (!partner) {
      return { authenticated: false };
    }
    return { authenticated: true, partner };
  },
});

/**
 * ✅ REGISTER a new partner (used during Laravel registration)
 */
export const register = mutation({
  args: {
    name: v.string(),
    laravelUserId: v.number(),
    email: v.string(),
    phone: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) {
      throw new Error("Email already exists");
    }

    const partnerId = await ctx.db.insert("partners", {
      name: args.name,
      laravelUserId: args.laravelUserId,
      email: args.email,
      phone: args.phone,
      username: args.username,
      is_first_login: true,
    });

    return {
      success: true,
      id: partnerId,
      message: "Partner registered successfully",
    };
  },
});

/**
 * ✅ FETCH a partner by email (used for login syncing)
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

/**
 * ✅ UPDATE Laravel user ID after login
 */
export const updateLaravelUserId = mutation({
  args: {
    email: v.string(),
    laravelUserId: v.number(),
  },
  handler: async (ctx, args) => {
    const { email, laravelUserId } = args;

    const partner = await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!partner) {
      throw new Error("Partner not found");
    }

    await ctx.db.patch(partner._id, { laravelUserId });
    return { success: true };
  },
});

export const completeOnboarding = mutation({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.partnerId, { is_first_login: false });
  },
});
