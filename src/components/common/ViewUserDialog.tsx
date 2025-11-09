'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Eye, EyeOff, Shield, User, Mail, Smartphone, Link, Copy } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';

export interface ViewUser {
  _id: Id<'users'>;
  name: string;
  email: string;
  role: 'partner_admin' | 'accountant' | 'campaign_manager' | 'viewer' | 'super_agent' | 'master_agent' | 'merchant_admin';
  phone?: string;
  is_account_activated: boolean;
  password_hash?: string;
  extension?:string
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>View User</DialogTitle>
          <DialogDescription>User details and credentials</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user.extension}</span>
            {user.extension && (
                <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => {
                    const url = `${window.location.origin}/signIn?extension=${user.extension}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Extension URL copied to clipboard!');
                }}
                >
                <Copy className="h-4 w-4 text-muted-foreground" />
                </Button>
            )}
            </div>


          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>

          {user.phone && (
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{user.role.replace(/_/g, ' ')}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Account:</span>
            <span className={user.is_account_activated ? 'text-green-600' : 'text-red-600'}>
              {user.is_account_activated ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="relative mt-4">
            <label className="text-xs text-muted-foreground block mb-1">Password (hashed)</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={user.password_hash || '************'}
                readOnly
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {showPassword && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Password visible — auto-hiding in 2 minutes
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
