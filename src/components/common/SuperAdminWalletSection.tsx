
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "../ui/skeleton";
import { useConvexQuery } from "../../hooks/useConvexQuery";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Search,
  Eye,
  Wallet as WalletIcon,
  ArrowDownToLine,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "../../utils/formatters";

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-2xl">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ?? 'bg-primary/10'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
        {loading ? (
          <Skeleton className="h-5 w-16 rounded mt-0.5" />
        ) : (
          <p className="text-[15px] font-bold text-foreground leading-tight">{value}</p>
        )}
        {sub && !loading && (
          <p className="text-[10px] text-muted-foreground">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed:  "bg-secondary",
    pending:    "bg-chart-3",
    processing: "bg-primary",
    failed:     "bg-destructive",
    cancelled:  "bg-destructive",
    Success:    "bg-secondary",
  };
  return (
    <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${colors[status] ?? 'bg-muted-foreground'}`} />
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function TableSkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-4 w-full rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <tr>
      <td colSpan={99}>
        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-2">
          <Icon className="h-8 w-8 opacity-25" />
          <p className="text-sm font-medium text-foreground">{title}</p>
          {sub && <p className="text-xs">{sub}</p>}
        </div>
      </td>
    </tr>
  );
}

export default function SuperAdminWalletSection() {
  const [searchQuery, setSearchQuery]           = useState("");
  const [activeTab, setActiveTab]               = useState<"wallets" | "transactions" | "withdrawals">("wallets");
  const [selectedWallet, setSelectedWallet]     = useState<Doc<"wallets"> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen]       = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Doc<"withdrawals"> | null>(null);
  const [isApprovalOpen, setIsApprovalOpen]     = useState(false);
  const [isRejectOpen, setIsRejectOpen]         = useState(false);
  const [isProcessing, setIsProcessing]         = useState(false);
  const [mpesaReceipt, setMpesaReceipt]         = useState("");
  const [rejectReason, setRejectReason]         = useState("");

  const rawWallets      = useQuery(api.wallet.getAllWallets);
  const rawTransactions = useQuery(api.transactions.getAllTransactions);
  const rawWithdrawals  = useQuery(api.withdrawals.getAllWithdrawals);
  const rawPartners     = useQuery(api.partner.getAllPartners);

  const { data: wallets,      isLoading: walletsLoading      } = useConvexQuery("admin_wallets",      rawWallets);
  const { data: allTxns,      isLoading: txnsLoading         } = useConvexQuery("admin_transactions", rawTransactions);
  const { data: allWithdrawals, isLoading: withdrawalsLoading } = useConvexQuery("admin_withdrawals", rawWithdrawals);
  const { data: partners,     isLoading: partnersLoading     } = useConvexQuery("admin_partners",     rawPartners);

  const approveWithdrawal = useMutation(api.withdrawals.approveWithdrawal);
  const rejectWithdrawal  = useMutation(api.withdrawals.rejectWithdrawal);

  const isLoading = walletsLoading || txnsLoading || withdrawalsLoading || partnersLoading;

  const getPartnerName = (id: Id<"partners">) =>
    partners?.find((p) => p._id === id)?.name ?? "Unknown";

  const metrics = useMemo(() => {
    if (!wallets || !allWithdrawals || !allTxns) return null;
    const pending = allWithdrawals.filter((w: Doc<"withdrawals">) => w.status === "pending");
    return {
      totalWallets:    wallets.length,
      totalBalance:    wallets.reduce((s, w) => s + w.balance, 0),
      lifetimeEarnings: wallets.reduce((s, w) => s + w.lifetime_earnings, 0),
      pendingCount:    pending.length,
      pendingAmount:   pending.reduce((s: number, w: Doc<"withdrawals">) => s + w.amount, 0),
      totalTxns:       allTxns.filter((t) => t.status === "Success").length,
    };
  }, [wallets, allWithdrawals, allTxns]);

  const filteredWallets = useMemo(() => {
    if (!wallets || !partners) return [];
    const q = searchQuery.toLowerCase();
    return wallets.filter((w) => {
      const name = partners.find((p) => p._id === w.partner_id)?.name ?? "";
      return q === "" || w.account_number.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [wallets, partners, searchQuery]);

  const filteredTxns = useMemo(() => {
    if (!allTxns || !partners) return [];
    const q = searchQuery.toLowerCase();
    return allTxns.filter((t) => {
      const name = partners.find((p) => p._id === t.partner_id)?.name ?? "";
      return q === "" || t.student_name.toLowerCase().includes(q) || t.mpesa_code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [allTxns, partners, searchQuery]);

  const filteredWithdrawals = useMemo(() => {
    if (!allWithdrawals || !partners) return [];
    const q = searchQuery.toLowerCase();
    return allWithdrawals.filter((w: Doc<"withdrawals">) => {
      const name = partners.find((p) => p._id === w.partner_id)?.name ?? "";
      return q === "" || w.reference_number.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [allWithdrawals, partners, searchQuery]);

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    if (!mpesaReceipt.trim()) { toast.error("Enter M-Pesa receipt number"); return; }
    setIsProcessing(true);
    try {
      await approveWithdrawal({ withdrawal_id: selectedWithdrawal._id, mpesa_receipt: mpesaReceipt.trim() });
      toast.success("Withdrawal approved");
      setIsApprovalOpen(false);
      setMpesaReceipt("");
    } catch { toast.error("Failed to approve"); }
    finally { setIsProcessing(false); }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;
    setIsProcessing(true);
    try {
      await rejectWithdrawal({ withdrawal_id: selectedWithdrawal._id, reason: rejectReason.trim() || "Rejected by admin" });
      toast.success("Withdrawal rejected");
      setIsRejectOpen(false);
      setRejectReason("");
    } catch { toast.error("Failed to reject"); }
    finally { setIsProcessing(false); }
  };

  const tabs: { key: typeof activeTab; label: string; badge?: number }[] = [
    { key: "wallets",      label: "Wallets",      badge: metrics?.totalWallets },
    { key: "transactions", label: "Transactions", badge: metrics?.totalTxns },
    { key: "withdrawals",  label: "Withdrawals",  badge: metrics?.pendingCount },
  ];

  return (
    <div className="min-h-full bg-muted/30">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-6 pb-5">
        <p className="text-[11px] font-bold tracking-[0.2em] text-primary-foreground/70 uppercase mb-1">
          Finance
        </p>
        <h1 className="text-[22px] font-bold text-primary-foreground leading-none mb-5">Wallet Management</h1>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoading || !metrics ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl bg-primary-foreground/10" />
            ))
          ) : (
            <>
              <div className="bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wide mb-0.5">Wallets</p>
                <p className="text-xl font-bold text-primary-foreground">{metrics.totalWallets}</p>
              </div>
              <div className="bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wide mb-0.5">Total Balance</p>
                <p className="text-xl font-bold text-primary-foreground">{formatCurrency(metrics.totalBalance)}</p>
              </div>
              <div className="bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wide mb-0.5">Lifetime Earnings</p>
                <p className="text-xl font-bold text-primary-foreground">{formatCurrency(metrics.lifetimeEarnings)}</p>
              </div>
              <div className={`border rounded-xl px-4 py-2.5 ${metrics.pendingCount > 0 ? 'bg-chart-3/20 border-chart-3/30' : 'bg-primary-foreground/10 border-primary-foreground/15'}`}>
                <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wide mb-0.5">Pending</p>
                <p className={`text-xl font-bold ${metrics.pendingCount > 0 ? 'text-chart-3' : 'text-primary-foreground'}`}>
                  {metrics.pendingCount}
                </p>
                {metrics.pendingCount > 0 && (
                  <p className="text-[10px] text-chart-3/70">{formatCurrency(metrics.pendingAmount)}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── PENDING ALERT BANNER ─────────────────────────────────────────────── */}
      {metrics && metrics.pendingCount > 0 && (
        <div className="mx-6 mt-5 flex items-center gap-3 px-4 py-3 bg-chart-3/10 border border-chart-3/25 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-chart-3 flex-shrink-0" />
          <p className="text-sm text-foreground flex-1">
            <span className="font-semibold">{metrics.pendingCount} withdrawal{metrics.pendingCount !== 1 ? 's' : ''}</span>
            {' '}need{metrics.pendingCount === 1 ? 's' : ''} your attention ·{' '}
            <span className="text-chart-3 font-medium">{formatCurrency(metrics.pendingAmount)}</span>
          </p>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className="text-xs font-semibold text-chart-3 hover:underline flex-shrink-0"
          >
            Review →
          </button>
        </div>
      )}

      {/* ── SEARCH + TABS ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5">
        <div className="relative mb-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search across all tabs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <div className="bg-card border-b border-border mt-4">
        <div className="flex gap-0 px-6">
          {tabs.map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                'flex items-center gap-2 py-3.5 px-1 mr-6 text-sm font-semibold border-b-2 -mb-px transition-colors',
                activeTab === key
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground',
              ].join(' ')}
            >
              {label}
              {badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  key === 'withdrawals' && (badge ?? 0) > 0
                    ? 'bg-chart-3/15 text-chart-3'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE AREA ────────────────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">

            {/* WALLETS */}
            {activeTab === "wallets" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Partner", "Account", "Balance", "Pending", "Lifetime", "Method", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {walletsLoading || partnersLoading ? (
                    <TableSkeletonRows cols={8} />
                  ) : filteredWallets.length === 0 ? (
                    <EmptyState
                      icon={WalletIcon}
                      title={searchQuery ? "No wallets match your search" : "No wallets yet"}
                      sub="Partner wallets will appear here once created"
                    />
                  ) : (
                    filteredWallets.map((wallet) => (
                      <tr key={wallet._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{getPartnerName(wallet.partner_id)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{wallet.account_number}</td>
                        <td className="px-4 py-3 font-semibold text-secondary">{formatCurrency(wallet.balance)}</td>
                        <td className="px-4 py-3 text-chart-3">{formatCurrency(wallet.pending_balance)}</td>
                        <td className="px-4 py-3">{formatCurrency(wallet.lifetime_earnings)}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground text-xs">{wallet.withdrawal_method}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${wallet.is_setup_complete ? 'text-secondary' : 'text-muted-foreground'}`}>
                            <StatusDot status={wallet.is_setup_complete ? 'completed' : 'pending'} />
                            {wallet.is_setup_complete ? 'Complete' : 'Incomplete'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setSelectedWallet(wallet); setIsDetailsOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* TRANSACTIONS */}
            {activeTab === "transactions" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Partner", "Student", "M-Pesa Code", "Campaign", "Amount", "Date", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txnsLoading || partnersLoading ? (
                    <TableSkeletonRows cols={7} />
                  ) : filteredTxns.length === 0 ? (
                    <EmptyState
                      icon={DollarSign}
                      title={searchQuery ? "No transactions match your search" : "No transactions yet"}
                      sub="Transactions appear here once payments are processed"
                    />
                  ) : (
                    filteredTxns.map((t) => (
                      <tr key={t._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{getPartnerName(t.partner_id)}</td>
                        <td className="px-4 py-3">{t.student_name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{t.mpesa_code}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{t.campaign_code}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(t.amount)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(t.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <StatusDot status={t.status} />
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* WITHDRAWALS */}
            {activeTab === "withdrawals" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Partner", "Reference", "Method", "Account", "Amount", "Date", "Status", "Receipt", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsLoading || partnersLoading ? (
                    <TableSkeletonRows cols={9} />
                  ) : filteredWithdrawals.length === 0 ? (
                    <EmptyState
                      icon={ArrowDownToLine}
                      title={searchQuery ? "No withdrawals match your search" : "No withdrawals yet"}
                      sub="Withdrawal requests will appear here"
                    />
                  ) : (
                    filteredWithdrawals.map((w: Doc<"withdrawals">) => (
                      <tr
                        key={w._id}
                        className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${w.status === 'pending' ? 'bg-chart-3/5' : ''}`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{getPartnerName(w.partner_id)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{w.reference_number}</td>
                        <td className="px-4 py-3 capitalize text-xs text-muted-foreground">{w.withdrawal_method}</td>
                        <td className="px-4 py-3 font-mono text-xs">{w.destination_details.account_number}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(w.amount)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(w._creationTime)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize">
                            <StatusDot status={w.status} />
                            {w.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {w.mpesa_receipt ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs">{w.mpesa_receipt}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(w.mpesa_receipt!); toast.success("Copied"); }}
                                className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {w.status === "pending" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => { setSelectedWithdrawal(w); setMpesaReceipt(""); setIsApprovalOpen(true); }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => { setSelectedWithdrawal(w); setRejectReason(""); setIsRejectOpen(true); }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                              >
                                <XCircle className="h-3 w-3" />
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── WALLET DETAILS DIALOG ─────────────────────────────────────────────── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Wallet Details</DialogTitle>
            <DialogDescription>{selectedWallet && getPartnerName(selectedWallet.partner_id)}</DialogDescription>
          </DialogHeader>
          {selectedWallet && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Account Number",   value: selectedWallet.account_number,                          mono: true },
                { label: "Balance",          value: formatCurrency(selectedWallet.balance),                 accent: "text-secondary" },
                { label: "Pending",          value: formatCurrency(selectedWallet.pending_balance),         accent: "text-chart-3" },
                { label: "Lifetime Earnings",value: formatCurrency(selectedWallet.lifetime_earnings) },
                { label: "Method",           value: selectedWallet.withdrawal_method,                       capitalize: true },
                { label: "Setup",            value: selectedWallet.is_setup_complete ? "Complete" : "Incomplete" },
              ].map(({ label, value, mono, accent, capitalize }) => (
                <div key={label}>
                  <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
                  <p className={`font-semibold ${mono ? 'font-mono text-xs' : ''} ${accent ?? ''} ${capitalize ? 'capitalize' : ''}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── APPROVAL DIALOG ───────────────────────────────────────────────────── */}
      <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>Enter the M-Pesa receipt number to confirm this payment.</DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-xl text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Partner</p>
                  <p className="font-medium">{getPartnerName(selectedWithdrawal.partner_id)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Amount</p>
                  <p className="font-bold text-secondary">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Method</p>
                  <p className="capitalize">{selectedWithdrawal.withdrawal_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Account</p>
                  <p className="font-mono text-xs">{selectedWithdrawal.destination_details.account_number}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">
                  M-Pesa Receipt <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. QFG7X8J9K2"
                  value={mpesaReceipt}
                  onChange={(e) => setMpesaReceipt(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Exact receipt from M-Pesa confirmation SMS</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button onClick={handleApprove} disabled={isProcessing || !mpesaReceipt.trim()}>
              {isProcessing ? "Processing…" : "Approve & Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── REJECT DIALOG ─────────────────────────────────────────────────────── */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>Provide a reason — the partner will see this message.</DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/15 rounded-xl text-sm">
                <span className="text-muted-foreground">{getPartnerName(selectedWithdrawal.partner_id)}</span>
                <span className="font-bold text-destructive">{formatCurrency(selectedWithdrawal.amount)}</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Rejection Reason</label>
                <Textarea
                  placeholder="e.g. Account details could not be verified. Please update your withdrawal account and try again."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? "Processing…" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
