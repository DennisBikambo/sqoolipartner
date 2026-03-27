import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authClient } from '../../lib/auth-client';

export function TwoFAReminderBanner() {
  const { user } = useAuth();
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!user) return null;

  const twoFactorEnabled = (session?.user as { twoFactorEnabled?: boolean })?.twoFactorEnabled;
  if (twoFactorEnabled || dismissed) return null;

  return (
    <div className="bg-primary/[0.07] border-b border-primary/20 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <ShieldAlert className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold text-foreground">Secure your account</span>
          <span className="text-sm text-muted-foreground ml-1.5 hidden sm:inline">
            — enable two-factor authentication to protect against unauthorized access.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate('/setup-2fa')}
          className="bg-primary text-primary-foreground text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
        >
          Set up 2FA
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
