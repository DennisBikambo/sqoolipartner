import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { X, Download, Eye, Copy } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";

interface CampaignAssetsProps {
  campaign: Doc<"campaigns"> | null;
  open: boolean;
  onClose: () => void;
}

export function CampaignAssets({
  campaign,
  open,
  onClose,
}: CampaignAssetsProps) {
  // Fetch assets for this campaign
  const assets = useQuery(
    api.assets.getAssetsByCampaign,
    campaign ? { campaign_id: campaign._id } : "skip"
  );

  if (!campaign) return null;

  // Group assets by type
  const whatsAppAssets = assets?.filter(asset => asset.content === "WhatsApp QR Code") || [];
  const howToPayAssets = assets?.filter(asset => asset.content === "Payment QR Code") || [];

  const handleDownload = (url: string, assetType: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${campaign.name}_${assetType}_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (url: string) => {
    window.open(url, '_blank');
  };

  const renderAssetCard = (asset: Doc<"assets">) => (
    <Card key={asset._id} className="border border-muted overflow-hidden">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Asset Preview */}
          <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
            {asset.url ? (
              <img 
                src={asset.url} 
                alt={`${asset.type} asset`}
                className="w-full h-full object-cover"
              />
            ) : asset.content ? (
              <div className="w-full h-full flex items-center justify-center p-2 text-xs text-muted-foreground overflow-hidden">
                <div className="line-clamp-6">{asset.content}</div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Preview
              </div>
            )}
          </div>

          {/* Asset Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground mb-1 capitalize">
              {asset.type.replace('_', ' ')}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Generated {new Date(asset.generated_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {asset.url && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => handlePreview(asset.url!)}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDownload(asset.url!, asset.type)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </>
              )}
              {asset.content && !asset.url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(asset.content!);
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy Text
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog  open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="!max-w-4xl sm:!max-w-4xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Campaigns</span>
            <span>/</span>
            <span>{campaign.name}</span>
            <span>/</span>
            <span className="text-foreground font-medium">Assets</span>
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

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Campaign Assets</h2>
            <p className="text-sm text-muted-foreground">
              View and download promotional materials for this campaign
            </p>
          </div>

          <Tabs defaultValue="qr_code" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr_code">
                WhatsApp QR Codes ({whatsAppAssets.length})
              </TabsTrigger>
              <TabsTrigger value="how_to_pay">
                How to Pay Qr Code ({howToPayAssets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr_code" className="space-y-4 mt-4">
              {whatsAppAssets.length === 0 ? (
                <Card className="border border-muted">
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-muted-foreground">No QR code assets available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {whatsAppAssets.map(renderAssetCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="how_to_pay" className="space-y-4 mt-4">
              {howToPayAssets.length === 0 ? (
                <Card className="border border-muted">
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-muted-foreground">No payment instruction assets available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {howToPayAssets.map(renderAssetCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}