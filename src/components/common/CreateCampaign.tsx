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
import { Check, Target, DollarSign, Sparkles, FileText, X, AlertCircle, Loader2, Hash, MessageSquare, Plus, Trash2 } from "lucide-react";

const steps = [
  { id: 0, title: "Program", icon: FileText, description: "Choose your program" },
  { id: 1, title: "Details", icon: Target, description: "Campaign information" },
  { id: 2, title: "Promo Code", icon: Hash, description: "Generate promo code" },
  { id: 3, title: "Assets", icon: Sparkles, description: "Review marketing assets" },
  { id: 4, title: "Review", icon: Check, description: "Confirm & create" }
];

interface PromoCode {
  code: string;
  label: string;
  description?: string;
}

interface WizardState {
  program_id: Id<"programs"> | "";

  name: string;
  duration_start: string;
  duration_end: string;
  target_signups: number;
  whatsapp_number: string;
  promo_code: string; // Legacy: backward compatibility
  auto_promo: boolean;
  promo_codes: PromoCode[]; // New: support multiple promo codes
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
  const storageKey = useMemo(() => `campaign-wizard:${String(partnerId)}`, [partnerId]);
  const createCampaign = useMutation(api.campaign.createCampaign);
  const createPromoCodeMutation = useMutation(api.promoCode.createPromoCode);
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
    whatsapp_number: "+254104010203",
    promo_code: "",
    auto_promo: true,
    promo_codes: [],
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
    if (step === 2) return Boolean((state.auto_promo || state.promo_code) || state.promo_codes.length > 0);
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
      promo_codes: [],
    });
    setStep(0);
    setError(null);
    setSuccess(null);
  };

  // Promo code management functions
  const addPromoCode = (promoCode: PromoCode) => {
    setState((s) => ({
      ...s,
      promo_codes: [...s.promo_codes, promoCode],
    }));
  };

  const removePromoCode = (index: number) => {
    setState((s) => ({
      ...s,
      promo_codes: s.promo_codes.filter((_, i) => i !== index),
    }));
  };

  const updatePromoCodeAt = (index: number, promoCode: PromoCode) => {
    setState((s) => ({
      ...s,
      promo_codes: s.promo_codes.map((pc, i) => (i === index ? promoCode : pc)),
    }));
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

      // Create the campaign
      const insertedId = await createCampaign({
        partner_id: partnerId,
        ...(user_id && { user_id }),
        program_id: state.program_id as Id<"programs">,
        name: state.name,
        duration_start: state.duration_start,
        duration_end: state.duration_end,
        target_signups: state.target_signups,
        whatsapp_number: state.whatsapp_number,
        promo_code: finalPromoCode || undefined,
      });

      // Create multiple promo codes if any were added
      if (state.promo_codes.length > 0) {
        for (const promoCode of state.promo_codes) {
          await createPromoCodeMutation({
            campaign_id: insertedId,
            code: promoCode.code,
            label: promoCode.label,
            description: promoCode.description,
          });
        }
      }

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Create New Campaign</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Step {step + 1} of {steps.length}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { resetWizard(); onClose?.(); }}
              className="text-primary-foreground hover:bg-primary-foreground/20"
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
                          ? "bg-primary-foreground text-primary"
                          : isCurrent
                          ? "bg-accent text-accent-foreground ring-4 ring-accent/30"
                          : "bg-primary/50 text-primary-foreground/60"
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
                      isCompleted ? "bg-primary-foreground" : "bg-primary/50"
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
              <StepIcon className="h-6 w-6 text-primary" />
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
                      ? "border-primary bg-accent/10"
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
                    <Check className="h-5 w-5 text-primary" />
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
                <Alert className="bg-accent/10 border-accent">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-foreground">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Campaign Duration:</span>
                        <strong>{calculations.days} days</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Target:</span>
                        <strong>{calculations.dailyTarget} signups/day</strong>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span>Revenue Projection:</span>
                        <strong>KES {calculations.revenueProjection.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-secondary">
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
              {/* Legacy single promo code option */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Single Promo Code (Legacy)</CardTitle>
                  <CardDescription>
                    Generate one promo code for your entire campaign
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
                    <div className="p-4 bg-secondary/10 border-2 border-secondary rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Generated Code</div>
                          <div className="text-2xl font-bold text-secondary">{autoPromoCode || "—"}</div>
                        </div>
                        <Check className="h-8 w-8 text-secondary" />
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

              <Separator />

              {/* Multiple promo codes option */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Multiple Promo Codes</CardTitle>
                      <CardDescription>
                        Create different promo codes for different radio stations or partners
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const code = `${state.name.replace(/\s+/g, "").toUpperCase().slice(0, 6)}${Math.floor(100 + Math.random() * 900)}`;
                        addPromoCode({
                          code,
                          label: `Station ${state.promo_codes.length + 1}`,
                          description: "",
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Promo Code
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {state.promo_codes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No promo codes added yet. Click "Add Promo Code" to create one.
                    </div>
                  ) : (
                    state.promo_codes.map((pc, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-3 bg-card"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`promo-label-${index}`}>
                                  Label (e.g., Radio Station Name)
                                </Label>
                                <Input
                                  id={`promo-label-${index}`}
                                  value={pc.label}
                                  onChange={(e) =>
                                    updatePromoCodeAt(index, { ...pc, label: e.target.value })
                                  }
                                  placeholder="E.g. Radio Africa"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`promo-code-${index}`}>Promo Code</Label>
                                <Input
                                  id={`promo-code-${index}`}
                                  value={pc.code}
                                  onChange={(e) =>
                                    updatePromoCodeAt(index, {
                                      ...pc,
                                      code: e.target.value.toUpperCase(),
                                    })
                                  }
                                  placeholder="E.g. AFRICA2025"
                                  className="font-mono"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`promo-desc-${index}`}>
                                Description (Optional)
                              </Label>
                              <Input
                                id={`promo-desc-${index}`}
                                value={pc.description || ""}
                                onChange={(e) =>
                                  updatePromoCodeAt(index, {
                                    ...pc,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="E.g. For Radio Africa listeners"
                              />
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removePromoCode(index)}
                            className="ml-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {state.promo_codes.length > 0
                    ? "Multiple promo codes allow you to track performance from different sources (radio stations, partners, etc.)"
                    : "Promo codes will be used in all marketing materials and payment instructions. Parents will use them to redeem their lessons after payment."}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Assets preview */}
          {step === 3 && (
            <div className="space-y-4">
              <Alert className="bg-accent/10 border-accent">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground">
                  The following marketing assets will be automatically generated when you create this campaign
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-secondary" />
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
                      <Check className="h-4 w-4 text-secondary" />
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
                      <Check className="h-4 w-4 text-secondary" />
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
                      <Check className="h-4 w-4 text-secondary" />
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
                  {state.promo_codes.length > 0 ? (
                    <div className="py-2">
                      <span className="text-muted-foreground">Promo Codes:</span>
                      <div className="mt-2 space-y-2">
                        {state.promo_codes.map((pc, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                            <div>
                              <div className="text-sm font-medium">{pc.label}</div>
                              {pc.description && (
                                <div className="text-xs text-muted-foreground">{pc.description}</div>
                              )}
                            </div>
                            <Badge variant="secondary" className="font-mono">{pc.code}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Promo Code:</span>
                      <Badge variant="secondary" className="font-mono">{finalPromoCode}</Badge>
                    </div>
                  )}
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
                      <div className="flex justify-between py-2 bg-secondary/10 -mx-4 px-4 rounded">
                        <span className="text-secondary font-medium">Your Share (20%):</span>
                        <span className="font-bold text-secondary">KES {calculations.partnerShare.toLocaleString()}</span>
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

              <Alert className="bg-accent/10 border-accent">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground">
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
                <Alert className="border-secondary bg-secondary/10">
                  <Check className="h-4 w-4 text-secondary" />
                  <AlertDescription className="text-secondary-foreground">{success}</AlertDescription>
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