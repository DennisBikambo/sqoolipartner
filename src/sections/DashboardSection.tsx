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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{displayName ? `, ${displayName}` : ""}
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateWizard(true)} 
          className="text-primary" 
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* LEFT */}
          <aside className="md:col-span-3 space-y-6">
            {/* Profile */}
            <Profile />
            {/* Wallet */}
            <Wallet activeItem={activeItem} setActiveItem={setActiveItem} />
          </aside>

          {/* MIDDLE */}
          <main className="md:col-span-6">
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
          <aside className="md:col-span-3 space-y-6">
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
      )}
    </div>
  );
}