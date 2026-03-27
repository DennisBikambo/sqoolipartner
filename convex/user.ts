// server/user.ts
import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal as _internal } from "./_generated/api";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internal = _internal as any;
import bcrypt from "bcryptjs";
import { createAuth } from "./auth";

/**
 * Utility to generate random passwords
 */
function generateRandomPassword(length = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

/**
 * ➕ Create a new user via Better Auth (password auto-generated)
 * Uses Better Auth admin API to create the account, then inserts the app user record.
 */
export const createUser = action({
  args: {
    partner_id: v.id("partners"),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    role: v.union(
      v.literal("super_admin"),
      v.literal("partner_admin"),
      v.literal("accountant"),
      v.literal("campaign_manager"),
      v.literal("viewer"),
      v.literal("super_agent"),
      v.literal("master_agent"),
      v.literal("merchant_admin")
    ),
    permission_ids: v.array(v.id("permissions")),
  },
  handler: async (ctx, args) => {
    // Check email uniqueness before creating the Better Auth account
    const existingUser = await ctx.runQuery(internal.userHelpers.getUserByEmailInternal, {
      email: args.email,
    });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const generatedPassword = generateRandomPassword(10);

    // Create the user in Better Auth (handles password hashing internally)
    const auth = createAuth(ctx as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baResult = await (auth.api.signUpEmail as any)({
      body: { email: args.email, password: generatedPassword, name: args.name },
    });

    const better_auth_id: string = baResult?.user?.id ?? "";

    // Insert the app-level user record linked to the Better Auth account
    const result = await ctx.runMutation(internal.userHelpers.insertUserRecord, {
      partner_id: args.partner_id,
      email: args.email,
      better_auth_id,
      name: args.name,
      phone: args.phone,
      avatar_url: args.avatar_url,
      role: args.role,
      permission_ids: args.permission_ids,
    });

    // Fire-and-forget: send welcome email
    const partner = await ctx.runQuery(api.partner.getById, { partner_id: args.partner_id });
    await ctx.scheduler.runAfter(0, api.email.sendWelcomeEmail, {
      to: args.email,
      userName: args.name,
      partnerName: partner?.name ?? "Sqooli",
      password: generatedPassword,
      loginUrl: process.env.SITE_URL ?? "https://sqooli.org",
    });

    return {
      message: "User created successfully",
      userId: result.userId,
    };
  },
});

/**
 * 📄 Get all users (optionally filtered by partner)
 */
export const getUsers = query({
  args: { partner_id: v.optional(v.id("partners")) },
  handler: async (ctx, args) => {
    const users = args.partner_id
      ? await ctx.db
          .query("users")
          .withIndex("by_partner_id", (q) =>
            q.eq("partner_id", args.partner_id!)
          )
          .collect()
      : await ctx.db.query("users").collect();

    return users;
  },
});

/**
 * 📄 Get single user by ID (with expanded permissions)
 */
export const getUserById = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id);
    if (!user) throw new Error("User not found");

    // ✅ Fetch permissions linked to the user
    const permissions = await Promise.all(
      (user.permission_ids || []).map((id) => ctx.db.get(id))
    );

    return { ...user, permissions: permissions.filter(Boolean) };
  },
});

/**
 * ✏️ Dynamically update user fields
 */
export const updateUser = mutation({
  args: {
    user_id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("super_admin"),
        v.literal("partner_admin"),
        v.literal("accountant"),
        v.literal("campaign_manager"),
        v.literal("viewer"),
        v.literal("super_agent"),
        v.literal("master_agent"),
        v.literal("merchant_admin")
      )
    ),
    avatar_url: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    is_account_activated: v.optional(v.boolean()),
    is_first_login: v.optional(v.boolean()),
    permission_ids: v.optional(v.array(v.id("permissions"))),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user_id, password, ...fields } = args;
    const existingUser = await ctx.db.get(user_id);
    if (!existingUser) throw new Error("User not found");

    const patchData: Partial<typeof existingUser> = {};

    (Object.keys(fields) as Array<keyof typeof fields>).forEach((key) => {
      const value = fields[key];
      if (value !== undefined) {
        (patchData[key] as typeof value) = value;
      }
    });

    if (password) {
      patchData.password_hash = bcrypt.hashSync(password, 10);
    }

    patchData.updated_at = new Date().toISOString();
    await ctx.db.patch(user_id, patchData);

    return { message: "User updated successfully", updatedFields: patchData };
  },
});

/**
 * ❌ Delete user
 */
export const deleteUser = mutation({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.user_id);
    if (!existing) throw new Error("User not found");

    await ctx.db.delete(args.user_id);
    return { message: "User deleted successfully" };
  },
});

// Login is now handled by Better Auth (authComponent.registerRoutes in http.ts)
// The old login mutation has been removed.


export const getUserByCampaign = query({
  args: {
    campaignId: v.id("campaigns"), 
  },
  handler: async ({ db }, { campaignId }) => {
    // Fetch the campaign record
    const campaign = await db.get(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Ensure the campaign has a userId field
    if (!campaign.user_id) {
      throw new Error("Campaign has no associated user");
    }

    // Fetch the user linked to this campaign
    const user = await db.get(campaign.user_id);
    if (!user) {
      throw new Error("User not found");
    }

    // Return minimal user info (you can expand if needed)
    return {
      _id: user._id,
      name: user.name ?? "Unknown User",
      email: user.email ?? "N/A",
      createdAt: user._creationTime,
    };
  },
})
