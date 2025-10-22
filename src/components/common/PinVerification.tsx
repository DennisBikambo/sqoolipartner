"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const LOCK_DURATION = 5 * 60 * 1000; // 5 minutes

interface PinVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  correctPin: string;
  userId: string;
  onSuccess: () => void;
}

export function PinVerificationDialog({
  open,
  onClose,
  correctPin,
  userId,
  onSuccess,
}: PinVerificationDialogProps) {
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  const lockKey = `wallet_lock_${userId}`;
  const attemptsKey = `wallet_attempts_${userId}`;
  const pinInput = pinDigits.join("");

  // Load lock state
  useEffect(() => {
    const storedLock = Number(localStorage.getItem(lockKey));
    const storedAttempts = Number(localStorage.getItem(attemptsKey)) || 0;
    if (storedLock && Date.now() < storedLock) {
      setLockedUntil(storedLock);
      setAttempts(storedAttempts);
    } else {
      localStorage.removeItem(lockKey);
      localStorage.removeItem(attemptsKey);
    }
  }, [lockKey, attemptsKey]);

  // Countdown logic
  useEffect(() => {
    if (lockedUntil) {
      const interval = setInterval(() => {
        const remaining = lockedUntil - Date.now();
        if (remaining <= 0) {
          setLockedUntil(null);
          setAttempts(0);
          setCountdown(0);
          setError("");
          localStorage.removeItem(lockKey);
          localStorage.removeItem(attemptsKey);
        } else {
          setCountdown(Math.ceil(remaining / 1000));
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [lockedUntil, lockKey, attemptsKey]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...pinDigits];
    newDigits[index] = value;
    setPinDigits(newDigits);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
    else if (!value && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const verifyPin = () => {
    if (lockedUntil && Date.now() < lockedUntil) return;

    if (pinInput === correctPin) {
      setError("");
      setAttempts(0);
      localStorage.removeItem(attemptsKey);
      onSuccess();
      onClose();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem(attemptsKey, String(newAttempts));

      if (newAttempts >= 3) {
        const lockTime = Date.now() + LOCK_DURATION;
        setLockedUntil(lockTime);
        localStorage.setItem(lockKey, String(lockTime));
        setError("Too many failed attempts. Locked for 5 minutes.");
      } else {
        setError(`Incorrect PIN. ${3 - newAttempts} attempts left.`);
      }
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!open) setPinDigits(["", "", "", ""]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enter Wallet PIN</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-3 mt-4">
          {pinDigits.map((digit, i) => (
            <Input
              key={i}
              type="password"
              maxLength={1}
              value={digit}
              ref={(el) => (inputRefs.current[i] = el)}
              onChange={(e) => handleChange(i, e.target.value)}
              className="w-12 h-12 text-center text-xl font-bold tracking-widest"
            />
          ))}
        </div>

        {lockedUntil && countdown > 0 && (
          <p className="text-sm text-destructive text-center mt-3">
            Locked. Try again in {formatCountdown(countdown)}
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive text-center mt-3">{error}</p>
        )}

        <div className="flex justify-center mt-4">
          <Button onClick={verifyPin} disabled={pinInput.length !== 4 || !!lockedUntil}>
            Verify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
