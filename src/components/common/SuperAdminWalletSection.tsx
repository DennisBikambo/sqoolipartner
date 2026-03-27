
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "../ui/skeleton";
import { useConvexQuery } from "../../hooks/useConvexQuery";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "../ui/dialog";
import {
  Search,
  Eye,
  Wallet as WalletIcon,
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  Copy,
  DollarSign,
  AlertTriangle,
  XIcon,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed:  { label: "Completed",  className: "bg-secondary/10 text-secondary" },
    pending:    { label: "Pending",    className: "bg-chart-3/10 text-chart-3" },
    processing: { label: "Processing", className: "bg-primary/10 text-primary" },
    failed:     { label: "Failed",     className: "bg-destructive/10 text-destructive" },
    cancelled:  { label: "Cancelled",  className: "bg-destructive/10 text-destructive" },
    Success:    { label: "Success",    className: "bg-secondary/10 text-secondary" },
  };
  const { label, className } = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function TableSkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3.5">
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
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-1">
            <Icon className="h-5 w-5 opacity-40" />
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </td>
    </tr>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "bg-primary/10 text-primary",
  highlight = false,
  loading = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  highlight?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <Skeleton className="h-8 w-8 rounded-xl mb-4" />
        <Skeleton className="h-6 w-20 mb-1.5" />
        <Skeleton className="h-3.5 w-14" />
      </div>
    );
  }
  return (
    <div className={`bg-card border rounded-2xl p-5 flex flex-col gap-4 transition-all hover:shadow-sm ${highlight ? "border-chart-3/40 bg-chart-3/[0.03]" : "border-border"}`}>
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground tracking-tight leading-none tabular-nums">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</p>
        {sub && <p className={`text-[11px] mt-0.5 font-semibold ${highlight ? "text-chart-3" : "text-muted-foreground/70"}`}>{sub}</p>}
      </div>
    </div>
  );
}

export default function SuperAdminWalletSection() {
  const [searchQuery, setSearchQuery]               = useState("");
  const [activeTab, setActiveTab]                   = useState<"wallets" | "transactions" | "withdrawals">("wallets");
  const [selectedWallet, setSelectedWallet]         = useState<Doc<"wallets"> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen]           = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Doc<"withdrawals"> | null>(null);
  const [isApprovalOpen, setIsApprovalOpen]         = useState(false);
  const [isRejectOpen, setIsRejectOpen]             = useState(false);
  const [isProcessing, setIsProcessing]             = useState(false);
  const [mpesaReceipt, setMpesaReceipt]             = useState("");
  const [rejectReason, setRejectReason]             = useState("");

  const rawWallets      = useQuery(api.wallet.getAllWallets);
  const rawTransactions = useQuery(api.transactions.getAllTransactions);
  const rawWithdrawals  = useQuery(api.withdrawals.getAllWithdrawals);
  const rawPartners     = useQuery(api.partner.getAllPartners);

  const { data: wallets,        isLoading: walletsLoading      } = useConvexQuery("admin_wallets",      rawWallets);
  const { data: allTxns,        isLoading: txnsLoading         } = useConvexQuery("admin_transactions", rawTransactions);
  const { data: allWithdrawals, isLoading: withdrawalsLoading  } = useConvexQuery("admin_withdrawals",  rawWithdrawals);
  const { data: partners,       isLoading: partnersLoading     } = useConvexQuery("admin_partners",     rawPartners);

  const approveWithdrawal = useMutation(api.withdrawals.approveWithdrawal);
  const rejectWithdrawal  = useMutation(api.withdrawals.rejectWithdrawal);

  const isLoading = walletsLoading || txnsLoading || withdrawalsLoading || partnersLoading;

  const getPartnerName = (id: Id<"partners">) =>
    partners?.find((p) => p._id === id)?.name ?? "Unknown";

  const metrics = useMemo(() => {
    if (!wallets || !allWithdrawals || !allTxns) return null;
    const pending = allWithdrawals.filter((w: Doc<"withdrawals">) => w.status === "pending");
    return {
      totalWallets:     wallets.length,
      totalBalance:     wallets.reduce((s, w) => s + w.balance, 0),
      lifetimeEarnings: wallets.reduce((s, w) => s + w.lifetime_earnings, 0),
      pendingCount:     pending.length,
      pendingAmount:    pending.reduce((s: number, w: Doc<"withdrawals">) => s + w.amount, 0),
      totalTxns:        allTxns.filter((t) => t.status === "Success").length,
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
      await rejectWithdrawal({
        withdrawal_id: selectedWithdrawal._id,
        reason: rejectReason.trim() || "Rejected by admin",
      });
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
    <div className="min-h-full bg-muted/20">

      {/* ── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 rounded-md bg-secondary/15 flex items-center justify-center mt-0.5">
            <WalletIcon className="h-3 w-3 text-secondary" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Finance</span>
            <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Wallet Management</h1>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── METRIC CARDS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={WalletIcon}
            label="Total Wallets"
            value={isLoading || !metrics ? "—" : metrics.totalWallets}
            accent="bg-primary/10 text-primary"
            loading={isLoading && !metrics}
          />
          <MetricCard
            icon={DollarSign}
            label="Total Balance"
            value={isLoading || !metrics ? "—" : formatCurrency(metrics.totalBalance)}
            accent="bg-secondary/10 text-secondary"
            loading={isLoading && !metrics}
          />
          <MetricCard
            icon={TrendingUp}
            label="Lifetime Earnings"
            value={isLoading || !metrics ? "—" : formatCurrency(metrics.lifetimeEarnings)}
            accent="bg-chart-4/10 text-chart-4"
            loading={isLoading && !metrics}
          />
          <MetricCard
            icon={Clock}
            label="Pending Withdrawals"
            value={isLoading || !metrics ? "—" : metrics.pendingCount}
            sub={metrics && metrics.pendingCount > 0 ? formatCurrency(metrics.pendingAmount) : undefined}
            accent={metrics && metrics.pendingCount > 0 ? "bg-chart-3/15 text-chart-3" : "bg-muted text-muted-foreground"}
            highlight={!!metrics && metrics.pendingCount > 0}
            loading={isLoading && !metrics}
          />
        </div>

        {/* ── PENDING ALERT ────────────────────────────────────────────────── */}
        {metrics && metrics.pendingCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-chart-3/8 border border-chart-3/25 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-chart-3 shrink-0" />
            <p className="text-sm text-foreground flex-1">
              <span className="font-semibold text-chart-3">{metrics.pendingCount} withdrawal{metrics.pendingCount !== 1 ? "s" : ""}</span>
              {" "}awaiting approval · total{" "}
              <span className="font-semibold">{formatCurrency(metrics.pendingAmount)}</span>
            </p>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className="text-xs font-bold text-chart-3 hover:text-chart-3/80 shrink-0 transition-colors"
            >
              Review →
            </button>
          </div>
        )}

        {/* ── TABLE CARD ────────────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
            {/* Tabs */}
            <div className="flex gap-0">
              {tabs.map(({ key, label, badge }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={[
                    "flex items-center gap-1.5 py-1.5 px-3 mr-1 rounded-lg text-sm font-semibold transition-colors",
                    activeTab === key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {label}
                  {badge !== undefined && (
                    <span className={`text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${
                      key === "withdrawals" && (badge ?? 0) > 0
                        ? "bg-chart-3 text-white"
                        : "bg-muted-foreground/15 text-muted-foreground"
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">

            {/* ── WALLETS ── */}
            {activeTab === "wallets" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Partner", "Account No.", "Balance", "Pending", "Lifetime", "Method", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                      <tr key={wallet._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3.5 font-semibold text-foreground">{getPartnerName(wallet.partner_id)}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{wallet.account_number}</td>
                        <td className="px-4 py-3.5 font-bold text-secondary tabular-nums">{formatCurrency(wallet.balance)}</td>
                        <td className="px-4 py-3.5 text-chart-3 tabular-nums">{formatCurrency(wallet.pending_balance)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground tabular-nums">{formatCurrency(wallet.lifetime_earnings)}</td>
                        <td className="px-4 py-3.5 capitalize text-muted-foreground text-xs">{wallet.withdrawal_method}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={wallet.is_setup_complete ? "completed" : "pending"} />
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => { setSelectedWallet(wallet); setIsDetailsOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground opacity-0 group-hover:opacity-100"
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

            {/* ── TRANSACTIONS ── */}
            {activeTab === "transactions" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Partner", "Student", "M-Pesa Code", "Campaign", "Amount", "Date", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                        <td className="px-4 py-3.5 font-semibold text-foreground">{getPartnerName(t.partner_id)}</td>
                        <td className="px-4 py-3.5 text-foreground">{t.student_name}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{t.mpesa_code}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{t.campaign_code}</td>
                        <td className="px-4 py-3.5 font-bold tabular-nums">{formatCurrency(t.amount)}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{formatDate(t.created_at)}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* ── WITHDRAWALS ── */}
            {activeTab === "withdrawals" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Partner", "Reference", "Method", "Account", "Amount", "Date", "Status", "Receipt", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                        className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${w.status === "pending" ? "bg-chart-3/[0.03]" : ""}`}
                      >
                        <td className="px-4 py-3.5 font-semibold text-foreground">{getPartnerName(w.partner_id)}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{w.reference_number}</td>
                        <td className="px-4 py-3.5 capitalize text-xs text-muted-foreground">{w.withdrawal_method}</td>
                        <td className="px-4 py-3.5 font-mono text-xs">{w.destination_details.account_number}</td>
                        <td className="px-4 py-3.5 font-bold tabular-nums">{formatCurrency(w.amount)}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{formatDate(w._creationTime)}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={w.status} /></td>
                        <td className="px-4 py-3.5">
                          {w.mpesa_receipt ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-muted-foreground">{w.mpesa_receipt}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(w.mpesa_receipt!); toast.success("Copied"); }}
                                className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
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
        <DialogContent className="max-w-[420px] p-0 overflow-hidden gap-0" showCloseButton={false}>
          {/* Header */}
          <div className="relative flex items-center gap-4 px-6 py-5 border-b border-border">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <WalletIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground leading-tight">
                {selectedWallet ? getPartnerName(selectedWallet.partner_id) : "—"}
              </p>
              {selectedWallet && (
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  {selectedWallet.account_number}
                </p>
              )}
            </div>
            <DialogClose className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-4">
              <XIcon /><span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {selectedWallet && (
            <div className="px-6 py-5 grid grid-cols-3 gap-3">
              {[
                { label: "Balance",   value: formatCurrency(selectedWallet.balance),          className: "text-secondary font-bold" },
                { label: "Pending",   value: formatCurrency(selectedWallet.pending_balance),  className: "text-chart-3" },
                { label: "Lifetime",  value: formatCurrency(selectedWallet.lifetime_earnings), className: "" },
                { label: "Method",    value: selectedWallet.withdrawal_method,                className: "capitalize" },
                { label: "Setup",     value: selectedWallet.is_setup_complete ? "Complete" : "Incomplete",
                  className: selectedWallet.is_setup_complete ? "text-secondary" : "text-muted-foreground" },
                { label: "Type",      value: selectedWallet.withdrawal_method === "mpesa" ? "M-Pesa" : selectedWallet.withdrawal_method, className: "capitalize" },
              ].map(({ label, value, className }) => (
                <div key={label} className="bg-muted/40 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">{label}</p>
                  <p className={`font-semibold text-sm text-foreground ${className}`}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── APPROVAL DIALOG ───────────────────────────────────────────────────── */}
      <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden gap-0" showCloseButton={false}>
          <div className="relative flex items-center gap-3 px-6 py-5 border-b border-border">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">Approve Withdrawal</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enter the M-Pesa receipt number to confirm.</p>
            </div>
            <DialogClose className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-4">
              <XIcon /><span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {selectedWithdrawal && (
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Partner</p>
                  <p className="font-semibold text-foreground">{getPartnerName(selectedWithdrawal.partner_id)}</p>
                </div>
                <div className="bg-secondary/8 border border-secondary/20 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Amount</p>
                  <p className="text-lg font-bold text-secondary tabular-nums">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Method</p>
                  <p className="font-semibold text-foreground capitalize">{selectedWithdrawal.withdrawal_method}</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Account</p>
                  <p className="font-mono text-xs text-foreground">{selectedWithdrawal.destination_details.account_number}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  M-Pesa Receipt <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. QFG7X8J9K2"
                  value={mpesaReceipt}
                  onChange={(e) => setMpesaReceipt(e.target.value)}
                  className="font-mono text-base h-11"
                />
                <p className="text-xs text-muted-foreground">Exact code from M-Pesa confirmation SMS</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end px-6 pb-5">
            <Button variant="outline" onClick={() => setIsApprovalOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing || !mpesaReceipt.trim()}>
              {isProcessing ? "Processing…" : "Approve & Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── REJECT DIALOG ─────────────────────────────────────────────────────── */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-[440px] p-0 overflow-hidden gap-0" showCloseButton={false}>
          <div className="relative flex items-center gap-3 px-6 py-5 border-b border-border">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">Reject Withdrawal</p>
              <p className="text-xs text-muted-foreground mt-0.5">The partner will be notified with your reason.</p>
            </div>
            <DialogClose className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-4">
              <XIcon /><span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {selectedWithdrawal && (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Partner</p>
                  <p className="font-semibold text-foreground text-sm">{getPartnerName(selectedWithdrawal.partner_id)}</p>
                </div>
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Amount</p>
                  <p className="text-lg font-bold text-destructive tabular-nums">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Rejection Reason</label>
                <Textarea
                  placeholder="e.g. Account details could not be verified. Please update your withdrawal account and try again."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Optional — leave blank to use a default message</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end px-6 pb-5">
            <Button variant="outline" onClick={() => setIsRejectOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? "Processing…" : "Confirm Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
