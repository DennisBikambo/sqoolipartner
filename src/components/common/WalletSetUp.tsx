import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { X, Building2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface WalletSetupDialogProps {
  open: boolean;
  onClose: () => void;
  partnerId: Id<"partners">;
  userId: Id<"users">;
}

export function WalletSetupDialog({
  open,
  onClose,
  partnerId,
  userId,
}: WalletSetupDialogProps) {
  const [activeTab, setActiveTab] = useState("method");
  const [withdrawalMethod, setWithdrawalMethod] = useState<"mpesa" | "bank" | "paybill">("mpesa");
  const [businessType, setBusinessType] = useState<"B2B" | "B2C">("B2B");
  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createWallet = useMutation(api.wallet.createWallet);

  // Dynamic validation for PIN mismatch
  useEffect(() => {
    if (confirmPin && pin !== confirmPin) {
      setPinError("PINs do not match");
    } else {
      setPinError("");
    }
  }, [pin, confirmPin]);

  const handleSave = async () => {
    if (activeTab === "method") {
      setActiveTab("pin");
      return;
    }

    if (pin.length !== 4) {
      setPinError("PIN must be 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }

    setIsLoading(true);
    try {
      await createWallet({
        partner_id: partnerId,
        user_id: userId,
        account_number: accountNumber,
        withdrawal_method: withdrawalMethod,
        paybill_number: withdrawalMethod === "mpesa" ? paybillNumber : undefined,
        pin: pin,
        beneficiaries: [
          {
            label: withdrawalMethod === "mpesa" ? "M-Pesa" : "Bank Account",
            account_number: accountNumber,
            provider: withdrawalMethod === "mpesa" ? "Safaricom" : "Bank",
          },
        ],
      });
      onClose();
    } catch (error) {
      console.error("Failed to create wallet:", error);
      alert("Failed to set up wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="!max-w-2xl sm:!max-w-2xl p-0" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Setup Wallet
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Setup withdrawal settings to access your earnings
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="method">Setup Withdrawal Method</TabsTrigger>
            <TabsTrigger value="pin" disabled={activeTab === "method"}>
              PIN Setup
            </TabsTrigger>
          </TabsList>

          {/* --- METHOD TAB --- */}
          <TabsContent value="method" className="space-y-6 mt-6">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-4">
                Select withdrawal method
              </h3>

              <div className="grid grid-cols-3 gap-4">
                {/* MPESA Card */}
                <button
                  onClick={() => setWithdrawalMethod("mpesa")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    withdrawalMethod === "mpesa"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="w-12 h-12 rounded bg-chart-2 flex items-center justify-center mb-3">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">MPESA</h4>
                  <p className="text-xs text-muted-foreground">
                    Setup withdrawal method manually through MPESA
                  </p>
                </button>

                {/* Bank Account Card */}
                <button
                  onClick={() => setWithdrawalMethod("bank")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    withdrawalMethod === "bank"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center mb-3">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Bank Account</h4>
                  <p className="text-xs text-muted-foreground">
                    Withdraw your earnings directly to bank account
                  </p>
                </button>

                {/* Pesapal Card */}
                <button
                  onClick={() => setWithdrawalMethod("paybill")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    withdrawalMethod === "paybill"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="w-12 h-12 rounded bg-chart-3 flex items-center justify-center mb-3">
                    <span className="text-foreground font-bold text-lg">P</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Pesapal</h4>
                  <p className="text-xs text-muted-foreground">
                    Automatically withdraw your earnings via Pesapal checkout
                  </p>
                </button>
              </div>
            </div>

            {withdrawalMethod === "mpesa" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">
                  Select option below
                </h3>

                {/* B2B / B2C Options */}
                <RadioGroup
                  value={businessType}
                  onValueChange={(v) => setBusinessType(v as "B2B" | "B2C")}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="B2B" id="b2b" />
                      <Label htmlFor="b2b" className="cursor-pointer">B2B</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="B2C" id="b2c" />
                      <Label htmlFor="b2c" className="cursor-pointer">B2C</Label>
                    </div>
                  </div>
                </RadioGroup>

                {/* Conditional Fields */}
                {businessType === "B2B" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="paybill" className="text-sm font-medium text-foreground">
                        Paybill Number
                      </Label>
                      <Input
                        id="paybill"
                        placeholder="Enter paybill number"
                        value={paybillNumber}
                        onChange={(e) => setPaybillNumber(e.target.value)}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account" className="text-sm font-medium text-foreground">
                        Account Number
                      </Label>
                      <Input
                        id="account"
                        placeholder="Enter account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="mpesa-phone" className="text-sm font-medium text-foreground">
                      M-PESA Phone Number
                    </Label>
                    <div className="flex items-center space-x-2 bg-background rounded-md border p-2">
                      <div className="flex items-center space-x-1">
                        <img
                          src="https://flagcdn.com/w20/ke.png"
                          alt="KE"
                          className="w-5 h-5 rounded-sm"
                        />
                        <span className="text-sm text-muted-foreground">+254</span>
                      </div>
                      <input
                        id="mpesa-phone"
                        type="tel"
                        placeholder="712345678"
                        value={accountNumber}
                        onChange={(e) =>
                          setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 9))
                        }
                        className="flex-1 bg-transparent outline-none text-sm text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}


            {withdrawalMethod === "bank" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-account" className="text-sm font-medium text-foreground">
                    Bank Account Number
                  </Label>
                  <Input
                    id="bank-account"
                    placeholder="Enter bank account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>
            )}

            {withdrawalMethod === "paybill" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pesapal-account" className="text-sm font-medium text-foreground">
                    Pesapal Account
                  </Label>
                  <Input
                    id="pesapal-account"
                    placeholder="Enter Pesapal account"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} className="min-w-[150px]">
                Save & Continue
              </Button>
            </div>
          </TabsContent>

          {/* --- PIN TAB --- */}
          <TabsContent value="pin" className="space-y-6 mt-6">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">
              Set your withdrawal PIN
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              This PIN will be required for all withdrawal requests
            </p>

            {/* PIN Input Fields */}
            <div className="space-y-6">
              {["Enter PIN", "Confirm PIN"].map((label, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    {label}
                  </Label>
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <input
                        key={i}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        className="w-12 h-12 text-center text-lg font-semibold border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        value={
                          index === 0
                            ? pin[i] || ""
                            : confirmPin[i] || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (index === 0) {
                            const updated = pin.split("");
                            updated[i] = val;
                            setPin(updated.join(""));
                          } else {
                            const updated = confirmPin.split("");
                            updated[i] = val;
                            setConfirmPin(updated.join(""));
                          }

                          // Move to next box automatically
                          if (val && e.target.nextSibling instanceof HTMLInputElement) {
                            e.target.nextSibling.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !e.currentTarget.value) {
                            const prev = e.currentTarget.previousSibling;
                            if (prev instanceof HTMLInputElement) prev.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                  {index === 1 && pinError && (
                    <p className="text-destructive text-xs mt-1">{pinError}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isLoading || pin.length < 4 || confirmPin.length < 4 || !!pinError}
              className="min-w-[150px]"
            >
              {isLoading ? "Setting up..." : "Submit"}
            </Button>
          </div>
        </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
