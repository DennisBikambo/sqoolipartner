
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { isConvexUser } from "../types/auth.types";
import type { DashboardCampaign } from "../types/global.types";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "../components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Lock, AlertCircle } from "lucide-react";
import SuperAdminDashboard from "../components/common/SuperAdminDashboard";
import Wallet from "../components/common/Wallet";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import CreateProgramDialog from "../components/common/CreateProgramDialog";
import { PermissionWrapper } from "../components/common/PermissionWrapper";
import { formatCurrency, getAvatarColor } from "../utils/formatters";
import { Skeleton } from "../components/ui/skeleton";
import { useConvexQuery } from "../hooks/useConvexQuery";

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// ── Custom Icons ──────────────────────────────────────────────────────────────

const MoneybagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
    <ellipse cx="18" cy="24" rx="12" ry="10" fill="#f97316"/>
    <path d="M12 24 C12 18 24 18 24 24" fill="#f97316"/>
    <rect x="13" y="8" width="10" height="7" rx="3" fill="#fb923c"/>
    <path d="M14 8 Q18 2 22 8" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
    <text x="18" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">$</text>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-chart-3">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

const DropIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-chart-4">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
    <line x1="12" y1="19" x2="12" y2="5"/>
    <polyline points="5 12 12 5 19 12"/>
  </svg>
);

const CalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardSection({
  activeItem,
  setActiveItem,
}: {
  activeItem?: string;
  setActiveItem: (item: string) => void;
}) {
  const { user, partner, loading: authLoading } = useAuth();
  const { hasPermission, userRole } = usePermissions();

  const [chartTab, setChartTab] = useState<"earnings" | "withdrawals" | "engagements">("earnings");
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showCreateProgramDialog, setShowCreateProgramDialog] = useState(false);

  const isSuperAdmin = isConvexUser(user) && userRole === "super_admin";
  const isDashboardAdmin = hasPermission("dashboard.admin");
  const canViewFullDashboard = hasPermission("dashboard.read");
  const canViewDashboard = isDashboardAdmin || canViewFullDashboard;
  const canCreateCampaigns = hasPermission("campaigns.write");

  const partnerId = partner?._id as Id<"partners"> | undefined;

  const rawCampaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partnerId && canViewDashboard ? { partner_id: partnerId } : "skip"
  ) as DashboardCampaign[] | undefined;

  const rawCampaignEarnings = useQuery(
    api.campaign.getCampaignEarnings,
    partnerId && canViewFullDashboard ? { partner_id: partnerId } : "skip"
  );

  const rawWithdrawalStats = useQuery(
    api.withdrawals.getTotalWithdrawals,
    partnerId && canViewFullDashboard ? { partner_id: partnerId } : "skip"
  );

  const rawEarningsTimeline = useQuery(
    api.program_enrollments.getEarningsTimeline,
    partnerId && canViewFullDashboard ? { partner_id: partnerId, days: 30 } : "skip"
  );

  const rawAuditLogs = useQuery(
    api.audit.getAuditLogs,
    partnerId ? { partner_id: partnerId } : "skip"
  );

  const { data: campaigns, isLoading: campaignsLoading } = useConvexQuery(
    `dashboard_campaigns_${partnerId}`,
    rawCampaigns
  );
  const { data: campaignEarnings } = useConvexQuery(
    `dashboard_earnings_${partnerId}`,
    rawCampaignEarnings
  );
  const { data: withdrawalStats } = useConvexQuery(
    `dashboard_withdrawal_stats_${partnerId}`,
    rawWithdrawalStats
  );
  const { data: earningsTimeline, isLoading: timelineLoading } = useConvexQuery(
    `dashboard_earnings_timeline_${partnerId}`,
    rawEarningsTimeline
  );
  const { data: auditLogs, isLoading: auditLogsLoading } = useConvexQuery(
    `dashboard_audit_logs_${partnerId}`,
    rawAuditLogs
  );

  // Wait for auth to settle before deciding which dashboard to render.
  // Without this guard, the partner dashboard flashes briefly while the
  // session is being validated and isSuperAdmin is still false.
  if (authLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-[140px] w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  if (isSuperAdmin) {
    return <SuperAdminDashboard setActiveItem={setActiveItem} />;
  }

  if (!canViewDashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Dashboard Access Restricted</h3>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Contact your administrator to request{" "}
                <span className="font-medium text-foreground">dashboard.view</span> permission.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Computed metrics
  const totalEarnings = campaignEarnings?.reduce((s, c) => s + c.partner_earnings, 0) ?? 0;
  const totalCampaigns = campaigns?.length ?? 0;
  const ongoingCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const totalEngagements = campaignEarnings?.reduce((s, c) => s + c.enrollments, 0) ?? 0;
  const totalWithdrawn = withdrawalStats?.total_completed ?? 0;

  // Chart data by tab
  const getChartData = (): { formatted_date: string; amount: number }[] => {
    if (chartTab === "earnings")
      return (earningsTimeline as { formatted_date: string; amount: number }[] | undefined) ?? [];
    if (chartTab === "withdrawals") {
      return (withdrawalStats?.recent_withdrawals ?? []).map((w) => ({
        formatted_date: new Date(w._creationTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        amount: w.amount,
      }));
    }
    return [];
  };

  const chartData = getChartData();

  const chartTabConfig = [
    { key: "earnings" as const,    label: "Earnings",    value: formatCurrency(totalEarnings) },
    { key: "withdrawals" as const, label: "Withdrawals", value: formatCurrency(totalWithdrawn) },
    { key: "engagements" as const, label: "Engagements", value: formatCompact(totalEngagements) },
  ];
  const activeTabIdx = chartTabConfig.findIndex((t) => t.key === chartTab);

  const recentLogs = auditLogs ? [...auditLogs].reverse().slice(0, 10) : [];

  return (
    <div className="p-6 bg-muted/30 min-h-full">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-[18px]">
        <h1 className="text-lg font-bold text-foreground m-0">Dashboard</h1>
        <div className="flex items-start gap-[6px]">
          <div className="mt-0.5"><CalIcon /></div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] text-muted-foreground">12 Jan 2026 – 13 Feb 2026</span>
            <div className="flex items-center gap-[3px] cursor-pointer">
              <span className="text-[11px] font-semibold text-foreground">Last 28 Days</span>
              <ChevronDownIcon />
            </div>
          </div>
        </div>
      </div>

      {/* ── Wallet Card (from commons/Wallet.tsx) ── */}
      <PermissionWrapper requireRead="wallet" fallback={null}>
        <div className="mb-4">
          <Wallet activeItem={activeItem ?? "dashboard"} setActiveItem={setActiveItem} />
        </div>
      </PermissionWrapper>

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-[2fr_1fr] gap-[14px]">

        {/* LEFT column */}
        <div className="flex flex-col gap-[14px]">

          {/* EARNINGS + STATS PANEL */}
          <div className="bg-card rounded-xl border border-border px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            {/* Total Earnings */}
            <PermissionWrapper
              permissionKey="dashboard.admin"
              fallback={
                <div className="mb-[14px]">
                  <div className="flex items-center gap-[6px] mb-1">
                    <div className="w-[30px] h-[30px] rounded-lg bg-soft-peach flex items-center justify-center">
                      <MoneybagIcon />
                    </div>
                    <span className="text-[11px] text-muted-foreground">Total Earnings</span>
                  </div>
                  <div className="pl-6">
                    <span className="text-base font-bold text-muted-foreground blur-[4px] select-none">KES ••••</span>
                  </div>
                </div>
              }
            >
              <div className="mb-[14px]">
                <div className="flex items-center gap-[6px] mb-1">
                  <div className="w-[30px] h-[30px] rounded-lg bg-soft-peach flex items-center justify-center">
                    <MoneybagIcon />
                  </div>
                  <span className="text-[11px] text-muted-foreground">Total Earnings</span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-base font-bold text-foreground">
                    {formatCurrency(totalEarnings)}
                  </span>
                  {totalEarnings > 0 && (
                    <span className="flex items-center gap-[3px] text-[10px] text-secondary font-semibold bg-secondary/10 py-0.5 px-[7px] rounded-full">
                      <ArrowUpIcon />
                      10% since last month
                    </span>
                  )}
                </div>
              </div>
            </PermissionWrapper>

            <div className="border-t border-border mb-[14px]"/>

            {/* 3-col stats */}
            <div className="grid grid-cols-3">
              <div className="flex flex-col gap-[3px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-light-blue-bg flex items-center justify-center">
                  <SendIcon />
                </div>
                <span className="text-[11px] text-muted-foreground mt-[3px]">Total Campaigns</span>
                <span className="text-base font-bold text-foreground">{totalCampaigns}</span>
              </div>
              <div className="flex flex-col gap-[3px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-soft-peach flex items-center justify-center">
                  <RefreshIcon />
                </div>
                <span className="text-[11px] text-muted-foreground mt-[3px]">Ongoing Campaigns</span>
                <span className="text-base font-bold text-foreground">{ongoingCampaigns}</span>
              </div>
              <div className="flex flex-col gap-[3px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-soft-mint/30 flex items-center justify-center">
                  <DropIcon />
                </div>
                <span className="text-[11px] text-muted-foreground mt-[3px]">Engagements</span>
                <span className="text-base font-bold text-foreground">{formatCompact(totalEngagements)}</span>
              </div>
            </div>
          </div>

          {/* CHART PANEL */}
          <PermissionWrapper permissionKey="dashboard.read" fallback={null}>
            <div className="bg-muted/30 rounded-xl overflow-hidden">
              {/* Tab strip with sliding indicator */}
              <div className="relative grid grid-cols-3 pt-1">
                <div
                  className="absolute top-1 -bottom-px rounded-t-lg bg-card z-[1] pointer-events-none transition-[left] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ left: `${activeTabIdx * 33.333}%`, width: "33.333%" }}
                />
                {chartTabConfig.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setChartTab(t.key)}
                    className="relative z-[2] bg-transparent border-none cursor-pointer pt-[10px] pr-[14px] pb-3 pl-[14px] text-left"
                  >
                    <div className="text-[10px] text-muted-foreground mb-[3px]">{t.label}</div>
                    <div className={`text-[13px] font-bold ${chartTab === t.key ? "text-foreground" : "text-muted-foreground"}`}>
                      {t.value}
                    </div>
                  </button>
                ))}
              </div>
              {/* Chart area */}
              <div className="bg-card rounded-b-xl px-[18px] pt-[14px] pb-4">
                {timelineLoading && chartTab === "earnings" ? (
                  <div className="h-[155px] flex flex-col justify-end gap-1 pb-2">
                    <Skeleton className="h-full w-full rounded-lg opacity-50" />
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={155}>
                    <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <XAxis dataKey="formatted_date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}/>
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        axisLine={false} tickLine={false}
                        tickFormatter={(v) => chartTab === "engagements" ? formatCompact(v) : `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)" }}
                        formatter={(value: number) => [
                          chartTab === "engagements" ? formatCompact(value) : formatCurrency(value),
                          chartTab === "earnings" ? "Earnings" : chartTab === "withdrawals" ? "Withdrawals" : "Engagements",
                        ]}
                      />
                      <Line type="monotone" dataKey="amount" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#22d3ee" }}/>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[140px] flex items-center justify-center">
                    <span className="text-[11px] text-muted-foreground">Not enough data to show trend</span>
                  </div>
                )}
              </div>
            </div>
          </PermissionWrapper>
        </div>

        {/* RIGHT column */}
        <div className="flex flex-col gap-[14px]">

          {/* UPCOMING CAMPAIGNS */}
          <div className="rounded-xl border border-accent/30 overflow-hidden bg-accent/10">
            <div className="px-[14px] py-3 flex items-center gap-[6px]">
              <ClockIcon />
              <span className="text-xs font-semibold text-foreground">Upcoming Campaigns</span>
            </div>
            {campaignsLoading ? (
              <div className="flex flex-col gap-2 px-[10px] pb-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : campaigns && campaigns.length > 0 ? (
              <div className="flex flex-col gap-2 px-[10px] pb-3">
                {campaigns.slice(0, 5).map((c) => (
                  <div
                    key={c._id}
                    className="bg-card border border-border rounded-lg py-2 px-3 flex items-center gap-[10px]"
                  >
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{c.duration_start}</span>
                    <span className="text-[11px] font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{c.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-[22px] px-[14px] flex justify-center">
                <span className="text-[11px] text-muted-foreground">You have no upcoming campaigns.</span>
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-card rounded-xl border border-border px-4 py-[14px] flex-1">
            <div className="flex items-center justify-between mb-[14px]">
              <span className="text-xs font-semibold text-foreground">Recent Activity</span>
              {!auditLogsLoading && auditLogs && auditLogs.length > 5 && (
                <button className="bg-transparent border-none text-[11px] text-primary cursor-pointer">
                  View All
                </button>
              )}
            </div>
            {auditLogsLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : recentLogs.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentLogs.map((log) => (
                  <div key={log._id} className="flex items-start gap-2">
                    <div
                      className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${getAvatarColor(log.user_id)}`}
                    >
                      <span className="text-[9px] font-bold text-white">
                        {log.entity_type.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="m-0 text-[11px] leading-[1.4]">
                        <span className="text-primary font-semibold capitalize">{log.entity_type}</span>
                        {" "}
                        <span className="text-muted-foreground">{log.action}</span>
                      </p>
                      {log.details && (
                        <p className="mt-px mb-0 text-[10px] text-muted-foreground">{log.details}</p>
                      )}
                      <p className="mt-0.5 mb-0 text-[9px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20">
                <span className="text-[11px] text-muted-foreground">No recent activity</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      {showCreateWizard && partner?._id && canCreateCampaigns && isConvexUser(user) && (
        <CreateCampaignWizard
          partnerId={partner._id}
          user_id={user._id}
          open={showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
        />
      )}

      <CreateProgramDialog
        open={showCreateProgramDialog}
        onOpenChange={setShowCreateProgramDialog}
      />
    </div>
  );
}
