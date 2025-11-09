'use client';

import { Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface UserCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
  extension: string;
}

export function UserCredentialsDialog({ open, onOpenChange, email, password , extension}: UserCredentialsDialogProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>User Created Successfully 🎉</DialogTitle>
          <DialogDescription>
            Please copy these credentials — you won’t be able to view them again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between bg-muted p-2 rounded">
            <span className="text-sm font-medium">{email}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(email)}
            >
              <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </Button>
          </div>
          <div className="flex items-center justify-between bg-muted p-2 rounded">
            <span className="text-sm font-medium">{password}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(password)}
            >
              <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </Button>
          </div>
          <div>
            <Label>Extension (Login ID)</Label>
            <div className="flex gap-2">
              <Input value={extension} readOnly />
              <Button onClick={() => navigator.clipboard.writeText(extension)}>
                Copy
              </Button>
            </div>
          </div>
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
