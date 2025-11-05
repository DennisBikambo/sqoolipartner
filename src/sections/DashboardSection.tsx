// app/dashboard/section.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
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
import Wallet from "../components/common/Wallet";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import { LineChart, Line, XAxis, ResponsiveContainer } from "recharts";

export default function DashboardSection({ 
  activeItem, 
  setActiveItem 
}: {
  activeItem: string; 
  setActiveItem: (item: string) => void;
}) {
  const {  partner } = useAuth();
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



  // Check if we have enough data for the chart
  const hasEnoughData = earningsData.length > 0;

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
        </div>
        <Button 
          onClick={() => setShowCreateWizard(true)} 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT - Main Content (2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Single Metrics Card */}
            <Card className="border border-muted">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
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

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Total Campaigns</p>
                    <p className="text-2xl font-bold text-foreground">
                      {metrics.totalCampaigns}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <span className="text-lg">🎯</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Ongoing Campaigns</p>
                    <p className="text-2xl font-bold text-foreground">
                      {metrics.ongoingCampaigns}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="text-lg">📈</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Engagements</p>
                    <p className="text-2xl font-bold text-foreground">
                      {metrics.totalSignups}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Second Row Metrics */}
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
                  <p className="text-xl font-bold text-foreground">
                    KES 0.00
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground mb-1">Engagements</p>
                  <p className="text-xl font-bold text-foreground">
                    {metrics.totalSignups}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="border border-muted">
              <CardContent className="p-6">
                {hasEnoughData ? (
                  <div className="h-64 text-primary">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={earningsData}>
                        <XAxis 
                          dataKey="date" 
                          stroke="var(--chart-1)"
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
                ) : (
                  <div className="h-64 text-muted-foreground flex items-center justify-center">
                    <p className="text-sm">Not enough data to show trend</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT - Sidebar (1 column on desktop) */}
          <div className="space-y-6">
            {/* Wallet */}
            <Wallet activeItem={activeItem} setActiveItem={setActiveItem} />

            {/* Upcoming Campaigns */}
            <Card className="border border-muted">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏰</span>
                  <CardTitle className="text-base">Upcoming Campaigns</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {campaigns.length > 0 ? (
                  campaigns.slice(0, 3).map((c) => (
                    <div
                      key={c._id}
                      className="py-3 border-b last:border-0 border-border"
                    >
                      <p className="text-sm font-medium text-foreground mb-1">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.duration_start} — {c.duration_end}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming campaigns
                  </p>
                )}
              </CardContent>
            </Card>

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