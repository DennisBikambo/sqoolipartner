import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { WalletSetupDialog } from "./WalletSetUp";
import { PinVerificationDialog } from "./PinVerification";

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

  // Auto-hide balance after 3 minutes
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

  // Show loading state while wallet is being fetched
  if (partner && wallet === undefined) {
    return (
      <Card className="border border-muted p-4 sm:p-6 rounded-2xl">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="h-20 bg-muted animate-pulse rounded-xl" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
            <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-muted p-4 sm:p-6 rounded-2xl">
        {wallet && wallet.is_setup_complete ? (
          <>
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm opacity-80">Wallet Balance</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 select-none truncate">
                  {showBalance
                    ? `KES ${wallet.balance.toLocaleString()}`
                    : "KES ••••••••"}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                onClick={handleShowBalance}
              >
                {showBalance ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>

            <div className="mt-4 rounded-xl p-3 bg-muted/30">
              <p className="text-xs sm:text-sm font-medium flex items-center gap-2 flex-wrap">
                {wallet.withdrawal_method === "mpesa" && (
                  <img src="/mpesa.svg" alt="mpesa" className="h-8 w-8 sm:h-12 sm:w-12" />
                )}
                Saved Method:
                <span className="capitalize ml-1">
                  {wallet.withdrawal_method}
                </span>
              </p>

              <p className="text-xs sm:text-sm mt-2 break-all">
                {wallet.withdrawal_method === "paybill" && (
                  <>
                    Paybill:{" "}
                    <span className="font-semibold">
                      {wallet.paybill_number || "—"}
                    </span>
                    <br />
                  </>
                )}
                Account No:{" "}
                <span className="font-semibold">
                  {wallet.account_number.replace(
                    /^(.{2})(.*)(.{4})$/,
                    (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`
                  )}
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button className="flex-1 bg-background text-primary hover:bg-muted text-sm sm:text-base">
                Withdraw
              </Button>
              <Button
                className="flex-1 bg-muted text-destructive hover:bg-destructive/90 text-sm sm:text-base"
                onClick={setUpWallet}
              >
                Edit
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4 sm:py-6">
            <p className="text-xs sm:text-sm text-muted-foreground px-2">
              Setup wallet to withdraw your earnings
            </p>
            <Button
              className="mt-3 bg-muted text-destructive hover:bg-destructive/90 text-sm sm:text-base"
              variant="outline"
              onClick={setUpWallet}
            >
              Setup Wallet
            </Button>
          </div>
        )}
      </Card>

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