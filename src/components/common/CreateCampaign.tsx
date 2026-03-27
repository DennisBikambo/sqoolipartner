import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { X, Loader2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useConvexQuery } from "../../hooks/useConvexQuery";
import { generateQRCode } from "../../services/qrCodeService";
import { generateCampaignPosterDataUrl } from "../../utils/posterUtils";
import { uploadToCloudinary } from "../../services/cloudinaryUpload";
import type { CampaignSuccessData } from "./CampaignSuccessModal";

interface WizardState {
  program_id: Id<"programs"> | "";
  channel_id: Id<"channels"> | "";
  subchannel_id: Id<"subchannels"> | "";
  name: string;
  description: string;
  target_signups: number;
}

export interface CreationSuccessPayload extends CampaignSuccessData {
  posterDataUrl: string | null;
}

interface CreateCampaignWizardProps {
  partnerId: Id<"partners">;
  user_id?: Id<"users">;
  open: boolean;
  onClose?: () => void;
  onSuccess?: (data: CreationSuccessPayload) => void;
}

export default function CreateCampaignWizard({
  partnerId,
  user_id,
  open,
  onClose,
  onSuccess,
}: CreateCampaignWizardProps) {
  const createCampaign = useMutation(api.campaign.createCampaign);
  const saveAsset      = useMutation(api.assets.saveAsset);
  const createChannel  = useMutation(api.channel.createChannel);

  const rawPrograms = useQuery(api.program.listPrograms);
  const rawChannels = useQuery(api.channel.getChannelsByPartner, { partnerId });
  const { data: programs, isLoading: programsLoading } = useConvexQuery(
    `create_programs_${partnerId}`,
    rawPrograms
  );
  const { data: channels, isLoading: channelsLoading } = useConvexQuery(
    `create_channels_${partnerId}`,
    rawChannels
  );

  const [state, setState] = useState<WizardState>({
    program_id: "",
    channel_id: "",
    subchannel_id: "",
    name: "",
    description: "",
    target_signups: 10000,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [phase, setPhase] = useState<"idle" | "creating" | "poster">("idle");
  const [error, setError] = useState<string | null>(null);

  // Inline channel creation (shown when no channels exist yet)
  const [channelForm, setChannelForm] = useState({ name: "", description: "" });
  const [creatingChannel, setCreatingChannel] = useState(false);

  // Load subchannels for selected channel
  const rawSubchannels = useQuery(
    api.channel.getSubchannelsByChannel,
    state.channel_id ? { channel_id: state.channel_id as Id<"channels"> } : "skip"
  );

  // Set defaults when data loads
  useEffect(() => {
    if (programs && programs.length > 0 && !state.program_id) {
      setState((s) => ({ ...s, program_id: programs[0]._id }));
    }
  }, [programs, state.program_id]);

  useEffect(() => {
    if (channels && channels.length > 0 && !state.channel_id) {
      setState((s) => ({ ...s, channel_id: channels[0]._id }));
    }
  }, [channels, state.channel_id]);

  const calculations = useMemo(() => {
    if (!state.program_id || !state.target_signups) return null;
    const selectedProgram = programs?.find((p) => p._id === state.program_id);
    if (!selectedProgram) return null;

    const start = new Date(selectedProgram.start_date);
    const end = new Date(selectedProgram.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const bundlePrice = selectedProgram.pricing * 5;
    const revenueProjection = state.target_signups * bundlePrice;

    return {
      days,
      dailyTarget: Math.ceil(state.target_signups / days),
      bundlePrice,
      revenueProjection,
      partnerShare: revenueProjection * 0.2,
      duration_start: selectedProgram.start_date,
      duration_end: selectedProgram.end_date,
    };
  }, [state.program_id, state.target_signups, programs]);

  const handleCreateChannel = async () => {
    if (!channelForm.name.trim()) return;
    setCreatingChannel(true);
    try {
      const code = channelForm.name.trim().toUpperCase().replace(/\s+/g, "_").slice(0, 12);
      await createChannel({
        partnerId,
        name: channelForm.name.trim(),
        code,
        description: channelForm.description.trim() || channelForm.name.trim(),
      });
      setChannelForm({ name: "", description: "" });
      // rawChannels will reactively update — the useEffect auto-selects the new channel
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create channel");
    } finally {
      setCreatingChannel(false);
    }
  };

  const resetWizard = () => {
    setState({
      program_id: programs?.[0]?._id ?? "",
      channel_id: channels?.[0]?._id ?? "",
      subchannel_id: "",
      name: "",
      description: "",
      target_signups: 10000,
    });
    setPhase("idle");
    setError(null);
  };

  const canSubmit = Boolean(
    state.name &&
    state.program_id &&
    state.channel_id &&
    state.description &&
    !isSaving
  );

  const handleCreate = async () => {
    if (!canSubmit || !calculations) return;
    setError(null);
    setIsSaving(true);
    setPhase("creating");

    try {
      const selectedProgram = programs?.find((p) => p._id === state.program_id);

      const result = await createCampaign({
        partner_id: partnerId,
        ...(user_id && { user_id }),
        program_id: state.program_id as Id<"programs">,
        channel_id: state.channel_id as Id<"channels">,
        subchannel: state.subchannel_id
          ? rawSubchannels?.find((s) => s._id === state.subchannel_id)?.name
          : undefined,
        name: state.name,
        description: state.description,
        target_signups: state.target_signups,
        duration_start: calculations.duration_start,
        duration_end: calculations.duration_end,
      });

      const { campaignId, promoCode } = result as { campaignId: string; promoCode: string };

      // Generate poster client-side
      setPhase("poster");
      let posterDataUrl: string | null = null;
      let qrDataUrl: string | null = null;
      try {
        qrDataUrl = await generateQRCode("https://sqooli.com", { width: 300, errorCorrectionLevel: "H" });
        posterDataUrl = await generateCampaignPosterDataUrl({
          campaignName: state.name,
          programName: selectedProgram?.name ?? "",
          promoCode,
          qrCodeDataUrl: qrDataUrl,
        });
      } catch {
        // Poster generation failed — non-fatal, continue without poster
      }

      onClose?.();
      resetWizard();
      onSuccess?.({
        name: state.name,
        promoCode,
        programName: selectedProgram?.name ?? "",
        posterDataUrl,
      });

      // Background: persist assets so the detail view loads them from cache next time
      if (campaignId) {
        const cid = campaignId as import("../../../convex/_generated/dataModel").Id<"campaigns">;
        if (qrDataUrl) {
          saveAsset({ campaign_id: cid, type: "qr_code", content: qrDataUrl }).catch(() => {});
        }
        if (posterDataUrl) {
          uploadToCloudinary(posterDataUrl, {
            folder: "sqooli/campaign-posters",
            publicId: `poster_${campaignId}`,
          })
            .then((cloudUrl) => saveAsset({ campaign_id: cid, type: "flyer", url: cloudUrl }))
            .catch(() => {});
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <Card className="w-full max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">Create Campaign Link</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { resetWizard(); onClose?.(); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaign-name" className="text-sm font-medium text-muted-foreground">
              Campaign Name
            </Label>
            <Input
              id="campaign-name"
              value={state.name}
              onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              placeholder="Enter campaign name"
              className="h-10"
            />
          </div>

          {/* Program */}
          <div className="space-y-2">
            <Label htmlFor="program" className="text-sm font-medium text-muted-foreground">
              Program
            </Label>
            {programsLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              <select
                id="program"
                value={state.program_id}
                onChange={(e) => setState((s) => ({ ...s, program_id: e.target.value as Id<"programs"> }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select program...</option>
                {(programs ?? []).map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.start_date} → {p.end_date})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Channel + Sub-channel */}
          {channelsLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : channels && channels.length === 0 ? (
            /* ── No channels yet: inline quick-create ── */
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Create a Channel First</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Campaigns need a channel to track where your audience comes from. Set one up quickly below.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">Channel Name</Label>
                <Input
                  value={channelForm.name}
                  onChange={(e) => setChannelForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. WhatsApp, Radio, Facebook"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">
                  Description <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  value={channelForm.description}
                  onChange={(e) => setChannelForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What is this channel for?"
                  className="h-9 text-sm"
                />
              </div>
              <button
                onClick={handleCreateChannel}
                disabled={!channelForm.name.trim() || creatingChannel}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {creatingChannel ? "Creating..." : "Create Channel & Continue"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="channel" className="text-sm font-medium text-muted-foreground">
                  Channel
                </Label>
                <select
                  id="channel"
                  value={state.channel_id}
                  onChange={(e) => setState((s) => ({
                    ...s,
                    channel_id: e.target.value as Id<"channels">,
                    subchannel_id: "",
                  }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select channel...</option>
                  {(channels ?? []).map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subchannel" className="text-sm font-medium text-muted-foreground">
                  Sub-channel <span className="text-xs font-normal">(optional)</span>
                </Label>
                <select
                  id="subchannel"
                  value={state.subchannel_id}
                  onChange={(e) => setState((s) => ({ ...s, subchannel_id: e.target.value as Id<"subchannels"> }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  disabled={!state.channel_id || !rawSubchannels?.length}
                >
                  <option value="">Select...</option>
                  {(rawSubchannels ?? []).map((sub) => (
                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Target Signups */}
          <div className="space-y-2">
            <Label htmlFor="target" className="text-sm font-medium text-muted-foreground">
              Target Signups
            </Label>
            <Input
              id="target"
              type="number"
              min={1}
              value={state.target_signups}
              onChange={(e) => setState((s) => ({ ...s, target_signups: Number(e.target.value) }))}
              className="h-10"
            />
          </div>

          {/* About Campaign */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
              About Campaign
            </Label>
            <Textarea
              id="description"
              value={state.description}
              onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
              placeholder="Enter a description..."
              className="min-h-[100px] resize-none bg-accent/5"
            />
          </div>

          {/* Live calculations */}
          {calculations && (
            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <strong>{calculations.days} days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Target:</span>
                    <strong>{calculations.dailyTarget} signups/day</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bundle (5 lessons):</span>
                    <strong>KES {calculations.bundlePrice.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-primary font-medium">
                    <span>Your Share (20%):</span>
                    <strong>KES {calculations.partnerShare.toLocaleString()}</strong>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="bg-muted flex justify-end border-t border-border px-4 sm:px-6 py-3">
          <Button
            onClick={handleCreate}
            disabled={!canSubmit || programsLoading || channelsLoading}
            className="h-9 sm:h-10 min-w-[140px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {phase === "poster" ? "Generating poster..." : "Creating..."}
              </>
            ) : (
              "Create Campaign"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
