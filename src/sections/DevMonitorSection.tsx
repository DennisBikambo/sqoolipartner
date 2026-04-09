import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Activity, AlertCircle, Users, Terminal, ChevronDown, ChevronRight, Database, Wallet, RefreshCw } from "lucide-react";

type Tab = "logs" | "data";

type Level = "info" | "warn" | "error";
type Source = "backend" | "frontend" | "http";

const TIME_RANGES = [
  { label: "Last 1h", ms: 60 * 60 * 1000 },
  { label: "Last 24h", ms: 24 * 60 * 60 * 1000 },
  { label: "Last 5 days", ms: 5 * 24 * 60 * 60 * 1000 },
];

const levelDot: Record<Level, string> = {
  info: "bg-emerald-500",
  warn: "bg-yellow-500",
  error: "bg-destructive",
};

const levelRow: Record<Level, string> = {
  info: "border-l-2 border-transparent hover:bg-muted/40",
  warn: "border-l-2 border-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10",
  error: "border-l-2 border-destructive bg-destructive/5 hover:bg-destructive/10",
};

const sourceBadge: Record<Source, string> = {
  backend: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  frontend: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  http: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};

function StatCard({ title, value, icon: Icon, accent }: { title: string; value: number | undefined; icon: React.ElementType; accent?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border px-[18px] py-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${accent ?? "bg-primary/10"}`}>
        <Icon className={`h-5 w-5 ${accent ? "text-white" : "text-primary"}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        {value === undefined ? (
          <Skeleton className="h-6 w-12 mt-1" />
        ) : (
          <p className="text-xl font-semibold text-foreground">{value.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

function LogRow({ log }: { log: { _id: string; level: string; source: string; event_name: string; user_email?: string; duration_ms?: number; message?: string; details?: string; created_at: number; status: string } }) {
  const [expanded, setExpanded] = useState(false);
  const level = log.level as Level;
  const source = log.source as Source;

  const time = new Date(log.created_at).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  let parsedDetails: object | string | null = null;
  if (log.details) {
    try { parsedDetails = JSON.parse(log.details); } catch { parsedDetails = log.details; }
  }

  return (
    <div className={`${levelRow[level]} rounded-sm cursor-pointer select-none`} onClick={() => setExpanded(e => !e)}>
      <div className="flex items-center gap-3 px-3 py-2 text-xs">
        <span className="text-muted-foreground w-[70px] shrink-0 font-mono">{time}</span>
        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${sourceBadge[source]}`}>{source}</span>
        <span className={`h-2 w-2 rounded-full shrink-0 ${levelDot[level]}`} />
        <span className="font-mono text-foreground font-medium truncate flex-1">{log.event_name}</span>
        {log.user_email && (
          <span className="text-muted-foreground truncate max-w-[140px] hidden sm:block">{log.user_email}</span>
        )}
        {log.duration_ms !== undefined && (
          <span className="text-muted-foreground shrink-0 w-[50px] text-right">{log.duration_ms}ms</span>
        )}
        <span className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </span>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-1 border-t border-border/50 pt-2">
          {log.message && (
            <p className="text-xs text-muted-foreground">{log.message}</p>
          )}
          {parsedDetails && (
            <pre className="text-[11px] bg-muted/50 rounded p-2 overflow-x-auto text-foreground font-mono whitespace-pre-wrap break-all">
              {JSON.stringify(parsedDetails, null, 2)}
            </pre>
          )}
          <p className="text-[10px] text-muted-foreground">
            {new Date(log.created_at).toISOString()} · status: {log.status}
          </p>
        </div>
      )}
    </div>
  );
}

export default function DevMonitorSection() {
  const { loading } = useAuth();
  const isDev = useQuery(api.createDevAccount.isDevUser, {});
  const [tab, setTab] = useState<Tab>("logs");
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<{ anomalies_found: number } | null>(null);
  const triggerReconciliation = useMutation(api.systemLogs.triggerReconciliation);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<Level | undefined>();
  const [source, setSource] = useState<Source | undefined>();
  const [rangeIdx, setRangeIdx] = useState(1); // default: last 24h
  const [autoScroll, setAutoScroll] = useState(true);
  const topRef = useRef<HTMLDivElement>(null);

  const fromTs = Date.now() - TIME_RANGES[rangeIdx].ms;

  const logs = useQuery(api.systemLogs.getSystemLogs, {
    limit: 300,
    level,
    source,
    from_ts: fromTs,
    search: search.trim() || undefined,
  });

  const stats = useQuery(api.systemLogs.getSystemLogStats, {});
  const transactions = useQuery(api.systemLogs.getRecentTransactions, { limit: 200 });
  const wallets = useQuery(api.systemLogs.getWalletsSnapshot, {});

  useEffect(() => {
    if (autoScroll && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  if (loading || isDev === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!isDev) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-center">
        <Terminal className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Access Restricted</p>
        <p className="text-sm text-muted-foreground">This page is only accessible to the system developer.</p>
      </div>
    );
  }

  const errorCount = logs?.filter(l => l.level === "error").length ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Dev Monitor</h1>
        </div>
        {tab === "logs" && (
          <button
            onClick={() => setAutoScroll(a => !a)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              autoScroll
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
          </button>
        )}
      </div>

      {/* Tab switcher + reconcile button */}
      <div className="flex items-center gap-3 flex-wrap">
      <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit border border-border">
        <button
          onClick={() => setTab("logs")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
            tab === "logs" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          Logs
        </button>
        <button
          onClick={() => setTab("data")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
            tab === "data" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          Data
        </button>
      </div>

      <button
        disabled={reconciling}
        onClick={async () => {
          setReconciling(true);
          setReconcileResult(null);
          try {
            const result = await triggerReconciliation();
            setReconcileResult(result);
          } finally {
            setReconciling(false);
          }
        }}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${reconciling ? "animate-spin" : ""}`} />
        {reconciling ? "Running..." : "Run Reconciliation"}
      </button>

      {reconcileResult !== null && (
        <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
          reconcileResult.anomalies_found > 0
            ? "bg-destructive/15 text-destructive"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        }`}>
          {reconcileResult.anomalies_found > 0
            ? `${reconcileResult.anomalies_found} anomaly(ies) found — check logs`
            : "All checks passed"}
        </span>
      )}
      </div>

      {tab === "logs" && (<>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard title="Total Today" value={stats?.totalToday} icon={Activity} />
        <StatCard
          title="Errors Today"
          value={stats?.errorsToday}
          icon={AlertCircle}
          accent={stats?.errorsToday ? "bg-destructive" : undefined}
        />
        <StatCard title="Active Users" value={stats?.activeUsers} icon={Users} />
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-xl px-[18px] py-3 flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search event or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-xs w-full sm:w-56"
        />

        <select
          value={level ?? ""}
          onChange={e => setLevel((e.target.value as Level) || undefined)}
          className="h-8 text-xs rounded-md border border-border bg-background text-foreground px-2 cursor-pointer"
        >
          <option value="">All levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>

        <select
          value={source ?? ""}
          onChange={e => setSource((e.target.value as Source) || undefined)}
          className="h-8 text-xs rounded-md border border-border bg-background text-foreground px-2 cursor-pointer"
        >
          <option value="">All sources</option>
          <option value="backend">Backend</option>
          <option value="frontend">Frontend</option>
          <option value="http">HTTP</option>
        </select>

        <select
          value={rangeIdx}
          onChange={e => setRangeIdx(Number(e.target.value))}
          className="h-8 text-xs rounded-md border border-border bg-background text-foreground px-2 cursor-pointer"
        >
          {TIME_RANGES.map((r, i) => (
            <option key={r.label} value={i}>{r.label}</option>
          ))}
        </select>

        <span className="text-xs text-muted-foreground ml-auto">
          {logs === undefined ? "Loading..." : `${logs.length} entries${errorCount > 0 ? ` · ${errorCount} errors` : ""}`}
        </span>
      </div>

      {/* Log feed */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-muted/30 text-[10px] text-muted-foreground font-medium">
          <span className="w-[70px] shrink-0">TIME</span>
          <span className="w-[60px] shrink-0">SOURCE</span>
          <span className="w-2 shrink-0" />
          <span className="flex-1">EVENT</span>
          <span className="hidden sm:block max-w-[140px] truncate">USER</span>
          <span className="w-[50px] text-right shrink-0">DUR</span>
          <span className="w-3 shrink-0" />
        </div>

        <div className="max-h-[600px] overflow-y-auto divide-y divide-border/40">
          <div ref={topRef} />
          {logs === undefined ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Terminal className="h-8 w-8" />
              <p className="text-sm">No logs found for this filter.</p>
            </div>
          ) : (
            logs.map(log => <LogRow key={log._id} log={log} />)
          )}
        </div>
      </div>
      </>)}

      {tab === "data" && (
        <div className="space-y-6">
          {/* Wallets */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Wallets</span>
              <span className="text-xs text-muted-foreground ml-auto">{wallets === undefined ? "Loading..." : `${wallets.length} wallets`}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-[10px] text-muted-foreground font-medium">
                    <th className="px-3 py-2 text-left">PARTNER</th>
                    <th className="px-3 py-2 text-left">ACCOUNT</th>
                    <th className="px-3 py-2 text-left">METHOD</th>
                    <th className="px-3 py-2 text-right">BALANCE</th>
                    <th className="px-3 py-2 text-right">LIFETIME</th>
                    <th className="px-3 py-2 text-right">PENDING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {wallets === undefined ? (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : wallets.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No wallets found</td></tr>
                  ) : wallets.map(w => (
                    <tr key={w._id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium text-foreground">{w.partner_name}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{w.account_number}</td>
                      <td className="px-3 py-2 text-muted-foreground">{w.withdrawal_method}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${(w.balance ?? 0) < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                        KES {(w.balance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">KES {(w.lifetime_earnings ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">KES {(w.pending_balance ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Transactions</span>
              <span className="text-xs text-muted-foreground ml-auto">{transactions === undefined ? "Loading..." : `${transactions.length} recent`}</span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted/20 text-[10px] text-muted-foreground font-medium">
                    <th className="px-3 py-2 text-left">TIME</th>
                    <th className="px-3 py-2 text-left">STUDENT</th>
                    <th className="px-3 py-2 text-left">PHONE</th>
                    <th className="px-3 py-2 text-left">M-PESA CODE</th>
                    <th className="px-3 py-2 text-left">CAMPAIGN</th>
                    <th className="px-3 py-2 text-right">AMOUNT</th>
                    <th className="px-3 py-2 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {transactions === undefined ? (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No transactions found</td></tr>
                  ) : transactions.map(t => (
                    <tr key={t._id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(t._creationTime).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-3 py-2 text-foreground">{t.student_name}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{t.phone_number}</td>
                      <td className="px-3 py-2 font-mono text-blue-600 dark:text-blue-400">{t.mpesa_code}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.campaign_code}</td>
                      <td className="px-3 py-2 text-right font-semibold text-foreground">KES {t.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          t.status === "Success" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                          t.status === "Failed" ? "bg-destructive/15 text-destructive" :
                          "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                        }`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
