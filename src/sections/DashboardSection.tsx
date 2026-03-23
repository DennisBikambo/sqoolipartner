
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

const DropIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/>
    <polyline points="5 12 12 5 19 12"/>
  </svg>
);

const CalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const { user, partner } = useAuth();
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
    <div style={{ padding: "24px", background: "#f9fafb", minHeight: "100%" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0 }}>Dashboard</h1>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <div style={{ marginTop: "2px" }}><CalIcon /></div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>12 Jan 2026 – 13 Feb 2026</span>
            <div style={{ display: "flex", alignItems: "center", gap: "3px", cursor: "pointer" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#374151" }}>Last 28 Days</span>
              <ChevronDownIcon />
            </div>
          </div>
        </div>
      </div>

      {/* ── Wallet Card (from commons/Wallet.tsx) ── */}
      <PermissionWrapper requireRead="wallet" fallback={null}>
        <div style={{ marginBottom: "16px" }}>
          <Wallet activeItem={activeItem ?? "dashboard"} setActiveItem={setActiveItem} />
        </div>
      </PermissionWrapper>

      {/* ── Main 2-col grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>

        {/* LEFT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* EARNINGS + STATS PANEL */}
          <div style={{
            background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6",
            padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            {/* Total Earnings */}
            <PermissionWrapper
              permissionKey="dashboard.admin"
              fallback={
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MoneybagIcon />
                    </div>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>Total Earnings</span>
                  </div>
                  <div style={{ paddingLeft: "24px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#9ca3af", filter: "blur(4px)", userSelect: "none" }}>KES ••••</span>
                  </div>
                </div>
              }
            >
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MoneybagIcon />
                  </div>
                  <span style={{ fontSize: "11px", color: "#9ca3af" }}>Total Earnings</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "24px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {formatCurrency(totalEarnings)}
                  </span>
                  {totalEarnings > 0 && (
                    <span style={{
                      display: "flex", alignItems: "center", gap: "3px",
                      fontSize: "10px", color: "#16a34a", fontWeight: 600,
                      background: "#dcfce7", padding: "2px 7px", borderRadius: "999px",
                    }}>
                      <ArrowUpIcon />
                      10% since last month
                    </span>
                  )}
                </div>
              </div>
            </PermissionWrapper>

            <div style={{ borderTop: "1px solid #f3f4f6", marginBottom: "14px" }}/>

            {/* 3-col stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SendIcon />
                </div>
                <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>Total Campaigns</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{totalCampaigns}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RefreshIcon />
                </div>
                <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>Ongoing Campaigns</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{ongoingCampaigns}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DropIcon />
                </div>
                <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>Engagements</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{formatCompact(totalEngagements)}</span>
              </div>
            </div>
          </div>

          {/* CHART PANEL */}
          <PermissionWrapper permissionKey="dashboard.read" fallback={null}>
            <div style={{ background: "#f9fafb", borderRadius: "12px", overflow: "hidden" }}>
              {/* Tab strip with sliding indicator */}
              <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", paddingTop: "4px" }}>
                <div style={{
                  position: "absolute", top: "4px", bottom: "-1px",
                  left: `${activeTabIdx * 33.333}%`, width: "33.333%",
                  background: "#fff", borderRadius: "8px 8px 0 0",
                  transition: "left 0.22s cubic-bezier(0.4,0,0.2,1)",
                  zIndex: 1, pointerEvents: "none",
                }}/>
                {chartTabConfig.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setChartTab(t.key)}
                    style={{
                      position: "relative", zIndex: 2,
                      background: "transparent", border: "none", cursor: "pointer",
                      padding: "10px 14px 12px", textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "#9ca3af", marginBottom: "3px" }}>{t.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: chartTab === t.key ? "#111827" : "#6b7280" }}>
                      {t.value}
                    </div>
                  </button>
                ))}
              </div>
              {/* Chart area */}
              <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", padding: "14px 18px 16px" }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={155}>
                    <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <XAxis dataKey="formatted_date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}/>
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        axisLine={false} tickLine={false}
                        tickFormatter={(v) => chartTab === "engagements" ? formatCompact(v) : `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                        formatter={(value: number) => [
                          chartTab === "engagements" ? formatCompact(value) : formatCurrency(value),
                          chartTab === "earnings" ? "Earnings" : chartTab === "withdrawals" ? "Withdrawals" : "Engagements",
                        ]}
                      />
                      <Line type="monotone" dataKey="amount" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#22d3ee" }}/>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>Not enough data to show trend</span>
                  </div>
                )}
              </div>
            </div>
          </PermissionWrapper>
        </div>

        {/* RIGHT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* UPCOMING CAMPAIGNS */}
          <div style={{ borderRadius: "12px", border: "1px solid #ddd6fe", overflow: "hidden", background: "#ede9fe" }}>
            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ClockIcon />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Upcoming Campaigns</span>
            </div>
            {campaigns && campaigns.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 10px 12px" }}>
                {campaigns.slice(0, 5).map((c) => (
                  <div
                    key={c._id}
                    style={{
                      background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px",
                      padding: "8px 12px", display: "flex", alignItems: "center", gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#9ca3af", whiteSpace: "nowrap" }}>{c.duration_start}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "22px 14px", display: "flex", justifyContent: "center" }}>
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>You have no upcoming campaigns.</span>
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6", padding: "14px 16px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Recent Activity</span>
              {auditLogs && auditLogs.length > 5 && (
                <button style={{ background: "none", border: "none", fontSize: "11px", color: "#06b6d4", cursor: "pointer" }}>
                  View All
                </button>
              )}
            </div>
            {recentLogs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recentLogs.map((log) => (
                  <div key={log._id} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <div
                      style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                      className={getAvatarColor(log.user_id)}
                    >
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#fff" }}>
                        {log.entity_type.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.4 }}>
                        <span style={{ color: "#3b82f6", fontWeight: 600, textTransform: "capitalize" }}>{log.entity_type}</span>
                        {" "}
                        <span style={{ color: "#6b7280" }}>{log.action}</span>
                      </p>
                      {log.details && (
                        <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#9ca3af" }}>{log.details}</p>
                      )}
                      <p style={{ margin: "2px 0 0", fontSize: "9px", color: "#9ca3af" }}>
                        {new Date(log.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80px" }}>
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>No recent activity</span>
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
