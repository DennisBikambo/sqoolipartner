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
      <DialogContent className="!max-w-[480px] p-0" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Social Media Links
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Setup your social media links to grow your audience
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

        <div className="px-6 pb-6 space-y-4 mt-4">
          {(
            [
              { id: "twitter", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
              { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
              { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
              { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
            ] as const
          ).map(({ id, label, placeholder }) => (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={`social-${id}`} className="text-sm">{label}</Label>
              <Input
                id={`social-${id}`}
                type="url"
                placeholder={placeholder}
                value={links[id]}
                onChange={setField(id)}
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="min-w-[120px]">
              Save Links
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
