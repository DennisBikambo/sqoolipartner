"use client";
import { useState, useMemo } from "react";
import Profile from "../components/common/Profile";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Search,
  Eye,
  Copy,
  Trash2,
  Filter,
  Menu,
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/ui/sheet";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { CampaignDetailDialog } from "../components/common/CampaignDetails";
import { ConfirmDialog } from "../components/common/ConfirmationDialog";
import type { Doc } from "../../convex/_generated/dataModel";

export default function CampaignSection() {
  const [activeTab, setActiveTab] = useState<"active" | "expired" | "draft">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Doc<"campaigns"> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { user } = useAuth();
  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    user ? { partner_id: user._id } : "skip"
  );

  const updateCampaignStatus = useMutation(api.campaign.updateCampaignStatus);

  // Calculate days until expiry
  const calculateDaysToExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

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
        campaign.promo_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDate(campaign.duration_start)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [campaigns, activeTab, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCopy = (promoCode: string) => {
    navigator.clipboard.writeText(promoCode);
  };

  const handleDelete = async (campaign: Doc<"campaigns">) => {
    try {
      await updateCampaignStatus({
        id: campaign._id,
        status: "expired"
      });
      setShowConfirm(false);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (!campaigns) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6">
        {/* Mobile Profile Toggle */}
        <div className="lg:hidden">
          <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="w-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-4">
                <Profile />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Profile Sidebar */}
        <div className="hidden lg:block lg:w-64 shrink-0">
          <Profile />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4 lg:space-y-6 min-w-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-10 bg-background border-border w-full"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 w-full sm:w-auto">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs and Table */}
          <Card className="border-border">
            <CardContent className="p-4 lg:pt-6">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              >
                <TabsList className="mb-4 lg:mb-6 w-full grid grid-cols-3 lg:w-auto lg:inline-flex">
                  <TabsTrigger value="active" className="text-xs sm:text-sm">
                    Active ({campaigns.filter((c) => c.status === "active").length})
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="text-xs sm:text-sm">
                    Draft ({campaigns.filter((c) => c.status === "draft").length})
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="text-xs sm:text-sm">
                    Expired ({campaigns.filter((c) => c.status === "expired").length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  {filteredCampaigns.length === 0 ? (
                    <div className="text-center py-8 lg:py-12 text-muted-foreground text-sm lg:text-base">
                      {searchQuery
                        ? "No campaigns match your search"
                        : `No ${activeTab} campaigns`}
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-4">
                        {filteredCampaigns.map((campaign) => (
                          <Card key={campaign._id} className="border-border">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(campaign.duration_start)}
                                  </div>
                                  <div className="text-sm font-medium text-foreground truncate">
                                    #{campaign.promo_code}
                                  </div>
                                  <div className="text-sm font-medium text-foreground line-clamp-2">
                                    {campaign.name}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-border">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Engagements
                                  </div>
                                  <div className="text-sm font-medium text-foreground">
                                    {campaign.target_signups >= 1000
                                      ? `${(campaign.target_signups / 1000).toFixed(0)}k`
                                      : campaign.target_signups}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Purchases
                                  </div>
                                  <div className="text-sm font-medium text-foreground">
                                    {campaign.bundled_offers.min_lessons}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Expiry
                                  </div>
                                  <div className="text-sm font-medium text-foreground">
                                    {calculateDaysToExpiry(campaign.duration_end)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-2"
                                  onClick={() => {
                                    setSelectedCampaign(campaign);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-2"
                                  onClick={() => handleCopy(campaign.promo_code)}
                                >
                                  <Copy className="h-4 w-4" />
                                  Copy
                                </Button>
                                {campaign.status === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => setShowConfirm(true)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-muted/50">
                              <TableHead className="text-muted-foreground font-medium">
                                Campaign
                              </TableHead>
                              <TableHead className="text-muted-foreground font-medium">
                                Engagements
                              </TableHead>
                              <TableHead className="text-muted-foreground font-medium">
                                Purchases
                              </TableHead>
                              <TableHead className="text-muted-foreground font-medium">
                                Expiry
                              </TableHead>
                              <TableHead className="text-muted-foreground font-medium text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCampaigns.map((campaign) => (
                              <TableRow
                                key={campaign._id}
                                className="border-border hover:bg-muted/50"
                              >
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground">
                                      {formatDate(campaign.duration_start)}
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                      #{campaign.promo_code}
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                      {campaign.name}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground">
                                      Engagements
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                      {campaign.target_signups >= 1000
                                        ? `${(campaign.target_signups / 1000).toFixed(0)}k`
                                        : campaign.target_signups}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground">
                                      Purchases
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                      {campaign.bundled_offers.min_lessons}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground">
                                      Expiry
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                      {calculateDaysToExpiry(campaign.duration_end)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                      title="View details"
                                      onClick={() => {
                                        setSelectedCampaign(campaign);
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                      onClick={() => handleCopy(campaign.promo_code)}
                                      title="Copy promo code"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    {campaign.status === "active" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        title="Mark as expired"
                                        onClick={() => setShowConfirm(true)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <ConfirmDialog
                                          open={showConfirm}
                                          onOpenChange={setShowConfirm}
                                          title="Mark Campaign as expired"
                                          description="Are you sure you want to mark this campaign as expired? This action cannot be undone."
                                          confirmLabel="Yes, Mark as expired"
                                          onConfirm={() => handleDelete(campaign)}
                                          loading={loading}
                                        />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 lg:mt-6 pt-4 border-t border-border">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Showing {filteredCampaigns.length} of{" "}
                          {campaigns.filter((c) => c.status === activeTab).length} campaigns
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
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <CampaignDetailDialog
        campaign={selectedCampaign}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCopy={handleCopy}
      />
    </div>
  );
}