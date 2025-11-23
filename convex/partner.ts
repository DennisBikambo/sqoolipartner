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

    // Get ALL permissions for new partners (partner_admin level access)
    const allPermissions = await ctx.db.query("permissions").collect();
    const allPermissionIds = allPermissions.map((p) => p._id);


    // Get default permissions for new partners (partner_admin level access)
    const defaultPermissions = await ctx.db.query("permissions").filter((q) => q.eq(q.field("is_default"), true)).collect();
    const defaultPermissionIds = defaultPermissions.map((p) => p._id);

    // Create and update permissions for new partner
    const userPermissions = await ctx.db.query("permissions").filter((q) => q.eq(q.field("category"), "users")).collect();
    const userPermissionIds = userPermissions.map((p) => p._id);
    const totalPartnerPermissions = defaultPermissionIds.concat(userPermissionIds);

    if (allPermissionIds.length === 0) {
      throw new Error("No permissions found. Please run seedPermissions first.");
    }

    const partnerId = await ctx.db.insert("partners", {
      name: args.name,
      laravelUserId: args.laravelUserId,
      email: args.email,
      phone: args.phone,
      username: args.username,
      is_first_login: true,
      permission_ids: totalPartnerPermissions, 
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


export const getById = query({
  args: { partner_id: v.id("partners") },
  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partner_id);
    return partner;
  },
});
