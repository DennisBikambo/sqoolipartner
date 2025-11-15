
import {query} from "./_generated/server"
import {v} from "convex/values"
import { mutation } from "./_generated/server";



export const createWallet = mutation({
  args: {
    partner_id: v.id("partners"),
    user_id: v.id("users"),
    account_number: v.string(),
    withdrawal_method: v.union(
      v.literal("mpesa"),
      v.literal("bank"),
      v.literal("paybill")
    ),
    paybill_number: v.optional(v.string()),
    pin: v.string(),
    beneficiaries: v.array(
      v.object({
        label: v.string(),
        account_number: v.string(),
        provider: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("wallets", {
      account_number: args.account_number,
      partner_id: args.partner_id,
      user_id: args.user_id,
      balance: 0,
      pending_balance: 0,
      lifetime_earnings: 0,
      withdrawal_method: args.withdrawal_method,
      paybill_number: args.paybill_number,
      beneficiaries: args.beneficiaries,
      pin: args.pin,
      pin_set_at: now,
      created_at: now,
      is_setup_complete: true,
    });
  },
});

export const getWalletByPartnerId = query({
  args: { partner_id: v.id("partners") },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partner_id))
      .first(); 
    return wallet ?? null;
  },
});



export const verifyPin = query({
  args: {
    wallet_id: v.id("wallets"),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.wallet_id);
    if (!wallet) return { success: false, error: "Wallet not found" };
    if (wallet.pin === args.pin) {
      return { success: true };
    } else {
      return { success: false, error: "Invalid PIN" };
    }
  },
});



export const updateWalletBalance = mutation({
  args: {
    partner_id: v.id("partners"),
    amount_to_add: v.number(),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partner_id))
      .first();

    if (!wallet) {
      throw new Error(`Wallet not found for partner ${args.partner_id}`);
    }

    const newBalance = (wallet.balance || 0) + args.amount_to_add;
    const newLifetime = (wallet.lifetime_earnings || 0) + args.amount_to_add;

    await ctx.db.patch(wallet._id, {
      balance: newBalance,
      lifetime_earnings: newLifetime,
      updated_at: new Date().toISOString(),
    });

    return { success: true, new_balance: newBalance };
  },
});

export const getWalletByPartner = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", args.partnerId))
      .first();
  },
});

export const updateWallet = mutation({
  args: {
    wallet_id: v.id("wallets"),
    account_number: v.string(),
    withdrawal_method: v.union(
      v.literal("mpesa"),
      v.literal("bank"),
      v.literal("paybill")
    ),
    paybill_number: v.optional(v.string()),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.wallet_id);
    
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const updateData: Partial<typeof wallet> = {
      account_number: args.account_number,
      withdrawal_method: args.withdrawal_method,
      pin: args.pin,
      pin_set_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (args.withdrawal_method === "paybill" && args.paybill_number) {
      updateData.paybill_number = args.paybill_number;
    } else if (args.withdrawal_method !== "paybill") {
      updateData.paybill_number = undefined;
    }

    await ctx.db.patch(args.wallet_id, updateData);

    return { success: true, message: "Wallet updated successfully" };
  },
});