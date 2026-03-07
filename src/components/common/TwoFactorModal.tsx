import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type TwoFAScreen = "enter" | "verify" | "success";
type VerifyMethod = "phone" | "email";

interface TwoFactorModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  defaultEmail?: string;
  defaultPhone?: string;
}

const slideVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export function TwoFactorModal({
  open,
  onClose,
  onComplete,
  defaultEmail = "",
  defaultPhone = "",
}: TwoFactorModalProps) {
  const [screen, setScreen] = useState<TwoFAScreen>("enter");
  const [method, setMethod] = useState<VerifyMethod>("phone");
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Reset all state whenever the modal opens or default values change
  useEffect(() => {
    if (open) {
      setScreen("enter");
      setMethod("phone");
      setPhone(defaultPhone);
      setEmail(defaultEmail);
      setCode("");
      setIsSending(false);
      setIsVerifying(false);
    }
  }, [open, defaultPhone, defaultEmail]);

  const handleClose = () => {
    onClose();
  };

  const handleSendCode = async () => {
    setIsSending(true);
    // Simulated send — replace with real OTP call when ready
    await new Promise((r) => setTimeout(r, 1500));
    setIsSending(false);
    setScreen("verify");
  };

  const handleVerify = async () => {
    if (!code) return;
    setIsVerifying(true);
    // Simulated verify — replace with real OTP check when ready
    await new Promise((r) => setTimeout(r, 1200));
    setIsVerifying(false);
    setScreen("success");
  };

  const handleOkay = () => {
    onComplete();
    handleClose();
  };

  const canSend = method === "phone" ? phone.length >= 9 : email.includes("@");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="!max-w-[480px] p-0 overflow-hidden" showCloseButton={false}>
        <AnimatePresence mode="wait">
          {/* ── Screen 1: Choose method + enter contact ── */}
          {screen === "enter" && (
            <motion.div
              key="enter"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Two Factor Authentication Setup
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose how you'd like to receive your verification code
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close dialog"
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Method selector */}
              <div role="radiogroup" aria-label="Verification method" className="grid grid-cols-2 gap-3">
                {(["phone", "email"] as VerifyMethod[]).map((m) => (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={method === m}
                    onClick={() => setMethod(m)}
                    className={[
                      "rounded-lg border-2 py-3 px-4 text-sm font-medium transition-all text-left",
                      method === m
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-muted-foreground",
                    ].join(" ")}
                  >
                    {m === "phone" ? "Phone number" : "Email address"}
                  </button>
                ))}
              </div>

              {/* Phone input */}
              {method === "phone" && (
                <div className="space-y-2">
                  <Label className="text-sm">Phone Number</Label>
                  <p className="text-xs text-muted-foreground">
                    We will send an OTP code to your phone number for verification
                  </p>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 border rounded-lg px-3 bg-muted/30 shrink-0">
                      <span className="text-sm text-muted-foreground" aria-label="Kenya +254">🇰🇪 +254</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="712 345 678"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {/* Email input */}
              {method === "email" && (
                <div className="space-y-2">
                  <Label className="text-sm">Email Address</Label>
                  <p className="text-xs text-muted-foreground">
                    We will send an OTP code to your email address for verification
                  </p>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handleSendCode}
                disabled={isSending || !canSend}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending code...
                  </>
                ) : (
                  "Send Code"
                )}
              </Button>
            </motion.div>
          )}

          {/* ── Screen 2: Enter OTP ── */}
          {screen === "verify" && (
            <motion.div
              key="verify"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Enter Verification Code</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {method === "phone"
                      ? `Code sent to +254 ${phone}`
                      : `Code sent to ${email}`}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close dialog"
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp-code" className="text-sm">Enter Code</Label>
                <Input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="------"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying || code.length < 4}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
                <button
                  onClick={() => {
                    setScreen("enter");
                    setCode("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline text-center"
                >
                  Didn't receive a code? Go back
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Screen 3: Success ── */}
          {screen === "success" && (
            <motion.div
              key="success"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="p-8 flex flex-col items-center text-center space-y-5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center"
                aria-hidden="true"
              >
                <Check className="h-10 w-10 text-white stroke-[2.5]" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  2FA Completed Successfully
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  You have successfully setup your 2FA contact details
                </p>
              </div>
              <Button onClick={handleOkay} className="min-w-[140px] rounded-lg">
                Okay
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
