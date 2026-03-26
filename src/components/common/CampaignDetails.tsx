import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Copy,
  Trash2,
  MessageCircle,
  TrendingUp,
  X,
  Eye,
  Download,
  XCircle,
  ChevronRight,
  ThumbsUp,
  ShoppingCart,
  Target,
  Share2,
  FileText,
  Activity,
  CheckCircle,
} from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "../../hooks/useAuth";
import { ConfirmDialog } from "./ConfirmationDialog";
import { CampaignAssets } from "./CampaignAssets";
import { useState, useMemo, useEffect } from "react";
import {
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { Skeleton } from "../ui/skeleton";
import { useConvexQuery } from "../../hooks/useConvexQuery";
import { isConvexUser } from "../../types/auth.types";
import {
  generateCampaignPosterDataUrl,
  downloadPosterAsPng,
  downloadPosterAsPdf,
} from "../../utils/posterUtils";
import { generateQRCode } from "../../services/qrCodeService";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface CampaignDetailDialogProps {
  campaign: Doc<"campaigns"> | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (campaignId: string) => void;
  onCopy?: (promoCode: string) => void;
  onStatusChange?: () => void;
}

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:   { label: "Ongoing",          cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" },
  inactive: { label: "Inactive",         cls: "bg-muted text-muted-foreground border border-border" },
  pending:  { label: "Pending Approval", cls: "bg-primary/10 text-primary border border-primary/20" },
  expired:  { label: "Expired",          cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  badge?: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <div className="mb-1.5">{icon}</div>
      <p className="text-[10px] text-muted-foreground mb-1 leading-tight">{label}</p>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <p className="text-sm font-bold text-foreground leading-tight">{value}</p>
        {badge && (
          <span className="text-[10px] text-chart-2 font-semibold">{badge}</span>
        )}
      </div>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sub}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CampaignDetailDialog({
  campaign,
  open,
  onClose,
  onCopy,
  onStatusChange,
}: CampaignDetailDialogProps) {
  const { partner, user } = useAuth();

  const isAdmin =
    user && isConvexUser(user) &&
    (user.role === "super_admin" || user.role === "partner_admin");

  // ── Queries ────────────────────────────────────────────────────────────────

  const rawEnrollments = useQuery(
    api.program_enrollments.listByCampaign,
    campaign ? { campaignId: campaign._id } : "skip"
  );
  const rawProgram = useQuery(
    api.program.getProgramById,
    campaign ? { id: campaign.program_id } : "skip"
  );
  const rawRevenueLogs = useQuery(
    api.partner_revenue.getByCampaign,
    campaign ? { campaignId: campaign._id } : "skip"
  );

  const { data: enrollments, isLoading: enrollmentsLoading } = useConvexQuery(
    `campaign_enrollments_${campaign?._id}`,
    rawEnrollments
  );
  const { data: program, isLoading: programLoading } = useConvexQuery(
    `campaign_program_${campaign?._id}`,
    rawProgram
  );
  const { data: revenueLogs, isLoading: revenueLogsLoading } = useConvexQuery(
    `campaign_revenue_${campaign?._id}`,
    rawRevenueLogs
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateCampaignStatus = useMutation(api.campaign.updateCampaignStatus);
  const activateCampaign     = useMutation(api.campaign.activateCampaign);
  const deactivateCampaign   = useMutation(api.campaign.deactivateCampaign);

  // ── Local state ────────────────────────────────────────────────────────────

  const [showConfirm, setShowConfirm]       = useState(false);
  const [showAssets, setShowAssets]         = useState(false);
  const [loading, setLoading]               = useState(false);
  const [posterDataUrl, setPosterDataUrl]   = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl]           = useState<string | null>(null);
  const [posterGenerating, setPosterGenerating] = useState(false);
  const [copied, setCopied]                 = useState(false);

  // ── Chart data ─────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    if (!revenueLogs || revenueLogs.length === 0) return [];
    const byDate: Record<string, number> = {};
    revenueLogs.forEach((log) => {
      const d = new Date(log.split_timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      byDate[d] = (byDate[d] || 0) + log.amount;
    });
    return Object.entries(byDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date + " 2024").getTime() - new Date(b.date + " 2024").getTime());
  }, [revenueLogs]);

  const cumulativeEarnings = useMemo(
    () => (revenueLogs ?? []).reduce((s, l) => s + l.amount, 0),
    [revenueLogs]
  );

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open || !campaign || !program) return;
    if (posterDataUrl) return;

    let cancelled = false;
    setPosterGenerating(true);

    (async () => {
      try {
        const qr = await generateQRCode("https://sqooli.com", {
          width: 200,
          errorCorrectionLevel: "H",
        });
        if (!cancelled) setQrDataUrl(qr);

        const url = await generateCampaignPosterDataUrl({
          campaignName: campaign.name,
          programName:  program.name,
          promoCode:    campaign.promo_code ?? "",
          qrCodeDataUrl: qr,
        });
        if (!cancelled) setPosterDataUrl(url);
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setPosterGenerating(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, campaign?._id, program?._id]);

  useEffect(() => {
    setPosterDataUrl(null);
    setQrDataUrl(null);
  }, [campaign?._id]);

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!campaign) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const daysToExpiry = () => {
    const diff = Math.ceil(
      (new Date(campaign.duration_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return diff < 0 ? 0 : diff;
  };

  const durationDays = () => {
    const diff = Math.ceil(
      (new Date(campaign.duration_end).getTime() - new Date(campaign.duration_start).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  };

  const growthPct = () => {
    if (!campaign.target_signups) return 0;
    return Math.round(((enrollments?.length ?? 0) / campaign.target_signups) * 100);
  };

  const actualEngagements = enrollments?.length ?? 0;
  const redeemedCount     = enrollments?.filter((e) => e.status === "redeemed").length ?? 0;
  const actualRevenue     = redeemedCount * campaign.bundled_offers.total_price;
  const actualPartnerEarnings = actualRevenue * (campaign.revenue_share.partner_percentage / 100);
  const projectedPartnerEarnings = campaign.revenue_projection * (campaign.revenue_share.partner_percentage / 100);

  const statusCfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.inactive;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Check out ${campaign.name}! Use promo code: ${campaign.promo_code}\n\n` +
      `Get ${campaign.bundled_offers.min_lessons} lessons for only ${formatCurrency(campaign.bundled_offers.total_price)}!`
    );
    window.open(`https://wa.me/${campaign.whatsapp_number}?text=${msg}`, "_blank");
  };

  const handleCopy = () => {
    const code = campaign.promo_code || "";
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(code);
    toast.success("Promo code copied");
  };

  const handleMarkExpired = async () => {
    try {
      setLoading(true);
      await updateCampaignStatus({ id: campaign._id, status: "expired" });
      setShowConfirm(false);
      onClose();
    } catch {
      toast.error("Failed to mark as expired");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!user || !isConvexUser(user) || !partner?._id) return;
    try {
      await activateCampaign({ id: campaign._id, user_id: user._id, partner_id: partner._id });
      toast.success("Campaign activated");
      onStatusChange?.();
    } catch {
      toast.error("Failed to activate");
    }
  };

  const handleDeactivate = async () => {
    if (!user || !isConvexUser(user) || !partner?._id) return;
    try {
      await deactivateCampaign({ id: campaign._id, user_id: user._id, partner_id: partner._id });
      toast.success("Campaign deactivated");
      onStatusChange?.();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  // ── Info rows (left panel) ─────────────────────────────────────────────────

  const infoRows = [
    { label: "Date Created:",  value: formatDate(campaign.duration_start) },
    {
      label: "Program:",
      value: programLoading ? "..." : (program?.name ?? "—"),
      bold: true,
    },
    { label: "Start Date:",    value: formatDate(campaign.duration_start) },
    { label: "End Date:",      value: formatDate(campaign.duration_end) },
    { label: "Duration:",      value: `${durationDays()} Days`,          bold: true },
    { label: "Created By:",    value: partner?.name || "—",              bold: true },
    { label: "Expiry (days):", value: `${daysToExpiry()}` },
    {
      label: "Bundle:",
      value: `${campaign.bundled_offers.min_lessons} lessons @ ${formatCurrency(campaign.bundled_offers.total_price)}`,
    },
    {
      label: "Rev. Share:",
      value: `${campaign.revenue_share.partner_percentage}% / ${campaign.revenue_share.sqooli_percentage}%`,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open && !showAssets} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="!max-w-[820px] p-0 overflow-hidden"
          showCloseButton={false}
          style={{ display: "flex", flexDirection: "column", maxHeight: "90vh" }}
        >
          {/* ── Breadcrumb header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Campaigns</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-primary font-medium truncate max-w-[260px]">
                {campaign.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full flex-shrink-0"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* ── Two-panel body ── */}
          <div className="flex flex-1 overflow-hidden">
            {/* ── LEFT PANEL ── */}
            <div className="w-[230px] flex-shrink-0 border-r border-border overflow-y-auto p-4 bg-card">

              {/* Poster banner */}
              <div className="mb-3">
                {posterGenerating ? (
                  <Skeleton className="w-full h-[72px] rounded-lg" />
                ) : posterDataUrl ? (
                  <div className="relative group">
                    <img
                      src={posterDataUrl}
                      alt="Campaign poster"
                      className="w-full h-[72px] object-cover rounded-lg border border-border"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => downloadPosterAsPng(posterDataUrl, campaign.name)}
                        className="bg-black/70 text-white rounded p-1 hover:bg-black"
                        title="Download PNG"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[72px] rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] text-primary/60">Generating poster…</span>
                  </div>
                )}
              </div>

              {/* Name + description */}
              <p className="text-sm font-bold text-foreground mb-0.5 leading-snug">
                {campaign.name}
              </p>
              <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2 leading-snug">
                {campaign.description || `Campaign for ${program?.name ?? "—"}`}
              </p>

              {/* Info rows */}
              {infoRows.map((row) => (
                <div key={row.label} className="flex justify-between items-start mb-2 gap-2">
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">
                    {row.label}
                  </span>
                  <span
                    className={`text-[11px] ${row.bold ? "font-semibold" : ""} text-foreground text-right max-w-[120px] leading-snug`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

              {/* Status badge */}
              <div className="flex justify-between items-center mb-4 mt-1">
                <span className="text-[11px] text-muted-foreground">Status:</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.cls}`}>
                  {statusCfg.label}
                </span>
              </div>

              {/* ── Action buttons ── */}

              {/* Share + Copy row (active / inactive) */}
              {(campaign.status === "active" || campaign.status === "inactive") && (
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold mb-2 hover:bg-primary/90 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Share via WhatsApp
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M11.99 0C5.373 0 0 5.373 0 12c0 2.123.553 4.112 1.522 5.843L.057 23.997l6.304-1.654A11.94 11.94 0 0011.99 24C18.607 24 24 18.627 24 12S18.607 0 11.99 0zm.01 21.818a9.818 9.818 0 01-5.007-1.37l-.36-.213-3.72.976.994-3.633-.233-.372A9.799 9.799 0 012.18 12c0-5.42 4.41-9.818 9.82-9.818 5.41 0 9.82 4.398 9.82 9.818S17.41 21.818 12 21.818z"/>
                  </svg>
                </button>
              )}

              {(campaign.status === "active" || campaign.status === "inactive") && (
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-muted text-foreground rounded-lg py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors border border-border"
                  >
                    {copied ? (
                      <CheckCircle className="h-3.5 w-3.5 text-chart-2" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                  {campaign.status === "active" && (
                    <button
                      onClick={handleDeactivate}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive rounded-lg py-1.5 text-xs font-medium hover:bg-destructive/20 transition-colors border border-destructive/20"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Deactivate
                    </button>
                  )}
                </div>
              )}

              {/* Mark expired (active only) */}
              {campaign.status === "active" && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive rounded-lg py-1.5 text-xs font-medium hover:bg-destructive/20 transition-colors border border-destructive/20 mb-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Mark as Expired
                </button>
              )}

              {/* Activate (inactive) */}
              {campaign.status === "inactive" && (
                <button
                  onClick={handleActivate}
                  className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors mb-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Activate Campaign
                </button>
              )}

              {/* Approve (pending, admin-only) */}
              {campaign.status === "pending" && isAdmin && (
                <button
                  onClick={handleActivate}
                  className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors mb-2"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Approve Campaign
                </button>
              )}
              {campaign.status === "pending" && !isAdmin && (
                <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 mb-2">
                  <span className="text-[10px] text-muted-foreground leading-snug">
                    Awaiting admin approval. Only partner admins can activate this campaign.
                  </span>
                </div>
              )}

              {/* Poster downloads */}
              {posterDataUrl && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => downloadPosterAsPng(posterDataUrl, campaign.name)}
                    className="flex-1 flex items-center justify-center gap-1 bg-muted text-foreground rounded-lg py-1.5 text-[10px] font-medium hover:bg-muted/80 transition-colors border border-border"
                  >
                    <Download className="h-3 w-3" /> PNG
                  </button>
                  <button
                    onClick={() => downloadPosterAsPdf(posterDataUrl, campaign.name)}
                    className="flex-1 flex items-center justify-center gap-1 bg-muted text-foreground rounded-lg py-1.5 text-[10px] font-medium hover:bg-muted/80 transition-colors border border-border"
                  >
                    <FileText className="h-3 w-3" /> PDF
                  </button>
                </div>
              )}

              {/* View Assets */}
              <button
                onClick={() => setShowAssets(true)}
                className="w-full flex items-center justify-center gap-1.5 bg-muted text-foreground rounded-lg py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors border border-border mb-3"
              >
                <Eye className="h-3.5 w-3.5" />
                View Assets
              </button>

              {/* QR Code section (active only) */}
              {campaign.status === "active" && (
                <div className="bg-background rounded-lg border border-border p-3 text-center">
                  <p className="text-[11px] font-semibold text-foreground mb-2">Scan QR Code</p>
                  <div className="w-[90px] h-[90px] mx-auto mb-2 border border-border rounded-md overflow-hidden flex items-center justify-center bg-white">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR code" className="w-full h-full object-cover" />
                    ) : (
                      <Skeleton className="w-full h-full" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Promocode: <span className="font-semibold text-foreground">{campaign.promo_code}</span>
                  </p>
                  <div className="flex justify-center gap-5">
                    {[
                      {
                        icon: <Share2 className="h-3.5 w-3.5" />,
                        label: "Share",
                        onClick: handleShareWhatsApp,
                      },
                      {
                        icon: <Copy className="h-3.5 w-3.5" />,
                        label: "Copy",
                        onClick: handleCopy,
                      },
                    ].map((b) => (
                      <button
                        key={b.label}
                        onClick={b.onClick}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center text-background hover:opacity-80 transition-opacity">
                          {b.icon}
                        </div>
                        <span className="text-[9px] text-muted-foreground">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="flex-1 overflow-y-auto p-4 bg-background space-y-3">

              {/* 4 stats cards — 2×2 grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard
                  icon={<TrendingUp className="h-4 w-4 text-chart-3" />}
                  label="Total Earnings"
                  value={formatCurrency(actualPartnerEarnings)}
                  sub={`Projected: ${formatCurrency(projectedPartnerEarnings)}`}
                  badge={`+${growthPct()}%`}
                />
                <StatCard
                  icon={<ThumbsUp className="h-4 w-4 text-chart-2" />}
                  label="Engagements"
                  value={
                    enrollmentsLoading
                      ? "…"
                      : actualEngagements >= 1000
                      ? `${(actualEngagements / 1000).toFixed(1)}K`
                      : String(actualEngagements)
                  }
                  sub={`Target: ${campaign.target_signups}`}
                  badge={enrollmentsLoading ? undefined : `+${growthPct()}%`}
                />
                <StatCard
                  icon={<ShoppingCart className="h-4 w-4 text-primary" />}
                  label="Purchases"
                  value={enrollmentsLoading ? "…" : String(redeemedCount)}
                  sub={`Pending: ${enrollments?.filter((e) => e.status === "pending").length ?? 0}`}
                />
                <StatCard
                  icon={<Target className="h-4 w-4 text-chart-4" />}
                  label="Daily Target"
                  value={`${campaign.daily_target} signups`}
                  sub={`Rev. share: ${campaign.revenue_share.partner_percentage}% partner`}
                />
              </div>

              {/* Chart card */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="grid grid-cols-2 mb-3 gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Earnings</p>
                    {revenueLogsLoading ? (
                      <Skeleton className="h-6 w-28 rounded" />
                    ) : (
                      <p className="text-base font-bold text-foreground">
                        {formatCurrency(cumulativeEarnings)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Engagements</p>
                    {enrollmentsLoading ? (
                      <Skeleton className="h-6 w-20 rounded" />
                    ) : (
                      <p className="text-base font-bold text-foreground">
                        {actualEngagements.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {revenueLogsLoading ? (
                  <Skeleton className="h-[140px] w-full rounded-lg" />
                ) : chartData.length > 0 ? (
                  <div className="h-[140px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={chartData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number) => [formatCurrency(value), "Earnings"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[140px] w-full flex items-center justify-center border border-dashed border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">No earnings data yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm expired dialog */}
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Mark Campaign as Expired"
        description="Are you sure you want to mark this campaign as expired? This action cannot be undone."
        confirmLabel="Yes, Mark as Expired"
        onConfirm={handleMarkExpired}
        loading={loading}
      />

      {/* Assets view */}
      <CampaignAssets
        campaign={campaign}
        open={showAssets}
        onClose={() => setShowAssets(false)}
      />
    </>
  );
}
