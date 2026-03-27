import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldCheck, Copy, CheckCheck, Eye, EyeOff, Smartphone, Check } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { authClient } from '../lib/auth-client';
import { DashboardLayout } from '../components/layout/DashboardLayout';

type Step = 'password' | 'scan' | 'confirm' | 'backup';

const STEPS: Step[] = ['password', 'scan', 'confirm', 'backup'];
const STEP_LABELS = ['Verify', 'Scan', 'Confirm', 'Save'];

const APPS = [
  { name: 'Google Authenticator', platform: 'iOS & Android' },
  { name: 'Authy', platform: 'iOS, Android & Desktop' },
  { name: 'Microsoft Authenticator', platform: 'iOS & Android' },
];

export default function Setup2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromOnboarding = new URLSearchParams(location.search).get('from') === 'onboarding';

  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpUri, setTotpUri] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyCode = digits.join('');
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (!totpUri) return;
    QRCode.toDataURL(totpUri, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [totpUri]);

  const handleEnable = async () => {
    if (!password) { toast.error('Please enter your current password'); return; }
    setIsLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({ password });
      if (error) { toast.error(error.message || 'Failed to enable 2FA'); return; }
      setTotpUri(data!.totpURI);
      setBackupCodes(data!.backupCodes ?? []);
      setStep('scan');
    } catch {
      toast.error('Failed to enable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && verifyCode.length === 6 && !isLoading) {
      handleConfirm();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length) {
      const newDigits = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
      setDigits(newDigits);
      digitRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleConfirm = async () => {
    if (verifyCode.length !== 6) { toast.error('Please enter all 6 digits'); return; }
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code: verifyCode });
      if (error) {
        toast.error(error.message || 'Invalid code. Please try again.');
        setDigits(['', '', '', '', '', '']);
        digitRefs.current[0]?.focus();
        return;
      }
      setStep('backup');
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
    toast.success('Backup codes copied');
  };

  const handleCopyKey = () => {
    const secret = totpUri.split('secret=')[1]?.split('&')[0] ?? '';
    navigator.clipboard.writeText(secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success('Setup key copied');
  };

  const handleDone = () => {
    toast.success('Two-factor authentication enabled!');
    navigate(fromOnboarding ? '/onboarding' : '/dashboard');
  };

  return (
    <DashboardLayout title="Set Up Two-Factor Authentication">
      <div className="flex items-start justify-center px-4 py-10 min-h-full">
        <div className="w-full max-w-[460px]">

          {/* Progress bar */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={[
                  'flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                  i < stepIndex
                    ? 'h-7 w-7 bg-secondary text-secondary-foreground'
                    : i === stepIndex
                    ? 'h-7 w-7 bg-primary text-primary-foreground shadow-sm'
                    : 'h-6 w-6 bg-muted text-muted-foreground',
                ].join(' ')}>
                  {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={[
                  'text-xs font-medium hidden sm:block',
                  i === stepIndex ? 'text-foreground' : 'text-muted-foreground',
                ].join(' ')}>
                  {STEP_LABELS[i]}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={[
                    'h-px w-6 sm:w-10 transition-colors duration-300',
                    i < stepIndex ? 'bg-secondary' : 'bg-border',
                  ].join(' ')} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Two-Factor Authentication</h2>
                <p className="text-xs text-white/70 mt-0.5">
                  {step === 'password' && 'Step 1 — Verify your identity'}
                  {step === 'scan' && 'Step 2 — Add to authenticator app'}
                  {step === 'confirm' && 'Step 3 — Confirm it works'}
                  {step === 'backup' && 'Step 4 — Save your backup codes'}
                </p>
              </div>
            </div>

            <div className="px-6 py-6">

              {/* Step 1: password */}
              {step === 'password' && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enter your current password to confirm your identity. You'll then scan a QR code with an authenticator app on your phone.
                  </p>

                  {/* App suggestions */}
                  <div className="bg-muted/50 rounded-xl p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5" />
                      Download one of these apps first
                    </p>
                    {APPS.map((app) => (
                      <div key={app.name} className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{app.name}</span>
                        <span className="text-xs text-muted-foreground">{app.platform}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleEnable()}
                        placeholder="••••••••"
                        className="w-full border border-border rounded-xl px-3.5 py-2.5 pr-10 text-sm bg-background outline-none text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
                        disabled={isLoading}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleEnable}
                    disabled={isLoading || !password}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Setting up...</> : 'Continue to QR Code'}
                  </button>
                </div>
              )}

              {/* Step 2: scan QR */}
              {step === 'scan' && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Open your authenticator app, tap <strong className="text-foreground font-semibold">+</strong> or <strong className="text-foreground font-semibold">Add account</strong>, then scan the QR code below.
                  </p>

                  {/* QR code — always white background for reliable scanning */}
                  <div className="flex justify-center">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-border">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="TOTP QR code" className="h-[180px] w-[180px] block" />
                      ) : (
                        <div className="h-[180px] w-[180px] flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manual key */}
                  {totpUri && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 text-center">Can't scan? Enter this key manually:</p>
                      <div className="bg-muted rounded-xl px-3.5 py-2.5 flex items-center gap-2 group">
                        <code className="text-xs text-foreground flex-1 break-all font-mono tracking-wider">
                          {totpUri.split('secret=')[1]?.split('&')[0] ?? ''}
                        </code>
                        <button
                          onClick={handleCopyKey}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Copy key"
                        >
                          {copiedKey ? <CheckCheck className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setStep('confirm')}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all"
                  >
                    I've added it — Continue
                  </button>
                </div>
              )}

              {/* Step 3: confirm code */}
              {step === 'confirm' && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground leading-relaxed text-center">
                    Enter the 6-digit code shown in your authenticator app to confirm setup.
                  </p>

                  {/* 6-box OTP input */}
                  <div className="flex justify-center gap-2" onPaste={handleDigitPaste}>
                    {digits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { digitRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        autoFocus={i === 0}
                        disabled={isLoading}
                        className={[
                          'h-12 w-11 text-center text-xl font-bold font-mono rounded-xl border-2 bg-background outline-none transition-all',
                          digit ? 'border-primary text-foreground' : 'border-border text-foreground',
                          'focus:border-primary focus:ring-2 focus:ring-primary/15',
                          isLoading ? 'opacity-50' : '',
                        ].join(' ')}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Codes refresh every 30 seconds — enter it quickly.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setStep('scan'); setDigits(['', '', '', '', '', '']); }}
                      className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isLoading || verifyCode.length !== 6}
                      className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : 'Verify & Enable'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: backup codes */}
              {step === 'backup' && (
                <div className="space-y-5">
                  <div className="bg-secondary/10 border border-secondary/25 rounded-xl p-3.5">
                    <p className="text-xs font-semibold text-foreground mb-1">Save your backup codes</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      If you lose your phone, these codes let you sign in. Each code works only once. Store them somewhere safe — a password manager is ideal.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="bg-muted border border-border rounded-lg px-3 py-2 text-center">
                        <code className="text-sm font-mono font-semibold text-foreground tracking-wider">{code}</code>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyBackupCodes}
                    className="w-full border border-border rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
                  >
                    {copiedBackup
                      ? <><CheckCheck className="h-4 w-4 text-secondary" /> Copied to clipboard</>
                      : <><Copy className="h-4 w-4" /> Copy all backup codes</>
                    }
                  </button>

                  <button
                    onClick={handleDone}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Done — Account is secured
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security note */}
          {step !== 'backup' && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Your codes are generated locally — we never see them.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
