/**
 * Create Subject Dialog
 * For Super Admins to create new subjects
 */

'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';

interface CreateSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateSubjectDialog({ open, onOpenChange }: CreateSubjectDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const createSubject = useMutation(api.subjects.createSubject);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    setLoading(true);
    try {
      await createSubject({
        name: name.trim(),
      });

      toast.success('Subject created successfully!');

      // Reset form
      setName('');
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Create Subject
          </DialogTitle>
          <DialogDescription>
            Add a new subject to the system that can be used in programs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mathematics, Physics, English"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Subject'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
