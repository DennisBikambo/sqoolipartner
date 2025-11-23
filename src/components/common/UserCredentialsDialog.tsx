import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Copy, Check, Mail, Lock, User, Hash, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
  userName: string;
  partnerName: string;
  extension?: string;
  username?: string;
}

export function UserCredentialsDialog({
  open,
  onOpenChange,
  email,
  password,
  userName,
  partnerName,
  extension,
  username,
}: UserCredentialsDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllCredentials = () => {
    const credentials = [
      `Partner Organization: ${partnerName}`,
      `User Name: ${userName}`,
      `Email: ${email}`,
      username ? `Username: ${username}` : null,
      extension ? `Extension: ${extension}` : null,
      `Password: ${password}`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(credentials);
    toast.success('All credentials copied to clipboard!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Account Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Save these login credentials securely. You'll need them to access the account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Partner Organization */}
          <div className="flex items-center gap-4">
            <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Partner Organization</p>
              <p className="font-medium text-foreground">{partnerName}</p>
            </div>
          </div>

          {/* User Name */}
          <div className="flex items-center gap-4">
            <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">User Name</p>
              <p className="font-medium text-foreground">{userName}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                <span className="font-mono text-sm text-foreground">{email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(email, 'Email')}
                >
                  {copiedField === 'Email' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Optional Username */}
          {username && (
            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Username</p>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                  <span className="font-mono text-sm text-foreground">{username}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(username, 'Username')}
                  >
                    {copiedField === 'Username' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Optional Extension */}
          {extension && (
            <div className="flex items-center gap-4">
              <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Extension</p>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                  <span className="font-mono text-sm text-foreground">{extension}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(extension, 'Extension')}
                  >
                    {copiedField === 'Extension' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Password */}
          <div className="flex items-center gap-4">
            <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Password</p>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                <span className="font-mono text-sm text-foreground">{password}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(password, 'Password')}
                >
                  {copiedField === 'Password' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Warning - using your exact destructive colors */}
          <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="mt-0.5 text-destructive">Warning:</div>
            <p className="text-xs text-destructive font-medium leading-tight">
              Important: Save these credentials now. This is the only time you'll see the password.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={copyAllCredentials} className="w-full sm:w-auto order-2 sm:order-1">
            <Copy className="h-4 w-4 mr-2" />
            Copy All Credentials
          </Button>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto order-1 sm:order-2">
            I've Saved the Credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}