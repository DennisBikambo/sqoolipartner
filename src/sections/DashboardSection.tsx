"use client";

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { PermissionWrapper } from "../components/common/PermissionWrapper";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Loading } from "../components/common/Loading";
import { isConvexUser } from "../types/auth.types";
import type { DashboardCampaign } from "../types/global.types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Wallet from "../components/common/Wallet";
// import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import CreateProgramDialog from "../components/common/CreateProgramDialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Lock, AlertCircle, TrendingUp, TrendingDown, Award, DollarSign } from "lucide-react";
import SuperAdminDashboard from "../components/common/SuperAdminDashboard";

export default function DashboardSection({
  activeItem,
  setActiveItem,
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
}) {
  const { user, partner } = useAuth();
  const { hasPermission,userRole } = usePermissions();
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showCreateProgramDialog, setShowCreateProgramDialog] = useState(false);

  const isSuperAdmin = isConvexUser(user) && userRole === "super_admin";

  

  // Permission checks
  const isDashboardAdmin = hasPermission("dashboard.admin");
  const canViewFullDashboard = hasPermission("dashboard.read"); 
  const canViewDashboard = isDashboardAdmin || canViewFullDashboard;
  const canCreateCampaigns = hasPermission("campaigns.write"); 

  // Fetch campaigns
  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id && canViewDashboard ? { partner_id: partner._id } : "skip"
  ) as DashboardCampaign[] | undefined;

  // Fetch campaign earnings (ranked)
  const campaignEarnings = useQuery(
    api.campaign.getCampaignEarnings,
    partner?._id && canViewFullDashboard ? { partner_id: partner._id } : "skip"
  );

  // Fetch withdrawal stats
  const withdrawalStats = useQuery(
    api.withdrawals.getTotalWithdrawals,
    partner?._id && canViewFullDashboard ? { partner_id: partner._id } : "skip"
  );

  // Fetch earnings timeline
  const earningsTimeline = useQuery(
    api.program_enrollments.getEarningsTimeline,
    partner?._id && canViewFullDashboard ? { partner_id: partner._id, days: 30 } : "skip"
  );

  const metrics = {
    totalCampaigns: campaigns?.length || 0,
    ongoingCampaigns: campaigns?.filter((c) => c.status === "active").length || 0,
    totalSignups: campaignEarnings?.reduce((sum, c) => sum + c.enrollments, 0) || 0,
    totalEarnings: campaignEarnings?.reduce((sum, c) => sum + c.partner_earnings, 0) || 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getRankBadge = (index: number) => {
    const badges = ["🥇", "🥈", "🥉"];
    return badges[index] || `#${index + 1}`;
  };

  if (isSuperAdmin) {
    return (
      <SuperAdminDashboard
        setActiveItem={setActiveItem}
      />
    );
  }

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
        <div className="flex items-center gap-3">
          {/* Super Admin: Create Program */}
          {isConvexUser(user) && user.role === 'super_admin' && (
            <Button
              onClick={() => setShowCreateProgramDialog(true)}
              variant="outline"
            >
              + New Program
            </Button>
          )}
          {/* Create Campaign */}
          {canCreateCampaigns && (
            <Button
              onClick={() => setShowCreateWizard(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              + New Campaign
            </Button>
          )}
        </div>
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
                    permissionKey="dashboard.admin"
                    fallback={<LockedMetric label="Total Earnings" />}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(metrics.totalEarnings)}
                      </p>
                    </div>
                  </PermissionWrapper>

                  {/* Total Campaigns */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Total Campaigns</p>
                    <p className="text-2xl font-bold text-foreground">{metrics.totalCampaigns}</p>
                  </div>

                  {/* Ongoing Campaigns */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <span className="text-lg">🎯</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Ongoing Campaigns</p>
                    <p className="text-2xl font-bold text-foreground">{metrics.ongoingCampaigns}</p>
                  </div>

                  {/* Engagements */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <span className="text-lg">📈</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Engagements</p>
                    <p className="text-2xl font-bold text-foreground">{metrics.totalSignups}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Second Row Metrics with Withdrawals */}
            <PermissionWrapper permissionKey="dashboard.view">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-muted">
                  <CardContent className="p-6">
                    <p className="text-xs text-muted-foreground mb-1">Earnings</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(metrics.totalEarnings)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-muted">
                  <CardContent className="p-6">
                    <p className="text-xs text-muted-foreground mb-1">Withdrawals</p>
                    <p className="text-xl font-bold text-foreground">
                      {withdrawalStats 
                        ? formatCurrency(withdrawalStats.total_completed)
                        : formatCurrency(0)}
                    </p>
                    {withdrawalStats && withdrawalStats.total_pending > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        +{formatCurrency(withdrawalStats.total_pending)} pending
                      </p>
                    )}
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

            {/* Enhanced Chart with Better UX */}
            <PermissionWrapper permissionKey="dashboard.view">
              <Card className="border border-muted">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Earnings Over Time (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {earningsTimeline && earningsTimeline.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={earningsTimeline}>
                          <defs>
                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="formatted_date" 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `KES ${value}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [formatCurrency(value), "Earnings"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#colorEarnings)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                      <TrendingDown className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm">No earnings data available yet</p>
                      <p className="text-xs mt-1">Start earning to see your progress</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PermissionWrapper>

            {/* Top Performing Campaigns - NEW FEATURE */}
            <PermissionWrapper permissionKey="dashboard.view">
              <Card className="border border-muted">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Top Performing Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {campaignEarnings && campaignEarnings.length > 0 ? (
                    <div className="space-y-3">
                      {campaignEarnings.slice(0, 5).map((campaign, index) => (
                        <div
                          key={campaign.campaign_id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-transparent rounded-lg border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-2xl flex-shrink-0">
                              {getRankBadge(index)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {campaign.campaign_name}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {campaign.enrollments} enrollments
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  •
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {campaign.conversion_rate.toFixed(1)}% conversion
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="text-base font-bold text-primary">
                              {formatCurrency(campaign.partner_earnings)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              from {formatCurrency(campaign.total_revenue)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No campaign earnings yet</p>
                      <p className="text-xs mt-1">Create campaigns to start earning</p>
                    </div>
                  )}
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

            {/* Recent Withdrawals */}
            <PermissionWrapper permissionKey="dashboard.view">
              <Card className="border border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent Withdrawals</CardTitle>
                </CardHeader>
                <CardContent>
                  {withdrawalStats && withdrawalStats.recent_withdrawals.length > 0 ? (
                    <div className="space-y-3">
                      {withdrawalStats.recent_withdrawals.map((w) => (
                        <div key={w._id} className="flex items-center justify-between py-2 border-b last:border-0 border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {formatCurrency(w.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(w._creationTime).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              w.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : w.status === "pending"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No withdrawals yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </PermissionWrapper>
          </div>
        </div>
      )}

      {/* Create Program Dialog (Super Admin only) */}
      <CreateProgramDialog
        open={showCreateProgramDialog}
        onOpenChange={setShowCreateProgramDialog}
      />
    </div>
  );
}