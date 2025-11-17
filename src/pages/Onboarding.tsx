import { useState, useEffect } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import { WalletSetupDialog } from "../components/common/WalletSetUp";
import { useAuth } from "../hooks/useAuth";
import { isConvexUser } from "../types/auth.types";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
  const [walletOpen, setWalletOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const { partner, user } = useAuth();
  const navigate = useNavigate();

  const wallet = useQuery(
    api.wallet.getWalletByPartner,
    partner?._id ? { partnerId: partner._id } : "skip"
  );
  const campaign = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id ? { partner_id: partner._id } : "skip"
  );

  const completeOnboarding = useMutation(api.partner.completeOnboarding);

  useEffect(() => {
    if (partner && wallet && campaign) {
      completeOnboarding({ partnerId: partner._id });
      navigate("/dashboard");
    }
  }, [wallet, campaign, partner, completeOnboarding, navigate]);

  const handleSkip = async () => {
    if (!partner?._id) return;
    await completeOnboarding({ partnerId: partner._id });
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 sm:px-0">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Welcome to Sqooli</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete the following steps to activate your profile
          </p>
        </div>

        {/* === Step 1: Wallet Setup === */}
        <Card
          className={`rounded-xl border p-5 transition ${
            wallet ? "bg-green-50 border-green-200" : "hover:bg-muted border-border"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            {/* Number + Text */}
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-gray-400">1</span>
              <div>
                <p className="font-medium text-foreground">Setup Wallet</p>
                <p className="text-sm text-muted-foreground">
                  Setup your wallet payment methods for future withdrawals of your
                  earnings.
                </p>
              </div>
            </div>

            {/* Go / Check */}
            {wallet ? (
              <CheckCircle className="text-green-500 h-6 w-6 animate-fadeIn" />
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWalletOpen(true)}
                className="ml-4 whitespace-nowrap"
              >
                Go
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* === Step 2: Create Campaign === */}
        <Card
          className={`rounded-xl border p-5 transition ${
            campaign ? "bg-blue-50 border-blue-200" : "hover:bg-muted border-border"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-gray-400">2</span>
              <div>
                <p className="font-medium text-foreground">Create Campaign</p>
                <p className="text-sm text-muted-foreground">
                  Create a campaign and share with your audience to start earning.
                </p>
              </div>
            </div>

            {campaign ? (
              <CheckCircle className="text-blue-500 h-6 w-6 animate-fadeIn" />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="ml-4 whitespace-nowrap"
                onClick={() => setCampaignOpen(true)}
              >
                Go
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* === Step 3: Add Users === */}
        <Card className="rounded-xl border border-border p-5 opacity-70">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-gray-400">3</span>
              <div>
                <p className="font-medium text-foreground">Add Users</p>
                <p className="text-sm text-muted-foreground">
                  Invite other users with different roles to your account.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="whitespace-nowrap">
              Coming Soon
            </Badge>
          </div>
        </Card>

        {/* === Step 4: Two-Factor Auth === */}
        <Card className="rounded-xl border border-border p-5 opacity-70">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-gray-400">4</span>
              <div>
                <p className="font-medium text-foreground">
                  Two Factor Authentication Setup
                </p>
                <p className="text-sm text-muted-foreground">
                  Setup your contact details for two-factor authentication.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="whitespace-nowrap">
              Coming Soon
            </Badge>
          </div>
        </Card>

        {/* Skip */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="text-muted-foreground border-border hover:bg-primary hover:text-primary-foreground"
          >
            Skip for now
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      { partner?._id && user && isConvexUser(user) && (
        <WalletSetupDialog
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        partnerId={partner?._id as Id<"partners">}
        userId={user._id}
      />
      )}
      
      {partner?._id && user && isConvexUser(user) && (
        <CreateCampaignWizard
          open={campaignOpen}
          onClose={() => setCampaignOpen(false)}
          partnerId={partner._id}
          user_id={user._id}
        />
      )}
    </div>
  );
}
