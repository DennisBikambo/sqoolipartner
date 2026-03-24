import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X } from "lucide-react";

const EMPTY_LINKS = { twitter: "", instagram: "", facebook: "", youtube: "" };

interface SocialMediaModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function SocialMediaModal({ open, onClose, onComplete }: SocialMediaModalProps) {
  const [links, setLinks] = useState(EMPTY_LINKS);

  const handleClose = () => {
    setLinks(EMPTY_LINKS);
    onClose();
  };

  const handleSave = () => {
    onComplete();
    handleClose();
  };

  const setField = (field: keyof typeof links) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setLinks((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="!max-w-[680px] p-0" showCloseButton={false}>
        <DialogHeader className="px-7 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Social Media Links
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Connect your social media profiles to grow your audience
              </p>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close dialog"
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-7 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(
              [
                { id: "twitter", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
                { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
                { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
                { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
              ] as const
            ).map(({ id, label, placeholder }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={`social-${id}`} className="text-xs font-medium">{label}</Label>
                <Input
                  id={`social-${id}`}
                  type="url"
                  placeholder={placeholder}
                  value={links[id]}
                  onChange={setField(id)}
                  className="text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="min-w-[100px]">
              Save Links
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
