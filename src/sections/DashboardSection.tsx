// app/dashboard/section.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getDisplayName } from "../types/auth.types";
import { api } from "../../convex/_generated/api";
import { useQuery, useConvex } from "convex/react";
import { Loading } from "../components/common/Loading";
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
import { Badge } from "../components/ui/badge";
import Profile from "../components/common/Profile";
import Wallet from "../components/common/Wallet";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import { ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, ResponsiveContainer } from "recharts";

export default function DashboardSection({ 
  activeItem, 
  setActiveItem 
}: {
  activeItem: string; 
  setActiveItem: (item: string) => void;
}) {
  const { user, partner } = useAuth();
  const convex = useConvex();
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [allEnrollments, setAllEnrollments] = useState<DashboardEnrollment[]>([]);
  const [earningsData, setEarningsData] = useState<DashboardEarnings[]>([]);

  // Use partner._id for queries (Convex partner ID)
  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id ? { partner_id: partner._id } : "skip"
  ) as DashboardCampaign[] | undefined;

  useEffect(() => {
    if (!campaigns?.length) return;

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
      const safeCampaigns = campaigns ?? [];

      // Flatten all enrollments across campaigns
      const enrollments = await Promise.all(
        safeCampaigns.map((c) =>
          convex.query(api.program_enrollments.listByCampaign, {
            campaignId: c._id,
          })
        )
      );

      const flatEnrollments = enrollments.flat();

      // Group earnings by date
      const earningsMap: Record<string, number> = {};

      flatEnrollments.forEach((e) => {
        const date = new Date(e._creationTime).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });

        // Assuming each enrollment = one lesson at KES 200
        earningsMap[date] = (earningsMap[date] || 0) + 200;
      });

      const formatted = Object.entries(earningsMap).map(([date, amount]) => ({
        date,
        amount,
      }));

      // Sort by date ascending
      formatted.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setEarningsData(formatted);
    }

    fetchEnrollments();
    fetchEarnings();
  }, [campaigns, convex]);

  const metrics: DashboardMetrics = {
    totalCampaigns: campaigns?.length || 0,
    ongoingCampaigns: campaigns?.filter((c) => c.status === "active").length || 0,
    totalSignups: allEnrollments.length,
    totalEarnings:
      campaigns?.reduce((sum, c) => sum + (c.revenue_projection * 0.2 || 0), 0) || 0,
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

  // Get display name using helper function
  const displayName = getDisplayName(partner || user);

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">
            Dashboard Overview
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            Welcome back{displayName ? `, ${displayName}` : ""}
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateWizard(true)} 
          className="text-primary w-full sm:w-auto text-sm sm:text-base" 
          variant="outline"
        >
          + New Campaign
        </Button>
      </div>

      {showCreateWizard && partner?._id && (
        <CreateCampaignWizard
          partnerId={partner._id}
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
        <div className="space-y-6">
          {/* Mobile/Tablet: Stack everything vertically */}
          <div className="lg:hidden space-y-4">
            {/* Profile & Wallet */}
            <Profile />
            <Wallet activeItem={activeItem} setActiveItem={setActiveItem} />

            {/* Insights Card */}
            <Card className="border border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base sm:text-lg">Insights</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="outline" className="text-xs">Last 30 Days</Badge>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Campaigns", value: metrics.totalCampaigns },
                    { label: "Ongoing", value: metrics.ongoingCampaigns },
                    { label: "Total Signups", value: metrics.totalSignups },
                    {
                      label: "Earnings",
                      value: `KES ${metrics.totalEarnings.toLocaleString()}`,
                    },
                  ].map((m, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground line-clamp-1">{m.label}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground truncate">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="h-48 sm:h-64 text-primary">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={earningsData}>
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--chart-1)"
                        tick={{ fontSize: 10 }}
                      />
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
              </CardContent>
            </Card>

            {/* Upcoming Campaigns */}
            <Card className="border border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Upcoming Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.slice(0, 3).map((c) => (
                  <div
                    key={c._id}
                    className="flex items-start justify-between py-3 border-b last:border-0 border-border gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.duration_start} — {c.duration_end}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Signups */}
            <Card className="border border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Recent Signups</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((a) => (
                      <div key={a._id} className="flex items-center gap-3 py-2 border-b last:border-0 border-border">
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                          <AvatarFallback className="text-xs">{getInitials(a._id)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{a._id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {a.status || "pending"}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(new Date(a._creationTime))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent signups yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Desktop: Original 3-column layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6">
            {/* LEFT */}
            <aside className="lg:col-span-3 space-y-6">
              {/* Profile */}
              <Profile />
              {/* Wallet */}
              <Wallet activeItem={activeItem} setActiveItem={setActiveItem} />
            </aside>

            {/* MIDDLE */}
            <main className="lg:col-span-6">
              <Card className="border border-muted">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Insights</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="outline">Last 30 Days</Badge>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total Campaigns", value: metrics.totalCampaigns },
                      { label: "Ongoing Campaigns", value: metrics.ongoingCampaigns },
                      { label: "Total Signups", value: metrics.totalSignups },
                      {
                        label: "Total Earnings",
                        value: `KES ${metrics.totalEarnings.toLocaleString()}`,
                      },
                    ].map((m, i) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="mt-6 h-64 text-primary">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={earningsData}>
                        <XAxis dataKey="date" stroke="var(--chart-1)" />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="currentColor"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </main>

            {/* RIGHT */}
            <aside className="lg:col-span-3 space-y-6">
              {/* Upcoming Campaigns */}
              <Card className="border border-muted">
                <CardHeader>
                  <CardTitle>Upcoming Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaigns.slice(0, 3).map((c) => (
                    <div
                      key={c._id}
                      className="flex items-start justify-between py-3 border-b last:border-0 border-border"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.duration_start} — {c.duration_end}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {c.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border border-muted">
                <CardHeader>
                  <CardTitle>Recent Signups</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((a) => (
                      <div key={a._id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(a._id)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex flex-col gap-3">
                            <p className="text-sm font-medium text-foreground">{a._id}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {a.status || "pending"}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(new Date(a._creationTime))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent signups yet.</p>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}