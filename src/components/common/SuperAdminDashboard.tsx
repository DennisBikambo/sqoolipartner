
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import CreateProgramDialog from "./CreateProgramDialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  GraduationCap,
  Users,
  DollarSign,
  Wallet as WalletIcon,
  Award,
  BarChart3,
  Shield,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

interface SuperAdminDashboardProps {
  setActiveItem: (item: string) => void;
}

export default function SuperAdminDashboard({
  setActiveItem,
}: SuperAdminDashboardProps) {
  const [showCreateProgramDialog, setShowCreateProgramDialog] = useState(false);

  // Fetch system-wide data
  const subjects = useQuery(api.subjects.listSubjects);
  const curricula = useQuery(api.curricula.listCurricula);
  const programs = useQuery(api.program.listPrograms);
  const wallets = useQuery(api.wallet.getAllWallets);
  const partners = useQuery(api.partner.getAllPartners);
  const transactions = useQuery(api.transactions.getAllTransactions);

  // Calculate partner earnings summary
  const partnerEarningsSummary = useQuery(api.partner_revenue.getPartnerEarningsSummary);

  // Get earnings timeline for chart
  const systemEarningsTimeline = useQuery(
    api.partner_revenue.getSystemEarningsTimeline,
    { days: 30 }
  );

  // Top earning partners
  const topPartners = useQuery(api.partner_revenue.getTopEarningPartners, { limit: 5 });

  const primaryLoading =
    wallets === undefined ||
    partners === undefined ||
    transactions === undefined ||
    partnerEarningsSummary === undefined;

  const secondaryLoading =
    subjects === undefined ||
    curricula === undefined ||
    programs === undefined;

  const metrics = {
    totalSubjects: subjects?.length || 0,
    totalCurricula: curricula?.length || 0,
    totalPrograms: programs?.length || 0,
    totalWallets: wallets?.length || 0,
    totalPartners: partners?.length || 0,
    totalTransactions: transactions?.length || 0,
    totalPartnerEarnings: partnerEarningsSummary?.total_earnings || 0,
    totalSystemRevenue: partnerEarningsSummary?.total_revenue || 0,
  };

  const partnerSharePct = metrics.totalSystemRevenue > 0
    ? Math.round((metrics.totalPartnerEarnings / metrics.totalSystemRevenue) * 100)
    : 0;
  const sqooliSharePct = metrics.totalSystemRevenue > 0
    ? Math.round(((metrics.totalSystemRevenue - metrics.totalPartnerEarnings) / metrics.totalSystemRevenue) * 100)
    : 0;

  const getRankCircle = (index: number) => {
    const styles = [
      "bg-primary text-primary-foreground",
      "bg-muted-foreground/60 text-background",
      "bg-chart-3/70 text-background",
    ];
    const style = styles[index] ?? "bg-muted text-muted-foreground";
    return (
      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${style}`}>
        #{index + 1}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">System Dashboard</h1>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Super Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            System-wide analytics and management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateProgramDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + New Program
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Metrics — 4 individual cards */}
          {primaryLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-secondary border-border">
                <CardContent className="p-5">
                  <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                    <DollarSign className="h-4 w-4 text-secondary" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">System Revenue</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(metrics.totalSystemRevenue)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-chart-3 border-border">
                <CardContent className="p-5">
                  <div className="h-8 w-8 rounded-lg bg-chart-3/10 flex items-center justify-center mb-3">
                    <Users className="h-4 w-4 text-chart-3" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Partner Earnings</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(metrics.totalPartnerEarnings)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary border-border">
                <CardContent className="p-5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Total Programs</p>
                  <p className="text-xl font-bold text-foreground">{metrics.totalPrograms}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-chart-4 border-border">
                <CardContent className="p-5">
                  <div className="h-8 w-8 rounded-lg bg-chart-4/10 flex items-center justify-center mb-3">
                    <BarChart3 className="h-4 w-4 text-chart-4" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                  <p className="text-xl font-bold text-foreground">{metrics.totalTransactions}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Secondary Stats — inline pills in one card */}
          {secondaryLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : (
            <Card className="border border-muted">
              <CardContent className="p-5">
                <div className="flex items-center gap-8 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Subjects</p>
                      <p className="text-lg font-bold text-foreground">{metrics.totalSubjects}</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-chart-4/10 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-chart-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Curricula</p>
                      <p className="text-lg font-bold text-foreground">{metrics.totalCurricula}</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <WalletIcon className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Active Wallets</p>
                      <p className="text-lg font-bold text-foreground">{metrics.totalWallets}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Earnings Chart */}
          <Card className="border border-muted">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                System Revenue Over Time (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {systemEarningsTimeline === undefined ? (
                <Skeleton className="h-64 w-full rounded-lg" />
              ) : systemEarningsTimeline.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={systemEarningsTimeline}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                        formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <TrendingDown className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No revenue data available yet</p>
                  <p className="text-xs mt-1">System revenue will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Earning Partners */}
          <Card className="border border-muted">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-chart-3" />
                Top Earning Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topPartners === undefined ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : topPartners.length > 0 ? (
                <div className="space-y-3">
                  {topPartners.map((partner, index) => (
                    <div
                      key={partner.partner_id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-transparent rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {getRankCircle(index)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {partner.partner_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {partner.total_campaigns} campaigns
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {partner.total_enrollments} enrollments
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-base font-bold text-primary">
                          {formatCurrency(partner.total_earnings)}
                        </p>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No partner earnings yet</p>
                  <p className="text-xs mt-1">Partner earnings will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT - Sidebar */}
        <div className="space-y-6">
          {/* System Summary Card */}
          {primaryLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <Card className="border border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Total Partners</span>
                    <span className="text-sm font-semibold text-foreground">{metrics.totalPartners}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Active Wallets</span>
                    <span className="text-sm font-semibold text-foreground">{metrics.totalWallets}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Transactions</span>
                    <span className="text-sm font-semibold text-foreground">{metrics.totalTransactions}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Programs</span>
                    <span className="text-sm font-semibold text-foreground">{metrics.totalPrograms}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions — above Revenue Breakdown */}
          <Card className="border border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveItem('programs')}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                View All Programs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveItem('users')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveItem('wallet')}
              >
                <WalletIcon className="h-4 w-4 mr-2" />
                View Wallets
              </Button>
            </CardContent>
          </Card>

          {/* Revenue Breakdown Card */}
          {primaryLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <Card className="border border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Total Revenue</span>
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(metrics.totalSystemRevenue)}
                        <span className="ml-1 text-muted-foreground">100%</span>
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Partner Share</span>
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(metrics.totalPartnerEarnings)}
                        <span className="ml-1 text-muted-foreground">{partnerSharePct}%</span>
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-chart-3 h-2 rounded-full"
                        style={{ width: `${partnerSharePct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Sqooli Share</span>
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(metrics.totalSystemRevenue - metrics.totalPartnerEarnings)}
                        <span className="ml-1 text-muted-foreground">{sqooliSharePct}%</span>
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${sqooliSharePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Program Dialog */}
      <CreateProgramDialog
        open={showCreateProgramDialog}
        onOpenChange={setShowCreateProgramDialog}
      />
    </div>
  );
}
