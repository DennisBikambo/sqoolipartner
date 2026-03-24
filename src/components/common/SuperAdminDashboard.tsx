
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import CreateProgramDialog from "./CreateProgramDialog";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  GraduationCap,
  Users,
  Wallet as WalletIcon,
  BarChart3,
  Building2,
  ArrowUpRight,
  Zap,
  DollarSign,
} from "lucide-react";
import { formatCurrency, getInitials, getAvatarColor } from "../../utils/formatters";

interface SuperAdminDashboardProps {
  setActiveItem: (item: string) => void;
}


function RankBadge({ rank }: { rank: number }) {
  const styles = [
    "bg-chart-3 text-white",
    "bg-muted-foreground/50 text-background",
    "bg-chart-3/50 text-foreground",
  ];
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black flex-shrink-0 ${styles[rank - 1] ?? "bg-muted text-muted-foreground"}`}>
      {rank}
    </span>
  );
}

export default function SuperAdminDashboard({ setActiveItem }: SuperAdminDashboardProps) {
  const [showCreateProgramDialog, setShowCreateProgramDialog] = useState(false);

  const subjects        = useQuery(api.subjects.listSubjects);
  const curricula       = useQuery(api.curricula.listCurricula);
  const programs        = useQuery(api.program.listPrograms);
  const wallets         = useQuery(api.wallet.getAllWallets);
  const partners        = useQuery(api.partner.getAllPartners);
  const transactions    = useQuery(api.transactions.getAllTransactions);
  const partnerEarnings = useQuery(api.partner_revenue.getPartnerEarningsSummary);
  const timeline        = useQuery(api.partner_revenue.getSystemEarningsTimeline, { days: 30 });
  const topPartners     = useQuery(api.partner_revenue.getTopEarningPartners, { limit: 5 });

  const primaryLoading =
    wallets === undefined ||
    partners === undefined ||
    transactions === undefined ||
    partnerEarnings === undefined;

  const secondaryLoading = subjects === undefined || curricula === undefined || programs === undefined;

  const totalRevenue    = partnerEarnings?.total_revenue ?? 0;
  const totalPartnerPay = partnerEarnings?.total_earnings ?? 0;
  const sqooliRevenue   = totalRevenue - totalPartnerPay;
  const partnerPct      = totalRevenue > 0 ? Math.round((totalPartnerPay / totalRevenue) * 100) : 0;
  const sqooliPct       = 100 - partnerPct;
  const totalTxns       = transactions?.length ?? 0;
  const totalPrograms   = programs?.length ?? 0;
  const totalPartners   = partners?.length ?? 0;

  return (
    <div className="min-h-full bg-muted/30">

      {/* ── HEADER BANNER ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-6 pb-5">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-primary-foreground/60 uppercase mb-1">
              Sqooli · Command Center
            </p>
            <h1 className="text-[24px] font-bold text-primary-foreground leading-none">
              System Dashboard
            </h1>
          </div>
          <Button
            onClick={() => setShowCreateProgramDialog(true)}
            size="sm"
            variant="secondary"
          >
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
            New Program
          </Button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {primaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl bg-primary-foreground/10" />
            ))
          ) : (
            <>
              <div className="bg-primary-foreground/15 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-primary-foreground/60 uppercase tracking-wide mb-0.5">System Revenue</p>
                <p className="text-lg font-bold text-primary-foreground">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-primary-foreground/15 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-primary-foreground/60 uppercase tracking-wide mb-0.5">Partner Earnings</p>
                <p className="text-lg font-bold text-primary-foreground">{formatCurrency(totalPartnerPay)}</p>
              </div>
              <div className="bg-primary-foreground/15 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-primary-foreground/60 uppercase tracking-wide mb-0.5">Transactions</p>
                <p className="text-lg font-bold text-primary-foreground">{totalTxns}</p>
              </div>
              <div className="bg-primary-foreground/15 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-primary-foreground/60 uppercase tracking-wide mb-0.5">Partners</p>
                <p className="text-lg font-bold text-primary-foreground">{totalPartners}</p>
                {totalPrograms > 0 && (
                  <p className="text-[10px] text-primary-foreground/50">{totalPrograms} programs</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MAIN BODY ─────────────────────────────────────────────────────────── */}
      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── LEFT ── */}
        <div className="xl:col-span-2 flex flex-col gap-5">

          {/* Revenue chart */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Revenue Trend</p>
                <p className="text-base font-bold text-foreground">Last 30 Days</p>
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>

            {timeline === undefined ? (
              <div className="px-5 pb-5"><Skeleton className="h-[180px] w-full rounded-xl" /></div>
            ) : timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeline} margin={{ top: 4, right: 24, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="formatted_date" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-card)" }}
                    formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] pb-5">
                <TrendingDown className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No revenue data yet</p>
              </div>
            )}
          </div>

          {/* Content library + Revenue split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Content library */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium mb-4">Content Library</p>
              {secondaryLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : (
                <div className="space-y-1">
                  {[
                    { icon: BookOpen,      label: "Subjects",  value: subjects?.length ?? 0,  color: "bg-primary/10 text-primary" },
                    { icon: GraduationCap, label: "Curricula", value: curricula?.length ?? 0,  color: "bg-secondary/10 text-secondary" },
                    { icon: WalletIcon,    label: "Wallets",   value: wallets?.length ?? 0,    color: "bg-chart-3/10 text-chart-3" },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue split */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium mb-4">Revenue Split</p>
              {primaryLoading ? (
                <div className="space-y-4"><Skeleton className="h-10 w-full rounded-lg" /><Skeleton className="h-10 w-full rounded-lg" /></div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Sqooli Share",   amount: sqooliRevenue,   pct: sqooliPct,  colorClass: "bg-primary" },
                    { label: "Partner Share",  amount: totalPartnerPay, pct: partnerPct, colorClass: "bg-secondary" },
                  ].map(({ label, amount, pct, colorClass }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground font-medium">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{formatCurrency(amount)}</span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-5">

          {/* Quick actions */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium mb-3">Quick Actions</p>
            <div className="space-y-2">
              {[
                { icon: Building2,  label: "Manage Partners", key: "users"    },
                { icon: BarChart3,  label: "View Programs",   key: "programs" },
                { icon: WalletIcon, label: "Wallet Overview", key: "wallet"   },
              ].map(({ icon: Icon, label, key }) => (
                <button
                  key={key}
                  onClick={() => setActiveItem(key)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground bg-muted/40 hover:bg-muted hover:text-primary transition-colors group"
                >
                  <div className="h-7 w-7 rounded-lg bg-background border border-border flex items-center justify-center group-hover:border-primary/30 transition-colors">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="flex-1 text-left">{label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </button>
              ))}
              <button
                onClick={() => setShowCreateProgramDialog(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors mt-1"
              >
                <div className="h-7 w-7 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <span className="flex-1 text-left">New Program</span>
              </button>
            </div>
          </div>

          {/* Partner leaderboard */}
          <div className="bg-card rounded-2xl border border-border p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Top Partners</p>
              <button onClick={() => setActiveItem("users")} className="text-[11px] text-primary hover:underline">
                View all
              </button>
            </div>

            {topPartners === undefined ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : topPartners.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Users className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">No partner data yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topPartners.map((p, i) => {
                  const maxEarnings = topPartners[0]?.total_earnings ?? 1;
                  const barWidth    = maxEarnings > 0 ? (p.total_earnings / maxEarnings) * 100 : 0;
                  return (
                    <div key={p.partner_id} className="group relative overflow-hidden rounded-xl border border-border bg-muted/20 hover:border-primary/20 hover:bg-muted/40 transition-all p-3">
                      <div className="absolute inset-y-0 left-0 bg-primary/5 rounded-xl transition-all duration-700" style={{ width: `${barWidth}%` }} />
                      <div className="relative flex items-center gap-3">
                        <RankBadge rank={i + 1} />
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0 ${getAvatarColor(p.partner_name)}`}>
                          {getInitials(p.partner_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground truncate leading-none mb-0.5">{p.partner_name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.total_campaigns} campaigns · {p.total_enrollments} enrollments</p>
                        </div>
                        <p className="text-[13px] font-bold text-primary flex-shrink-0">{formatCurrency(p.total_earnings)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secondary system stats */}
          {!primaryLoading && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium mb-3">System Overview</p>
              <div className="space-y-0">
                {[
                  { label: "Total Partners",  value: totalPartners,                icon: Building2,   color: "text-primary" },
                  { label: "Active Wallets",  value: wallets?.length ?? 0,          icon: WalletIcon,  color: "text-secondary" },
                  { label: "Transactions",    value: totalTxns,                     icon: DollarSign,  color: "text-chart-3" },
                  { label: "Programs",        value: totalPrograms,                 icon: GraduationCap, color: "text-chart-4" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateProgramDialog open={showCreateProgramDialog} onOpenChange={setShowCreateProgramDialog} />
    </div>
  );
}
