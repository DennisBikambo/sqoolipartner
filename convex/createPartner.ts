/**
 * Create Partner - For Super Admins
 *
 * This allows super admins to create new partner organizations
 * Each partner is independent and can manage their own users
 */

import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal as _internal } from "./_generated/api";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internal = _internal as any;
import { createAuth } from "./auth";

/**
 * Utility to generate random passwords
 */
function generateRandomPassword(length = 12): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

/**
 * Create a new partner organization (Super Admin only)
 * Creates both a partner record and an initial partner admin user via Better Auth.
 */
export const createPartnerOrganization = action({
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
    // Check uniqueness and get permissions
    const result = await ctx.runMutation(
      internal.createPartnerHelpers.createPartnerAndGetPermissions,
      {
        partner_name: args.partner_name,
        partner_email: args.partner_email,
        partner_phone: args.partner_phone,
        partner_username: args.partner_username,
        admin_email: args.admin_email,
        partner_permission_ids: args.partner_permission_ids,
        admin_permission_ids: args.admin_permission_ids,
      }
    );

    // Generate password and create Better Auth account for the admin user
    const adminPassword = generateRandomPassword(12);
    const auth = createAuth(ctx as any);

    let better_auth_id: string;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const baResult = await (auth.api.signUpEmail as any)({
        body: {
          email: args.admin_email,
          password: adminPassword,
          name: args.admin_name,
        },
      });
      better_auth_id = baResult?.user?.id ?? "";
      if (!better_auth_id) {
        throw new Error("Better Auth did not return a user ID");
      }
    } catch (err) {
      // Roll back the partner record so the admin can retry cleanly
      await ctx.runMutation(internal.createPartnerHelpers.deletePartner, {
        partner_id: result.partnerId,
      });
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to create admin account: ${msg}`);
    }

    // Insert the admin user record linked to Better Auth
    const userId = await ctx.runMutation(
      internal.createPartnerHelpers.insertPartnerAdminUser,
      {
        partner_id: result.partnerId,
        email: args.admin_email,
        better_auth_id,
        name: args.admin_name,
        phone: args.admin_phone,
        permission_ids: result.adminPermissions,
      }
    );

    // Fire-and-forget: send welcome email to the new partner admin
    await ctx.scheduler.runAfter(0, api.email.sendWelcomeEmail, {
      to: args.admin_email,
      userName: args.admin_name,
      partnerName: args.partner_name,
      password: adminPassword,
      loginUrl: process.env.SITE_URL ?? "https://sqooli.org",
    });

    return {
      success: true,
      message: "Partner organization created successfully",
      partner: {
        id: result.partnerId,
        name: args.partner_name,
        email: args.partner_email,
        phone: args.partner_phone,
        username: args.partner_username,
      },
      admin_user: {
        id: userId,
        name: args.admin_name,
        email: args.admin_email,
        role: "partner_admin",
      },
      credentials: {
        partner_name: args.partner_name,
        admin_email: args.admin_email,
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
