import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface WalletEditDialogProps {
  open: boolean;
  onClose: () => void;
  wallet: Doc<"wallets">;
  partnerId: Id<"partners">;
  userId: Id<"users">;
}

type WithdrawalMethod = "mpesa" | "bank" | "paybill";

export function WalletEditDialog({
  open,
  onClose,
  wallet,
}: WalletEditDialogProps) {
  const [step, setStep] = useState<"method" | "pin" | "confirm">("method");
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod>(
    wallet.withdrawal_method
  );
  const [accountNumber, setAccountNumber] = useState(wallet.account_number);
  const [paybillNumber, setPaybillNumber] = useState(
    wallet.paybill_number || ""
  );
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateWallet = useMutation(api.wallet.updateWallet);

  const handleClose = () => {
    setStep("method");
    setWithdrawalMethod(wallet.withdrawal_method);
    setAccountNumber(wallet.account_number);
    setPaybillNumber(wallet.paybill_number || "");
    setPin("");
    setConfirmPin("");
    setShowPin(false);
    setShowConfirmPin(false);
    onClose();
  };

  const validateMethodStep = () => {
    if (!accountNumber.trim()) {
      toast.error("Account number is required");
      return false;
    }

    if (withdrawalMethod === "mpesa") {
      if (!/^254\d{9}$/.test(accountNumber)) {
        toast.error("M-Pesa number must be in format 254XXXXXXXXX");
        return false;
      }
    }

    if (withdrawalMethod === "paybill") {
      if (!paybillNumber.trim()) {
        toast.error("Paybill number is required");
        return false;
      }
      if (!/^\d+$/.test(paybillNumber)) {
        toast.error("Paybill number must contain only digits");
        return false;
      }
    }

    return true;
  };

  const handleMethodNext = () => {
    if (validateMethodStep()) {
      setStep("pin");
    }
  };

  const validatePinStep = () => {
    if (!pin || pin.length !== 4) {
      toast.error("PIN must be exactly 4 digits");
      return false;
    }

    if (!/^\d{4}$/.test(pin)) {
      toast.error("PIN must contain only numbers");
      return false;
    }

    if (!confirmPin) {
      toast.error("Please confirm your PIN");
      return false;
    }

    if (pin !== confirmPin) {
      toast.error("PINs do not match");
      return false;
    }

    return true;
  };

  const handlePinNext = () => {
    if (validatePinStep()) {
      setStep("confirm");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await updateWallet({
        wallet_id: wallet._id,
        account_number: accountNumber,
        withdrawal_method: withdrawalMethod,
        paybill_number: withdrawalMethod === "paybill" ? paybillNumber : undefined,
        pin: pin,
      });

      toast.success("Wallet updated successfully! 🎉");
      handleClose();
    } catch (error: unknown) {
        console.error("Failed to update wallet:", error);
        const message = (error as Error)?.message || "Failed to update wallet. Please try again.";
        toast.error(message);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {step === "method" && "Update Withdrawal Method"}
            {step === "pin" && "Update Security PIN"}
            {step === "confirm" && "Confirm Changes"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {step === "method" &&
              "Choose how you'd like to receive your withdrawals"}
            {step === "pin" && "Set a new 4-digit PIN to secure your wallet"}
            {step === "confirm" && "Review your changes before updating"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Withdrawal Method */}
          {step === "method" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Withdrawal Method</Label>
                <RadioGroup
                  value={withdrawalMethod}
                  onValueChange={(value) =>
                    setWithdrawalMethod(value as WithdrawalMethod)
                  }
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="mpesa" id="mpesa" />
                    <Label
                      htmlFor="mpesa"
                      className="flex-1 cursor-pointer flex items-center gap-3"
                    >
                      <img src="/mpesa.svg" alt="M-Pesa" className="h-6 w-6" />
                      <div>
                        <p className="font-medium">M-Pesa</p>
                        <p className="text-xs text-muted-foreground">
                          Direct to your phone number
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="paybill" id="paybill" />
                    <Label
                      htmlFor="paybill"
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium">Paybill</p>
                      <p className="text-xs text-muted-foreground">
                        To a paybill account
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {withdrawalMethod === "paybill" && (
                <div className="space-y-2">
                  <Label htmlFor="paybill-number" className="text-sm font-medium">
                    Paybill Number
                  </Label>
                  <Input
                    id="paybill-number"
                    placeholder="e.g., 247247"
                    value={paybillNumber}
                    onChange={(e) => setPaybillNumber(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="account-number" className="text-sm font-medium">
                  {withdrawalMethod === "mpesa"
                    ? "M-Pesa Phone Number"
                    : "Account Number"}
                </Label>
                <Input
                  id="account-number"
                  placeholder={
                    withdrawalMethod === "mpesa"
                      ? "254XXXXXXXXX"
                      : "Enter account number"
                  }
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="h-11"
                />
                {withdrawalMethod === "mpesa" && (
                  <p className="text-xs text-muted-foreground">
                    Format: 254XXXXXXXXX (country code + number)
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMethodNext}
                  className="flex-1 h-11 bg-primary text-primary-foreground"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: PIN Setup */}
          {step === "pin" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium">
                  New PIN
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.slice(0, 4))}
                    maxLength={4}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pin" className="text-sm font-medium">
                  Confirm PIN
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-pin"
                    type={showConfirmPin ? "text" : "password"}
                    placeholder="Re-enter your PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.slice(0, 4))}
                    maxLength={4}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">PIN Requirements:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Must be exactly 4 digits</li>
                  <li>• Use only numbers (0-9)</li>
                  <li>• Avoid easy-to-guess combinations</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("method")}
                  className="flex-1 h-11"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePinNext}
                  className="flex-1 h-11 bg-primary text-primary-foreground"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Withdrawal Method
                      </p>
                      <p className="font-medium">
                        {withdrawalMethod === "mpesa"
                          ? "M-Pesa"
                          : "Paybill"}
                      </p>
                    </div>

                    {withdrawalMethod === "paybill" && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Paybill Number
                        </p>
                        <p className="font-medium font-mono">{paybillNumber}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Account Number
                      </p>
                      <p className="font-medium font-mono">{accountNumber}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Security PIN
                      </p>
                      <p className="font-medium">••••</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Make sure these details are correct.
                  All future withdrawals will be sent to this account.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("pin")}
                  disabled={isLoading}
                  className="flex-1 h-11"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 h-11 bg-primary text-primary-foreground"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Wallet"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}