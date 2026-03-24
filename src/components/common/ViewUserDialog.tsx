
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Eye, EyeOff, Shield, User, Mail, Smartphone, XIcon } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';
import { getAvatarColor, getInitials } from '../../utils/formatters';

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
      <DialogContent className="max-w-[400px] p-0 overflow-hidden gap-0" showCloseButton={false}>
        {/* Gradient hero */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 pt-10 pb-6">
          <DialogClose className="absolute top-4 right-4 p-1.5 rounded-md opacity-70 hover:opacity-100 transition-opacity text-primary-foreground [&_svg]:size-4">
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogClose>

          {/* Avatar */}
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-3 text-lg font-bold text-white ${getAvatarColor(user.name)}`}>
            {getInitials(user.name)}
          </div>

          {/* Name */}
          <h2 className="text-xl font-bold text-primary-foreground leading-tight mb-2">{user.name}</h2>

          {/* Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-primary-foreground/20 text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
              {user.role.replace(/_/g, ' ')}
            </span>
            <span className={`text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full ${user.is_account_activated ? 'bg-secondary/30' : 'bg-destructive/30'}`}>
              {user.is_account_activated ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Info rows */}
        <div className="px-6 py-4 space-y-0">
          {infoItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <span className="text-sm text-foreground font-medium capitalize ml-4 text-right truncate max-w-[180px]">{value}</span>
            </div>
          ))}
        </div>

        {/* Password section */}
        <div className="px-6 pb-4">
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

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-border bg-muted/20">
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
