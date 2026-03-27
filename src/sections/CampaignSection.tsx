import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { PermissionWrapper } from "../components/common/PermissionWrapper";
import { CampaignDetailDialog } from "../components/common/CampaignDetails";
import CreateCampaignWizard, { type CreationSuccessPayload } from "../components/common/CreateCampaign";
import { CampaignSuccessModal, type CampaignSuccessData } from "../components/common/CampaignSuccessModal";
import { isConvexUser } from "../types/auth.types";
import { useConvexQuery } from "../hooks/useConvexQuery";
import { formatDate } from "../utils/formatters";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import {
  Search,
  Eye,
  Plus,
  Lock,
  AlertCircle,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarX,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

type CampaignTab = "active" | "inactive" | "expired" | "pending";

const TAB_CONFIG: { key: CampaignTab; label: string; icon: React.ElementType; badge?: string }[] = [
  { key: "active",   label: "Active",           icon: CheckCircle2 },
  { key: "inactive", label: "Inactive",          icon: XCircle },
  { key: "expired",  label: "Expired",           icon: CalendarX },
  { key: "pending",  label: "Pending Approval",  icon: Clock },
];

function statusDaysToExpiry(endDate: string): { label: string; urgent: boolean } {
  const end = new Date(endDate);
  const today = new Date();
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: formatDate(endDate), urgent: false };
  if (diff === 0) return { label: "Today", urgent: true };
  if (diff <= 7) return { label: `${diff} day${diff === 1 ? "" : "s"}`, urgent: true };
  return { label: `${diff} days`, urgent: false };
}

export default function CampaignSection() {
  const [activeTab, setActiveTab] = useState<CampaignTab>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Doc<"campaigns"> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [successData, setSuccessData] = useState<(CampaignSuccessData & { posterDataUrl: string | null }) | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const { user, partner } = useAuth();
  const { canRead, canWrite, loading: permissionsLoading } = usePermissions();

  const isAdmin =
    user && isConvexUser(user) &&
    (user.role === "super_admin" || user.role === "partner_admin");

  const canViewCampaigns = canRead("campaigns");
  const canManageCampaigns = canWrite("campaigns");

  const rawCampaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id && canViewCampaigns ? { partner_id: partner._id } : "skip"
  );
  const { data: campaigns, isLoading: campaignsLoading, isError: campaignsError } = useConvexQuery(
    `campaigns_${partner?._id}`,
    rawCampaigns
  );

  const rawPrograms = useQuery(api.program.listPrograms);
  const { data: programs } = useConvexQuery("all_programs", rawPrograms);

  const rawEnrollmentCounts = useQuery(
    api.campaign.getCampaignEnrollmentCounts,
    partner?._id ? { partner_id: partner._id } : "skip"
  );

  const activateCampaign = useMutation(api.campaign.activateCampaign);
  const deactivateCampaign = useMutation(api.campaign.deactivateCampaign);

  // Build lookup maps
  const programsMap = useMemo(() => {
    const map = new Map<string, string>();
    (programs ?? []).forEach((p) => map.set(p._id, p.name));
    return map;
  }, [programs]);

  const enrollmentCountsMap = useMemo(() => {
    const map = new Map<string, { enrollments: number; purchases: number }>();
    (rawEnrollmentCounts ?? []).forEach((c) => {
      map.set(c.campaign_id, { enrollments: c.enrollments, purchases: c.purchases });
    });
    return map;
  }, [rawEnrollmentCounts]);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter((c) => {
      const matchesTab = c.status === activeTab;
      const matchesSearch =
        searchQuery === "" ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.promo_code ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDate(c.duration_start).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [campaigns, activeTab, searchQuery]);

  // Group by start date (month + year)
  const groupedCampaigns = useMemo(() => {
    const groups: { label: string; campaigns: typeof filteredCampaigns }[] = [];
    const seen = new Map<string, typeof filteredCampaigns>();

    filteredCampaigns.forEach((c) => {
      const d = new Date(c.duration_start);
      const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
      if (!seen.has(label)) {
        seen.set(label, []);
        groups.push({ label, campaigns: seen.get(label)! });
      }
      seen.get(label)!.push(c);
    });

    return groups;
  }, [filteredCampaigns]);

  const handleActivate = async (campaign: Doc<"campaigns">) => {
    if (!user || !isConvexUser(user) || !partner?._id) return;
    setActivatingId(campaign._id);
    try {
      await activateCampaign({ id: campaign._id, user_id: user._id, partner_id: partner._id });
      toast.success("Campaign activated");
    } catch {
      toast.error("Failed to activate campaign");
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeactivate = async (campaign: Doc<"campaigns">) => {
    if (!user || !isConvexUser(user) || !partner?._id) return;
    setDeactivatingId(campaign._id);
    try {
      await deactivateCampaign({ id: campaign._id, user_id: user._id, partner_id: partner._id });
      toast.success("Campaign deactivated");
    } catch {
      toast.error("Failed to deactivate campaign");
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleCreationSuccess = (data: CreationSuccessPayload) => {
    setSuccessData(data);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (permissionsLoading || !partner) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex gap-6 pb-0">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-20 rounded" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!canViewCampaigns) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold">Campaign Access Restricted</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              You don't have permission to view campaigns. Contact your administrator to request{" "}
              <span className="font-medium text-foreground">campaign.read</span> permission.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Campaigns</h1>
          <PermissionWrapper
            requireWrite="campaigns"
            fallback="button"
            fallbackProps={{ buttonText: "Create Campaign", buttonVariant: "default" }}
          >
            <Button onClick={() => setShowCreateWizard(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign Link
            </Button>
          </PermissionWrapper>
        </div>

        {/* Pending approval admin-only banner */}
        {activeTab === "pending" && !isAdmin && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 px-4 py-2.5 rounded-lg">
            <ShieldAlert className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Admin approval required:</span> Only partner admins can approve pending campaigns.
            </p>
          </div>
        )}

        {/* View-only banner */}
        {canViewCampaigns && !canManageCampaigns && (
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">View-only mode:</span> You can view campaigns but cannot manage them.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Search campaigns..."
            className="border-0 bg-transparent h-7 p-0 focus-visible:ring-0 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>

        {/* Main card */}
        <Card className="border-border">
          <CardContent className="p-0">
            {/* Tabs */}
            <div className="flex gap-0 border-b border-border px-4 overflow-x-auto">
              {TAB_CONFIG.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === t.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {campaigns && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {campaigns.filter((c) => c.status === t.key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            {campaignsLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : campaignsError ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                <AlertCircle className="h-8 w-8 text-destructive/50" />
                <p className="text-sm font-medium text-foreground">Failed to load campaigns</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {searchQuery ? "No campaigns match your search" : `No ${activeTab} campaigns`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table header */}
                <div className="flex items-center px-4 py-2.5 border-b border-border/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wide min-w-[700px]">
                  <div className="w-48">Campaign</div>
                  <div className="w-36">Program</div>
                  {activeTab !== "pending" && <div className="w-24">Engagements</div>}
                  {activeTab !== "pending" && <div className="w-24">Purchases</div>}
                  <div className="flex-1">
                    {activeTab === "expired" ? "Expiry Date" : "Expiry"}
                  </div>
                  <div className="w-24 text-right pr-2">Actions</div>
                </div>

                {/* Grouped rows */}
                {groupedCampaigns.map(({ label, campaigns: group }) => (
                  <div key={label}>
                    <div className="px-4 py-2 text-[10px] font-semibold text-muted-foreground bg-muted/30 border-b border-border/30">
                      {label}
                    </div>
                    {group.map((campaign) => {
                      const counts = enrollmentCountsMap.get(campaign._id) ?? { enrollments: 0, purchases: 0 };
                      const expiry = statusDaysToExpiry(campaign.duration_end);
                      const programName = programsMap.get(campaign.program_id) ?? "—";
                      const isActivating = activatingId === campaign._id;
                      const isDeactivating = deactivatingId === campaign._id;

                      const statusDot: Record<string, string> = {
                        active:   "bg-emerald-500",
                        inactive: "bg-muted-foreground/40",
                        expired:  "bg-amber-500",
                        pending:  "bg-primary",
                      };

                      return (
                        <div
                          key={campaign._id}
                          className="flex items-center px-4 py-3 border-b border-border/40 hover:bg-muted/30 transition-colors min-w-[700px] group"
                        >
                          {/* Campaign info */}
                          <div className="w-48 pr-2 flex items-start gap-2">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[campaign.status] ?? "bg-muted-foreground/40"}`} />
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground font-mono">{campaign.promo_code ?? "—"}</p>
                              <p className="text-sm font-semibold text-foreground leading-snug truncate">{campaign.name}</p>
                            </div>
                          </div>

                          {/* Program */}
                          <div className="w-36 pr-2">
                            <p className="text-[10px] text-muted-foreground">Program</p>
                            <p className="text-xs text-foreground truncate">{programName}</p>
                          </div>

                          {/* Engagements */}
                          {activeTab !== "pending" && (
                            <div className="w-24 pr-2">
                              <p className="text-[10px] text-muted-foreground">Engagements</p>
                              <p className="text-xs text-foreground font-medium">{counts.enrollments}</p>
                            </div>
                          )}

                          {/* Purchases */}
                          {activeTab !== "pending" && (
                            <div className="w-24 pr-2">
                              <p className="text-[10px] text-muted-foreground">Purchases</p>
                              <p className="text-xs text-foreground font-medium">{counts.purchases}</p>
                            </div>
                          )}

                          {/* Expiry */}
                          <div className="flex-1 pr-2">
                            <p className="text-[10px] text-muted-foreground">
                              {activeTab === "expired" ? "Expiry Date" : "Expiry"}
                            </p>
                            <p className={`text-xs font-medium ${
                              expiry.urgent && activeTab === "active" ? "text-destructive" : "text-foreground"
                            }`}>
                              {expiry.label}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="w-24 flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              onClick={() => { setSelectedCampaign(campaign); setIsDetailOpen(true); }}
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {activeTab === "active" && canManageCampaigns && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                disabled={isDeactivating}
                                onClick={() => handleDeactivate(campaign)}
                              >
                                {isDeactivating ? "..." : "Deactivate"}
                              </Button>
                            )}

                            {activeTab === "inactive" && canManageCampaigns && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                disabled={isActivating}
                                onClick={() => handleActivate(campaign)}
                              >
                                {isActivating ? "..." : "Activate"}
                              </Button>
                            )}

                            {activeTab === "pending" && canManageCampaigns && isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-muted-foreground hover:bg-emerald-600 hover:text-white transition-colors"
                                disabled={isActivating}
                                onClick={() => handleActivate(campaign)}
                              >
                                {isActivating ? "..." : "Approve"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Showing {filteredCampaigns.length} of {campaigns?.filter((c) => c.status === activeTab).length ?? 0}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Detail Dialog */}
      <CampaignDetailDialog
        campaign={selectedCampaign}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onCopy={() => {}}
      />

      {/* Create Campaign Wizard */}
      {partner?._id && (
        <CreateCampaignWizard
          open={showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
          partnerId={partner._id}
          user_id={user && isConvexUser(user) ? user._id : undefined}
          onSuccess={handleCreationSuccess}
        />
      )}

      {/* Success Modal */}
      <CampaignSuccessModal
        open={successData !== null}
        campaign={successData}
        posterDataUrl={successData?.posterDataUrl ?? null}
        onClose={() => setSuccessData(null)}
      />
    </div>
  );
}
