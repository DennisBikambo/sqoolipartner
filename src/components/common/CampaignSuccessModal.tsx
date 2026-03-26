import { useState } from "react";
import { X, Download, FileText, Share2, Copy, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { downloadPosterAsPng, downloadPosterAsPdf } from "../../utils/posterUtils";

interface CampaignSuccessData {
  name: string;
  promoCode: string;
  programName: string;
}

interface CampaignSuccessModalProps {
  open: boolean;
  campaign: CampaignSuccessData | null;
  posterDataUrl: string | null;
  onClose: () => void;
}

export function CampaignSuccessModal({
  open,
  campaign,
  posterDataUrl,
  onClose,
}: CampaignSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open || !campaign) return null;

  const handleCopyPromoCode = () => {
    navigator.clipboard.writeText(campaign.promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Join ${campaign.name} on Sqooli!\n\nUse promo code: ${campaign.promoCode}\nPay via M-Pesa: Paybill 247247, Account ${campaign.promoCode}\n\nVisit sqooli.com to learn more.`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Campaign Created Successfully</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your campaign poster is ready to share</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row gap-6 p-6">
          {/* Poster preview */}
          <div className="flex-shrink-0 w-full sm:w-56">
            {posterDataUrl ? (
              <img
                src={posterDataUrl}
                alt="Campaign poster"
                className="w-full aspect-square rounded-xl shadow-lg object-cover border border-border"
              />
            ) : (
              <div className="w-full aspect-square rounded-xl overflow-hidden">
                <Skeleton className="w-full h-full" />
              </div>
            )}
          </div>

          {/* Info + Actions */}
          <div className="flex-1 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Campaign</p>
                <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Program</p>
                <p className="text-sm text-foreground">{campaign.programName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Promo Code</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-bold font-mono bg-muted px-3 py-1.5 rounded-lg text-foreground tracking-widest">
                    {campaign.promoCode}
                  </code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyPromoCode}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div>
                <span className="inline-flex items-center text-xs font-medium bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                  Pending Approval
                </span>
              </div>
            </div>

            {/* Download / Share buttons */}
            <div className="space-y-2">
              <Button
                variant="default"
                size="sm"
                className="w-full justify-start gap-2"
                disabled={!posterDataUrl}
                onClick={() => posterDataUrl && downloadPosterAsPng(posterDataUrl, campaign.name)}
              >
                <Download className="h-4 w-4" />
                Download as PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                disabled={!posterDataUrl}
                onClick={() => posterDataUrl && downloadPosterAsPdf(posterDataUrl, campaign.name)}
              >
                <FileText className="h-4 w-4" />
                Download as PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleWhatsApp}
              >
                <Share2 className="h-4 w-4 text-green-600" />
                Share via WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

export type { CampaignSuccessData };
