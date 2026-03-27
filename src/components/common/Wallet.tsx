
import { useState, useEffect, useRef } from "react";
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

const EyeOffIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const EyeIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="5"  r="1.5" fill="rgba(255,255,255,0.85)"/>
    <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.85)"/>
    <circle cx="12" cy="19" r="1.5" fill="rgba(255,255,255,0.85)"/>
  </svg>
);

const WithdrawIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const BankIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="text-muted-foreground shrink-0">
    <rect x="3" y="10" width="18" height="11" rx="1"/>
    <path d="M12 2L2 7h20L12 2z"/>
    <line x1="7" y1="10" x2="7" y2="21"/>
    <line x1="12" y1="10" x2="12" y2="21"/>
    <line x1="17" y1="10" x2="17" y2="21"/>
  </svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADIENT = "linear-gradient(135deg, #7B9EEA 0%, #5E7AE0 35%, #5FA3E2 100%)";
const BOTTOM_BG = "#E1EEFA";

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskAccount(str: string) {
  return str.replace(/^(.{2})(.*)(.{4})$/, (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`);
}
function maskPaybill(str: string) {
  return str.replace(/^(.)(.*)(.{1})$/, (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`);
}
function fmtKes(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GradientSection({
  wallet,
  isActive,
  showBalance,
  onToggleBalance,
  compact = false,
}: {
  wallet?: Doc<"wallets">;
  isActive: boolean;
  showBalance: boolean;
  onToggleBalance: () => void;
  compact?: boolean;
}) {
  return (
    <div
      style={{ background: isActive ? GRADIENT : "#94a3b8", position: "relative", overflow: "hidden" }}
      className={compact ? "px-[18px] py-4 flex flex-col justify-center h-full" : "p-4 pb-5 min-h-[155px]"}
    >
      {/* Decorative circles */}
      <div style={{
        position: "absolute", right: "-50px", top: "50%", transform: "translateY(-50%)",
        width: "160px", height: "160px", borderRadius: "50%",
        background: "rgba(255,255,255,0.15)", zIndex: 0,
      }}/>
      <div style={{
        position: "absolute", right: "-18px", top: "50%", transform: "translateY(-50%)",
        width: "100px", height: "100px", borderRadius: "50%",
        background: "rgba(255,255,255,0.10)", zIndex: 0,
      }}/>

      {/* A/C + 3-dot */}
      <div style={{ position: "relative", zIndex: 1 }}
        className="flex items-center justify-between mb-3">
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
          {wallet?.account_number
            ? `A/C ${maskAccount(wallet.account_number)}`
            : "A/C ——"}
        </span>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", lineHeight: 0 }}>
          <DotsIcon />
        </button>
      </div>

      {/* Available Balance */}
      <div style={{ position: "relative", zIndex: 1 }} className="mb-2">
        <p style={{ margin: "0 0 2px", fontSize: "11px", color: "rgba(255,255,255,0.8)", fontWeight: 400 }}>
          Available Balance
        </p>
        <p style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          {isActive && showBalance ? fmtKes(wallet?.balance ?? 0) : "KES ••••"}
        </p>
      </div>

      {/* Actual Balance = balance + pending_balance */}
      {!compact && (
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ margin: "0 0 2px", fontSize: "11px", color: "rgba(255,255,255,0.8)", fontWeight: 400 }}>
            Actual Balance
          </p>
          <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
            {isActive && showBalance
              ? fmtKes((wallet?.balance ?? 0) + (wallet?.pending_balance ?? 0))
              : "KES ••••••"}
          </p>
        </div>
      )}

      {/* Eye toggle — bottom right */}
      <button
        style={{ position: "absolute", bottom: "14px", right: "14px", zIndex: 1,
          background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
        onClick={onToggleBalance}
      >
        {showBalance ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function InfoSection({
  wallet,
  isActive,
  onWithdraw,
  onEdit,
  onActivate,
  row = false,
  hideEdit = false,
}: {
  wallet?: Doc<"wallets">;
  isActive: boolean;
  onWithdraw: () => void;
  onEdit: () => void;
  onActivate: () => void;
  row?: boolean;
  hideEdit?: boolean;
}) {
  return (
    <div style={{ background: BOTTOM_BG }}
      className={row ? "flex-1 flex flex-col justify-center px-[22px] py-4" : "px-4 pb-[18px] pt-4"}>
      {isActive ? (
        <>
          <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 600, color: "#374151" }}>
            Saved Method:
          </p>
          <div className="flex items-center gap-[7px] mb-[3px]">
            {wallet?.withdrawal_method === "bank" ? (
              <BankIcon />
            ) : (
              <img src="/mpesa.svg" alt="M-Pesa" className="h-[18px] w-auto shrink-0" />
            )}
            <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>
              {wallet?.withdrawal_method === "mpesa" && "M-Pesa"}
              {wallet?.withdrawal_method === "paybill" && `Paybill: ${wallet.paybill_number ? maskPaybill(wallet.paybill_number) : ""}`}
              {wallet?.withdrawal_method === "bank" && (wallet.bank_name ?? "Bank")}
            </span>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: "11px", color: "#6b7280", paddingLeft: "35px" }}>
            Account No: {wallet?.account_number ? maskAccount(wallet.account_number) : "—"}
            {wallet?.withdrawal_method === "bank" && wallet?.branch ? ` · ${wallet.branch}` : ""}
          </p>
          <div className="flex gap-[10px]">
            <button
              onClick={onWithdraw}
              style={{
                flex: hideEdit ? "0 0 auto" : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                background: "#3b82f6", color: "#fff", border: "none",
                borderRadius: "10px", padding: "9px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              }}
            >
              <WithdrawIcon /> Withdraw
            </button>
            {!hideEdit && (
              <button
                onClick={onEdit}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb",
                  borderRadius: "10px", padding: "9px 0", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                }}
              >
                <EditIcon /> Edit
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#6b7280" }}>
            Activate your wallet to start withdrawing earnings.
          </p>
          <button
            onClick={onActivate}
            style={{
              alignSelf: "flex-start",
              background: "#ef4444", color: "#fff", border: "none",
              borderRadius: "10px", padding: "9px 18px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Activate Wallet
          </button>
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Wallet({
  activeItem,
  setActiveItem,
  variant = "horizontal",
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
  variant?: "horizontal" | "vertical";
}) {
  const { user, partner, loading: authLoading } = useAuth();
  const [showBalance, setShowBalance] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const partnerId = partner?._id as Id<"partners"> | undefined;
  const wallet = useQuery(
    api.wallet.getWalletByPartnerId,
    partnerId ? { partner_id: partnerId } : "skip"
  ) as Doc<"wallets"> | null | undefined;

  // Cache the last known real wallet doc so a transient null (stale Convex
  // cache) never flips the card back to the "activate" state.
  const lastGoodWallet = useRef<Doc<"wallets"> | undefined>(undefined);
  if (wallet != null) lastGoodWallet.current = wallet;
  // displayWallet: use real doc when present; fall back to cached doc when null;
  // remain undefined (→ skeleton) until we've seen at least one real value.
  const displayWallet = wallet != null ? wallet : lastGoodWallet.current;

  useEffect(() => {
    if (showBalance) {
      const timer = setTimeout(() => setShowBalance(false), 3 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [showBalance]);

  function handleToggleBalance() {
    if (!wallet) return;
    if (!showBalance) setPinDialogOpen(true);
    else setShowBalance(false);
  }

  function handleActivate() {
    if (activeItem === "wallet") setShowSetupDialog(true);
    else setActiveItem("wallet");
  }

  function handleWithdraw() {
    if (!wallet) { toast.error("Wallet not available."); return; }
    if (!wallet.is_setup_complete) { toast.error("Wallet is not set up yet."); setShowSetupDialog(true); return; }
    setWithdrawalDialogOpen(true);
  }

  function handleEdit() {
    if (!wallet) { toast.error("Wallet not available."); return; }
    if (!wallet.is_setup_complete) { toast.error("Please setup your wallet first."); setShowSetupDialog(true); return; }
    setEditDialogOpen(true);
  }

  const isActive = displayWallet != null && displayWallet.is_setup_complete === true;

  // ── Skeleton ──────────────────────────────────────────────────────────────
  // Show skeleton only while the query is still in-flight (wallet === undefined).
  // wallet === null means "loaded, no wallet exists" → fall through to show the activate card.

  if (authLoading || !partner || wallet === undefined) {
    if (variant === "vertical") {
      return (
        <div style={{ borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 20px rgba(94,122,224,0.25)" }}>
          <div className="h-[155px] bg-muted animate-pulse" />
          <div style={{ background: BOTTOM_BG }} className="p-4 space-y-3">
            <div className="h-3 w-24 rounded bg-muted/60 animate-pulse" />
            <div className="h-3 w-40 rounded bg-muted/60 animate-pulse" />
            <div className="h-9 rounded-[10px] bg-muted/60 animate-pulse" />
          </div>
        </div>
      );
    }
    return (
      <div style={{ borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 20px rgba(94,122,224,0.25)" }}
        className="flex h-[110px]">
        <div className="w-[240px] bg-muted shrink-0 animate-pulse" />
        <div style={{ background: BOTTOM_BG }} className="flex-1 animate-pulse" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const sharedGradientProps = { wallet: displayWallet, isActive, showBalance, onToggleBalance: handleToggleBalance };
  const sharedInfoProps = { wallet: displayWallet, isActive, onWithdraw: handleWithdraw, onEdit: handleEdit, onActivate: handleActivate };

  return (
    <>
      {variant === "vertical" ? (
        <div style={{ borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 20px rgba(94,122,224,0.25)" }}>
          <GradientSection {...sharedGradientProps} />
          <InfoSection {...sharedInfoProps} />
        </div>
      ) : (
        <div style={{ borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 20px rgba(94,122,224,0.25)" }}
          className="flex h-[140px]">
          <div className="w-[260px] shrink-0 h-full">
            <GradientSection {...sharedGradientProps} compact />
          </div>
          <InfoSection {...sharedInfoProps} row hideEdit />
        </div>
      )}

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
