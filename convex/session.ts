import { mutation } from "./_generated/server";
import { v } from "convex/values";


function generateSessionToken(length = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * ➕ Create session for user (expires in 2 hours)
 */
export const createSession = mutation({
  args: {
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const token = generateSessionToken();
    const now = new Date();
    const expires_at = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // +2hrs

    await ctx.db.insert("sessions", {
      user_id: args.user_id,
      token,
      created_at: now.toISOString(),
      expires_at,
    });

    return { token, expires_at };
  },
});

/**
 * 🔍 Validate session token
 */
export const validateSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) return null;

    if (new Date(session.expires_at) < new Date()) {
      
      await ctx.db.delete(session._id);
      return null;
    }

    const user = await ctx.db.get(session.user_id);
    if (!user) return null;

    return { user, session };
  },
});

export const deleteSession = mutation(async (ctx, { token }: { token: string }) => {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) {
    console.log("⚠️ No session found for token:", token);
    return { success: false, message: "Session not found" };
  }

  await ctx.db.delete(session._id);
  console.log("✅ Session deleted:", session._id);

  return { success: true };
});
