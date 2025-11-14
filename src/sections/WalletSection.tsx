import { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { Loading } from "../components/common/Loading";
import { api } from "../../convex/_generated/api";
import Wallet from "../components/common/Wallet";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/ui/sheet";
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
} from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function WalletSection({
  activeItem,
  setActiveItem
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
}) {
  const { partner } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"payments" | "withdrawals">("payments");
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id ? { partner_id: partner._id } : "skip"
  );

  // Fetch all transactions
  const transactions = useQuery(
    api.transactions.getTransactionsByPartner,
    partner?._id ? { partner_id: partner._id } : "skip"
  );

  // Fetch withdrawals
  const withdrawals = useQuery(
    api.withdrawals.getWithdrawals,
    partner?._id ? { partner_id: partner._id } : "skip"
  );

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter((transaction: Doc<"transactions">) => {
      const matchesSearch = searchQuery === "" || 
        transaction.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.phone_number.includes(searchQuery) ||
        transaction.mpesa_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.campaign_code.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [transactions, searchQuery]);

  // Filter withdrawals based on search query
  const filteredWithdrawals = useMemo(() => {
    if (!withdrawals) return [];
    
    return withdrawals.filter((withdrawal: Doc<"withdrawals">) => {
      const matchesSearch = searchQuery === "" || 
        withdrawal.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        withdrawal.destination_details.account_number.includes(searchQuery) ||
        withdrawal.amount.toString().includes(searchQuery);
      
      return matchesSearch;
    });
  }, [withdrawals, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCreationTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    return `KES ${amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        return <CheckCircle2 className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <AlertCircle className="h-4 w-4" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getWithdrawalMethodDisplay = (method: string) => {
    switch (method) {
      case "mpesa":
        return "M-Pesa";
      case "bank":
        return "Bank Transfer";
      case "paybill":
        return "Paybill";
      default:
        return method;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Show loading state
  if (!partner) {
    return <Loading message="Loading your wallet..." size="lg" />;
  }

  if (campaigns === undefined || transactions === undefined || withdrawals === undefined) {
    return <Loading message="Loading transactions..." size="lg" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6">
        {/* Mobile Wallet Toggle */}
        <div className="lg:hidden">
          <Sheet open={isWalletOpen} onOpenChange={setIsWalletOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <WalletIcon className="h-4 w-4" />
                View Wallet
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-4">
                <Wallet activeItem={activeItem} setActiveItem={setActiveItem} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Wallet - Left Column */}
        <div className="hidden lg:block lg:w-64 shrink-0">
          <Wallet activeItem={activeItem} setActiveItem={setActiveItem} />
        </div>

        {/* Right Column - Transaction Content */}
        <div className="flex-1 space-y-4 lg:space-y-6 min-w-0">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "payments" ? "Search transactions..." : "Search withdrawals..."}
                className="pl-10 bg-background border-border w-full"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 w-full sm:w-auto">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs and Table */}
          <Card className="border-border">
            <CardContent className="p-4 lg:pt-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="mb-4 flex space-x-4 bg-transparent p-0">
                  <TabsTrigger
                    value="payments"
                    className={`text-sm font-medium p-2 ${
                      activeTab === "payments" ? "text-primary" : "text-muted-foreground"
                    } hover:text-primary bg-transparent`}
                  >
                    Payments
                  </TabsTrigger>
                  <TabsTrigger
                    value="withdrawals"
                    className={`text-sm font-medium p-2 ${
                      activeTab === "withdrawals" ? "text-primary" : "text-muted-foreground"
                    } hover:text-primary bg-transparent`}
                  >
                    Withdrawals
                  </TabsTrigger>
                </TabsList>

                {/* PAYMENTS TAB */}
                <TabsContent value="payments" className="mt-0">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-muted flex items-center justify-center">
                          <svg
                            className="w-10 h-10 lg:w-12 lg:h-12 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="space-y-1 text-center px-4">
                          <div className="text-sm lg:text-base text-muted-foreground font-medium">
                            Your completed payments will display here
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-3">
                        {filteredTransactions.map((transaction) => (
                          <Card key={transaction._id} className="border-border">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground truncate">
                                    {transaction.student_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {transaction.phone_number}
                                  </div>
                                </div>
                                <Badge 
                                  variant={getStatusBadgeVariant(transaction.status)}
                                  className="capitalize shrink-0"
                                >
                                  {transaction.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-border">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    M-Pesa Code
                                  </div>
                                  <div className="font-mono text-sm text-foreground truncate">
                                    {transaction.mpesa_code}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Amount
                                  </div>
                                  <div className="text-sm font-semibold text-foreground">
                                    {formatCurrency(transaction.amount)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Campaign
                                  </div>
                                  <div className="text-sm text-foreground truncate">
                                    {transaction.campaign_code}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Date
                                  </div>
                                  <div className="text-xs text-foreground">
                                    {formatDate(transaction.created_at)}
                                  </div>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-muted/50">
                              <TableHead className="text-muted-foreground font-medium">Student</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Phone</TableHead>
                              <TableHead className="text-muted-foreground font-medium">M-Pesa Code</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Campaign</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                              <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTransactions.map((transaction) => (
                              <TableRow key={transaction._id} className="border-border hover:bg-muted/50">
                                <TableCell>
                                  <div className="font-medium text-foreground">
                                    {transaction.student_name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-foreground">
                                    {transaction.phone_number}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-mono text-sm text-foreground">
                                    {transaction.mpesa_code}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-foreground">
                                    {transaction.campaign_code}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-semibold text-foreground">
                                    {formatCurrency(transaction.amount)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-muted-foreground">
                                    {formatDate(transaction.created_at)}
                                  </div>
                                  {transaction.verified_at && (
                                    <div className="text-xs text-muted-foreground">
                                      Verified: {formatDate(transaction.verified_at)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={getStatusBadgeVariant(transaction.status)}
                                    className="capitalize"
                                  >
                                    {transaction.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                      title="View details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 lg:mt-6 pt-4 border-t border-border">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Showing {filteredTransactions.length} of {transactions?.length || 0} payments
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled>
                            Previous
                          </Button>
                          <Button variant="outline" size="sm" disabled>
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* WITHDRAWALS TAB */}
                <TabsContent value="withdrawals" className="mt-0">
                  {filteredWithdrawals.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-muted flex items-center justify-center">
                          <ArrowDownToLine className="w-10 h-10 lg:w-12 lg:h-12 text-muted-foreground" />
                        </div>
                        <div className="space-y-1 text-center px-4">
                          <div className="text-sm lg:text-base text-muted-foreground font-medium">
                            No withdrawals yet
                          </div>
                          <div className="text-xs lg:text-sm text-muted-foreground">
                            Your withdrawal requests will appear here
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View - Withdrawals */}
                      <div className="lg:hidden space-y-3">
                        {filteredWithdrawals.map((withdrawal) => (
                          <Card key={withdrawal._id} className="border-border">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {getWithdrawalStatusIcon(withdrawal.status)}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-mono text-sm text-foreground">
                                      {withdrawal.reference_number}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {getWithdrawalMethodDisplay(withdrawal.withdrawal_method)}
                                    </div>
                                  </div>
                                </div>
                                <Badge 
                                  variant={getStatusBadgeVariant(withdrawal.status)}
                                  className="capitalize shrink-0"
                                >
                                  {withdrawal.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-border">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Amount
                                  </div>
                                  <div className="text-sm font-semibold text-foreground">
                                    {formatCurrency(withdrawal.amount)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Account
                                  </div>
                                  <div className="text-sm text-foreground font-mono truncate">
                                    {withdrawal.destination_details.account_number}
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Date Requested
                                  </div>
                                  <div className="text-xs text-foreground">
                                    {formatCreationTime(withdrawal._creationTime)}
                                  </div>
                                </div>
                                {withdrawal.mpesa_receipt && (
                                  <div className="col-span-2">
                                    <div className="text-xs text-muted-foreground mb-1">
                                      M-Pesa Receipt
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm text-foreground font-mono">
                                        {withdrawal.mpesa_receipt}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(withdrawal.mpesa_receipt!)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop Table View - Withdrawals */}
                      <div className="hidden lg:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-muted/50">
                              <TableHead className="text-muted-foreground font-medium">Reference</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Method</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Account</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                              <TableHead className="text-muted-foreground font-medium">Receipt</TableHead>
                              <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredWithdrawals.map((withdrawal) => (
                              <TableRow key={withdrawal._id} className="border-border hover:bg-muted/50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getWithdrawalStatusIcon(withdrawal.status)}
                                    <div className="font-mono text-sm text-foreground">
                                      {withdrawal.reference_number}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-foreground">
                                    {getWithdrawalMethodDisplay(withdrawal.withdrawal_method)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-mono text-sm text-foreground">
                                    {withdrawal.destination_details.account_number}
                                  </div>
                                  {withdrawal.destination_details.bank_name && (
                                    <div className="text-xs text-muted-foreground">
                                      {withdrawal.destination_details.bank_name}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="font-semibold text-foreground">
                                    {formatCurrency(withdrawal.amount)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-muted-foreground">
                                    {formatCreationTime(withdrawal._creationTime)}
                                  </div>
                                  {withdrawal.processed_at && (
                                    <div className="text-xs text-muted-foreground">
                                      Processed: {formatDate(withdrawal.processed_at)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={getStatusBadgeVariant(withdrawal.status)}
                                    className="capitalize"
                                  >
                                    {withdrawal.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {withdrawal.mpesa_receipt ? (
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm text-foreground">
                                        {withdrawal.mpesa_receipt}
                                      </span>
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
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                      title="View details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination - Withdrawals */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 lg:mt-6 pt-4 border-t border-border">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Showing {filteredWithdrawals.length} of {withdrawals?.length || 0} withdrawals
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled>
                            Previous
                          </Button>
                          <Button variant="outline" size="sm" disabled>
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}