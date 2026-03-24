
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Eye, EyeOff, Shield, User, Mail, Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

export interface ViewUser {
  _id: Id<'users'>;
  name: string;
  email: string;
  role: 'partner_admin' | 'accountant' | 'campaign_manager' | 'viewer' | 'super_agent' | 'master_agent' | 'merchant_admin';
  phone?: string;
  is_account_activated: boolean;
  password_hash?: string;
}

interface ViewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ViewUser | null;
}

export default function ViewUserDialog({ open, onOpenChange, user }: ViewUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showPassword) {
      const t = setTimeout(() => setShowPassword(false), 120000);
      setTimer(t);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showPassword]);

  if (!user) return null;

  const displayPhone = user.phone
    ? user.phone.startsWith('+') ? user.phone : `+254 ${user.phone}`
    : null;

  const infoItems = [
    { icon: User, label: 'Full Name', value: user.name },
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Smartphone, label: 'Phone', value: displayPhone ?? '—' },
    { icon: Shield, label: 'Role', value: user.role.replace(/_/g, ' ') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-7 pt-6 pb-4 border-b border-border bg-card">
          <DialogTitle className="text-base font-bold">User Details</DialogTitle>
        </DialogHeader>

        <div>
          {/* Info grid */}
          <div className="px-7 py-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-5">
              {infoItems.map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground font-medium capitalize">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-5">
              {user.is_account_activated
                ? <CheckCircle2 className="h-4 w-4 text-secondary" />
                : <XCircle className="h-4 w-4 text-destructive" />
              }
              <span className={`text-sm font-semibold ${user.is_account_activated ? 'text-secondary' : 'text-destructive'}`}>
                {user.is_account_activated ? 'Account Active' : 'Account Inactive'}
              </span>
            </div>

            {/* Password */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Password (hashed)</p>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={user.password_hash || '************'}
                  readOnly
                  className="pr-10 text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {showPassword && (
                <p className="text-[10px] text-muted-foreground mt-1">Auto-hiding in 2 minutes</p>
              )}
            </div>
          </div>

        </div>

        <div className="flex justify-end px-7 py-4 border-t border-border bg-card">
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
