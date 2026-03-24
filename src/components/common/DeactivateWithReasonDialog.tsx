import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface DeactivateWithReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  reasonLabel?: string;
  confirmLabel?: string;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export function DeactivateWithReasonDialog({
  open,
  onOpenChange,
  title = 'Deactivate',
  description = 'Are you sure you want to deactivate this item?',
  reasonLabel = 'Reason for deactivation',
  confirmLabel = 'Deactivate',
  onConfirm,
  loading = false,
}: DeactivateWithReasonDialogProps) {
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label className="text-xs font-medium text-foreground">{reasonLabel}</Label>
          <Textarea
            placeholder="Enter reason..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="resize-none h-[90px] text-sm bg-muted"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
