import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { HeroHeader } from '../components/layout/HeroHeader';
import { authClient } from '../lib/auth-client';

type Mode = 'totp' | 'backup';

export default function Verify2FA() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('totp');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error('Please enter the code');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'totp') {
        const { error } = await authClient.twoFactor.verifyTotp({
          code: code.trim(),
          trustDevice: true,
        });
        if (error) {
          toast.error(error.message || 'Invalid code. Please try again.');
          return;
        }
      } else {
        const { error } = await authClient.twoFactor.verifyBackupCode({
          code: code.trim(),
        });
        if (error) {
          toast.error(error.message || 'Invalid backup code.');
          return;
        }
      }

      toast.success('Verification successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) handleVerify();
  };

  return (
    <>
      <HeroHeader />
      <div className="h-[calc(100vh-64px)] bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-[400px]">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            {/* Icon + heading */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground">Two-Factor Verification</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === 'totp'
                    ? 'Enter the 6-digit code from your authenticator app'
                    : 'Enter one of your saved backup codes'}
                </p>
              </div>
            </div>

            {/* Code input */}
            <div className="space-y-4">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'totp' ? '000000' : 'XXXX-XXXX'}
                maxLength={mode === 'totp' ? 6 : 20}
                className="w-full border border-border rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest bg-background outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 transition-colors"
                autoFocus
                disabled={isLoading}
              />

              <button
                onClick={handleVerify}
                disabled={isLoading || !code.trim()}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                ) : (
                  'Verify'
                )}
              </button>
            </div>

            {/* Toggle mode */}
            <div className="mt-6 pt-5 border-t border-border flex items-center justify-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                onClick={() => { setMode(m => m === 'totp' ? 'backup' : 'totp'); setCode(''); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {mode === 'totp' ? 'Use a backup code instead' : 'Use authenticator app instead'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
