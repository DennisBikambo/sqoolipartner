
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { AlertCircle, X } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

type Step = "amount" | "pin" | "success" | "failed";

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
  limits?: { min: number; max: number; daily: number; monthly: number };
  usage?: {
    today: number;
    remaining_today: number;
    this_month: number;
    remaining_this_month: number;
  };
  processing_days?: number;
}

const MIN_WITHDRAWAL = 1000;

/* ─── Starburst decoration for success/failed states ─── */
function Starburst({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 60 + 38 * Math.cos(angle);
        const y1 = 60 + 38 * Math.sin(angle);
        const x2 = 60 + 52 * Math.cos(angle);
        const y2 = 60 + 52 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        );
      })}
    </svg>
  );
}

export function WithdrawalDialog({
  open,
  onClose,
  wallet,
  partnerId,
  userId,
}: WithdrawalDialogProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const createWithdrawal = useMutation(api.withdrawals.createWithdrawal);

  const availabilityCheck = useQuery(
    api.withdrawals.checkAvailability,
    amount && parseFloat(amount) > 0
      ? { partner_id: partnerId, amount: parseFloat(amount) }
      : "skip"
  ) as ValidationResult | undefined;

  // Sync validation result
  useEffect(() => {
    if (availabilityCheck !== undefined) {
      setValidationResult(availabilityCheck);
    }
  }, [availabilityCheck]);

  // Reset all state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep("amount");
      setAmount("");
      setPinDigits(["", "", "", ""]);
      setPinError("");
      setValidationResult(null);
      setIsSubmitting(false);
    }
  }, [open]);

  // Focus first PIN box when entering PIN step
  useEffect(() => {
    if (step === "pin") {
      setTimeout(() => pinRefs.current[0]?.focus(), 50);
    }
  }, [step]);

  const amountValue = parseFloat(amount) || 0;
  const isAmountValid = amountValue >= MIN_WITHDRAWAL && amountValue <= wallet.balance;
  const isValidating = availabilityCheck === undefined && amountValue > 0;
  const canProceed = isAmountValid && validationResult?.can_withdraw === true && !isValidating;

  const handleWithdrawClick = () => {
    if (canProceed) setStep("pin");
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pinDigits];
    next[index] = value;
    setPinDigits(next);
    setPinError("");
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinSubmit = async () => {
    const enteredPin = pinDigits.join("");
    if (enteredPin.length < 4) {
      setPinError("Please enter all 4 digits.");
      return;
    }
    if (enteredPin !== wallet.pin) {
      setPinError("Incorrect PIN. Please try again.");
      setPinDigits(["", "", "", ""]);
      setTimeout(() => pinRefs.current[0]?.focus(), 50);
      return;
    }

    setIsSubmitting(true);
    try {
      await createWithdrawal({
        wallet_id: wallet._id,
        user_id: userId,
        partner_id: partnerId,
        amount: amountValue,
        withdrawal_method: wallet.withdrawal_method,
        destination_details: {
          account_number: wallet.account_number,
          paybill_number: wallet.paybill_number,
          bank_name: wallet.bank_name ?? undefined,
          branch: wallet.branch ?? undefined,
        },
      });
      setStep("success");
    } catch {
      setStep("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit when all 4 digits are entered
  useEffect(() => {
    if (step === "pin" && pinDigits.join("").length === 4 && !isSubmitting) {
      handlePinSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinDigits]);

  const validationError =
    amountValue > 0 && amountValue < MIN_WITHDRAWAL
      ? `Minimum withdrawal is ${formatCurrency(MIN_WITHDRAWAL)}`
      : amountValue > wallet.balance
      ? "Amount exceeds available balance"
      : validationResult?.can_withdraw === false
      ? validationResult.reason
      : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px] p-0 overflow-hidden" showCloseButton={false}>

        {/* ─── STEP 1: AMOUNT ENTRY ─── */}
        {step === "amount" && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Withdraw Earnings</h2>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* 48-hour warning */}
              <p className="text-sm text-red-500 font-medium">
                Please note: You can only make one withdrawal every 48 Hours.
              </p>

              {/* Source of funds */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">Source of Funds</Label>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(wallet.balance)}
                  </p>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <Label htmlFor="wd-amount" className="text-sm font-medium text-foreground">
                  Amount to withdraw
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    KES
                  </span>
                  <Input
                    id="wd-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-14 text-base font-semibold"
                    min={MIN_WITHDRAWAL}
                    max={wallet.balance}
                    step="100"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum Withdrawal: {formatCurrency(MIN_WITHDRAWAL)}
                </p>

                {/* Validation error */}
                {validationError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Checking state */}
                {isValidating && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Checking withdrawal limits…
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex justify-end">
              <Button
                disabled={!canProceed}
                onClick={handleWithdrawClick}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
              >
                {isValidating ? "Checking…" : "Withdraw"}
              </Button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: PIN ENTRY ─── */}
        {step === "pin" && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Withdraw Earnings</h2>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-8 flex flex-col items-center space-y-6">
              {/* Wallet illustration */}
              <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <svg
                  className="h-9 w-9 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                  />
                </svg>
              </div>

              <p className="text-sm font-medium text-foreground text-center">
                Enter your PIN to proceed
              </p>

              {/* PIN boxes */}
              <div className="flex items-center gap-4">
                {pinDigits.map((digit, i) => (
                  <div key={i} className="relative">
                    <input
                      ref={(el) => { pinRefs.current[i] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      className={`w-12 h-12 text-center text-xl font-bold rounded-lg border-2 bg-background outline-none transition-colors focus:border-blue-500 ${
                        digit
                          ? "border-blue-500"
                          : "border-border"
                      }`}
                    />
                    {/* Blue dot mask */}
                    {digit && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {pinError && (
                <p className="text-sm text-red-500 text-center">{pinError}</p>
              )}

              {isSubmitting && (
                <p className="text-sm text-muted-foreground text-center">Processing…</p>
              )}

              <Button
                onClick={handlePinSubmit}
                disabled={pinDigits.join("").length < 4 || isSubmitting}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
              >
                {isSubmitting ? "Processing…" : "Confirm"}
              </Button>
            </div>
          </div>
        )}

        {/* ─── STEP 3A: SUCCESS ─── */}
        {step === "success" && (
          <div className="px-6 py-10 flex flex-col items-center space-y-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Checkmark with starburst */}
            <div className="relative h-24 w-24">
              <Starburst color="#22c55e" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <svg
                    className="h-7 w-7 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                Withdrawal Initiated Successfully
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                Your request to withdraw earnings has been received successfully. We will approve
                the transaction within 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* ─── STEP 3B: FAILED ─── */}
        {step === "failed" && (
          <div className="px-6 py-10 flex flex-col items-center space-y-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* X icon with starburst */}
            <div className="relative h-24 w-24">
              <Starburst color="#ef4444" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <X className="h-7 w-7 text-red-500" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">Withdrawal Failed</h3>
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                Your withdrawal request failed. Try again later.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setStep("amount");
                setPinDigits(["", "", "", ""]);
                setPinError("");
              }}
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
