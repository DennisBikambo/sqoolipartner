"use client";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Loading } from "../components/common/Loading";
import {
  Search,
  Eye,
  Trash2,
  Menu,
  Plus,
  Lock,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { PermissionWrapper } from "../components/common/PermissionWrapper";
import { CampaignDetailDialog } from "../components/common/CampaignDetails";
import { ConfirmDialog } from "../components/common/ConfirmationDialog";
import type { Doc } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import { isConvexUser } from '../types/auth.types';

export default function CampaignSection() {
  const [activeTab, setActiveTab] = useState<"active" | "expired" | "draft">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Doc<"campaigns"> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Doc<"campaigns"> | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { user,partner } = useAuth();
  const { canRead, canWrite, loading: permissionsLoading } = usePermissions();

  // Permission checks
  const canViewCampaigns = canRead("campaigns");
  const canManageCampaigns = canWrite("campaigns");

  // Fetch campaigns using query
  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id && canViewCampaigns ? { partner_id: partner._id } : "skip"
  );

  const updateCampaignStatus = useMutation(api.campaign.updateCampaignStatus);

  // Track when campaigns have loaded at least once
  useEffect(() => {
    if (campaigns !== undefined) {
      setHasLoaded(true);
    }
  }, [campaigns]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase();
  };

  // Filter campaigns based on tab and search query
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];

    return campaigns.filter((campaign) => {
      const matchesTab = campaign.status === activeTab;

      const matchesSearch =
        searchQuery === "" ||
        campaign._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (campaign.promo_code && campaign.promo_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        formatDate(campaign.duration_start)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [campaigns, activeTab, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDelete = async (campaign: Doc<"campaigns">) => {
    if (!canManageCampaigns) {
      toast.error('You don\'t have permission to delete campaigns');
      return;
    }

    setLoading(true);
    try {
      await updateCampaignStatus({
        id: campaign._id,
        status: "expired"
      });
      toast.success('Campaign marked as expired');
      setShowConfirm(false);
      setCampaignToDelete(null);
      // Campaigns will auto-refresh via Convex reactivity
    } catch (err) {
      console.log(err);
      toast.error('Failed to update campaign');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (permissionsLoading || !partner) {
    return <Loading message="Loading your campaigns..." size="md" />;
  }

  // No permission to view - Full page access denied
  if (!canViewCampaigns) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Campaign Access Restricted</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>You don't have permission to view campaigns.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to request <span className="font-medium text-foreground">campaign.read</span> permission.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading spinner only if we haven't loaded data yet
  // Once loaded, show the UI even if campaigns is undefined (reactivity will update it)
  if (!hasLoaded && campaigns === undefined) {
    return <Loading message="Loading campaigns..." size="md" />;
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
          <div className="flex items-center gap-2">
            {/* Create Campaign Button with fallback */}
            <PermissionWrapper 
              requireWrite="campaigns"
              fallback="button"
              fallbackProps={{
                buttonText: 'Create Campaign',
                buttonVariant: 'default',
              }}
            >
              <Button onClick={() => setShowCreateWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </PermissionWrapper>

            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Permission Badge */}
        {canViewCampaigns && !canManageCampaigns && (
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">View-only mode:</span> You can view campaigns but cannot create or manage them.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-10 bg-background border-border"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Tabs and Table */}
        <Card className="border-border">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            >
              <div className="border-b border-border px-6 pt-4">
                <TabsList className="bg-transparent p-0 h-auto space-x-6">
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    Active
                  </TabsTrigger>

                  <TabsTrigger
                    value="draft"
                    className="data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    Draft
                  </TabsTrigger>

                  <TabsTrigger
                    value="expired"
                    className="data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    Expired
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                {filteredCampaigns.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery
                      ? "No campaigns match your search"
                      : `No ${activeTab} campaigns`}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-xs text-muted-foreground font-normal pl-6">
                            Campaign Details
                          </TableHead>
                          <TableHead className="text-xs text-muted-foreground font-normal">
                            Program
                          </TableHead>
                          <TableHead className="text-xs text-muted-foreground font-normal">
                            Engagements
                          </TableHead>
                          <TableHead className="text-xs text-muted-foreground font-normal">
                            Min. Lessons
                          </TableHead>
                          <TableHead className="text-xs text-muted-foreground font-normal">
                            Expiry Date
                          </TableHead>
                          <TableHead className="text-xs text-muted-foreground font-normal pr-6">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.map((campaign) => (
                          <TableRow
                            key={campaign._id}
                            className="border-border hover:bg-muted/30"
                          >
                            <TableCell className="pl-6">
                              <div className="space-y-0.5">
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(campaign.duration_start)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  #{campaign.promo_code}
                                </div>
                                <div className="text-sm text-foreground font-medium">
                                  {campaign.name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="text-xs text-muted-foreground">
                                  Program
                                </div>
                                <div className="text-sm text-foreground">
                                  AAAA
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="text-xs text-muted-foreground">
                                  Engagements
                                </div>
                                <div className="text-sm text-foreground">
                                  {campaign.target_signups}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="text-xs text-muted-foreground">
                                  Min. Lessons
                                </div>
                                <div className="text-sm text-foreground">
                                  {campaign.bundled_offers.min_lessons}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="text-xs text-muted-foreground">
                                  Expiry Date
                                </div>
                                <div className="text-sm text-foreground">
                                  {formatDate(campaign.duration_end)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="pr-6">
                              <div className="flex items-center justify-end gap-2">
                                {/* View Button - Always visible with read permission */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                  onClick={() => {
                                    setSelectedCampaign(campaign);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {/* Delete Button with fallback */}
                                {(activeTab === "active" || activeTab === "draft") && (
                                  <PermissionWrapper 
                                    requireWrite="campaigns"
                                    fallback={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-40 cursor-not-allowed"
                                        disabled
                                        title="You don't have permission to delete campaigns"
                                      >
                                        <Lock className="h-3 w-3 text-destructive" />
                                      </Button>
                                    }
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => {
                                        setCampaignToDelete(campaign);
                                        setShowConfirm(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </PermissionWrapper>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {filteredCampaigns.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredCampaigns.length} of {campaigns?.length || 0} campaigns
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Detail Dialog */}
      <CampaignDetailDialog
        campaign={selectedCampaign}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCopy={() => {}}
      />

      {/* Create Campaign Wizard - Only render if user has permission */}
      {partner?._id && canManageCampaigns && (
        <CreateCampaignWizard
          open={showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
          partnerId={partner._id}
          user_id={user && isConvexUser(user) ? user._id : undefined}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Mark Campaign as Expired"
        description="Are you sure you want to mark this campaign as expired? This action cannot be undone."
        confirmLabel="Yes, Mark as Expired"
        onConfirm={() => campaignToDelete && handleDelete(campaignToDelete)}
        loading={loading}
      />
    </div>
  );
}