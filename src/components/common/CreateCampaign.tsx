import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useActivityTracker } from "../../hooks/useActivityTracker";
import { Button } from "../ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Check, Target, DollarSign, Sparkles, FileText, X, AlertCircle, Loader2, Hash, MessageSquare } from "lucide-react";

const steps = [
  { id: 0, title: "Program", icon: FileText, description: "Choose your program" },
  { id: 1, title: "Details", icon: Target, description: "Campaign information" },
  { id: 2, title: "Promo Code", icon: Hash, description: "Generate promo code" },
  { id: 3, title: "Assets", icon: Sparkles, description: "Review marketing assets" },
  { id: 4, title: "Review", icon: Check, description: "Confirm & create" }
];

interface WizardState {
  program_id: Id<"programs"> | "";
  name: string;
  duration_start: string;
  duration_end: string;
  target_signups: number;
  whatsapp_number: string;
  promo_code: string;
  auto_promo: boolean;
}

export default function CreateCampaignWizard({
  partnerId,
  open,
  onClose,
}: {
  partnerId: Id<"partners">;
  open: boolean;
  onClose?: () => void;
}) {
  const storageKey = useMemo(() => `campaign-wizard:${String(partnerId)}`, [partnerId]);
  const createCampaign = useMutation(api.campaign.createCampaign);
  const { track } = useActivityTracker(partnerId);
  const programs = useQuery(api.program.listPrograms);


  const [step, setStep] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    program_id: "",
    name: "",
    duration_start: "",
    duration_end: "",
    target_signups: 10000,
    whatsapp_number: "+254753113000",
    promo_code: "",
    auto_promo: true,
  });

  // Set initial program when programs load
  useEffect(() => {
    if (programs && programs.length > 0 && !state.program_id) {
      setState((s) => ({ ...s, program_id: programs[0]._id }));
    }
  }, [programs, state.program_id]);

  // Auto-calculations based on state
  const calculations = useMemo(() => {
    if (!state.duration_start || !state.duration_end || !state.target_signups) {
      return null;
    }

    const start = new Date(state.duration_start);
    const end = new Date(state.duration_end);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const dailyTarget = Math.ceil(state.target_signups / days);
    const revenueProjection = state.target_signups * 1000;
    const partnerShare = revenueProjection * 0.2;
    const sqooliShare = revenueProjection * 0.8;

    return {
      days,
      dailyTarget,
      bundledOffers: { min_lessons: 5, total_price: 1000 },
      discountRule: { price_per_lesson: 200 },
      revenueProjection,
      partnerShare,
      sqooliShare,
    };
  }, [state.duration_start, state.duration_end, state.target_signups]);

  // Auto-generate promo code
  const autoPromoCode = useMemo(() => {
    if (!state.name) return "";
    const base = state.name.replace(/\s+/g, "").toUpperCase().slice(0, 8);
    const random = Math.floor(100 + Math.random() * 900);
    return `${base}${random}`;
  }, [state.name]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as WizardState;
        setState((s) => ({ ...s, ...parsed }));
      }
    } catch (e) {
      console.warn("Failed to parse saved wizard state", e);
    }
  }, [open, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to persist wizard state", e);
    }
  }, [state, storageKey]);

  const canNext = () => {
    if (step === 0) return Boolean(state.program_id);
    if (step === 1) return Boolean(state.name && state.duration_start && state.duration_end && state.target_signups && state.whatsapp_number);
    if (step === 2) return Boolean(state.auto_promo || state.promo_code);
    return true;
  };

  const next = () => {
    if (!canNext()) return;
    setError(null);
    setStep((s) => Math.min(s + 1, 4));
  };

  const prev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const resetWizard = () => {
    localStorage.removeItem(storageKey);
    setState({
      program_id: programs?.[0]?._id ?? "",
      name: "",
      duration_start: "",
      duration_end: "",
      target_signups: 10000,
      whatsapp_number: "+15551575355",
      promo_code: "",
      auto_promo: true,
    });
    setStep(0);
    setError(null);
    setSuccess(null);
  };

  const handleCreate = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (!state.program_id) {
        setError("Please select a program");
        setIsSaving(false);
        return;
      }

      const finalPromoCode = state.auto_promo ? autoPromoCode : state.promo_code;

      const insertedId = await createCampaign({
        partner_id: partnerId,
        program_id: state.program_id as Id<"programs">,
        name: state.name,
        duration_start: state.duration_start,
        duration_end: state.duration_end,
        target_signups: state.target_signups,
        whatsapp_number: state.whatsapp_number,
        promo_code: finalPromoCode || undefined,
      });

      track({ type: "campaign_created", payload: { campaignId: String(insertedId), name: state.name } });

      localStorage.removeItem(storageKey);
      setSuccess("Campaign created successfully! Assets have been generated.");
      
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

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;
  const selectedProgram = programs?.find(p => p._id === state.program_id);
  const finalPromoCode = state.auto_promo ? autoPromoCode : state.promo_code;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh]  overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r  from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Create New Campaign</CardTitle>
              <CardDescription className="text-blue-100">
                Step {step + 1} of {steps.length}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { resetWizard(); onClose?.(); }}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isCompleted = idx < step;
              const isCurrent = idx === step;
              
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-white text-blue-600"
                          : isCurrent
                          ? "bg-blue-500 text-white ring-4 ring-blue-300"
                          : "bg-blue-700/50 text-blue-200"
                      }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs mt-1 ${isCurrent ? "font-semibold" : ""}`}>
                      {s.title}
                    </span>
                  </div>
                  
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 transition-all ${
                      isCompleted ? "bg-white" : "bg-blue-700/50"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <StepIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold">{currentStep.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{currentStep.description}</p>
          </div>

          {/* Step 0: Program selection */}
          {step === 0 && (
            <RadioGroup
              value={state.program_id}
              onValueChange={(value) => setState((s) => ({ ...s, program_id: value as Id<"programs"> }))}
              className="space-y-3"
            >
              {programs?.map((p) => (
                <Label
                  key={p._id}
                  htmlFor={p._id}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    state.program_id === p._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value={p._id} id={p._id} className="mt-1" />
                  <div className="ml-3 flex-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {p.start_date} → {p.end_date}
                    </div>
                  </div>
                  {state.program_id === p._id && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </Label>
              ))}
            </RadioGroup>
          )}

          {/* Step 1: Campaign details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">
                  Campaign Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="campaign-name"
                  value={state.name}
                  onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                  placeholder="E.g. Radio Africa Holiday Tuition Campaign"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={state.duration_start}
                    onChange={(e) => setState((s) => ({ ...s, duration_start: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">
                    End Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={state.duration_end}
                    onChange={(e) => setState((s) => ({ ...s, duration_end: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">
                  Target Signups <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="target"
                  type="number"
                  min={1}
                  value={state.target_signups}
                  onChange={(e) => setState((s) => ({ ...s, target_signups: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">
                  WhatsApp Number <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <MessageSquare className="h-5 w-5 text-muted-foreground mt-2" />
                  <Input
                    id="whatsapp"
                    disabled
                    value={state.whatsapp_number}
                    onChange={(e) => setState((s) => ({ ...s, whatsapp_number: e.target.value }))}
                    placeholder="+254712345678"
                  />
                </div>
              </div>

              {calculations && (
                <Alert className="bg-blue-50 border-blue-200">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Campaign Duration:</span>
                        <strong>{calculations.days} days</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Target:</span>
                        <strong>{calculations.dailyTarget} signups/day</strong>
                      </div>
                      <Separator className="my-2 bg-blue-200" />
                      <div className="flex justify-between">
                        <span>Revenue Projection:</span>
                        <strong>KES {calculations.revenueProjection.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-green-700">
                        <span>Your Share (20%):</span>
                        <strong>KES {calculations.partnerShare.toLocaleString()}</strong>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Promo code */}
          {step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Promo Code Generation</CardTitle>
                  <CardDescription>
                    This unique code will track all transactions from your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-promo"
                      checked={state.auto_promo}
                      onChange={(e) => setState((s) => ({ ...s, auto_promo: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="auto-promo" className="cursor-pointer">
                      Auto-generate promo code
                    </Label>
                  </div>

                  {state.auto_promo ? (
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Generated Code</div>
                          <div className="text-2xl font-bold text-green-700">{autoPromoCode || "—"}</div>
                        </div>
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="custom-promo">Custom Promo Code</Label>
                      <Input
                        id="custom-promo"
                        value={state.promo_code}
                        onChange={(e) => setState((s) => ({ ...s, promo_code: e.target.value.toUpperCase() }))}
                        placeholder="E.g. RADIO2025"
                        className="font-mono text-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be unique. Only letters and numbers allowed.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This promo code will be used in all marketing materials and payment instructions.
                  Parents will use it to redeem their lessons after payment.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Assets preview */}
          {step === 3 && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  The following marketing assets will be automatically generated when you create this campaign
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      WhatsApp Click-to-Chat Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-xs bg-muted p-2 rounded block break-all">
                      https://wa.me/{state.whatsapp_number.replace(/\+/g, '')}?text=The%20current%20active%20campaign%20is%20,+{finalPromoCode}
                    </code>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Links to: https://sqooli.co/campaign?code={finalPromoCode}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Campaign Flyer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Co-branded flyer with program details, KES 200/lesson pricing, and promo code
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      How to Pay Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <div>Paybill: <strong>4092033</strong></div>
                      <div>Account: <strong>[Transaction ID]</strong></div>
                      <div>Amount: <strong>KES 1,000</strong></div>
                      <div>Promo Code: <strong>{finalPromoCode}</strong></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Campaign Name:</span>
                    <span className="font-semibold">{state.name}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Program:</span>
                    <span className="font-semibold">{selectedProgram?.name}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-semibold">
                      {state.duration_start} → {state.duration_end}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Target Signups:</span>
                    <span className="font-semibold">{state.target_signups.toLocaleString()} students</span>
                  </div>
                  {calculations && (
                    <>
                      <Separator />
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Daily Target:</span>
                        <span className="font-semibold">{calculations.dailyTarget} signups/day</span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Promo Code:</span>
                    <Badge variant="secondary" className="font-mono">{finalPromoCode}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">WhatsApp:</span>
                    <span className="font-semibold">{state.whatsapp_number}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Bundled Offer:</span>
                    <span className="font-semibold">5 lessons @ KES 1,000</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-semibold">KES 200/lesson with promo</span>
                  </div>
                  {calculations && (
                    <>
                      <Separator />
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Revenue Projection:</span>
                        <span className="font-semibold">KES {calculations.revenueProjection.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-2 bg-green-50 -mx-4 px-4 rounded">
                        <span className="text-green-700 font-medium">Your Share (20%):</span>
                        <span className="font-bold text-green-700">KES {calculations.partnerShare.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary">Draft (pending approval)</Badge>
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  Your campaign will be submitted for review. Once approved by Sqooli Admin, 
                  you'll receive a notification and can start promoting with your generated assets.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/50 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => { resetWizard(); onClose?.(); }}
          >
            Cancel
          </Button>

          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={prev}>
                Back
              </Button>
            )}

            {step < 4 && (
              <Button onClick={next} disabled={!canNext()}>
                Continue
              </Button>
            )}

            {step === 4 && (
              <Button onClick={handleCreate} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Submit Campaign
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
