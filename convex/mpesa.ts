import { httpAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
// internal.systemLogs.logEvent is used for observability throughout this file

/**
 * M-Pesa C2B Validation endpoint
 * Safaricom calls this before processing the payment.
 * We accept all payments unconditionally.
 */
export const c2bValidation = httpAction(async (_ctx, request) => {
  const webhookSecret = process.env.MPESA_WEBHOOK_SECRET;
  const providedSecret = request.headers.get("x-webhook-secret");
  if (webhookSecret && providedSecret !== webhookSecret) {
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

/**
 * M-Pesa C2B Confirmation endpoint
 * Safaricom calls this after the payment is confirmed.
 * Payload example:
 * {
 *   TransactionType: "Pay Bill",
 *   TransID: "OEI2AK4Q16",
 *   TransTime: "20191122063845",
 *   TransAmount: "7500",
 *   BusinessShortCode: "247247",
 *   BillRefNumber: "SQCAMP123",   ← campaign promo code
 *   MSISDN: "254708374149",
 *   FirstName: "John",
 *   LastName: "Doe"
 * }
 */
export const c2bConfirmation = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.MPESA_WEBHOOK_SECRET;
  const providedSecret = request.headers.get("x-webhook-secret");
  if (webhookSecret && providedSecret !== webhookSecret) {
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await request.json() as {
      TransID: string;
      TransAmount: string;
      BillRefNumber: string;
      MSISDN: string;
      FirstName?: string;
      LastName?: string;
    };

    const promoCode = (payload.BillRefNumber ?? "").trim().toUpperCase();
    const amount = parseFloat(payload.TransAmount);
    const studentName = `${payload.FirstName ?? ""} ${payload.LastName ?? ""}`.trim() || "Unknown";

    await ctx.runMutation(internal.mpesa.processC2BPayment, {
      mpesa_code: payload.TransID,
      amount,
      promo_code: promoCode,
      phone_number: payload.MSISDN,
      student_name: studentName,
    });
  } catch (err) {
    console.error("M-Pesa C2B confirmation error:", err);
    // Always return success to Safaricom — avoids repeated retries
  }

  return new Response(
    JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

/**
 * Internal mutation — the actual payment processing logic.
 * Called from the confirmation HTTP action.
 */
export const processC2BPayment = internalMutation({
  args: {
    mpesa_code: v.string(),
    amount: v.number(),
    promo_code: v.string(),
    phone_number: v.string(),
    student_name: v.string(),
  },
  handler: async (ctx, args) => {
    const start = Date.now();

    // 1. Deduplicate — skip if this M-Pesa code was already recorded
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_mpesa_code", (q) => q.eq("mpesa_code", args.mpesa_code))
      .first();
    if (existing) {
      await ctx.runMutation(internal.systemLogs.logEvent, {
        level: "warn", source: "http",
        event_name: "mpesa.c2bPayment",
        status: "warn",
        message: `Duplicate M-Pesa code skipped: ${args.mpesa_code}`,
        details: JSON.stringify({ mpesa_code: args.mpesa_code, promo_code: args.promo_code }),
      });
      return { skipped: true };
    }

    // 2. Look up campaign by promo code
    const campaign = await ctx.db
      .query("campaigns")
      .withIndex("by_promo_code", (q) => q.eq("promo_code", args.promo_code))
      .first();

    if (!campaign) {
      console.error(`M-Pesa payment received for unknown promo code: ${args.promo_code}`);
      await ctx.runMutation(internal.systemLogs.logEvent, {
        level: "warn", source: "http",
        event_name: "mpesa.c2bPayment",
        status: "warn",
        message: `Unknown promo code: ${args.promo_code}`,
        details: JSON.stringify({ mpesa_code: args.mpesa_code, promo_code: args.promo_code, amount: args.amount }),
      });
      return { skipped: true, reason: "campaign_not_found" };
    }

    // ── Financial anomaly checks ─────────────────────────────────────────────
    const expectedAmount = campaign.bundled_offers.total_price;
    const anomalies: string[] = [];

    // Amount is zero or negative
    if (args.amount <= 0) {
      anomalies.push(`Invalid amount: KES ${args.amount}`);
    }

    // Amount doesn't match the campaign bundled price (not a whole multiple)
    const grossAmount = Math.round(args.amount * 100) / 100;
    if (expectedAmount > 0 && Math.round(grossAmount % expectedAmount * 100) / 100 !== 0) {
      anomalies.push(`Amount KES ${grossAmount} is not a multiple of bundled price KES ${expectedAmount}`);
    }

    // Amount is unreasonably large (> 20x bundled price)
    if (expectedAmount > 0 && args.amount > expectedAmount * 20) {
      anomalies.push(`Unusually large payment: KES ${args.amount} (expected ~KES ${expectedAmount})`);
    }

    // Revenue split sanity — partner share cannot exceed gross
    const expectedShare = Math.round(args.amount * (campaign.revenue_share.partner_percentage / 100) * 100) / 100;
    if (expectedShare > args.amount) {
      anomalies.push(`Revenue split error: partner share KES ${expectedShare} > gross KES ${args.amount}`);
    }

    // Percentages must add up to 100
    const totalPct = campaign.revenue_share.partner_percentage + campaign.revenue_share.sqooli_percentage;
    if (totalPct !== 100) {
      anomalies.push(`Revenue split percentages add up to ${totalPct}% instead of 100%`);
    }

    // Rapid successive payments — same phone to same campaign within 3 minutes
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
    const recentPayment = await ctx.db
      .query("transactions")
      .withIndex("by_campaign_code", q => q.eq("campaign_code", args.promo_code))
      .filter(q =>
        q.and(
          q.eq(q.field("phone_number"), args.phone_number),
          q.eq(q.field("status"), "Success"),
          q.gte(q.field("_creationTime"), threeMinutesAgo)
        )
      )
      .first();
    if (recentPayment) {
      anomalies.push(`Rapid successive payment: ${args.phone_number} paid to ${args.promo_code} again within 3 minutes`);
    }

    // Log all anomalies found
    for (const anomaly of anomalies) {
      await ctx.runMutation(internal.systemLogs.logEvent, {
        level: "error", source: "http",
        event_name: "anomaly.financialCheck",
        status: "error",
        message: anomaly,
        details: JSON.stringify({
          mpesa_code: args.mpesa_code,
          amount: args.amount,
          expected_amount: expectedAmount,
          promo_code: args.promo_code,
          phone: args.phone_number,
          campaign_id: campaign._id,
        }),
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const now = new Date().toISOString();

    // 3. Record the transaction
    const transactionId = await ctx.db.insert("transactions", {
      student_name: args.student_name,
      phone_number: args.phone_number,
      mpesa_code: args.mpesa_code,
      amount: args.amount,
      campaign_code: args.promo_code,
      partner_id: campaign.partner_id,
      status: "Success",
      created_at: now,
      verified_at: now,
    });

    // 4. Calculate the partner's revenue share
    const partnerShare = Math.round(args.amount * (campaign.revenue_share.partner_percentage / 100) * 100) / 100;

    // 5. Update the partner's wallet balance
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", campaign.partner_id))
      .first();

    if (wallet) {
      const newBalance = (wallet.balance ?? 0) + partnerShare;
      const newLifetime = (wallet.lifetime_earnings ?? 0) + partnerShare;

      // Anomaly: balance going negative (should never happen on a credit)
      if (newBalance < 0) {
        await ctx.runMutation(internal.systemLogs.logEvent, {
          level: "error", source: "http",
          event_name: "anomaly.walletBalanceNegative",
          status: "error",
          message: `Wallet balance would go negative after credit: KES ${newBalance}`,
          details: JSON.stringify({ wallet_id: wallet._id, prev_balance: wallet.balance, credit: partnerShare, new_balance: newBalance }),
        });
      }

      // Anomaly: lifetime earnings less than balance (data inconsistency)
      if (newLifetime < newBalance) {
        await ctx.runMutation(internal.systemLogs.logEvent, {
          level: "error", source: "http",
          event_name: "anomaly.lifetimeEarningsMismatch",
          status: "error",
          message: `Lifetime earnings KES ${newLifetime} is less than current balance KES ${newBalance}`,
          details: JSON.stringify({ wallet_id: wallet._id, lifetime: newLifetime, balance: newBalance }),
        });
      }

      await ctx.db.patch(wallet._id, {
        balance: newBalance,
        lifetime_earnings: newLifetime,
        updated_at: now,
      });
    } else {
      // Anomaly: payment received but partner has no wallet
      await ctx.runMutation(internal.systemLogs.logEvent, {
        level: "error", source: "http",
        event_name: "anomaly.walletMissing",
        status: "error",
        message: `Payment received but no wallet found for partner`,
        details: JSON.stringify({ partner_id: campaign.partner_id, amount: args.amount, promo_code: args.promo_code }),
      });
    }

    // 6. Log the revenue split (use first partner user as the actor)
    const partnerUser = await ctx.db
      .query("users")
      .withIndex("by_partner_id", (q) => q.eq("partner_id", campaign.partner_id))
      .first();

    if (partnerUser) {
      await ctx.db.insert("partner_revenue_logs", {
        partner_id: campaign.partner_id,
        campaign_id: campaign._id,
        user_id: partnerUser._id,
        transaction_id: transactionId,
        amount: partnerShare,
        gross_amount: args.amount,
        split_timestamp: Date.now(),
      });
    }

    // 7. Notify the partner
    await ctx.db.insert("notifications", {
      partnerId: campaign.partner_id,
      type: "payment",
      title: "Payment Received",
      message: `KES ${args.amount.toLocaleString()} received from ${args.student_name} via campaign ${args.promo_code}. Your share: KES ${partnerShare.toLocaleString()}.`,
      isRead: false,
      createdAt: Date.now(),
    });

    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "http",
      event_name: "mpesa.c2bPayment",
      status: "success",
      duration_ms: Date.now() - start,
      message: `Payment received: KES ${args.amount} via ${args.promo_code}`,
      details: JSON.stringify({ transactionId, amount: args.amount, partnerShare, promo_code: args.promo_code, phone: args.phone_number }),
    });

    return { success: true, transactionId, partnerShare };
  },
});
