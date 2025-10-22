import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Copy,
  Trash2,
  MessageCircle,
  TrendingUp,
  X,
} from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useAuth } from "../../hooks/useAuth";
import { useMutation } from "convex/react";
import { ConfirmDialog } from "./ConfirmationDialog";
import { useState } from "react";


interface CampaignDetailDialogProps {
  campaign: Doc<"campaigns"> | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (campaignId: string) => void;
  onCopy?: (promoCode: string) => void;
}

export function CampaignDetailDialog({
  campaign,
  open,
  onClose,
  onCopy,
}: CampaignDetailDialogProps) {

   const {user} = useAuth();

  // Fetch enrollments for this campaign to get actual engagement numbers
  const enrollments = useQuery(
    api.program_enrollments.listByCampaign,
    campaign ? { campaignId: campaign._id } : "skip"
  );

  // Fetch program data to show program details
  const program = useQuery(
    api.program.getProgramById,
    campaign ? { id: campaign.program_id } : "skip"
  );

  const updateCampaignStatus = useMutation(api.campaign.updateCampaignStatus);
  const [showConfirm,setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false);

  if (!campaign) return null;

  


  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateDaysToExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 0;
    return diffDays;
  };

  const calculateGrowthPercentage = () => {
    // Calculate actual vs target percentage
    const actualSignups = enrollments?.length;
    const targetSignups = campaign.target_signups;
    
    if (targetSignups === 0) return 0;
    return Math.round((!actualSignups ? 0 : actualSignups / targetSignups) * 100);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Check out ${campaign.name}! Use promo code: ${campaign.promo_code}\n\n` +
      `Get ${campaign.bundled_offers.min_lessons} lessons for only ${formatCurrency(campaign.bundled_offers.total_price)}!`
    );
    window.open(`https://wa.me/${campaign.whatsapp_number}?text=${message}`, '_blank');
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(campaign.promo_code);
    } else {
      navigator.clipboard.writeText(campaign.promo_code);
    }
  };

  const handleDelete = async () => {
    try{
        await updateCampaignStatus({
            id:campaign._id,
            status:"expired"
        })
        setShowConfirm(false)
        onClose()
    } catch(err){
        console.log(err)
    } finally{
        setLoading(false)
    }
  };

  // Calculate actual partner earnings based on revenue share
  const partnerEarnings = campaign.revenue_projection * (campaign.revenue_share.partner_percentage / 100);
  
  // Actual engagements from enrollments
  const actualEngagements = enrollments?.length ?? 0;
  
  // Calculate actual revenue based on enrollments
  const actualRevenue = (enrollments?.filter(e => e.status === "redeemed").length ?? 0) * campaign.bundled_offers.total_price;
  const actualPartnerEarnings = actualRevenue * (campaign.revenue_share.partner_percentage / 100);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="!max-w-5xl sm:!max-w-5xl max-h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-start justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Campaigns</span>
            <span>/</span>
            <span className="text-foreground font-medium">{campaign.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pt-4">
          {/* LEFT - Campaign Info Card */}
          <div className="md:col-span-1 h-fit">
            <div className="rounded-lg p-6 h-full border border-muted shadow bg-card">
              <h2 className="text-2xl font-bold text-foreground mb-4">{campaign.name}</h2>
              
              <div className="space-y-4 text-sm">
                {/* Promo Code */}
                <div>
                  <div className="text-muted-foreground mb-1">Promo Code:</div>
                  <div className="font-mono font-semibold text-foreground text-lg">
                    {campaign.promo_code}
                  </div>
                </div>

                {/* Date Created */}
                <div>
                  <div className="text-muted-foreground mb-1">Date Created:</div>
                  <div className="font-semibold text-foreground">
                    {formatDate(campaign.duration_start)}
                  </div>
                </div>

                {/* Created By */}
                <div>
                  <div className="text-muted-foreground mb-1">Created By:</div>
                  <div className="font-semibold text-foreground">
                    {user?.name || "Loading..."}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <div className="text-muted-foreground mb-1">Campaign Duration:</div>
                  <div className="font-semibold text-foreground">
                    {new Date(campaign.duration_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {new Date(campaign.duration_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Expiry */}
                <div>
                  <div className="text-muted-foreground mb-1">Expiry (days):</div>
                  <div className="font-semibold text-foreground">
                    {calculateDaysToExpiry(campaign.duration_end)} days remaining
                  </div>
                </div>

                {/* Daily Target */}
                <div>
                  <div className="text-muted-foreground mb-1">Daily Target:</div>
                  <div className="font-semibold text-foreground">
                    {campaign.daily_target} signups/day
                  </div>
                </div>

                {/* Bundle Offer */}
                <div>
                  <div className="text-muted-foreground mb-1">Bundle Offer:</div>
                  <div className="font-semibold text-foreground">
                    {campaign.bundled_offers.min_lessons} lessons @ {formatCurrency(campaign.bundled_offers.total_price)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ({formatCurrency(campaign.discount_rule.price_per_lesson)} per lesson)
                  </div>
                </div>

                {/* Revenue Share */}
                <div>
                  <div className="text-muted-foreground mb-1">Revenue Share:</div>
                  <div className="font-semibold text-foreground">
                    Partner: {campaign.revenue_share.partner_percentage}% | Sqooli: {campaign.revenue_share.sqooli_percentage}%
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <div className="text-muted-foreground mb-1">WhatsApp Contact:</div>
                  <div className="font-semibold text-foreground">
                    {campaign.whatsapp_number}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="text-muted-foreground mb-1">Status:</div>
                  <Badge 
                    variant={campaign.status === "active" ? "default" : campaign.status === "draft" ? "secondary" : "outline"}
                    className="capitalize"
                  >
                    {campaign.status}
                  </Badge>
                </div>

                {/* Program */}
                {program && (
                  <div>
                    <div className="text-muted-foreground mb-1">Program:</div>
                    <div className="font-semibold text-foreground">
                      {program.name}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-6">
                <Button
                  size="sm"
                  className="gap-2 flex-1"
                  onClick={handleShareWhatsApp}
                >
                  <MessageCircle className="h-4 w-4" />
                  Share Link
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background"
                  onClick={handleCopy}
                  title="Copy promo code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {campaign.status === "active" || campaign.status === "draft" ? (
                    
              
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9"
                  onClick={()=>setShowConfirm(true)}
                  title="Delete campaign"
                >
                  <Trash2 className="h-4 w-4" /> 
                </Button> 
                ):( 
                 <p className="text-xs text-destructive">Expired</p>
                )}
                <ConfirmDialog
                    open= {showConfirm}
                    onOpenChange={setShowConfirm}
                    title="Mark Campaign as expired"
                    description="Are you sure you want to mark this campaign as expired? This action cannot be undone."
                    confirmLabel="Yes, Mark as expired"
                    onConfirm={handleDelete}
                    loading={loading}
                />
              </div>
            </div>
          </div>

          {/* RIGHT - Stats and Chart */}
          <div className="md:col-span-2 space-y-4">
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Earnings - Projected */}
              <Card className="border border-muted">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-chart-3 mt-1" />
                    <div className="text-sm text-muted-foreground">Projected Earnings</div>
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {formatCurrency(partnerEarnings)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Actual: {formatCurrency(actualPartnerEarnings)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-chart-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>{calculateGrowthPercentage()}% of target</span>
                  </div>
                </CardContent>
              </Card>

              {/* Engagements - Actual vs Target */}
              <Card className="border border-muted">
                <CardContent className="pt-6 pb-6">
                  <div className="text-sm text-muted-foreground mb-2">Engagements</div>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {actualEngagements >= 1000 
                      ? `${(actualEngagements / 1000).toFixed(1)}K` 
                      : actualEngagements}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Target: {campaign.target_signups >= 1000 
                      ? `${(campaign.target_signups / 1000).toFixed(0)}K` 
                      : campaign.target_signups}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-chart-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>{calculateGrowthPercentage()}% achieved</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border border-muted">
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(campaign.revenue_projection)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-muted-foreground mb-1">Redeemed</div>
                  <div className="text-lg font-bold text-foreground">
                    {enrollments?.filter(e => e.status === "redeemed").length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-muted-foreground mb-1">Pending</div>
                  <div className="text-lg font-bold text-foreground">
                    {enrollments?.filter(e => e.status === "pending").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Card */}
            <Card className="flex-1 border border-muted">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Actual Earnings</div>
                    <div className="text-xl font-bold text-foreground">
                      {formatCurrency(actualPartnerEarnings)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Actual Signups</div>
                    <div className="text-xl font-bold text-foreground">
                      {actualEngagements}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{(campaign.target_signups * 0.8).toFixed(0)}</span>
                  <span>{(campaign.target_signups * 0.5).toFixed(0)}</span>
                </div>

                <div className="h-48 w-full mb-2">
                  <svg viewBox="0 0 700 150" className="w-full h-full" preserveAspectRatio="none">
                    <polyline
                      points="0,90 100,70 200,75 300,65 350,60 400,55 450,50 500,55 550,60 600,70 650,75 700,85"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-chart-1"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>1 Sep</span>
                  <span>5 Sep</span>
                  <span>10 Sep</span>
                  <span>15 Sep</span>
                  <span>20 Sep</span>
                  <span>25 Sep</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}