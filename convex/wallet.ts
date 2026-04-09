
import {query} from "./_generated/server"
import {v} from "convex/values"
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";



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
    
    const start = Date.now();
    const walletId = await ctx.db.insert("wallets", {
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
    await ctx.runMutation(internal.systemLogs.logEvent, {
      user_id: String(args.user_id),
      level: "info", source: "backend",
      event_name: "wallet.createWallet",
      status: "success",
      duration_ms: Date.now() - start,
      details: JSON.stringify({ walletId, partner_id: args.partner_id, method: args.withdrawal_method }),
    });
    return walletId;
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

    const start = Date.now();

    // Anomaly: balance going negative
    if (newBalance < 0) {
      await ctx.runMutation(internal.systemLogs.logEvent, {
        user_id: String(args.partner_id),
        level: "error", source: "backend",
        event_name: "anomaly.walletBalanceNegative",
        status: "error",
        message: `Wallet balance going negative: KES ${newBalance} after adjusting by KES ${args.amount_to_add}`,
        details: JSON.stringify({ partner_id: args.partner_id, prev_balance: wallet.balance, adjustment: args.amount_to_add, new_balance: newBalance }),
      });
    }

    // Anomaly: lifetime earnings less than balance
    if (newLifetime < newBalance) {
      await ctx.runMutation(internal.systemLogs.logEvent, {
        user_id: String(args.partner_id),
        level: "error", source: "backend",
        event_name: "anomaly.lifetimeEarningsMismatch",
        status: "error",
        message: `Lifetime earnings KES ${newLifetime} < balance KES ${newBalance} — data inconsistency`,
        details: JSON.stringify({ partner_id: args.partner_id, lifetime: newLifetime, balance: newBalance }),
      });
    }

    await ctx.db.patch(wallet._id, {
      balance: newBalance,
      lifetime_earnings: newLifetime,
      updated_at: new Date().toISOString(),
    });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      user_id: String(args.partner_id),
      level: "info", source: "backend",
      event_name: "wallet.updateWalletBalance",
      status: "success",
      duration_ms: Date.now() - start,
      details: JSON.stringify({ partner_id: args.partner_id, amount_added: args.amount_to_add, new_balance: newBalance }),
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

    await ctx.runMutation(internal.systemLogs.logEvent, {
      user_id: String(wallet.user_id),
      level: "info", source: "backend",
      event_name: "wallet.updateWallet",
      status: "success",
      details: JSON.stringify({ wallet_id: args.wallet_id, partner_id: wallet.partner_id, method: args.withdrawal_method }),
    });

    return { success: true, message: "Wallet updated successfully" };
  },
});


export const getAllWallets = query({
  handler: async (ctx) => {
    return await ctx.db.query("wallets").collect();
  },
});