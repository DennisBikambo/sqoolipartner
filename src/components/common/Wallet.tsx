
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <div style={{
        display: "flex", borderRadius: "16px", overflow: "hidden",
        border: "1px solid #e5e7eb", height: "110px",
      }}>
        <div style={{ width: "220px", background: "#e5e7eb", flexShrink: 0 }} className="animate-pulse" />
        <div style={{ flex: 1, background: "#fff", padding: "0 22px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px" }}>
          <div style={{ height: "10px", width: "80px", borderRadius: "4px" }} className="bg-gray-100 animate-pulse" />
          <div style={{ height: "12px", width: "140px", borderRadius: "4px" }} className="bg-gray-100 animate-pulse" />
          <div style={{ height: "10px", width: "110px", borderRadius: "4px" }} className="bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Card ── */}
      <div style={{
        display: "flex",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        height: "110px",
      }}>
        {/* LEFT half */}
        {isActive ? (
          <div style={{
            position: "relative", width: "220px", flexShrink: 0, overflow: "hidden",
            background: "linear-gradient(135deg, #5E7AE0 0%, #5FA3E2 100%)",
          }}>
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              display: "flex", flexDirection: "column", justifyContent: "center",
              padding: "0 18px", gap: "6px",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
                Wallet Balance
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "22px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                  {showBalance
                    ? `KES ${(wallet?.balance ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
                    : "KES ••••••"}
                </span>
                <button
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0, marginTop: "1px" }}
                  onClick={handleShowBalance}
                >
                  {showBalance ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {/* Decorative circles */}
            <div style={{
              position: "absolute", right: "-45px", top: "50%", transform: "translateY(-50%)",
              width: "130px", height: "130px", borderRadius: "50%",
              background: "rgba(255,255,255,0.2)", zIndex: 0,
            }}/>
            <div style={{
              position: "absolute", right: "-16px", top: "50%", transform: "translateY(-50%)",
              width: "78px", height: "78px", borderRadius: "50%",
              background: "rgba(255,255,255,0.13)", zIndex: 0,
            }}/>
          </div>
        ) : (
          <div style={{
            position: "relative", width: "220px", flexShrink: 0,
            overflow: "hidden", background: "#e5e7eb",
          }}>
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              display: "flex", flexDirection: "column", justifyContent: "center",
              padding: "0 18px", gap: "6px",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#9ca3af" }}>Wallet Balance</span>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#374151", lineHeight: 1 }}>KES 0.00</span>
            </div>
            <div style={{
              position: "absolute", right: "-45px", top: "50%", transform: "translateY(-50%)",
              width: "130px", height: "130px", borderRadius: "50%",
              background: "rgba(156,163,175,0.3)", zIndex: 0,
            }}/>
            <div style={{
              position: "absolute", right: "-16px", top: "50%", transform: "translateY(-50%)",
              width: "78px", height: "78px", borderRadius: "50%",
              background: "rgba(156,163,175,0.22)", zIndex: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"
                style={{ marginLeft: "18px" }}>
                <rect x="5" y="11" width="14" height="10" rx="2"/>
                <path d="M8 11V7a4 4 0 018 0v4"/>
              </svg>
            </div>
          </div>
        )}

        {/* RIGHT half */}
        <div style={{
          flex: 1, background: "#fff",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 22px", gap: "4px",
        }}>
          {isActive ? (
            <>
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>Saved Method:</span>

              {/* Method logo + label row */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {wallet?.withdrawal_method === "bank" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="10" width="18" height="11" rx="1"/>
                    <path d="M12 2L2 7h20L12 2z"/>
                    <line x1="7" y1="10" x2="7" y2="21"/>
                    <line x1="12" y1="10" x2="12" y2="21"/>
                    <line x1="17" y1="10" x2="17" y2="21"/>
                  </svg>
                ) : (
                  <img src="/mpesa.svg" alt="M-Pesa" style={{ height: "16px", width: "auto", flexShrink: 0 }} />
                )}

                <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>
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
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                {wallet?.withdrawal_method === "bank" ? "Account" : "Account No"}:{" "}
                {wallet?.account_number
                  ? wallet.account_number.replace(/^(.{2})(.*)(.{4})$/, (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`)
                  : ""}
                {wallet?.withdrawal_method === "bank" && wallet?.branch ? ` · ${wallet.branch}` : ""}
              </span>

              <div style={{ marginTop: "4px", display: "flex", gap: "8px" }}>
                <button
                  onClick={withdraw}
                  style={{
                    background: "#3b82f6", border: "none", color: "#fff",
                    fontSize: "11px", fontWeight: 600,
                    padding: "4px 16px", borderRadius: "999px", cursor: "pointer",
                  }}
                >
                  Withdraw
                </button>
                <button
                  onClick={editWallet}
                  style={{
                    background: "none", border: "1px solid #e5e7eb", color: "#6b7280",
                    fontSize: "11px", fontWeight: 500,
                    padding: "4px 12px", borderRadius: "999px", cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.5 }}>
                Activate Wallet to withdraw your earnings.
              </span>
              <div style={{ marginTop: "6px" }}>
                <button
                  onClick={setUpWallet}
                  style={{
                    background: "#ef4444", border: "none", color: "#fff",
                    fontSize: "11px", fontWeight: 600,
                    padding: "5px 16px", borderRadius: "999px", cursor: "pointer",
                  }}
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
