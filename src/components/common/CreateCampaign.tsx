import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useActivityTracker } from "../../hooks/useActivityTracker";
import { Button } from "../ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { X, Loader2 } from "lucide-react";

interface WizardState {
  program_id: Id<"programs"> | "";
  channel_id: Id<"channels"> | "";
  subchannel: string;
  name: string;
  description: string;
  target_signups: number;
}

export default function CreateCampaignWizard({
  partnerId,
  user_id,
  open,
  onClose,
}: {
  partnerId: Id<"partners">;
  user_id?: Id<"users">;
  open: boolean;
  onClose?: () => void;
}) {
  const createCampaign = useMutation(api.campaign.createCampaign);
  const { track } = useActivityTracker(partnerId);
  const programs = useQuery(api.program.listPrograms);
  const channels = useQuery(api.channel.getChannelsByPartner, { partnerId });

  const [step, setStep] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    program_id: "",
    channel_id: "",
    subchannel: "",
    name: "",
    description: "",
    target_signups: 10000,
  });

  // Set initial program and channel when data loads
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

  // Auto-calculations based on selected program
  const calculations = useMemo(() => {
    if (!state.program_id || !state.target_signups) return null;

    const selectedProgram = programs?.find(p => p._id === state.program_id);
    if (!selectedProgram) return null;

    const start = new Date(selectedProgram.start_date);
    const end = new Date(selectedProgram.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const dailyTarget = Math.ceil(state.target_signups / days);
    const pricePerLesson = selectedProgram.pricing;
    const bundlePrice = pricePerLesson * 5;
    const revenueProjection = state.target_signups * bundlePrice;
    const partnerShare = revenueProjection * 0.2;

    return {
      days,
      dailyTarget,
      pricePerLesson,
      bundlePrice,
      revenueProjection,
      partnerShare,
      duration_start: selectedProgram.start_date,
      duration_end: selectedProgram.end_date,
    };
  }, [state.program_id, state.target_signups, programs]);

  const resetWizard = () => {
    setState({
      program_id: programs?.[0]?._id ?? "",
      channel_id: channels?.[0]?._id ?? "",
      subchannel: "",
      name: "",
      description: "",
      target_signups: 10000,
    });
    setStep(0);
    setError(null);
    setSuccess(null);
  };

  const canNext = () => {
    if (step === 0) {
      return Boolean(
        state.name && 
        state.program_id && 
        state.channel_id &&
        state.description
      );
    }
    return true;
  };

  const next = () => {
    if (!canNext()) return;
    setError(null);
    setStep((s) => Math.min(s + 1, 1));
  };

  const prev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleCreate = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (!state.program_id || !state.channel_id) {
        setError("Please select a program and channel");
        setIsSaving(false);
        return;
      }

      if (!calculations) {
        setError("Unable to calculate campaign details");
        setIsSaving(false);
        return;
      }

      const insertedId = await createCampaign({
        partner_id: partnerId,
        ...(user_id && { user_id }),
        program_id: state.program_id as Id<"programs">,
        channel_id: state.channel_id as Id<"channels">,
        subchannel: state.subchannel || undefined,
        name: state.name,
        description: state.description,
        target_signups: state.target_signups,
        duration_start: calculations.duration_start,
        duration_end: calculations.duration_end,
      });

      track({ 
        type: "campaign_created", 
        payload: { campaignId: String(insertedId), name: state.name } 
      });

      setSuccess("Campaign created successfully!");

      setTimeout(() => {
        setSuccess(null);
        onClose?.();
        resetWizard();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const selectedProgram = programs?.find(p => p._id === state.program_id);
  const selectedChannel = channels?.find(c => c._id === state.channel_id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <Card className="w-full max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">Create Campaign Link</h2>
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

        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Step 0: Campaign Details */}
          {step === 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="campaign-name" className="text-sm font-medium text-muted-foreground">
                  Campaign Name
                </Label>
                <Input
                  id="campaign-name"
                  value={state.name}
                  onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Enter campaign name"
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program" className="text-sm font-medium text-muted-foreground">
                  Program
                </Label>
                <select
                  id="program"
                  value={state.program_id}
                  onChange={(e) => setState((s) => ({ 
                    ...s, 
                    program_id: e.target.value as Id<"programs"> 
                  }))}
                  className="w-full h-10 sm:h-11 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select...</option>
                  {programs?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.start_date} → {p.end_date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="channel" className="text-sm font-medium text-muted-foreground">
                    Channel
                  </Label>
                  <select
                    id="channel"
                    value={state.channel_id}
                    onChange={(e) => {
                      const newChannelId = e.target.value as Id<"channels">;
                      setState((s) => ({ 
                        ...s, 
                        channel_id: newChannelId,
                        subchannel: "" // Reset subchannel when channel changes
                      }));
                    }}
                    className="w-full h-10 sm:h-11 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Select...</option>
                    {channels?.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subchannel" className="text-sm font-medium text-muted-foreground">
                    Sub-channel (optional)
                  </Label>
                  <select
                    id="subchannel"
                    value={state.subchannel}
                    onChange={(e) => setState((s) => ({ ...s, subchannel: e.target.value }))}
                    className="w-full h-10 sm:h-11 px-3 rounded-md border border-input bg-background"
                    disabled={!state.channel_id || !selectedChannel?.subchanells?.length}
                  >
                    <option value="">Select...</option>
                    {selectedChannel?.subchanells?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                  About Campaign
                </Label>
                <Textarea
                  id="description"
                  value={state.description}
                  onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Enter a description..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target" className="text-sm font-medium text-muted-foreground">
                  Target Signups
                </Label>
                <Input
                  id="target"
                  type="number"
                  min={1}
                  value={state.target_signups}
                  onChange={(e) => setState((s) => ({ 
                    ...s, 
                    target_signups: Number(e.target.value) 
                  }))}
                  className="h-10 sm:h-11"
                />
              </div>

              {calculations && (
                <Alert className="bg-accent/10 border-accent/20">
                  <AlertDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campaign Duration:</span>
                        <strong>{calculations.days} days</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily Target:</span>
                        <strong>{calculations.dailyTarget} signups/day</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bundle Price:</span>
                        <strong>KES {calculations.bundlePrice.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue Projection:</span>
                        <strong>KES {calculations.revenueProjection.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-primary">
                        <span>Your Share (20%):</span>
                        <strong>KES {calculations.partnerShare.toLocaleString()}</strong>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 1: Review */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Review Campaign Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Campaign Name:</span>
                  <span className="font-semibold">{state.name}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Program:</span>
                  <span className="font-semibold">{selectedProgram?.name}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-semibold">
                    {selectedChannel?.name}
                    {state.subchannel && ` > ${state.subchannel}`}
                  </span>
                </div>
                
                {calculations && (
                  <>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-semibold">
                        {calculations.duration_start} → {calculations.duration_end}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Target Signups:</span>
                      <span className="font-semibold">{state.target_signups.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Daily Target:</span>
                      <span className="font-semibold">{calculations.dailyTarget} signups/day</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Price per Lesson:</span>
                      <span className="font-semibold">KES {calculations.pricePerLesson}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Bundle (5 lessons):</span>
                      <span className="font-semibold">KES {calculations.bundlePrice}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-border bg-muted px-3 rounded">
                      <span className="font-medium">Your Expected Earnings:</span>
                      <span className="font-bold text-primary">
                        KES {calculations.partnerShare.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="py-2">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="mt-1 text-sm">{state.description}</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted flex justify-between border-t border-border px-4 sm:px-6 py-3 sm:py-4">
          {step > 0 && (
            <Button variant="outline" onClick={prev} className="h-9 sm:h-10">
              Back
            </Button>
          )}
          
          {step === 0 && (
            <div className="w-full flex justify-end">
              <Button onClick={next} disabled={!canNext()} className="h-9 sm:h-10">
                Continue
              </Button>
            </div>
          )}

          {step === 1 && (
            <Button onClick={handleCreate} disabled={isSaving} className="ml-auto h-9 sm:h-10">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}