/**
 * Create Partner - For Super Admins
 *
 * This allows super admins to create new partner organizations
 * Each partner is independent and can manage their own users
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

/**
 * Utility to generate a secure extension
 */
function generateExtension(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let extension = "";
  for (let i = 0; i < 8; i++) {
    extension += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${extension}-${randomSuffix}`;
}

/**
 * Utility to generate random passwords
 */
function generateRandomPassword(length = 12): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Create a new partner organization (Super Admin only)
 * Creates both a partner record and an initial partner admin user
 */
export const createPartnerOrganization = mutation({
  args: {
    // Partner details
    partner_name: v.string(),
    partner_email: v.string(),
    partner_phone: v.string(),
    partner_username: v.string(),

    // Partner admin user details
    admin_name: v.string(),
    admin_email: v.string(),
    admin_phone: v.optional(v.string()),

    // Optional: specify permissions, otherwise use defaults
    partner_permission_ids: v.optional(v.array(v.id("permissions"))),
    admin_permission_ids: v.optional(v.array(v.id("permissions"))),
  },
  handler: async (ctx, args) => {
    // Check if partner email already exists
    const existingPartner = await ctx.db
      .query("partners")
      .filter((q) => q.eq(q.field("email"), args.partner_email))
      .first();

    if (existingPartner) {
      throw new Error(`Partner with email ${args.partner_email} already exists`);
    }

    // Check if admin user email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.admin_email))
      .unique();

    if (existingUser) {
      throw new Error(`User with email ${args.admin_email} already exists`);
    }

    // Get default permissions if not specified
    let partnerPermissions = args.partner_permission_ids;
    let adminPermissions = args.admin_permission_ids;

    if (!partnerPermissions || partnerPermissions.length === 0) {
      // Get all permissions for partners
      const allPermissions = await ctx.db.query("permissions").collect();
      partnerPermissions = allPermissions.map((p) => p._id);
    }

    if (!adminPermissions || adminPermissions.length === 0) {
      // Get all permissions for the admin user
      const allPermissions = await ctx.db.query("permissions").collect();
      adminPermissions = allPermissions.map((p) => p._id);
    }

    // Create the partner record
    const partnerId = await ctx.db.insert("partners", {
      name: args.partner_name,
      email: args.partner_email,
      phone: args.partner_phone,
      username: args.partner_username,
      laravelUserId: 0, // Not linked to Laravel initially
      is_first_login: true,
      permission_ids: partnerPermissions,
    });

    // Generate credentials for the partner admin user
    const adminPassword = generateRandomPassword(12);
    const adminExtension = generateExtension();
    const password_hash = bcrypt.hashSync(adminPassword, 10);

    // Create the partner admin user
    const userId = await ctx.db.insert("users", {
      partner_id: partnerId,
      email: args.admin_email,
      password_hash,
      name: args.admin_name,
      phone: args.admin_phone,
      role: "partner_admin",
      permission_ids: adminPermissions,
      extension: adminExtension,
      is_active: true,
      is_first_login: true,
      is_account_activated: true,
      last_login: undefined,
      updated_at: undefined,
    });

    return {
      success: true,
      message: "Partner organization created successfully",
      partner: {
        id: partnerId,
        name: args.partner_name,
        email: args.partner_email,
        phone: args.partner_phone,
        username: args.partner_username,
      },
      admin_user: {
        id: userId,
        name: args.admin_name,
        email: args.admin_email,
        extension: adminExtension,
        role: "partner_admin",
      },
      credentials: {
        partner_name: args.partner_name,
        admin_email: args.admin_email,
        admin_password: adminPassword,
        admin_extension: adminExtension,
      },
    };
  },
});

/**
 * List all partner organizations (Super Admin only)
 */
export const listPartners = query({
  args: {},
  handler: async (ctx) => {
    const partners = await ctx.db.query("partners").collect();

    // For each partner, get user count
    const partnersWithCounts = await Promise.all(
      partners.map(async (partner) => {
        const users = await ctx.db
          .query("users")
          .withIndex("by_partner_id", (q) => q.eq("partner_id", partner._id))
          .collect();

        const campaigns = await ctx.db
          .query("campaigns")
          .withIndex("by_partner_id", (q) => q.eq("partner_id", partner._id))
          .collect();

        return {
          id: partner._id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          username: partner.username,
          is_first_login: partner.is_first_login,
          user_count: users.length,
          campaign_count: campaigns.length,
          created_at: partner._creationTime,
        };
      })
    );

    return partnersWithCounts.sort((a, b) => b.created_at - a.created_at);
  },
});

/**
 * Get partner details with users
 */
export const getPartnerDetails = query({
  args: { partner_id: v.id("partners") },
  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partner_id);
    if (!partner) {
      throw new Error("Partner not found");
    }

    const users = await ctx.db
      .query("users")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partner_id))
      .collect();

    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partner_id))
      .collect();

    return {
      partner,
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        extension: u.extension,
      })),
      campaign_count: campaigns.length,
    };
  },
});

/**
 * Update partner details (Super Admin only)
 */
export const updatePartner = mutation({
  args: {
    partner_id: v.id("partners"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    username: v.optional(v.string()),
    is_first_login: v.optional(v.boolean()),
    permission_ids: v.optional(v.array(v.id("permissions"))),
  },
  handler: async (ctx, args) => {
    const { partner_id, ...fields } = args;

    const partner = await ctx.db.get(partner_id);
    if (!partner) {
      throw new Error("Partner not found");
    }

    // Check if email is being changed and if it's already in use
    if (fields.email && fields.email !== partner.email) {
      const existing = await ctx.db
        .query("partners")
        .filter((q) => q.eq(q.field("email"), fields.email!))
        .first();

      if (existing) {
        throw new Error(`Partner with email ${fields.email} already exists`);
      }
    }

    const patchData: Partial<typeof partner> = {};
    (Object.keys(fields) as Array<keyof typeof fields>).forEach((key) => {
      const value = fields[key];
      if (value !== undefined) {
        (patchData[key] as typeof value) = value;
      }
    });

    await ctx.db.patch(partner_id, patchData);

    return {
      success: true,
      message: "Partner updated successfully",
    };
  },
});

/**
 * Deactivate/activate partner (Super Admin only)
 * This deactivates all users under the partner
 */
export const togglePartnerStatus = mutation({
  args: {
    partner_id: v.id("partners"),
    activate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partner_id);
    if (!partner) {
      throw new Error("Partner not found");
    }

    // Get all users for this partner
    const users = await ctx.db
      .query("users")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partner_id))
      .collect();

    // Update all users' active status
    await Promise.all(
      users.map((user) =>
        ctx.db.patch(user._id, { is_active: args.activate })
      )
    );

    return {
      success: true,
      message: `Partner ${args.activate ? "activated" : "deactivated"} successfully`,
      users_affected: users.length,
    };
  },
});
