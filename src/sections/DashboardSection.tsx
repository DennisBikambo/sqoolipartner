
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { isConvexUser } from "../types/auth.types";
import type { DashboardCampaign } from "../types/global.types";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Lock,
  AlertCircle,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Zap,
  Calendar,
  Download,
  TrendingUp,
  Edit,
} from "lucide-react";
import SuperAdminDashboard from "../components/common/SuperAdminDashboard";
import { WalletSetupDialog } from "../components/common/WalletSetUp";
import { WithdrawalDialog } from "../components/common/WithdrawalDialog";
import { WalletEditDialog } from "../components/common/WalletEditDialog";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import CreateProgramDialog from "../components/common/CreateProgramDialog";
import { PermissionWrapper } from "../components/common/PermissionWrapper";
import { formatCurrency, getAvatarColor } from "../utils/formatters";

function maskString(str: string, showStart = 2, showEnd = 4): string {
  if (!str) return "";
  if (str.length <= showStart + showEnd) return str;
  return `${str.slice(0, showStart)}${"*".repeat(str.length - showStart - showEnd)}${str.slice(-showEnd)}`;
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default function DashboardSection({
  // activeItem,
  setActiveItem,
}: {
  activeItem?: string;
  setActiveItem: (item: string) => void;
}) {
  const { user, partner } = useAuth();
  const { hasPermission, userRole } = usePermissions();

  const [chartTab, setChartTab] = useState<"earnings" | "withdrawals" | "engagements">("earnings");
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [editWalletOpen, setEditWalletOpen] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showCreateProgramDialog, setShowCreateProgramDialog] = useState(false);

  const isSuperAdmin = isConvexUser(user) && userRole === "super_admin";
  const isDashboardAdmin = hasPermission("dashboard.admin");
  const canViewFullDashboard = hasPermission("dashboard.read");
  const canViewDashboard = isDashboardAdmin || canViewFullDashboard;
  const canCreateCampaigns = hasPermission("campaigns.write");

  const partnerId = partner?._id as Id<"partners"> | undefined;

  const wallet = useQuery(
    api.wallet.getWalletByPartnerId,
    partnerId ? { partner_id: partnerId } : "skip"
  ) as Doc<"wallets"> | null | undefined;

  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partnerId && canViewDashboard ? { partner_id: partnerId } : "skip"
  ) as DashboardCampaign[] | undefined;

  const campaignEarnings = useQuery(
    api.campaign.getCampaignEarnings,
    partnerId && canViewFullDashboard ? { partner_id: partnerId } : "skip"
  );

  const withdrawalStats = useQuery(
    api.withdrawals.getTotalWithdrawals,
    partnerId && canViewFullDashboard ? { partner_id: partnerId } : "skip"
  );

  const earningsTimeline = useQuery(
    api.program_enrollments.getEarningsTimeline,
    partnerId && canViewFullDashboard ? { partner_id: partnerId, days: 30 } : "skip"
  );

  const auditLogs = useQuery(
    api.audit.getAuditLogs,
    partnerId ? { partner_id: partnerId } : "skip"
  );

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
              <div>
                <h3 className="text-lg font-semibold text-foreground">Dashboard Access Restricted</h3>
              </div>
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
  const isWalletActive = wallet?.is_setup_complete === true;

  // Chart data by tab
  const getChartData = (): { formatted_date: string; amount: number }[] => {
    if (chartTab === "earnings") return (earningsTimeline as { formatted_date: string; amount: number }[] | undefined) ?? [];
    if (chartTab === "withdrawals") {
      return (withdrawalStats?.recent_withdrawals ?? []).map((w) => ({
        formatted_date: new Date(w._creationTime).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        amount: w.amount,
      }));
    }
    return [];
  };

  const chartData = getChartData();

  const getLogAvatarColor = (id: string) => getAvatarColor(id);

  const chartTabConfig = [
    { key: "earnings" as const, label: "Earnings", value: formatCurrency(totalEarnings) },
    { key: "withdrawals" as const, label: "Withdrawals", value: formatCurrency(totalWithdrawn) },
    { key: "engagements" as const, label: "Engagements", value: formatCompact(totalEngagements) },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* ===== TOP ACTION ROW ===== */}
      <div className="flex items-center justify-end gap-3">
        {isConvexUser(user) && user.role === "super_admin" && (
          <Button variant="outline" onClick={() => setShowCreateProgramDialog(true)}>
            + New Program
          </Button>
        )}
        {canCreateCampaigns && (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setShowCreateWizard(true)}
          >
            + New Campaign
          </Button>
        )}
      </div>

      {/* ===== WALLET BANNER ===== */}
      <PermissionWrapper requireRead="wallet" fallback={null}>
        {/* Outer tinted container */}
        <div className="rounded-xl p-4" style={{ backgroundColor: "#EFF3F8" }}>
          <div className="flex items-center gap-6">

            {/* ── Zone 1: Gradient balance card ── */}
            <div
              className="relative rounded-xl overflow-hidden flex-shrink-0 flex flex-col justify-between"
              style={{
                background: "linear-gradient(to right, #1E1B4B, #6366F1)",
                width: 240,
                minHeight: 110,
                padding: "18px 20px",
              }}
            >
              {/* Watermark wallet icon — front-facing billfold with clasp */}
              <svg
                className="absolute bottom-2 right-2"
                style={{ opacity: 0.35, width: 68, height: 68 }}
                viewBox="0 0 64 64"
                fill="none"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {/* Wallet body */}
                <rect x="8" y="16" width="48" height="40" rx="8" ry="8" />
                {/* Top flap / clasp tab */}
                <path d="M24 16 V12 Q24 4 32 4 Q40 4 40 12 V16" />
                {/* Horizontal seam */}
                <line x1="8" y1="30" x2="56" y2="30" />
                {/* Clasp circle — filled white at same opacity */}
                <circle cx="32" cy="16" r="3" fill="white" stroke="none" />
              </svg>

              <p className="text-white/75 text-xs font-medium tracking-wide relative z-10">
                Wallet Balance
              </p>
              <p className="text-white text-2xl font-bold mt-3 relative z-10">
                {isWalletActive
                  ? `KES ${(wallet?.balance ?? 0).toLocaleString("en-KE", {
                      minimumFractionDigits: 2,
                    })}`
                  : "KES 0.00"}
              </p>
            </div>

            {/* ── Zone 2 + Zone 3: Right content ── */}
            <div className="flex-1 flex items-center justify-between gap-6 min-w-0">
              {!isWalletActive ? (
                /* Empty state */
                <>
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">
                    Activate Wallet to withdraw your earnings
                  </p>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-6 flex-shrink-0"
                    onClick={() => setWalletSetupOpen(true)}
                  >
                    Activate Wallet
                  </Button>
                </>
              ) : (
                /* Activated state */
                <>
                  {/* Zone 2: M-Pesa badge + masked details */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Green M-Pesa chip */}
                    <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-1.5 flex-shrink-0">
                      <div className="h-5 w-5 bg-green-600 rounded flex items-center justify-center">
                        <span className="text-white text-[11px] font-bold leading-none">M</span>
                      </div>
                      <span className="text-xs text-green-700 dark:text-green-400 font-semibold">
                        Paybill
                      </span>
                    </div>

                    {/* Masked details */}
                    <div className="space-y-1 min-w-0">
                      {wallet?.paybill_number && (
                        <p className="text-sm text-gray-700 dark:text-foreground">
                          Paybill:{" "}
                          <span className="font-mono">
                            {maskString(wallet.paybill_number, 2, 1)}
                          </span>
                        </p>
                      )}
                      <p className="text-sm text-gray-700 dark:text-foreground">
                        Account No:{" "}
                        <span className="font-mono">
                          {maskString(wallet?.account_number ?? "", 2, 4)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Zone 3: Edit + Withdraw */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => setEditWalletOpen(true)}
                      title="Edit payment method"
                      className="h-9 w-9 rounded-lg border border-gray-300 dark:border-border flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-muted transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-5 h-10"
                      onClick={() => setWithdrawalOpen(true)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </PermissionWrapper>

      {/* ===== TWO-COLUMN LAYOUT: Stats+Chart | Sidebar ===== */}
      <div className="flex gap-6 items-start">

        {/* ── LEFT column (~65%): Stats card + Chart card ── */}
        <div className="flex-[2] min-w-0 space-y-5">

          {/* STATS — single unified card */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #E5E7EB" }}
          >
            {/* Top row: Total Earnings (full width) */}
            <PermissionWrapper
              permissionKey="dashboard.admin"
              fallback={
                <div className="px-6 py-5" style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                  </div>
                  <p className="text-2xl font-bold text-muted-foreground blur-sm select-none">
                    KES ••••
                  </p>
                </div>
              }
            >
              <div className="px-6 py-5 bg-card" style={{ borderBottom: "1px solid #E5E7EB" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalEarnings)}</p>
                {/* Subtext only when there is real earnings data */}
                {totalEarnings > 0 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>↑ since last month</span>
                  </p>
                )}
              </div>
            </PermissionWrapper>

            {/* Bottom row: 3 stats with vertical dividers */}
            <div className="grid grid-cols-3 bg-card" style={{ borderTop: 0 }}>
              {/* Total Campaigns */}
              <div className="px-6 py-5" style={{ borderRight: "1px solid #E5E7EB" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">Total Campaigns</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalCampaigns}</p>
              </div>

              {/* Ongoing Campaigns */}
              <div className="px-6 py-5" style={{ borderRight: "1px solid #E5E7EB" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Ongoing Campaigns</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{ongoingCampaigns}</p>
              </div>

              {/* Engagements */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">Engagements</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCompact(totalEngagements)}</p>
              </div>
            </div>
          </div>

          {/* CHART — tabbed */}
          <PermissionWrapper permissionKey="dashboard.read" fallback={null}>
            <div className="rounded-xl overflow-hidden bg-card" style={{ border: "1px solid #E5E7EB" }}>
              {/* Tab headers */}
              <div className="flex px-6 pt-4 overflow-x-auto" style={{ borderBottom: "1px solid #E5E7EB" }}>
                {chartTabConfig.map(({ key, label, value }) => (
                  <button
                    key={key}
                    className={`pb-3 mr-8 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      chartTab === key
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setChartTab(key)}
                  >
                    {label}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{value}</span>
                  </button>
                ))}
              </div>

              <div className="p-6">
                {chartData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis
                          dataKey="formatted_date"
                          tick={{ fontSize: 11, fill: "#9CA3AF" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#9CA3AF" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) =>
                            chartTab === "engagements"
                              ? formatCompact(v)
                              : `${(v / 1000).toFixed(0)}K`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [
                            chartTab === "engagements"
                              ? formatCompact(value)
                              : formatCurrency(value),
                            chartTab === "earnings"
                              ? "Earnings"
                              : chartTab === "withdrawals"
                              ? "Withdrawals"
                              : "Engagements",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#60A5FA"
                          strokeWidth={2}
                          fill="url(#chartFill)"
                          dot={false}
                          activeDot={{ r: 4, fill: "#60A5FA" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
                    <TrendingDown className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">Not enough data to show trend</p>
                    <p className="text-xs mt-1 opacity-60">Data will appear as you earn</p>
                  </div>
                )}
              </div>
            </div>
          </PermissionWrapper>
        </div>

        {/* ── RIGHT column (~35%): Upcoming + Activity ── */}
        <div className="flex-[1] min-w-0 space-y-4">

          {/* Upcoming Campaigns */}
          <div className="rounded-xl overflow-hidden bg-card" style={{ border: "1px solid #E5E7EB" }}>
            <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-foreground">Upcoming Campaigns</p>
            </div>
            <div className="px-5 py-2">
              {campaigns && campaigns.length > 0 ? (
                campaigns.slice(0, 5).map((c, i) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: i < Math.min(campaigns.length, 5) - 1 ? "1px solid #F3F4F6" : "none" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{c.duration_start}</p>
                      <p className="text-sm font-medium truncate pr-3">{c.name}</p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium text-white ${
                        i % 2 === 0 ? "bg-orange-400" : "bg-pink-500"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  You have no upcoming campaigns
                </p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl overflow-hidden bg-card" style={{ border: "1px solid #E5E7EB" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <p className="text-sm font-semibold text-foreground">Recent Activity</p>
              {auditLogs && auditLogs.length > 5 && (
                <button className="text-xs text-blue-500 hover:text-blue-600">View All</button>
              )}
            </div>
            <div className="px-5 py-2 max-h-72 overflow-y-auto">
              {auditLogs && auditLogs.length > 0 ? (
                [...auditLogs]
                  .reverse()
                  .slice(0, 10)
                  .map((log, i, arr) => (
                    <div
                      key={log._id}
                      className="flex items-start gap-3 py-3"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}
                    >
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getLogAvatarColor(log.user_id)}`}
                      >
                        {log.entity_type.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate capitalize">
                          {log.entity_type}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{log.action}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No recent activity
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== USER PROFILE CARD (wallet active only) ===== */}
      {isWalletActive && isConvexUser(user) && (
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 bg-emerald-500"
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                    Media Partner
                  </span>
                </div>
                {user.phone && (
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                )}
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              {canCreateCampaigns && (
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white rounded-lg flex-shrink-0"
                  onClick={() => setShowCreateWizard(true)}
                >
                  Create Campaign Link
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== DIALOGS ===== */}
      {partner?._id && (
        <WalletSetupDialog
          open={walletSetupOpen}
          onClose={() => setWalletSetupOpen(false)}
          partnerId={partner._id as Id<"partners">}
          userId={isConvexUser(user) ? user._id : (partner._id as unknown as Id<"users">)}
        />
      )}

      {partner?._id && wallet && isConvexUser(user) && (
        <WithdrawalDialog
          open={withdrawalOpen}
          onClose={() => setWithdrawalOpen(false)}
          wallet={wallet}
          partnerId={partner._id}
          userId={user._id}
        />
      )}

      {partner?._id && wallet && isConvexUser(user) && (
        <WalletEditDialog
          open={editWalletOpen}
          onClose={() => setEditWalletOpen(false)}
          wallet={wallet}
          partnerId={partner._id}
          userId={user._id}
        />
      )}

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
