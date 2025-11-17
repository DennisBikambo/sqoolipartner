/**
 * Create Curriculum Dialog
 * For Super Admins to create new curricula
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
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

interface CreateCurriculumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCurriculumDialog({ open, onOpenChange }: CreateCurriculumDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const createCurriculum = useMutation(api.curricula.createCurriculum);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a curriculum name');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      await createCurriculum({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      toast.success('Curriculum created successfully!');

      // Reset form
      setFormData({
        name: '',
        description: '',
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to create curriculum');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Create Curriculum
          </DialogTitle>
          <DialogDescription>
            Add a new curriculum to the system that can be used for programs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Curriculum Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Cambridge IGCSE"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this curriculum..."
              rows={4}
              disabled={loading}
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
              {loading ? 'Creating...' : 'Create Curriculum'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
