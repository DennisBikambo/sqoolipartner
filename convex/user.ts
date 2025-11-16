// server/user.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import bcrypt from "bcryptjs";

/**
 * Utility to generate random passwords
 */
function generateRandomPassword(length = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Utility to generate a secure but simple unique extension
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
 * ➕ Create a new user (password + extension generated automatically)
 */
export const createUser = mutation({
  args: {
    partner_id: v.id("partners"),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(
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
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const generatedPassword = generateRandomPassword(10);
    const extension = generateExtension();

    // ✅ Use synchronous hash to avoid Convex setTimeout error
    const password_hash = bcrypt.hashSync(generatedPassword, 10);

    const userId = await ctx.db.insert("users", {
      partner_id: args.partner_id,
      email: args.email,
      password_hash,
      name: args.name,
      phone: args.phone,
      role: args.role,
      permission_ids: args.permission_ids, 
      extension,
      is_active: true,
      is_first_login: true,
      last_login: undefined,
      updated_at: undefined,
      is_account_activated: true,
    });

    await ctx.runMutation(api.notifications.createNotification, {
      partnerId: args.partner_id,
      type: "success",
      title: "User created successfully",
      message: `User with email ${args.email} has been created successfully`,
    });

    return {
      message: "User created successfully",
      userId,
      generatedPassword,
      extension,
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
        v.literal("partner_admin"),
        v.literal("accountant"),
        v.literal("campaign_manager"),
        v.literal("viewer"),
        v.literal("super_agent"),
        v.literal("master_agent"),
        v.literal("merchant_admin")
      )
    ),
    is_active: v.optional(v.boolean()),
    is_account_activated: v.optional(v.boolean()),
    is_first_login: v.optional(v.boolean()),
    permission_ids: v.optional(v.array(v.id("permissions"))), // ✅ multiple permissions
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

/**
 * 🔐 Login user
 */
export const login = mutation({
  args: { email: v.string(), password: v.string(), extension: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) throw new Error("Invalid email or password");

    const isMatch = bcrypt.compareSync(args.password, user.password_hash);
    if (!isMatch) throw new Error("Invalid email or password");
    if (user.extension !== args.extension) {
      throw new Error("Invalid extension");
    }

    await ctx.db.patch(user._id, {
      last_login: new Date().toISOString(),
      is_first_login: false,
    });

    
    const permissions = await Promise.all(
      (user.permission_ids || []).map((id) => ctx.db.get(id))
    );

    return {
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        partner_id: user.partner_id,
        is_account_activated: user.is_account_activated,
        extension: user.extension,
        permissions: permissions.filter(Boolean),
      },
    };
  },
});


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
