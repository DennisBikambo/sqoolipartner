
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: "destructive" | "default";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Confirm Action",
  description = "Are you sure you want to proceed? This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  variant = "default",
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <div className="flex flex-col items-center text-center pt-2 pb-1">
          {/* Icon with outer ring */}
          <div className={`h-16 w-16 rounded-3xl flex items-center justify-center mb-5 ${
            isDestructive
              ? "bg-destructive/10 ring-4 ring-destructive/15"
              : "bg-primary/10 ring-4 ring-primary/15"
          }`}>
            {isDestructive ? (
              <AlertTriangle className="h-7 w-7 text-destructive" />
            ) : (
              <CheckCircle2 className="h-7 w-7 text-primary" />
            )}
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold text-center">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-center leading-relaxed max-w-[260px] mx-auto">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex gap-3 sm:flex-row mt-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
