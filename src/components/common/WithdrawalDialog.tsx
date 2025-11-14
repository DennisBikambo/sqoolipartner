"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { PinVerificationDialog } from "./PinVerification";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  TrendingDown,
  Wallet,
} from "lucide-react";

interface WithdrawalDialogProps {
  open: boolean;
  onClose: () => void;
  wallet: Doc<"wallets">;
  partnerId: Id<"partners">;
  userId: Id<"users">;
}

interface ValidationResult {
  can_withdraw: boolean;
  reason?: string;
  error_type?: string;
  amount?: number;
  available_balance?: number;
  remaining_balance?: number;
  limits?: {
    min: number;
    max: number;
    daily: number;
    monthly: number;
  };
  usage?: {
    today: number;
    remaining_today: number;
    this_month: number;
    remaining_this_month: number;
  };
  processing_days?: number;
}

interface SuccessState {
  reference: string;
  processingDays: number;
}

export function WithdrawalDialog({
  open,
  onClose,
  wallet,
  partnerId,
  userId,
}: WithdrawalDialogProps) {
  const [amount, setAmount] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const createWithdrawal = useMutation(api.withdrawals.createWithdrawal);

  // Real-time validation query
  const availabilityCheck = useQuery(
    api.withdrawals.checkAvailability,
    amount && parseFloat(amount) > 0
      ? {
          partner_id: partnerId,
          amount: parseFloat(amount),
        }
      : "skip"
  );

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAmount("");
      setError(null);
      setValidationResult(null);
      setSuccess(null);
    }
  }, [open]);

  // Update validation result when query returns
  useEffect(() => {
    if (availabilityCheck) {
      setValidationResult(availabilityCheck);
      setError(null);
    }
  }, [availabilityCheck]);

  const handleSubmit = () => {
    if (!validationResult?.can_withdraw) {
      setError(validationResult?.reason || "Cannot process withdrawal");
      return;
    }
    setShowPin(true);
  };

  const handleVerified = async () => {
    try {
      const result = await createWithdrawal({
        wallet_id: wallet._id,
        user_id: userId,
        partner_id: partnerId,
        amount: parseFloat(amount),
        withdrawal_method: wallet.withdrawal_method,
        destination_details: {
          account_number: wallet.account_number,
          paybill_number: wallet.paybill_number,
          bank_name: wallet.bank_name ?? undefined,
          branch: wallet.branch ?? undefined,
        },
      });

      setSuccess({
        reference: result.reference_number,
        processingDays: result.processing_days,
      });
      setShowPin(false);

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create withdrawal";
      setError(errorMessage);
      setShowPin(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  const getDestinationDisplay = () => {
    if (wallet.withdrawal_method === "mpesa") {
      return {
        label: "M-Pesa",
        value: wallet.account_number.replace(
          /^(.{2})(.*)(.{2})$/,
          (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`
        ),
      };
    }

    if (wallet.withdrawal_method === "paybill") {
      return {
        label: "Paybill",
        value: `${wallet.paybill_number} - ${wallet.account_number.replace(
          /^(.{2})(.*)(.{2})$/,
          (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`
        )}`,
      };
    }

    if (wallet.withdrawal_method === "bank") {
      return {
        label: "Bank Transfer",
        value: `${wallet.bank_name} - ${wallet.account_number.replace(
          /^(.{4})(.*)(.{4})$/,
          (_, a, b, c) => `${a}${"*".repeat(Math.min(b.length, 8))}${c}`
        )}`,
      };
    }

    return { label: "", value: "" };
  };

  const destination = getDestinationDisplay();

  // Success state
  if (success) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Withdrawal Requested!</h3>
              <p className="text-sm text-muted-foreground">
                Your withdrawal has been submitted successfully
              </p>
            </div>

            <div className="w-full p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono font-semibold">
                  {success.reference}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processing Time:</span>
                <span className="font-semibold">
                  {success.processingDays} business days
                </span>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your funds will be processed within {success.processingDays}{" "}
                business days. You'll receive a notification once completed.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if query is loading
  const isValidating = availabilityCheck === undefined && amount && parseFloat(amount) > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Withdraw Funds
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Available Balance */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="w-4 h-4" />
                  <span>Available Balance</span>
                </div>
                <span className="text-lg font-bold">
                  {formatCurrency(wallet.balance)}
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Withdrawal Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  KES
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-14 text-lg font-semibold"
                  min="0"
                  step="100"
                />
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {[1000, 5000, 10000].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                    className="flex-1 text-xs"
                    disabled={preset > wallet.balance}
                  >
                    {formatCurrency(preset)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Validation Results */}
            {validationResult && amount && parseFloat(amount) > 0 && (
              <div className="space-y-3">
                {!validationResult.can_withdraw ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {validationResult.reason}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-sm text-green-900">
                        Withdrawal amount is valid
                      </AlertDescription>
                    </Alert>

                    {/* Details */}
                    <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          You'll receive:
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(validationResult.amount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Remaining balance:
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(validationResult.remaining_balance || 0)}
                        </span>
                      </div>
                      {validationResult.usage && (
                        <>
                          <div className="flex justify-between text-xs pt-2 border-t">
                            <span className="text-muted-foreground">
                              Remaining today:
                            </span>
                            <span>
                              {formatCurrency(
                                validationResult.usage.remaining_today
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Remaining this month:
                            </span>
                            <span>
                              {formatCurrency(
                                validationResult.usage.remaining_this_month
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Loading State */}
            {isValidating && (
              <Alert>
                <Clock className="h-4 w-4 animate-spin" />
                <AlertDescription className="text-sm">
                  Checking withdrawal limits...
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Destination Details */}
            <div className="p-4 bg-muted rounded-lg space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Withdraw To:
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{destination.label}</span>
                <span className="text-sm font-mono">{destination.value}</span>
              </div>
            </div>

            {/* Processing Time Info */}
            {validationResult?.can_withdraw && validationResult.processing_days && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Processing time: {validationResult.processing_days} business
                  days
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-muted/50 border-t flex justify-between items-center">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
                disabled={
                    Boolean(!amount || parseFloat(amount) <= 0 || !validationResult?.can_withdraw || isValidating)
                }
                onClick={handleSubmit}
                className="min-w-[120px]"
                >
                {isValidating ? "Checking..." : "Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PinVerificationDialog
        open={showPin}
        onClose={() => setShowPin(false)}
        correctPin={wallet.pin}
        userId={partnerId}
        onSuccess={handleVerified}
      />
    </>
  );
}