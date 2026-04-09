import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const levelArg = v.union(v.literal("info"), v.literal("warn"), v.literal("error"));
const sourceArg = v.union(v.literal("backend"), v.literal("frontend"), v.literal("http"));
const statusArg = v.union(v.literal("success"), v.literal("error"), v.literal("warn"));

/**
 * Internal — called by backend mutations/actions only.
 * Frontend cannot set source:"backend" — it can only call logFrontendEvent.
 */
export const logEvent = internalMutation({
  args: {
    user_id:     v.optional(v.string()),
    user_email:  v.optional(v.string()),
    level:       levelArg,
    source:      sourceArg,
    event_name:  v.string(),
    message:     v.optional(v.string()),
    details:     v.optional(v.string()),
    duration_ms: v.optional(v.number()),
    status:      statusArg,
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("system_logs", { ...args, created_at: Date.now() });
  },
});

/**
 * Public — thin wrapper for browser logging.
 * Hard-codes source:"frontend" so callers cannot spoof backend/http events.
 */
export const logFrontendEvent = mutation({
  args: {
    user_id:    v.optional(v.string()),
    user_email: v.optional(v.string()),
    level:      levelArg,
    event_name: v.string(),
    message:    v.optional(v.string()),
    details:    v.optional(v.string()),
    status:     statusArg,
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("system_logs", {
      ...args,
      source: "frontend",
      created_at: Date.now(),
    });
  },
});

/**
 * Live query for the dev monitor dashboard.
 */
export const getSystemLogs = query({
  args: {
    limit:   v.optional(v.number()),
    level:   v.optional(levelArg),
    source:  v.optional(sourceArg),
    status:  v.optional(statusArg),
    from_ts: v.optional(v.number()),
    to_ts:   v.optional(v.number()),
    search:  v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;

    let rows = await ctx.db
      .query("system_logs")
      .withIndex("by_created_at", q => args.from_ts ? q.gte("created_at", args.from_ts) : q)
      .order("desc")
      .take(1000);

    if (args.level)   rows = rows.filter(r => r.level === args.level);
    if (args.source)  rows = rows.filter(r => r.source === args.source);
    if (args.status)  rows = rows.filter(r => r.status === args.status);
    if (args.to_ts)   rows = rows.filter(r => r.created_at <= args.to_ts!);
    if (args.search) {
      const s = args.search.toLowerCase();
      rows = rows.filter(r =>
        r.event_name.toLowerCase().includes(s) ||
        (r.user_email ?? "").toLowerCase().includes(s) ||
        (r.message ?? "").toLowerCase().includes(s)
      );
    }

    return rows.slice(0, limit);
  },
});

/**
 * Stat cards for the dev monitor dashboard.
 */
export const getSystemLogStats = query({
  args: {},
  handler: async (ctx) => {
    const dayStart = Date.now() - 24 * 60 * 60 * 1000;

    const todayLogs = await ctx.db
      .query("system_logs")
      .withIndex("by_created_at", q => q.gte("created_at", dayStart))
      .collect();

    const totalToday = todayLogs.length;
    const errorsToday = todayLogs.filter(l => l.level === "error").length;
    const activeUsers = new Set(
      todayLogs.filter(l => l.user_email).map(l => l.user_email!)
    ).size;

    return { totalToday, errorsToday, activeUsers };
  },
});

/**
 * Recent transactions for the Data tab — newest first, limit 200.
 */
export const getRecentTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const devEmail = process.env.DEV_EMAIL;
    if (!identity?.email || identity.email !== devEmail) {
      throw new Error("Unauthorized");
    }
    return await ctx.db
      .query("transactions")
      .order("desc")
      .take(args.limit ?? 200);
  },
});

/**
 * All wallets with their balances for the Data tab.
 */
export const getWalletsSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const devEmail = process.env.DEV_EMAIL;
    if (!identity?.email || identity.email !== devEmail) {
      throw new Error("Unauthorized");
    }
    const wallets = await ctx.db.query("wallets").collect();
    // Enrich with partner name
    const enriched = await Promise.all(
      wallets.map(async (w) => {
        const partner = await ctx.db.get(w.partner_id);
        return { ...w, partner_name: partner?.name ?? "Unknown" };
      })
    );
    return enriched.sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0));
  },
});

/**
 * Financial reconciliation — runs on a schedule and after manual trigger.
 * Checks every mathematical invariant across wallets, transactions, revenue logs,
 * and withdrawals. Any discrepancy (including direct DB edits) is flagged as an
 * anomaly in system_logs with level:"error".
 *
 * Invariants checked:
 *  W1 — wallet.balance >= 0
 *  W2 — wallet.pending_balance >= 0
 *  W3 — wallet.lifetime_earnings >= 0
 *  W4 — wallet.balance <= wallet.lifetime_earnings
 *  W5 — wallet.lifetime_earnings == sum(partner_revenue_logs.amount) for this partner
 *  W6 — wallet.balance == lifetime_earnings - completed_withdrawals - pending_withdrawals
 *        (mismatch here catches direct DB balance edits)
 *  T1 — no two transactions share the same mpesa_code
 *  T2 — every Success transaction has a partner_revenue_log
 *  T3 — no transaction with amount <= 0
 *  R1 — revenue log amount <= gross_amount
 *  R2 — revenue log amount > 0
 *  R3 — revenue log transaction_id references an existing transaction
 *  D1 — no withdrawal with amount <= 0
 *  D2 — no duplicate reference_number across completed withdrawals
 */
export const reconcileFinancials = internalMutation({
  args: {},
  handler: async (ctx) => {
    type Anomaly = { event: string; message: string; details: string };
    const anomalies: Anomaly[] = [];
    const flag = (event: string, message: string, details: object) =>
      anomalies.push({ event, message, details: JSON.stringify(details) });

    // ── Wallet checks ────────────────────────────────────────────────────────
    const wallets = await ctx.db.query("wallets").collect();

    for (const w of wallets) {
      const pid = w.partner_id;
      const balance = w.balance ?? 0;
      const pending = w.pending_balance ?? 0;
      const lifetime = w.lifetime_earnings ?? 0;

      // W1
      if (balance < 0)
        flag("anomaly.walletBalanceNegative",
          `Wallet balance is KES ${balance} (negative)`,
          { wallet_id: w._id, partner_id: pid, balance });

      // W2
      if (pending < 0)
        flag("anomaly.walletPendingNegative",
          `Wallet pending_balance is KES ${pending} (negative)`,
          { wallet_id: w._id, partner_id: pid, pending_balance: pending });

      // W3
      if (lifetime < 0)
        flag("anomaly.walletLifetimeNegative",
          `Wallet lifetime_earnings is KES ${lifetime} (negative)`,
          { wallet_id: w._id, partner_id: pid, lifetime_earnings: lifetime });

      // W4
      if (balance > lifetime + 0.01)
        flag("anomaly.balanceExceedsLifetime",
          `Balance KES ${balance} > lifetime_earnings KES ${lifetime} — impossible without a direct DB edit`,
          { wallet_id: w._id, partner_id: pid, balance, lifetime_earnings: lifetime });

      // W5 — lifetime must equal sum of revenue logs
      const revLogs = await ctx.db
        .query("partner_revenue_logs")
        .withIndex("by_partner_id", q => q.eq("partner_id", pid))
        .collect();
      const expectedLifetime = revLogs.reduce((s, l) => s + l.amount, 0);
      if (Math.abs(lifetime - expectedLifetime) > 1) // KES 1 floating-point tolerance
        flag("anomaly.lifetimeMismatchRevenueLogs",
          `lifetime_earnings KES ${lifetime} ≠ sum of revenue logs KES ${expectedLifetime.toFixed(2)} (diff: KES ${(lifetime - expectedLifetime).toFixed(2)})`,
          { wallet_id: w._id, partner_id: pid, lifetime_earnings: lifetime, expected_from_logs: expectedLifetime, log_count: revLogs.length });

      // W6 — balance must equal lifetime minus all non-cancelled withdrawals
      const withdrawals = await ctx.db
        .query("withdrawals")
        .withIndex("by_partner_id", q => q.eq("partner_id", pid))
        .collect();
      const completedOut = withdrawals
        .filter(d => d.status === "completed")
        .reduce((s, d) => s + d.amount, 0);
      const pendingOut = withdrawals
        .filter(d => d.status === "pending" || d.status === "processing")
        .reduce((s, d) => s + d.amount, 0);
      const expectedBalance = lifetime - completedOut - pendingOut;
      if (Math.abs(balance - expectedBalance) > 1)
        flag("anomaly.walletBalanceMismatch",
          `Balance KES ${balance} ≠ expected KES ${expectedBalance.toFixed(2)} (lifetime KES ${lifetime} − completed KES ${completedOut} − pending KES ${pendingOut}). Possible direct DB edit or double-deduction bug.`,
          { wallet_id: w._id, partner_id: pid, balance, expected_balance: expectedBalance, lifetime_earnings: lifetime, completed_withdrawals: completedOut, pending_withdrawals: pendingOut });
    }

    // ── Transaction checks ───────────────────────────────────────────────────
    const transactions = await ctx.db.query("transactions").collect();

    // T1 — duplicate mpesa codes
    const mpesaMap = new Map<string, string[]>();
    for (const tx of transactions) {
      const bucket = mpesaMap.get(tx.mpesa_code) ?? [];
      bucket.push(tx._id);
      mpesaMap.set(tx.mpesa_code, bucket);
    }
    for (const [code, ids] of mpesaMap) {
      if (ids.length > 1)
        flag("anomaly.duplicateMpesaCode",
          `M-Pesa code ${code} appears ${ids.length}× in transactions`,
          { mpesa_code: code, transaction_ids: ids, count: ids.length });
    }

    // T2 — every Success tx must have a revenue log
    const allRevLogs = await ctx.db.query("partner_revenue_logs").collect();
    const revenueLogTxIds = new Set(allRevLogs.map(l => l.transaction_id as string));
    for (const tx of transactions) {
      if (tx.status === "Success" && !revenueLogTxIds.has(tx._id as string))
        flag("anomaly.successTxMissingRevenueLog",
          `Transaction ${tx.mpesa_code} (KES ${tx.amount}) is Success but has no revenue log`,
          { transaction_id: tx._id, mpesa_code: tx.mpesa_code, amount: tx.amount, campaign_code: tx.campaign_code, partner_id: tx.partner_id });

      // T3 — amount must be positive
      if (tx.amount <= 0)
        flag("anomaly.transactionZeroOrNegativeAmount",
          `Transaction ${tx.mpesa_code} has amount KES ${tx.amount}`,
          { transaction_id: tx._id, mpesa_code: tx.mpesa_code, amount: tx.amount });
    }

    // ── Revenue log checks ───────────────────────────────────────────────────
    const txById = new Map(transactions.map(t => [t._id as string, t]));

    for (const log of allRevLogs) {
      // R1
      if (log.amount > log.gross_amount + 0.01)
        flag("anomaly.revenueLogExceedsGross",
          `Revenue log: partner share KES ${log.amount} > gross KES ${log.gross_amount}`,
          { log_id: log._id, partner_id: log.partner_id, amount: log.amount, gross_amount: log.gross_amount });

      // R2
      if (log.amount <= 0)
        flag("anomaly.revenueLogZeroOrNegative",
          `Revenue log has amount KES ${log.amount}`,
          { log_id: log._id, partner_id: log.partner_id, amount: log.amount });

      // R3
      if (!txById.has(log.transaction_id as string))
        flag("anomaly.revenueLogOrphanedTransaction",
          `Revenue log references transaction ${log.transaction_id} which no longer exists`,
          { log_id: log._id, transaction_id: log.transaction_id, partner_id: log.partner_id, amount: log.amount });
    }

    // ── Withdrawal checks ────────────────────────────────────────────────────
    const allWithdrawals = await ctx.db.query("withdrawals").collect();

    // D1
    for (const d of allWithdrawals) {
      if (d.amount <= 0)
        flag("anomaly.withdrawalZeroOrNegative",
          `Withdrawal ${d.reference_number} has amount KES ${d.amount}`,
          { withdrawal_id: d._id, partner_id: d.partner_id, amount: d.amount, reference: d.reference_number });
    }

    // D2 — duplicate reference numbers among completed withdrawals
    const completedRefs = allWithdrawals.filter(d => d.status === "completed");
    const refMap = new Map<string, string[]>();
    for (const d of completedRefs) {
      const bucket = refMap.get(d.reference_number) ?? [];
      bucket.push(d._id);
      refMap.set(d.reference_number, bucket);
    }
    for (const [ref, ids] of refMap) {
      if (ids.length > 1)
        flag("anomaly.duplicateWithdrawalReference",
          `Completed withdrawal reference ${ref} appears ${ids.length}×`,
          { reference_number: ref, withdrawal_ids: ids });
    }

    // ── Log every anomaly found ──────────────────────────────────────────────
    for (const a of anomalies) {
      await ctx.db.insert("system_logs", {
        level: "error", source: "backend",
        event_name: a.event,
        message: a.message,
        details: a.details,
        status: "error",
        created_at: Date.now(),
      });
    }

    // ── Log the reconciliation run itself ────────────────────────────────────
    await ctx.db.insert("system_logs", {
      level: anomalies.length > 0 ? "warn" : "info",
      source: "backend",
      event_name: "reconcile.financialsRun",
      message: `Financial reconciliation: ${anomalies.length} anomaly(ies) found across ${wallets.length} wallets, ${transactions.length} transactions`,
      details: JSON.stringify({
        anomaly_count: anomalies.length,
        wallets_checked: wallets.length,
        transactions_checked: transactions.length,
        revenue_logs_checked: allRevLogs.length,
        withdrawals_checked: allWithdrawals.length,
        anomaly_types: [...new Set(anomalies.map(a => a.event))],
      }),
      status: anomalies.length > 0 ? "warn" : "success",
      created_at: Date.now(),
    });

    return { anomalies_found: anomalies.length };
  },
});

/**
 * Public mutation — lets the dev trigger reconciliation manually from the dashboard.
 * No auth check here because the UI is already gated behind isDevUser.
 */
export const triggerReconciliation = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const devEmail = process.env.DEV_EMAIL;
    if (!identity?.email || identity.email !== devEmail) {
      throw new Error("Unauthorized");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await ctx.runMutation((internal as any).systemLogs.reconcileFinancials, {});
  },
});

/**
 * Cron target — deletes logs older than 5 days.
 */
export const cleanupOldLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("system_logs")
      .withIndex("by_created_at", q => q.lt("created_at", cutoff))
      .collect();
    await Promise.all(old.map(row => ctx.db.delete(row._id)));
    return { deleted: old.length };
  },
});
