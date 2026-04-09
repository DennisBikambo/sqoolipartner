import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "cleanup-old-system-logs",
  { hourUTC: 2, minuteUTC: 0 },
  internal.systemLogs.cleanupOldLogs,
  {}
);

// Reconcile financial invariants every hour.
// Flags direct DB edits, double-deductions, orphaned records, and balance mismatches.
crons.interval(
  "reconcile-financials",
  { hours: 1 },
  internal.systemLogs.reconcileFinancials,
  {}
);

export default crons;
