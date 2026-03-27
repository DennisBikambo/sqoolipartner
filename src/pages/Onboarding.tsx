import { useReducer, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { isConvexUser } from "../types/auth.types";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { WalletSetupDialog } from "../components/common/WalletSetUp";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import AddUserDialog from "../components/common/AddUserDialog";
import { SocialMediaModal } from "../components/common/SocialMediaModal";

// ─── Step config ─────────────────────────────────────────────────────────────

type StepId = "wallet" | "campaign" | "users" | "2fa" | "social";
type StepStatus = "incomplete" | "active" | "completed";

interface StepDef {
  id: StepId;
  title: string;
  activeTitle?: string;
  description: string;
}

const STEPS: StepDef[] = [
  {
    id: "wallet",
    title: "Activate Wallet",
    description: "Setup your wallet payment methods for future withdrawals of your earnings",
  },
  {
    id: "campaign",
    title: "Create Campaign",
    description: "Create a campaign and share with your audience to start earning",
  },
  {
    id: "users",
    title: "Add Users",
    activeTitle: "Add Users (optional)",
    description: "Invite other users with different roles to your account",
  },
  {
    id: "2fa",
    title: "Two Factor Authentication Setup",
    description: "Setup your contact details for two factor authentication",
  },
  {
    id: "social",
    title: "Social Media Links (optional)",
    description: "Setup your social media links to grow your audience",
  },
];

// ─── State machine ────────────────────────────────────────────────────────────

interface OnboardingState {
  // which steps are completed (by index)
  completed: boolean[];
  // which modal is open
  openModal: StepId | null;
}

type OnboardingAction =
  | { type: "COMPLETE_STEP"; index: number }
  | { type: "OPEN_MODAL"; id: StepId }
  | { type: "CLOSE_MODAL" };

function computeStatuses(completed: boolean[]): StepStatus[] {
  let foundActive = false;
  return completed.map((done) => {
    if (done) return "completed";
    if (!foundActive) {
      foundActive = true;
      return "active";
    }
    return "incomplete";
  });
}

function reducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "COMPLETE_STEP": {
      const completed = [...state.completed];
      completed[action.index] = true;
      return { ...state, completed, openModal: null };
    }
    case "OPEN_MODAL":
      return { ...state, openModal: action.id };
    case "CLOSE_MODAL":
      return { ...state, openModal: null };
    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { partner, user } = useAuth();
  const completeOnboarding = useMutation(api.partner.completeOnboarding);
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const wallet = useQuery(
    api.wallet.getWalletByPartner,
    partner?._id ? { partnerId: partner._id } : "skip"
  );
  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id ? { partner_id: partner._id } : "skip"
  );

  const [state, dispatch] = useReducer(reducer, {
    completed: [false, false, false, false, false],
    openModal: null,
  });

  // Refs prevent wallet/campaign effects from re-running on every step change
  const completionFired = useRef(false);
  const walletSynced = useRef(false);
  const campaignSynced = useRef(false);

  // Sync wallet completion (step 0) — only re-runs when wallet query result changes
  useEffect(() => {
    if (wallet && !walletSynced.current) {
      walletSynced.current = true;
      dispatch({ type: "COMPLETE_STEP", index: 0 });
    }
  }, [wallet]);

  // Sync campaign completion (step 1) — only re-runs when campaigns query result changes
  useEffect(() => {
    if (campaigns && campaigns.length > 0 && !campaignSynced.current) {
      campaignSynced.current = true;
      dispatch({ type: "COMPLETE_STEP", index: 1 });
    }
  }, [campaigns]);

  // Auto-complete 2FA step (index 3) when user enables 2FA via /setup-2fa
  useEffect(() => {
    const twoFactorEnabled = (session?.user as { twoFactorEnabled?: boolean })?.twoFactorEnabled;
    if (twoFactorEnabled && !state.completed[3]) {
      dispatch({ type: "COMPLETE_STEP", index: 3 });
    }
  }, [session, state.completed]);

  // When all done → call mutation (guarded to fire exactly once).
  // After the mutation sets is_first_login = false, ProtectedRoute detects
  // !isFirstLogin && pathname === '/onboarding' and redirects to /dashboard
  // automatically — no manual navigate or page reload needed.
  const handleAllDone = useCallback(async () => {
    if (completionFired.current) return;
    if (!partner?._id || !user || !isConvexUser(user)) return;
    completionFired.current = true;
    try {
      await completeOnboarding({ partnerId: partner._id, userId: user._id });
    } catch {
      completionFired.current = false; // allow retry
      toast.error("Failed to complete onboarding. Please try again.");
    }
  }, [partner, user, completeOnboarding]);

  useEffect(() => {
    if (state.completed.every(Boolean)) {
      handleAllDone();
    }
  }, [state.completed, handleAllDone]);

  const statuses = computeStatuses(state.completed);

  const handleGo = (id: StepId) => {
    if (id === '2fa') {
      navigate('/setup-2fa?from=onboarding');
      return;
    }
    dispatch({ type: "OPEN_MODAL", id });
  };
  const handleSkip = (index: number) => dispatch({ type: "COMPLETE_STEP", index });
  const handleCloseModal = () => dispatch({ type: "CLOSE_MODAL" });

  const handleStep5Complete = () => dispatch({ type: "COMPLETE_STEP", index: 4 });

  return (
    <DashboardLayout activeItem="dashboard" title="Dashboard">
      <div className="min-h-full px-4 py-8 sm:px-8 lg:px-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to Sqooli</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete the following steps to activate your profile
            </p>
          </div>

          {/* Step list */}
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {STEPS.map((step, index) => {
                const status = statuses[index];
                const isActive = status === "active";
                const isDone = status === "completed";

                const displayTitle =
                  isActive && step.activeTitle ? step.activeTitle : step.title;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className={[
                      "flex items-center gap-4 px-5 py-5 transition-colors",
                      isActive
                        ? "bg-primary/5 dark:bg-primary/10"
                        : isDone
                        ? "bg-background"
                        : "bg-background opacity-60",
                      !isDone && "hover:bg-muted/30",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {/* Step indicator */}
                    <div className="shrink-0">
                      {isDone ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 250, damping: 18 }}
                          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
                        >
                          <Check className="h-5 w-5 text-white stroke-[2.5]" />
                        </motion.div>
                      ) : isActive ? (
                        <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {index + 1}
                          </span>
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center">
                          <span className="text-sm font-semibold text-muted-foreground">
                            {index + 1}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title + description */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={[
                          "text-sm font-semibold leading-snug",
                          isDone || isActive ? "text-foreground" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {displayTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Right action */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isActive ? (
                        <>
                          <button
                            onClick={() => handleSkip(index)}
                            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                          >
                            Skip
                          </button>
                          <Button
                            size="sm"
                            onClick={() => handleGo(step.id)}
                            className="h-8 px-4 text-xs font-semibold rounded-lg"
                          >
                            Go
                          </Button>
                        </>
                      ) : (
                        <ChevronRight
                          className={[
                            "h-4 w-4",
                            isDone ? "text-muted-foreground" : "text-muted-foreground/40",
                          ].join(" ")}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}

      {/* Step 1: Wallet — completes automatically when wallet query returns data */}
      {partner?._id && user && isConvexUser(user) && (
        <WalletSetupDialog
          open={state.openModal === "wallet"}
          onClose={handleCloseModal}
          partnerId={partner._id as Id<"partners">}
          userId={user._id}
        />
      )}

      {/* Step 2: Campaign — completes automatically when campaign query returns data */}
      {partner?._id && user && isConvexUser(user) && (
        <CreateCampaignWizard
          open={state.openModal === "campaign"}
          onClose={handleCloseModal}
          partnerId={partner._id}
          user_id={user._id}
        />
      )}

      {/* Step 3: Add Users — optional; closing just dismisses, Skip button advances */}
      {partner?._id && (
        <AddUserDialog
          open={state.openModal === "users"}
          onOpenChange={(o) => { if (!o) handleCloseModal(); }}
          partnerIdOverride={partner._id as Id<"partners">}
        />
      )}

      {/* Step 5: Social Media */}
      <SocialMediaModal
        open={state.openModal === "social"}
        onClose={handleCloseModal}
        onComplete={handleStep5Complete}
      />
    </DashboardLayout>
  );
}
