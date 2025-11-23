"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loading } from "./Loading";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
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
  Filter,
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

export default function SuperAdminWalletSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"wallets" | "transactions" | "withdrawals">("wallets");
  const [selectedWallet, setSelectedWallet] = useState<Doc<"wallets"> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Doc<"withdrawals"> | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all data
  const wallets = useQuery(api.wallet.getAllWallets);
  const allTransactions = useQuery(api.transactions.getAllTransactions);
  const allWithdrawals = useQuery(api.withdrawals.getAllWithdrawals);
  const partners = useQuery(api.partner.getAllPartners);

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

    const verifiedTransactions = allTransactions.filter((t) => t.status === "verified");
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
      const matchesSearch =
        searchQuery === "" ||
        wallet.account_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wallet.balance.toString().includes(searchQuery);

      return matchesSearch;
    });
  }, [wallets, partners, searchQuery]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!allTransactions || !partners) return [];

    return allTransactions.filter((transaction) => {
      const partner = partners.find((p) => p._id === transaction.partner_id);
      const matchesSearch =
        searchQuery === "" ||
        transaction.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.phone_number.includes(searchQuery) ||
        transaction.mpesa_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner?.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [allTransactions, partners, searchQuery]);

  // Filter withdrawals
  const filteredWithdrawals = useMemo(() => {
    if (!allWithdrawals || !partners) return [];

    return allWithdrawals.filter((withdrawal: Doc<"withdrawals">) => {
      const partner = partners.find((p) => p._id === withdrawal.partner_id);
      const matchesSearch =
        searchQuery === "" ||
        withdrawal.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        withdrawal.destination_details.account_number.includes(searchQuery) ||
        partner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        withdrawal.amount.toString().includes(searchQuery);

      return matchesSearch;
    });
  }, [allWithdrawals, partners, searchQuery]);

  const handleApproveWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    setIsProcessing(true);
    try {
      await approveWithdrawal({
        withdrawal_id: selectedWithdrawal._id,
        mpesa_receipt: `MPESA${Date.now()}`, // Generate receipt number
      });
      toast.success("Withdrawal approved successfully!");
      setIsApprovalDialogOpen(false);
      setSelectedWithdrawal(null);
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
        reason: "Rejected by admin",
      });
      toast.success("Withdrawal rejected");
      setIsApprovalDialogOpen(false);
      setSelectedWithdrawal(null);
    } catch (error) {
      toast.error("Failed to reject withdrawal");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCreationTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "verified":
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "processing":
        return "outline";
      case "failed":
      case "rejected":
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getWithdrawalStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "processing":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!wallets || !allTransactions || !allWithdrawals || !partners) {
    return <Loading message="Loading wallet management..." size="lg" />;
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <WalletIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total Wallets</p>
            <p className="text-2xl font-bold text-foreground">{metrics.totalWallets}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.totalBalance)}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Pending Withdrawals</p>
            <p className="text-2xl font-bold text-foreground">{metrics.pendingWithdrawals}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(metrics.pendingWithdrawalAmount)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Lifetime Earnings</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.totalLifetimeEarnings)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wallets, transactions, or withdrawals..."
            className="pl-10 bg-background border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Card className="border-border">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4 flex space-x-4 bg-transparent p-0">
              <TabsTrigger
                value="wallets"
                className={`text-sm font-medium p-2 ${
                      activeTab === "wallets" ? "text-primary " : "text-muted-foreground"
                    } hover:text-primary bg-transparent`}
              >
                <WalletIcon className="h-4 w-4 mr-2" />
                Wallets ({metrics.totalWallets})
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className={`text-sm font-medium p-2 ${
                      activeTab === "transactions" ? "text-primary" : "text-muted-foreground"
                    } hover:text-primary bg-transparent`}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Transactions ({metrics.totalTransactions})
              </TabsTrigger>
              <TabsTrigger
                value="withdrawals"
                className={`text-sm font-medium p-2 ${
                      activeTab === "withdrawals" ? "text-primary" : "text-muted-foreground"
                    } hover:text-primary bg-transparent`}
              >
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
                    {filteredWallets.map((wallet) => (
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
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(wallet.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
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
                    ))}
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
                    {filteredTransactions.map((transaction) => (
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
                    ))}
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
                    {filteredWithdrawals.map((withdrawal: Doc<"withdrawals">) => (
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
                                  setIsApprovalDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  handleRejectWithdrawal();
                                }}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
                  <p className="font-semibold text-green-600">{formatCurrency(selectedWallet.balance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="font-semibold text-amber-600">{formatCurrency(selectedWallet.pending_balance)}</p>
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
              Confirm approval for this withdrawal request
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Partner</p>
                  <p className="font-medium">{getPartnerName(selectedWithdrawal.partner_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-green-600">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">{selectedWithdrawal.withdrawal_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <p className="font-mono text-sm">{selectedWithdrawal.destination_details.account_number}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApproveWithdrawal} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Approve & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}