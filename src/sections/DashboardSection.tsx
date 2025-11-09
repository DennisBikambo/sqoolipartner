"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { PermissionWrapper } from "../components/common/PermissionWrapper";
import { api } from "../../convex/_generated/api";
import { useQuery, useConvex } from "convex/react";
import { Loading } from "../components/common/Loading";
import { isConvexUser } from "../types/auth.types";
import type {
  DashboardCampaign,
  DashboardEnrollment,
  DashboardMetrics,
  DashboardEarnings,
} from "../types/global.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import Wallet from "../components/common/Wallet";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import { LineChart, Line, XAxis, ResponsiveContainer } from "recharts";
import { Lock, AlertCircle } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export default function DashboardSection({
  activeItem,
  setActiveItem,
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
}) {
  const { user, partner } = useAuth();
  const { hasPermission, canRead, permissions } = usePermissions();
  const convex = useConvex();
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [allEnrollments, setAllEnrollments] = useState<DashboardEnrollment[]>([]);
  const [earningsData, setEarningsData] = useState<DashboardEarnings[]>([]);
  const [users, setUsers] = useState<Record<string, { name: string; email: string } | null>>({});

  // Permission checks
  const isDashboardAdmin = hasPermission("dashboard.admin");
  const canViewFullDashboard = hasPermission("dashboard.view");
  const canViewDashboard = isDashboardAdmin || canViewFullDashboard;
  const canViewCampaigns = canRead("campaigns");
  const canCreateCampaigns = hasPermission("campaign.write");
  const canViewWallet = canRead("wallet");

  // Debug logs
  useEffect(() => {
    console.log("Dashboard Permissions:", {
      permissions,
      isDashboardAdmin,
      canViewFullDashboard,
      canViewDashboard,
      canViewCampaigns,
      canViewWallet,
    });
  }, [permissions, isDashboardAdmin, canViewFullDashboard, canViewDashboard, canViewCampaigns, canViewWallet]);

  // Fetch campaigns
  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id && canViewDashboard ? { partner_id: partner._id } : "skip"
  ) as DashboardCampaign[] | undefined;

  async function getUserForCampaign(campaignId: Id<"campaigns">) {
    try {
      const user = await convex.query(api.user.getUserByCampaign, {
        campaignId,
      });
      return user;
    } catch (err) {
      console.error("Failed to fetch user for campaign:", err);
      return null;
    }
  }

  useEffect(() => {
    async function fetchUsers() {
      if (!campaigns || campaigns.length === 0) return;

      const results = await Promise.all(
        campaigns.map(async (c) => {
          const u = await getUserForCampaign(c._id);
          return [c._id, u] as const;
        })
      );

      const userMap: Record<string, { name: string; email: string } | null> = {};
      results.forEach(([id, u]) => {
        userMap[id] = u;
      });

      setUsers(userMap);
    }

    fetchUsers();
  }, [campaigns, convex,getUserForCampaign]);

  useEffect(() => {
    if (!campaigns || campaigns.length === 0) return;

    async function fetchEnrollments() {
      const safeCampaigns = campaigns ?? [];
      if (safeCampaigns.length === 0) {
        setAllEnrollments([]);
        return;
      }

      const results = await Promise.all(
        safeCampaigns.map((c) =>
          convex.query(api.program_enrollments.listByCampaign, {
            campaignId: c._id,
          })
        )
      );
      setAllEnrollments(results.flat());
    }

    async function fetchEarnings() {
      if (!canViewFullDashboard) return;

      const safeCampaigns = campaigns ?? [];
      const enrollments = await Promise.all(
        safeCampaigns.map((c) =>
          convex.query(api.program_enrollments.listByCampaign, {
            campaignId: c._id,
          })
        )
      );

      const flatEnrollments = enrollments.flat();
      const earningsMap: Record<string, number> = {};

      flatEnrollments.forEach((e) => {
        const date = new Date(e._creationTime).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });
        earningsMap[date] = (earningsMap[date] || 0) + 200;
      });

      const formatted = Object.entries(earningsMap).map(([date, amount]) => ({
        date,
        amount,
      }));

      formatted.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setEarningsData(formatted);
    }

    fetchEnrollments();
    fetchEarnings();
  }, [campaigns, convex, canViewFullDashboard]);

  const metrics: DashboardMetrics = {
    totalCampaigns: campaigns?.length || 0,
    ongoingCampaigns: campaigns?.filter((c) => c.status === "active").length || 0,
    totalSignups: allEnrollments.length,
    totalEarnings: canViewFullDashboard
      ? campaigns?.reduce((sum, c) => sum + (c.revenue_projection * 0.2 || 0), 0) || 0
      : 0,
  };

  const recentActivity = allEnrollments
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 6);

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const hasEnoughData = earningsData.length > 0;

  const LockedMetric = ({ label }: { label: string }) => (
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-muted-foreground blur-sm select-none">
        KES ••••
      </p>
      <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px] rounded-lg" />
    </div>
  );

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
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>You don't have permission to view the dashboard.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to request <span className="font-medium text-foreground">dashboard.view</span> permission.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          {isDashboardAdmin && (
            <p className="text-sm text-muted-foreground mt-1">
              Partner Admin View - Campaign Analytics
            </p>
          )}
        </div>
        {canCreateCampaigns && (
          <Button
            onClick={() => setShowCreateWizard(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + New Campaign
          </Button>
        )}
      </div>

      {showCreateWizard && partner?._id && canCreateCampaigns && user && isConvexUser(user) && (
        <CreateCampaignWizard
          partnerId={partner._id}
          user_id={user._id}
          open={showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
        />
      )}

      {!partner ? (
        <Loading message="Loading your dashboard..." size="lg" />
      ) : campaigns === undefined ? (
        <Loading message="Loading your campaigns..." size="lg" />
      ) : !campaigns?.length ? (
        <NoCampaignCard />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metrics Card */}
            <Card className="border border-muted">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                  {/* Total Earnings */}
                  <PermissionWrapper
                    permissionKey="dashboard.view"
                    fallback={<LockedMetric label="Total Earnings" />}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <span className="text-lg">💰</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                      <p className="text-2xl font-bold text-foreground">
                        KES {metrics.totalEarnings.toFixed(2)}
                      </p>
                    </div>
                  </PermissionWrapper>

                  {/* Total Campaigns */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Total Campaigns</p>
                    <p className="text-2xl font-bold text-foreground">{metrics.totalCampaigns}</p>
                  </div>

                  {/* Ongoing Campaigns */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <span className="text-lg">🎯</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Ongoing Campaigns</p>
                    <p className="text-2xl font-bold text-foreground">{metrics.ongoingCampaigns}</p>
                  </div>

                  {/* Engagements */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="text-lg">📈</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Engagements</p>
                    <p className="text-2xl font-bold text-foreground">{metrics.totalSignups}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Second Row Metrics */}
            <PermissionWrapper permissionKey="dashboard.view">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-muted">
                  <CardContent className="p-6">
                    <p className="text-xs text-muted-foreground mb-1">Earnings</p>
                    <p className="text-xl font-bold text-foreground">
                      KES {metrics.totalEarnings.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-muted">
                  <CardContent className="p-6">
                    <p className="text-xs text-muted-foreground mb-1">Withdrawals</p>
                    <p className="text-xl font-bold text-foreground">KES 0.00</p>
                  </CardContent>
                </Card>

                <Card className="border border-muted">
                  <CardContent className="p-6">
                    <p className="text-xs text-muted-foreground mb-1">Engagements</p>
                    <p className="text-xl font-bold text-foreground">{metrics.totalSignups}</p>
                  </CardContent>
                </Card>
              </div>
            </PermissionWrapper>

            {/* Chart */}
            <PermissionWrapper permissionKey="dashboard.view">
              <Card className="border border-muted">
                <CardContent className="p-6">
                  {hasEnoughData ? (
                    <div className="h-64 text-primary">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={earningsData}>
                          <XAxis dataKey="date" stroke="var(--chart-1)" />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="currentColor"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 text-muted-foreground flex items-center justify-center">
                      <p className="text-sm">Not enough data to show trend</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PermissionWrapper>

            {/* Campaign Revenue by User */}
            <PermissionWrapper permissionKey="dashboard.admin">
              <Card className="border border-muted">
                <CardHeader>
                  <CardTitle className="text-base">Campaign Revenue by User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns.slice(0, 5).map((campaign) => {
                      const campaignUser = users[campaign._id];

                      return (
                        <div
                          key={campaign._id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Revenue Projection: KES {campaign.revenue_projection.toFixed(2)}
                            </p>

                            {campaignUser && (
                              <p className="text-xs text-primary mt-1">
                                Created by: {campaignUser.name || campaignUser.email}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {campaign.target_signups} signups
                            </p>
                            <p className="text-xs text-muted-foreground">{campaign.status}</p>
                          </div>
                        </div>
                      );
                    })}

                    {campaigns.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No campaigns yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </PermissionWrapper>
          </div>

          {/* RIGHT - Sidebar */}
          <div className="space-y-6">
            {/* Wallet */}
            <PermissionWrapper permissionKey="dashboard.view" fallback={null}>
              <PermissionWrapper requireRead="wallet" fallback={null}>
                <Wallet activeItem={activeItem} setActiveItem={setActiveItem} />
              </PermissionWrapper>
            </PermissionWrapper>

            {/* Upcoming Campaigns */}
            {campaigns && campaigns.length > 0 && (
              <Card className="border border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏰</span>
                    <CardTitle className="text-base">Upcoming Campaigns</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {campaigns.slice(0, 3).map((c) => (
                    <div key={c._id} className="py-3 border-b last:border-0 border-border">
                      <p className="text-sm font-medium text-foreground mb-1">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.duration_start} — {c.duration_end}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="border border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((a) => (
                      <div key={a._id} className="flex items-center gap-3 py-2">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs">{getInitials(a._id)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{a._id}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(a._creationTime))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}