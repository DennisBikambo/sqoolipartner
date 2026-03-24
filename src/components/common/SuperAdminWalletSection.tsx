
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "../ui/skeleton";
import { useConvexQuery } from "../../hooks/useConvexQuery";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
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
  Users,
  TrendingUp,
  Ban,
} from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "../../utils/formatters";

export default function SuperAdminWalletSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"wallets" | "transactions" | "withdrawals">("wallets");
  const [selectedWallet, setSelectedWallet] = useState<Doc<"wallets"> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Doc<"withdrawals"> | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpesaReceipt, setMpesaReceipt] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Fetch all data
  const rawWallets = useQuery(api.wallet.getAllWallets);
  const rawAllTransactions = useQuery(api.transactions.getAllTransactions);
  const rawAllWithdrawals = useQuery(api.withdrawals.getAllWithdrawals);
  const rawPartners = useQuery(api.partner.getAllPartners);

  const { data: wallets, isLoading: walletsLoading } = useConvexQuery("admin_wallets", rawWallets);
  const { data: allTransactions, isLoading: transactionsLoading } = useConvexQuery("admin_transactions", rawAllTransactions);
  const { data: allWithdrawals, isLoading: withdrawalsLoading } = useConvexQuery("admin_withdrawals", rawAllWithdrawals);
  const { data: partners, isLoading: partnersLoading } = useConvexQuery("admin_partners", rawPartners);

  // Mutations
  const approveWithdrawal = useMutation(api.withdrawals.approveWithdrawal);
  const rejectWithdrawal = useMutation(api.withdrawals.rejectWithdrawal);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!wallets || !allWithdrawals || !allTransactions) {
      return {
        totalWallets: 0,
        totalBalance: 0,
        totalPendingBalance: 0,
        totalLifetimeEarnings: 0,
        pendingWithdrawals: 0,
        pendingWithdrawalAmount: 0,
        totalTransactions: 0,
        totalTransactionAmount: 0,
      };
    }

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalPendingBalance = wallets.reduce((sum, w) => sum + w.pending_balance, 0);
    const totalLifetimeEarnings = wallets.reduce((sum, w) => sum + w.lifetime_earnings, 0);

    const pendingWithdrawals = allWithdrawals.filter((w: Doc<"withdrawals">) => w.status === "pending");
    const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum: number, w: Doc<"withdrawals">) => sum + w.amount, 0);

    const verifiedTransactions = allTransactions.filter((t) => t.status === "Success");
    const totalTransactionAmount = verifiedTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalWallets: wallets.length,
      totalBalance,
      totalPendingBalance,
      totalLifetimeEarnings,
      pendingWithdrawals: pendingWithdrawals.length,
      pendingWithdrawalAmount,
      totalTransactions: verifiedTransactions.length,
      totalTransactionAmount,
    };
  }, [wallets, allWithdrawals, allTransactions]);

  // Get partner name helper
  const getPartnerName = (partnerId: Id<"partners">) => {
    const partner = partners?.find((p) => p._id === partnerId);
    return partner?.name || "Unknown Partner";
  };

  // Filter wallets
  const filteredWallets = useMemo(() => {
    if (!wallets || !partners) return [];

    return wallets.filter((wallet) => {
      const partner = partners.find((p) => p._id === wallet.partner_id);
      return (
        searchQuery === "" ||
        wallet.account_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wallet.balance.toString().includes(searchQuery)
      );
    });
  }, [wallets, partners, searchQuery]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!allTransactions || !partners) return [];

    return allTransactions.filter((transaction) => {
      const partner = partners.find((p) => p._id === transaction.partner_id);
      return (
        searchQuery === "" ||
        transaction.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.phone_number.includes(searchQuery) ||
        transaction.mpesa_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [allTransactions, partners, searchQuery]);

  // Filter withdrawals
  const filteredWithdrawals = useMemo(() => {
    if (!allWithdrawals || !partners) return [];

    return allWithdrawals.filter((withdrawal: Doc<"withdrawals">) => {
      const partner = partners.find((p) => p._id === withdrawal.partner_id);
      return (
        searchQuery === "" ||
        withdrawal.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        withdrawal.destination_details.account_number.includes(searchQuery) ||
        partner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        withdrawal.amount.toString().includes(searchQuery)
      );
    });
  }, [allWithdrawals, partners, searchQuery]);

  const handleApproveWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    if (!mpesaReceipt.trim()) {
      toast.error("Please enter the M-Pesa receipt number");
      return;
    }

    setIsProcessing(true);
    try {
      await approveWithdrawal({
        withdrawal_id: selectedWithdrawal._id,
        mpesa_receipt: mpesaReceipt.trim(),
      });
      toast.success("Withdrawal approved successfully!");
      setIsApprovalDialogOpen(false);
      setSelectedWithdrawal(null);
      setMpesaReceipt("");
    } catch (error) {
      toast.error("Failed to approve withdrawal");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    setIsProcessing(true);
    try {
      await rejectWithdrawal({
        withdrawal_id: selectedWithdrawal._id,
        reason: rejectReason.trim() || "Rejected by admin",
      });
      toast.success("Withdrawal rejected");
      setIsRejectDialogOpen(false);
      setSelectedWithdrawal(null);
      setRejectReason("");
    } catch (error) {
      toast.error("Failed to reject withdrawal");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCreationTime = (timestamp: number) => formatDate(timestamp);

  const getWithdrawalStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-secondary" />;
      case "pending":
        return <Clock className="h-4 w-4 text-chart-3" />;
      case "processing":
        return <AlertCircle className="h-4 w-4 text-primary" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const isLoading = walletsLoading || transactionsLoading || withdrawalsLoading || partnersLoading;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Wallet Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Super Admin - Manage all partner wallets and withdrawals
        </p>
      </div>

      {/* Metrics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <WalletIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Total Wallets</p>
              <p className="text-2xl font-bold text-foreground">{metrics.totalWallets}</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-secondary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.totalBalance)}</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-chart-3" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-foreground">{metrics.pendingWithdrawals}</p>
              <p className="text-xs text-chart-3 mt-1">
                {formatCurrency(metrics.pendingWithdrawalAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-chart-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Lifetime Earnings</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.totalLifetimeEarnings)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search wallets, transactions, or withdrawals..."
          className="pl-10 bg-background border-border"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Card className="border-border">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="wallets">
                <WalletIcon className="h-4 w-4 mr-2" />
                Wallets ({metrics.totalWallets})
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <DollarSign className="h-4 w-4 mr-2" />
                Transactions ({metrics.totalTransactions})
              </TabsTrigger>
              <TabsTrigger value="withdrawals">
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Withdrawals ({metrics.pendingWithdrawals} pending)
              </TabsTrigger>
            </TabsList>

            {/* WALLETS TAB */}
            <TabsContent value="wallets" className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Partner</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Lifetime Earnings</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-border">
                          {Array.from({ length: 8 }).map((__, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full rounded" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredWallets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="text-center py-12 text-muted-foreground">
                            <WalletIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No wallets found</p>
                            <p className="text-xs mt-1">
                              {searchQuery ? "No wallets match your search" : "Partner wallets will appear here once created"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWallets.map((wallet) => (
                        <TableRow key={wallet._id} className="border-border">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{getPartnerName(wallet.partner_id)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{wallet.account_number}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-secondary">
                              {formatCurrency(wallet.balance)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-chart-3">
                              {formatCurrency(wallet.pending_balance)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{formatCurrency(wallet.lifetime_earnings)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {wallet.withdrawal_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={wallet.is_setup_complete ? "default" : "secondary"}>
                              {wallet.is_setup_complete ? "Complete" : "Incomplete"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedWallet(wallet);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* TRANSACTIONS TAB */}
            <TabsContent value="transactions" className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Partner</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>M-Pesa Code</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-border">
                          {Array.from({ length: 8 }).map((__, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full rounded" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="text-center py-12 text-muted-foreground">
                            <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No transactions found</p>
                            <p className="text-xs mt-1">
                              {searchQuery ? "No transactions match your search" : "Transactions will appear here once payments are processed"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction._id} className="border-border">
                          <TableCell>
                            <span className="font-medium">{getPartnerName(transaction.partner_id)}</span>
                          </TableCell>
                          <TableCell>{transaction.student_name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {transaction.phone_number}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{transaction.mpesa_code}</TableCell>
                          <TableCell className="text-sm">{transaction.campaign_code}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(transaction.status)} className="capitalize">
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* WITHDRAWALS TAB */}
            <TabsContent value="withdrawals" className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Partner</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-border">
                          {Array.from({ length: 9 }).map((__, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full rounded" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <div className="text-center py-12 text-muted-foreground">
                            <ArrowDownToLine className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No withdrawals found</p>
                            <p className="text-xs mt-1">
                              {searchQuery ? "No withdrawals match your search" : "Pending withdrawal requests will appear here"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWithdrawals.map((withdrawal: Doc<"withdrawals">) => (
                        <TableRow key={withdrawal._id} className="border-border">
                          <TableCell>
                            <span className="font-medium">{getPartnerName(withdrawal.partner_id)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getWithdrawalStatusIcon(withdrawal.status)}
                              <span className="font-mono text-sm">{withdrawal.reference_number}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{withdrawal.withdrawal_method}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {withdrawal.destination_details.account_number}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(withdrawal.amount)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatCreationTime(withdrawal._creationTime)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(withdrawal.status)} className="capitalize">
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {withdrawal.mpesa_receipt ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{withdrawal.mpesa_receipt}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(withdrawal.mpesa_receipt!)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {withdrawal.status === "pending" && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedWithdrawal(withdrawal);
                                    setMpesaReceipt("");
                                    setIsApprovalDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                                  onClick={() => {
                                    setSelectedWithdrawal(withdrawal);
                                    setRejectReason("");
                                    setIsRejectDialogOpen(true);
                                  }}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Wallet Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet Details</DialogTitle>
            <DialogDescription>
              {selectedWallet && getPartnerName(selectedWallet.partner_id)}
            </DialogDescription>
          </DialogHeader>
          {selectedWallet && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-mono font-medium">{selectedWallet.account_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-semibold text-secondary">{formatCurrency(selectedWallet.balance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="font-semibold text-chart-3">{formatCurrency(selectedWallet.pending_balance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lifetime Earnings</p>
                  <p className="font-semibold">{formatCurrency(selectedWallet.lifetime_earnings)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Withdrawal Method</p>
                  <p className="font-medium capitalize">{selectedWallet.withdrawal_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Setup Status</p>
                  <Badge variant={selectedWallet.is_setup_complete ? "default" : "secondary"}>
                    {selectedWallet.is_setup_complete ? "Complete" : "Incomplete"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>
              Enter the M-Pesa receipt number to confirm this withdrawal
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Partner</p>
                  <p className="font-medium">{getPartnerName(selectedWithdrawal.partner_id)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold text-secondary">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">{selectedWithdrawal.withdrawal_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account</p>
                  <p className="font-mono text-sm">{selectedWithdrawal.destination_details.account_number}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="mpesa-receipt" className="text-sm font-medium">
                  M-Pesa Receipt Number <span className="text-destructive">*</span>
                </label>
                <Input
                  id="mpesa-receipt"
                  placeholder="e.g. QFG7X8J9K2"
                  value={mpesaReceipt}
                  onChange={(e) => setMpesaReceipt(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the exact M-Pesa receipt number from the transaction confirmation
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveWithdrawal}
              disabled={isProcessing || !mpesaReceipt.trim()}
            >
              {isProcessing ? "Processing..." : "Approve & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this withdrawal request. The partner will be notified.
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Partner</p>
                  <p className="font-medium">{getPartnerName(selectedWithdrawal.partner_id)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold text-destructive">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="reject-reason" className="text-sm font-medium">
                  Rejection Reason
                </label>
                <Textarea
                  id="reject-reason"
                  placeholder="e.g. Account details could not be verified, please update your withdrawal account and try again."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectWithdrawal}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
