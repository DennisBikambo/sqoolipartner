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
import { WithdrawalDialog } from "./WithdrawalDialog";
import { WalletEditDialog } from "./WalletEditDialog";
import { isConvexUser } from "../../types/auth.types";
import { toast } from "sonner";

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
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  function withdraw() {
    if (!wallet) {
      toast.error("Wallet not available for withdrawal.");
      return;
    }

    if (!wallet.is_setup_complete) {
      toast.error("Wallet is not set up yet.");
      setShowSetupDialog(true);
      return;
    }

    setWithdrawalDialogOpen(true);
  }

  function editWallet() {
    if (!wallet) {
      toast.error("Wallet not available.");
      return;
    }

    if (!wallet.is_setup_complete) {
      toast.error("Please setup your wallet first.");
      setShowSetupDialog(true);
      return;
    }

    setEditDialogOpen(true);
  }

  // Skeleton loading
  if (partner && wallet === undefined) {
    return (
      <Card className="rounded-2xl p-6 space-y-4 border border-border bg-card">
        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded-xl" />
      </Card>
    );
  }

  return (
  <>
    <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn bg-background w-full max-w-full overflow-hidden">
      {wallet && wallet.is_setup_complete ? (
        <>
          {/* -------- TOP BLUE SECTION -------- */}
          <div className="p-4 sm:p-6 pb-6 sm:pb-8 bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-3">
              
              {/* LEFT — BALANCE */}
              <div className="min-w-0 w-full sm:flex-1">
                <p className="text-xs sm:text-sm font-medium opacity-90">Wallet Balance</p>

                <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words mt-1">
                  {showBalance
                    ? `KES ${wallet.balance.toLocaleString()}`
                    : "KES ••••••••"}
                </p>
              </div>

              {/* EYE ICON */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleShowBalance}
                className="text-primary-foreground/90 hover:bg-primary-foreground/15 rounded-full h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
              >
                {showBalance ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-primary-foreground/80">
              <div className="h-2 w-2 bg-secondary rounded-full animate-pulse" />
              <span>Active & Ready to Withdraw</span>
            </div>
          </div>

          {/* -------- BOTTOM SECTION -------- */}
          <div className="p-4 sm:p-6 space-y-5 bg-background w-full">

            {/* PAYMENT METHOD */}
            <div className="bg-muted/50 border border-border/60 rounded-xl p-4 sm:p-5 space-y-4">

              <div className="flex items-center gap-3 min-w-0">
                {wallet.withdrawal_method === "mpesa" && (
                  <div className="h-10 w-10 bg-background border border-border rounded-lg flex items-center justify-center">
                    <img src="/mpesa.svg" alt="Mpesa" className="h-6 w-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Withdrawal Method</p>
                  <p className="text-sm font-semibold truncate">
                    {wallet.withdrawal_method === "mpesa" ? "M-Pesa" : "Paybill"}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/40 pt-3 space-y-3">

                {wallet.withdrawal_method === "paybill" && wallet.paybill_number && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-xs text-muted-foreground">Paybill Number</span>
                    <span className="text-sm font-mono font-semibold break-all">
                      {wallet.paybill_number.replace(/^(.{1})(.*)(.{1})$/, (_, a, b, c) =>
                        `${a}${"*".repeat(b.length)}${c}`
                      )}
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-xs text-muted-foreground">Account Number</span>
                  <span className="text-sm font-mono font-semibold break-all">
                    {wallet.account_number.replace(/^(.{2})(.*)(.{4})$/, (_, a, b, c) =>
                      `${a}${"*".repeat(b.length)}${c}`
                    )}
                  </span>
                </div>

              </div>
            </div>

            {/* -------- BUTTONS (Fully Responsive) -------- */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Button
                className="w-full sm:flex-1 h-11 sm:h-12 font-semibold rounded-xl shadow-sm hover:shadow-md"
                onClick={withdraw}
              >
                Withdraw Funds
              </Button>

              <Button
                variant="outline"
                className="w-full sm:flex-1 h-11 sm:h-12 border-2 rounded-xl font-semibold"
                onClick={editWallet}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit Method
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* -------- SETUP STATE -------- */
        <div className="p-6 sm:p-8 text-center space-y-5 bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground flex flex-col items-center justify-center min-h-[240px]">

          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>

          <h3 className="text-lg sm:text-xl font-bold">Setup Your Wallet</h3>
          <p className="text-xs sm:text-sm opacity-90 max-w-xs mx-auto">
            Configure your withdrawal method to start receiving your earnings
          </p>

          <Button
            className="bg-background text-primary rounded-xl px-6 h-11 sm:h-12 w-full sm:w-auto font-semibold shadow-md"
            onClick={setUpWallet}
          >
            Get Started
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

    {user && isConvexUser(user) && (
      <WalletSetupDialog
        open={showSetupDialog}
        onClose={() => setShowSetupDialog(false)}
        partnerId={partner?._id as Id<"partners">}
        userId={user._id}
      />
    )}

    {partner?._id && wallet && user && isConvexUser(user) && (
      <WithdrawalDialog
        open={withdrawalDialogOpen}
        onClose={() => setWithdrawalDialogOpen(false)}
        wallet={wallet}
        partnerId={partner._id}
        userId={user._id}
      />
    )}

    {wallet && partner?._id && user && isConvexUser(user) && (
      <WalletEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        wallet={wallet}
        partnerId={partner._id}
        userId={user._id}
      />
    )}
  </>
);

}