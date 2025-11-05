'use client';

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Eye, EyeOff, Edit } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { WalletSetupDialog } from "./WalletSetUp";
import { PinVerificationDialog } from "./PinVerification";
// import { cn } from "../../lib/utils";

export default function Wallet({
  activeItem,
  setActiveItem,
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
}) {
  const { user, partner } = useAuth();
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  const partnerId = partner?._id as Id<"partners"> | undefined;
  const wallet = useQuery(
    api.wallet.getWalletByPartnerId,
    partnerId ? { partner_id: partnerId } : "skip"
  ) as Doc<"wallets"> | undefined;

  useEffect(() => {
    if (showBalance) {
      const timer = setTimeout(() => setShowBalance(false), 3 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [showBalance]);

  const handleShowBalance = () => {
    if (!wallet) return;
    setPinDialogOpen(true);
  };

  function setUpWallet() {
    if (activeItem === "wallet") setShowSetupDialog(true);
    else setActiveItem("wallet");
  }

  // Skeleton loading
  if (partner && wallet === undefined) {
    return (
      <Card className="rounded-xl p-6 space-y-4 border border-border bg-card">
        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded-xl" />
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl overflow-hidden border-0 shadow-sm  text-primary-foreground animate-fadeIn">
        {wallet && wallet.is_setup_complete ? (
          <>
            {/* --- Top Section (Blue Area) --- */}
            <div className="p-6 pb-8 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground rounded-t-2xl relative">
              {/* Curved divider at bottom */}
              <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-primary/40 to-transparent rounded-t-[2rem]" />

              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm opacity-90">Wallet Balance</p>
                    <p className="text-3xl font-semibold mt-1 select-none">
                      {showBalance
                        ? `KES ${wallet.balance.toLocaleString()}`
                        : "KES ••••••••"}
                    </p>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleShowBalance}
                    className="text-primary-foreground/80 hover:bg-primary-foreground/20 rounded-full"
                  >
                    {showBalance ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* --- Bottom Section (Lighter Area) --- */}
            <div className="bg-background/90 text-foreground/90 p-6 space-y-10">
              {/* Saved Method Section */}
              <div className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-1 shadow-inner">
                <div className="flex items-center gap-2">
                  {wallet.withdrawal_method === "mpesa" && (
                    <img
                      src="/mpesa.svg"
                      alt="Mpesa"
                      className="h-5 w-5 rounded"
                    />
                  )}
                  <p className="text-sm font-medium">Saved Method:</p>
                </div>
                {wallet.withdrawal_method === "paybill" && (
                  <p className="text-sm">
                    Paybill:{" "}
                    <span className="font-semibold">
                      {wallet.paybill_number
                        ? wallet.paybill_number.replace(
                            /^(.{1})(.*)(.{1})$/,
                            (_, a, b, c) =>
                              `${a}${"*".repeat(b.length)}${c}`
                          )
                        : "—"}
                    </span>
                  </p>
                )}
                <p className="text-sm">
                  Account No:{" "}
                  <span className="font-semibold">
                    {wallet.account_number.replace(
                      /^(.{2})(.*)(.{4})$/,
                      (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`
                    )}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90">
                  Withdraw
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-primary text-primary font-medium rounded-lg hover:bg-primary/10"
                  onClick={setUpWallet}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center space-y-4">
            <p className="text-sm text-primary-foreground/80">
              Setup wallet to withdraw your earnings
            </p>
            <Button
              className="bg-background text-primary hover:bg-muted rounded-lg font-medium"
              onClick={setUpWallet}
            >
              Setup Wallet
            </Button>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      {wallet && user && (
        <PinVerificationDialog
          open={pinDialogOpen}
          onClose={() => setPinDialogOpen(false)}
          correctPin={wallet.pin}
          userId={partner?._id as Id<"partners">}
          onSuccess={() => setShowBalance(true)}
        />
      )}

      {user && (
        <WalletSetupDialog
          open={showSetupDialog}
          onClose={() => setShowSetupDialog(false)}
          partnerId={partner?._id as Id<"partners">}
        />
      )}
    </>
  );
}
