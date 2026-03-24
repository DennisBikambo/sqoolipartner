
import { useState, useEffect } from "react";
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

// ── Icons ─────────────────────────────────────────────────────────────────────

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground/75">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground/75">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

export default function Wallet({
  activeItem,
  setActiveItem,
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
}) {
  const { user, partner } = useAuth();
  const [showBalance, setShowBalance] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  function handleShowBalance() {
    if (!wallet) return;
    setPinDialogOpen(true);
  }

  function setUpWallet() {
    if (activeItem === "wallet") setShowSetupDialog(true);
    else setActiveItem("wallet");
  }

  function withdraw() {
    if (!wallet) { toast.error("Wallet not available."); return; }
    if (!wallet.is_setup_complete) { toast.error("Wallet is not set up yet."); setShowSetupDialog(true); return; }
    setWithdrawalDialogOpen(true);
  }

  function editWallet() {
    if (!wallet) { toast.error("Wallet not available."); return; }
    if (!wallet.is_setup_complete) { toast.error("Please setup your wallet first."); setShowSetupDialog(true); return; }
    setEditDialogOpen(true);
  }

  const isActive = wallet?.is_setup_complete === true;

  // Skeleton while loading
  if (partner && wallet === undefined) {
    return (
      <div className="flex rounded-2xl overflow-hidden border border-border h-[110px]">
        <div className="w-[220px] bg-muted shrink-0 animate-pulse" />
        <div className="flex-1 bg-card px-[22px] flex flex-col justify-center gap-2">
          <div className="h-[10px] w-[80px] rounded bg-muted animate-pulse" />
          <div className="h-[12px] w-[140px] rounded bg-muted animate-pulse" />
          <div className="h-[10px] w-[110px] rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Card ── */}
      <div className="flex rounded-2xl overflow-hidden border border-border h-[110px]">
        {/* LEFT half */}
        {isActive ? (
          <div className="relative w-[220px] shrink-0 overflow-hidden bg-gradient-to-br from-primary to-primary/70">
            <div className="absolute inset-0 z-[1] flex flex-col justify-center px-[18px] gap-[6px]">
              <span className="text-[11px] font-medium text-primary-foreground/85">
                Wallet Balance
              </span>
              <div className="flex items-center gap-[6px]">
                <span className="text-[22px] font-bold text-primary-foreground leading-none">
                  {showBalance
                    ? `KES ${(wallet?.balance ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
                    : "KES ••••••"}
                </span>
                <button
                  className="bg-transparent border-none p-0 cursor-pointer leading-none mt-px"
                  onClick={handleShowBalance}
                >
                  {showBalance ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-[45px] top-1/2 -translate-y-1/2 w-[130px] h-[130px] rounded-full bg-white/20 z-0" />
            <div className="absolute -right-[16px] top-1/2 -translate-y-1/2 w-[78px] h-[78px] rounded-full bg-white/[0.13] z-0" />
          </div>
        ) : (
          <div className="relative w-[220px] shrink-0 overflow-hidden bg-muted">
            <div className="absolute inset-0 z-[1] flex flex-col justify-center px-[18px] gap-[6px]">
              <span className="text-[11px] font-medium text-muted-foreground">Wallet Balance</span>
              <span className="text-[22px] font-bold text-foreground leading-none">KES 0.00</span>
            </div>
            <div className="absolute -right-[45px] top-1/2 -translate-y-1/2 w-[130px] h-[130px] rounded-full bg-muted-foreground/30 z-0" />
            <div className="absolute -right-[16px] top-1/2 -translate-y-1/2 w-[78px] h-[78px] rounded-full bg-muted-foreground/20 z-0 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className="text-muted-foreground ml-[18px]">
                <rect x="5" y="11" width="14" height="10" rx="2"/>
                <path d="M8 11V7a4 4 0 018 0v4"/>
              </svg>
            </div>
          </div>
        )}

        {/* RIGHT half */}
        <div className="flex-1 bg-card flex flex-col justify-center px-[22px] gap-1">
          {isActive ? (
            <>
              <span className="text-[11px] text-muted-foreground">Saved Method:</span>

              {/* Method logo + label row */}
              <div className="flex items-center gap-[6px]">
                {wallet?.withdrawal_method === "bank" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                    <rect x="3" y="10" width="18" height="11" rx="1"/>
                    <path d="M12 2L2 7h20L12 2z"/>
                    <line x1="7" y1="10" x2="7" y2="21"/>
                    <line x1="12" y1="10" x2="12" y2="21"/>
                    <line x1="17" y1="10" x2="17" y2="21"/>
                  </svg>
                ) : (
                  <img src="/mpesa.svg" alt="M-Pesa" className="h-4 w-auto shrink-0" />
                )}

                <span className="text-[12px] text-foreground font-medium">
                  {wallet?.withdrawal_method === "mpesa" && "M-Pesa"}
                  {wallet?.withdrawal_method === "paybill" && (
                    <>
                      Paybill:{" "}
                      {wallet.paybill_number
                        ? wallet.paybill_number.replace(/^(.)(.*)(.{1})$/, (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`)
                        : ""}
                    </>
                  )}
                  {wallet?.withdrawal_method === "bank" && (wallet.bank_name ?? "Bank")}
                </span>
              </div>

              {/* Secondary detail row */}
              <span className="text-[11px] text-muted-foreground">
                {wallet?.withdrawal_method === "bank" ? "Account" : "Account No"}:{" "}
                {wallet?.account_number
                  ? wallet.account_number.replace(/^(.{2})(.*)(.{4})$/, (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`)
                  : ""}
                {wallet?.withdrawal_method === "bank" && wallet?.branch ? ` · ${wallet.branch}` : ""}
              </span>

              <div className="mt-1 flex gap-2">
                <button
                  onClick={withdraw}
                  className="bg-primary border-none text-primary-foreground text-[11px] font-semibold py-1 px-4 rounded-full cursor-pointer"
                >
                  Withdraw
                </button>
                <button
                  onClick={editWallet}
                  className="bg-transparent border border-border text-muted-foreground text-[11px] font-medium py-1 px-3 rounded-full cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-[12px] text-muted-foreground leading-relaxed">
                Activate Wallet to withdraw your earnings.
              </span>
              <div className="mt-[6px]">
                <button
                  onClick={setUpWallet}
                  className="bg-destructive border-none text-white text-[11px] font-semibold py-[5px] px-4 rounded-full cursor-pointer"
                >
                  Activate Wallet
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}
      {wallet && partner && (
        <PinVerificationDialog
          open={pinDialogOpen}
          onClose={() => setPinDialogOpen(false)}
          correctPin={wallet.pin}
          userId={partner._id as Id<"partners">}
          onSuccess={() => setShowBalance(true)}
        />
      )}

      {partner?._id && (
        <WalletSetupDialog
          open={showSetupDialog}
          onClose={() => setShowSetupDialog(false)}
          partnerId={partner._id as Id<"partners">}
          userId={isConvexUser(user) ? user._id : (partner._id as unknown as Id<"users">)}
        />
      )}

      {partner?._id && wallet && (
        <WithdrawalDialog
          open={withdrawalDialogOpen}
          onClose={() => setWithdrawalDialogOpen(false)}
          wallet={wallet}
          partnerId={partner._id}
          userId={isConvexUser(user) ? user._id : (partner._id as unknown as Id<"users">)}
        />
      )}

      {wallet && partner?._id && (
        <WalletEditDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          wallet={wallet}
          partnerId={partner._id}
          userId={isConvexUser(user) ? user._id : (partner._id as unknown as Id<"users">)}
        />
      )}
    </>
  );
}
