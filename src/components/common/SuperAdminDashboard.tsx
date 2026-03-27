
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
  ArrowRight,
  Plus,
  DollarSign,
  Activity,
  Layers,
} from "lucide-react";
import { formatCurrency, getInitials, getAvatarColor } from "../../utils/formatters";

interface SuperAdminDashboardProps {
  setActiveItem: (item: string) => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "bg-primary/10 text-primary",
  loading = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <Skeleton className="h-9 w-9 rounded-xl mb-4" />
        <Skeleton className="h-7 w-24 mb-1.5" />
        <Skeleton className="h-3.5 w-16" />
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-border/80 hover:shadow-sm transition-all">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-4">
      {children}
    </p>
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
    <div className="min-h-full bg-muted/20">

      {/* ── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                <Activity className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Sqooli · Command Center
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">System Overview</h1>
          </div>
          <Button
            onClick={() => setShowCreateProgramDialog(true)}
            size="sm"
            className="shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Program
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="System Revenue"
            value={primaryLoading ? "—" : formatCurrency(totalRevenue)}
            accent="bg-primary/10 text-primary"
            loading={primaryLoading}
          />
          <StatCard
            icon={Building2}
            label="Partner Earnings"
            value={primaryLoading ? "—" : formatCurrency(totalPartnerPay)}
            accent="bg-secondary/10 text-secondary"
            loading={primaryLoading}
          />
          <StatCard
            icon={Activity}
            label="Transactions"
            value={primaryLoading ? "—" : totalTxns.toLocaleString()}
            accent="bg-chart-3/10 text-chart-3"
            loading={primaryLoading}
          />
          <StatCard
            icon={Users}
            label="Active Partners"
            value={primaryLoading ? "—" : totalPartners}
            sub={totalPrograms > 0 ? `${totalPrograms} programs` : undefined}
            accent="bg-chart-4/10 text-chart-4"
            loading={primaryLoading}
          />
        </div>

        {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Revenue chart */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
                <div>
                  <SectionLabel>Revenue Trend</SectionLabel>
                  <p className="text-base font-bold text-foreground -mt-2">Last 30 Days</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  30-day window
                </div>
              </div>

              {timeline === undefined ? (
                <div className="p-5"><Skeleton className="h-[200px] w-full rounded-xl" /></div>
              ) : timeline.length > 0 ? (
                <div className="pt-4 pb-2">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timeline} margin={{ top: 4, right: 24, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="formatted_date"
                        tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 10,
                          border: "1px solid var(--color-border)",
                          background: "var(--color-card)",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        }}
                        formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        fill="url(#revenueGrad)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px]">
                  <TrendingDown className="h-8 w-8 text-muted-foreground/20 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No revenue data yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Revenue will appear once transactions are processed</p>
                </div>
              )}
            </div>

            {/* Content library + Revenue split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Content library */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <SectionLabel>Content Library</SectionLabel>
                {secondaryLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {[
                      { icon: BookOpen,      label: "Subjects",  value: subjects?.length ?? 0,  accent: "bg-primary/8 text-primary" },
                      { icon: GraduationCap, label: "Curricula", value: curricula?.length ?? 0,  accent: "bg-secondary/8 text-secondary" },
                      { icon: Layers,        label: "Programs",  value: programs?.length ?? 0,   accent: "bg-chart-3/10 text-chart-3" },
                      { icon: WalletIcon,    label: "Wallets",   value: wallets?.length ?? 0,    accent: "bg-chart-4/10 text-chart-4" },
                    ].map(({ icon: Icon, label, value, accent }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${accent}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm text-foreground font-medium">{label}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Revenue split */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <SectionLabel>Revenue Split</SectionLabel>
                {primaryLoading ? (
                  <div className="space-y-5">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    {[
                      { label: "Sqooli Share",  amount: sqooliRevenue,   pct: sqooliPct,  color: "bg-primary", textColor: "text-primary" },
                      { label: "Partner Share", amount: totalPartnerPay, pct: partnerPct, color: "bg-secondary", textColor: "text-secondary" },
                    ].map(({ label, amount, pct, color, textColor }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(amount)}</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted ${textColor}`}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Total Processed</span>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(totalRevenue)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-6">

            {/* Quick actions */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <SectionLabel>Quick Actions</SectionLabel>
              <div className="space-y-1.5">
                {[
                  { icon: Building2,  label: "Manage Partners", sub: "View & create partners",  key: "users"    },
                  { icon: BarChart3,  label: "Programs",        sub: "Manage school programs",  key: "programs" },
                  { icon: WalletIcon, label: "Wallet Overview", sub: "Balances & withdrawals",  key: "wallet"   },
                ].map(({ icon: Icon, label, sub, key }) => (
                  <button
                    key={key}
                    onClick={() => setActiveItem(key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-muted/60 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 group-hover:bg-primary/8 group-hover:border-primary/20 transition-colors">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground">{sub}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
                  </button>
                ))}

                <div className="pt-1.5">
                  <button
                    onClick={() => setShowCreateProgramDialog(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary hover:bg-primary/90 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-primary-foreground flex-1 text-left">
                      Create New Program
                    </span>
                    <Plus className="h-3.5 w-3.5 text-primary-foreground/60" />
                  </button>
                </div>
              </div>
            </div>

            {/* Top Partners leaderboard */}
            <div className="bg-card rounded-2xl border border-border p-5 flex-1">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Top Earning Partners</SectionLabel>
                <button
                  onClick={() => setActiveItem("users")}
                  className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1 -mt-4 transition-colors"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {topPartners === undefined ? (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[58px] w-full rounded-xl" />)}
                </div>
              ) : topPartners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium text-foreground">No partner data yet</p>
                  <p className="text-xs mt-0.5">Top earners will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topPartners.map((p, i) => {
                    const maxEarnings = topPartners[0]?.total_earnings ?? 1;
                    const barWidth    = maxEarnings > 0 ? (p.total_earnings / maxEarnings) * 100 : 0;
                    const rankColors  = ["text-yellow-600 bg-yellow-50 border-yellow-200", "text-slate-500 bg-slate-50 border-slate-200", "text-amber-600 bg-amber-50 border-amber-200"];
                    return (
                      <div
                        key={p.partner_id}
                        className="relative overflow-hidden rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors p-3"
                      >
                        {/* progress fill */}
                        <div
                          className="absolute inset-y-0 left-0 bg-primary/[0.04] rounded-xl"
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="relative flex items-center gap-2.5">
                          {/* rank badge */}
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black border shrink-0 ${rankColors[i] ?? "bg-muted text-muted-foreground border-border"}`}>
                            {i + 1}
                          </span>
                          {/* avatar */}
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 ${getAvatarColor(p.partner_name)}`}>
                            {getInitials(p.partner_name)}
                          </div>
                          {/* name + meta */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate leading-none">{p.partner_name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {p.total_campaigns} campaigns · {p.total_enrollments} enrollments
                            </p>
                          </div>
                          {/* earnings */}
                          <p className="text-[13px] font-bold text-primary shrink-0 tabular-nums">
                            {formatCurrency(p.total_earnings)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateProgramDialog open={showCreateProgramDialog} onOpenChange={setShowCreateProgramDialog} />
    </div>
  );
}
