'use client';

import { useState } from 'react';
import { Copy, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface UserCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
  extension: string;
  userName: string;
  partnerName: string;
}

export function UserCredentialsDialog({ 
  open, 
  onOpenChange, 
  email, 
  password, 
  extension,
  userName,
  partnerName,
}: UserCredentialsDialogProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const sendCredentialsEmail = useAction(api.emails.sendUserCredentialsEmail);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const result = await sendCredentialsEmail({
        user_email: "azharahmedtakoy4444@gmail.com", 
        user_name: userName,
        password: password,
        extension: extension,
        partner_name: partnerName,
      });

      if (result.success) {
        setEmailSent(true);
        toast.success('Credentials sent to user email! 📧');
      } else {
        toast.error('Failed to send email. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Error sending credentials email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const loginUrl = `${window.location.origin}/signIn?extension=${extension}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>User Created Successfully</span>
            <span className="text-2xl">🎉</span>
          </DialogTitle>
          <DialogDescription>
            Save these credentials securely — they won't be shown again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Sent Success Banner */}
          {emailSent && (
            <div className="flex items-center gap-2 p-3 bg-muted border border-primary rounded-lg">
              <CheckCircle className="h-5 w-5 text-secondary" />
              <p className="text-sm text-secondary font-medium">
                Credentials sent to {email}
              </p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <div className="flex items-center gap-2">
              <Input value={email} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(email, 'Email')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Password</Label>
            <div className="flex items-center gap-2">
              <Input value={password} readOnly className="flex-1 font-mono" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(password, 'Password')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Extension */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Extension (Login ID)</Label>
            <div className="flex items-center gap-2">
              <Input value={extension} readOnly className="flex-1 font-mono" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(extension, 'Extension')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Login URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Login Link</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={loginUrl} 
                readOnly 
                className="flex-1 text-xs" 
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(loginUrl, 'Login link')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with the user for quick login
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleSendEmail}
              // disabled={isSendingEmail || emailSent}
            >
              
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : emailSent ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Email Sent
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send to User
                </>
              )}
            </Button>
            <Button 
              className="flex-1 bg-primary"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>

          {/* Warning Note */}
          <div className="bg-muted  border border-primary/10  rounded-lg p-3">
            <p className="text-xs text-primary">
              <strong>Important:</strong> Make sure to save or send these credentials before closing this dialog.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}