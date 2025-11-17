// convex/withdrawals.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Generate unique withdrawal reference
 */
function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WD-${timestamp}-${random}`;
}

/**
 * CHECK WITHDRAWAL AVAILABILITY
 * Pre-validate before showing the dialog
 */
export const checkAvailability = query({
  args: {
    partner_id: v.id("partners"),
    amount: v.number(),
  },
  handler: async (ctx, { partner_id, amount }) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .first();

    if (!wallet) {
      return {
        can_withdraw: false,
        reason: "Wallet not found",
        error_type: "wallet_not_found",
      };
    }

    if (!wallet.is_setup_complete) {
      return {
        can_withdraw: false,
        reason: "Please complete wallet setup first",
        error_type: "wallet_incomplete",
      };
    }

    const partnerLimit = await ctx.db
      .query("withdrawal_limits")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    const globalLimit = await ctx.db
      .query("withdrawal_limits")
      .withIndex("by_is_active", (q) => q.eq("is_active", true))
      .filter((q) => q.eq(q.field("partner_id"), undefined))
      .first();

    const limit = partnerLimit || globalLimit;

    if (!limit) {
      return {
        can_withdraw: false,
        reason: "Withdrawal limits not configured. Contact support.",
        error_type: "no_limits",
      };
    }

    if (amount > wallet.balance) {
      return {
        can_withdraw: false,
        reason: `Insufficient balance. Available: KES ${wallet.balance.toLocaleString()}`,
        error_type: "insufficient_balance",
        available_balance: wallet.balance,
      };
    }

    if (amount < limit.min_withdrawal_amount) {
      return {
        can_withdraw: false,
        reason: `Minimum withdrawal is KES ${limit.min_withdrawal_amount.toLocaleString()}`,
        error_type: "below_minimum",
        min_amount: limit.min_withdrawal_amount,
      };
    }

    if (amount > limit.max_withdrawal_amount) {
      return {
        can_withdraw: false,
        reason: `Maximum withdrawal is KES ${limit.max_withdrawal_amount.toLocaleString()}`,
        error_type: "exceeds_maximum",
        max_amount: limit.max_withdrawal_amount,
      };
    }

    // Get start of today in milliseconds
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todayWithdrawals = await ctx.db
      .query("withdrawals")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .filter((q) =>
        q.and(
          q.gte(q.field("_creationTime"), todayTimestamp),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "processing"),
            q.eq(q.field("status"), "completed")
          )
        )
      )
      .collect();

    const todayTotal = todayWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    if (todayTotal + amount > limit.daily_limit) {
      const remaining = limit.daily_limit - todayTotal;
      return {
        can_withdraw: false,
        reason: `Daily limit exceeded. Remaining today: KES ${remaining.toLocaleString()}`,
        error_type: "daily_limit",
        daily_limit: limit.daily_limit,
        used_today: todayTotal,
        remaining_today: remaining,
      };
    }

    // Get start of month in milliseconds
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartTimestamp = monthStart.getTime();

    const monthWithdrawals = await ctx.db
      .query("withdrawals")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .filter((q) =>
        q.and(
          q.gte(q.field("_creationTime"), monthStartTimestamp),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "processing"),
            q.eq(q.field("status"), "completed")
          )
        )
      )
      .collect();

    const monthTotal = monthWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    if (monthTotal + amount > limit.monthly_limit) {
      const remaining = limit.monthly_limit - monthTotal;
      return {
        can_withdraw: false,
        reason: `Monthly limit exceeded. Remaining this month: KES ${remaining.toLocaleString()}`,
        error_type: "monthly_limit",
        monthly_limit: limit.monthly_limit,
        used_this_month: monthTotal,
        remaining_this_month: remaining,
      };
    }

    return {
      can_withdraw: true,
      amount,
      available_balance: wallet.balance,
      remaining_balance: wallet.balance - amount,
      limits: {
        min: limit.min_withdrawal_amount,
        max: limit.max_withdrawal_amount,
        daily: limit.daily_limit,
        monthly: limit.monthly_limit,
      },
      usage: {
        today: todayTotal,
        remaining_today: limit.daily_limit - todayTotal - amount,
        this_month: monthTotal,
        remaining_this_month: limit.monthly_limit - monthTotal - amount,
      },
      processing_days: limit.processing_days,
    };
  },
});

/**
 * CREATE WITHDRAWAL
 */
export const createWithdrawal = mutation({
  args: {
    wallet_id: v.id("wallets"),
    user_id: v.id("users"),
    partner_id: v.id("partners"),
    amount: v.number(),
    withdrawal_method: v.union(
      v.literal("mpesa"),
      v.literal("bank"),
      v.literal("paybill")
    ),
    destination_details: v.object({
      account_number: v.string(),
      account_name: v.optional(v.string()),
      bank_name: v.optional(v.string()),
      branch: v.optional(v.string()),
      paybill_number: v.optional(v.string()),
    }),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { amount, wallet_id, partner_id } = args;
    const now = new Date().toISOString();

    const wallet = await ctx.db.get(wallet_id);
    if (!wallet) throw new Error("Wallet not found");
    if (!wallet.is_setup_complete) throw new Error("Wallet setup incomplete");
    if (wallet.balance < amount) throw new Error("Insufficient wallet balance");

    const partnerLimit = await ctx.db
      .query("withdrawal_limits")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    const globalLimit = await ctx.db
      .query("withdrawal_limits")
      .withIndex("by_is_active", (q) => q.eq("is_active", true))
      .filter((q) => q.eq(q.field("partner_id"), undefined))
      .first();

    const limit = partnerLimit || globalLimit;
    if (!limit) throw new Error("Withdrawal limits not configured");

    if (amount < limit.min_withdrawal_amount)
      throw new Error(`Minimum withdrawal is KES ${limit.min_withdrawal_amount}`);
    if (amount > limit.max_withdrawal_amount)
      throw new Error(`Maximum withdrawal is KES ${limit.max_withdrawal_amount}`);

    // Get start of today in milliseconds
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todayWithdrawals = await ctx.db
      .query("withdrawals")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .filter((q) =>
        q.and(
          q.gte(q.field("_creationTime"), todayTimestamp),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "processing"),
            q.eq(q.field("status"), "completed")
          )
        )
      )
      .collect();

    const todayTotal = todayWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    if (todayTotal + amount > limit.daily_limit)
      throw new Error(
        `Daily limit of KES ${limit.daily_limit} exceeded. Used today: KES ${todayTotal}`
      );

    // Get start of month in milliseconds
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartTimestamp = monthStart.getTime();

    const monthWithdrawals = await ctx.db
      .query("withdrawals")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .filter((q) =>
        q.and(
          q.gte(q.field("_creationTime"), monthStartTimestamp),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "processing"),
            q.eq(q.field("status"), "completed")
          )
        )
      )
      .collect();

    const monthTotal = monthWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    if (monthTotal + amount > limit.monthly_limit)
      throw new Error(
        `Monthly limit of KES ${limit.monthly_limit} exceeded. Used this month: KES ${monthTotal}`
      );

    const reference_number = generateReference();

    await ctx.db.patch(wallet_id, {
      balance: wallet.balance - amount,
      pending_balance: wallet.pending_balance + amount,
      updated_at: now,
    });

    const withdrawalId = await ctx.db.insert("withdrawals", {
      wallet_id,
      user_id: args.user_id,
      partner_id,
      amount,
      withdrawal_method: args.withdrawal_method,
      destination_details: args.destination_details,
      reference_number,
      status: "pending",
      notes: args.notes,
    });

    await ctx.db.insert("audit_logs", {
      user_id: args.user_id,
      partner_id,
      action: "withdrawal.requested",
      entity_type: "withdrawal",
      entity_id: withdrawalId,
      details: JSON.stringify({
        amount,
        reference: reference_number,
        method: args.withdrawal_method,
      }),
      created_at: now,
    });

    await ctx.runMutation(api.notifications.createNotification, {
      partnerId: args.partner_id,
      type: "success",
      title: "Withdrawal Request",
      message: "Your withdrawal request has been submitted",
    });

    // Send withdrawal notification email
    const partner = await ctx.db.get(partner_id);
    const user = await ctx.db.get(args.user_id);

    if (partner && user && user.email) {
      // Run email action asynchronously (don't block the withdrawal creation)
      ctx.scheduler.runAfter(0, api.emails.sendWithdrawalNotificationEmail, {
        partner_email: user.email,
        partner_name: partner.name,
        amount,
        reference_number,
        withdrawal_method: args.withdrawal_method,
        destination_account: args.destination_details.account_number,
        processing_days: limit.processing_days,
      });
    }

    return {
      withdrawalId,
      reference_number,
      amount,
      status: "pending",
      processing_days: limit.processing_days,
    };
  },
});

/**
 * GET WITHDRAWALS
 */
export const getWithdrawals = query({
  args: {
    partner_id: v.optional(v.id("partners")),
    user_id: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, { partner_id, user_id, status }) => {
    let withdrawals;

    if (partner_id) {
      withdrawals = await ctx.db
        .query("withdrawals")
        .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
        .order("desc")
        .collect();

      if (user_id) withdrawals = withdrawals.filter((w) => w.user_id === user_id);
    } else if (user_id) {
      withdrawals = await ctx.db
        .query("withdrawals")
        .filter((q) => q.eq(q.field("user_id"), user_id))
        .order("desc")
        .collect();
    } else {
      withdrawals = await ctx.db.query("withdrawals").order("desc").collect();
    }

    if (status) withdrawals = withdrawals.filter((w) => w.status === status);

    return withdrawals;
  },
});

/**
 * GET WITHDRAWAL STATS
 */
export const getWithdrawalStats = query({
  args: {
    partner_id: v.id("partners"),
  },
  handler: async (ctx, { partner_id }) => {
    const withdrawals = await ctx.db
      .query("withdrawals")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .collect();

    const stats = {
      total: withdrawals.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      total_amount: 0,
      pending_amount: 0,
      completed_amount: 0,
    };

    withdrawals.forEach((w) => {
      stats.total_amount += w.amount;

      switch (w.status) {
        case "pending":
          stats.pending++;
          stats.pending_amount += w.amount;
          break;
        case "processing":
          stats.processing++;
          stats.pending_amount += w.amount;
          break;
        case "completed":
          stats.completed++;
          stats.completed_amount += w.amount;
          break;
        case "failed":
          stats.failed++;
          break;
        case "cancelled":
          stats.cancelled++;
          break;
      }
    });

    return stats;
  },
});

export const getTotalWithdrawals = query({
  args: {
    partner_id: v.id("partners"),
  },
  handler: async (ctx, { partner_id }) => {
    const withdrawals = await ctx.db
      .query("withdrawals")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", partner_id))
      .collect();

    const completedWithdrawals = withdrawals.filter((w) => w.status === "completed");
    const pendingWithdrawals = withdrawals.filter(
      (w) => w.status === "pending" || w.status === "processing"
    );

    return {
      total_completed: completedWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      total_pending: pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      count_completed: completedWithdrawals.length,
      count_pending: pendingWithdrawals.length,
      recent_withdrawals: withdrawals
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 5),
    };
  },
});