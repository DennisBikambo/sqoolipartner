/**
 * Manage Curricula Dialog
 * For Super Admins to view, edit, and delete curricula
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
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
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { toast } from 'sonner';
import { BookOpen, Edit, Trash2, Search } from 'lucide-react';
import { ConfirmDialog } from './ConfirmationDialog';

interface ManageCurriculaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditingCurriculum {
  id: Id<'curricula'>;
  name: string;
  description: string;
}

export default function ManageCurriculaDialog({ open, onOpenChange }: ManageCurriculaDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCurriculum, setEditingCurriculum] = useState<EditingCurriculum | null>(null);
  const [deletingId, setDeletingId] = useState<Id<'curricula'> | null>(null);
  const [loading, setLoading] = useState(false);

  const curricula = useQuery(api.curricula.listCurricula);
  const updateCurriculum = useMutation(api.curricula.updateCurriculum);
  const deleteCurriculum = useMutation(api.curricula.deleteCurriculum);

  const filteredCurricula = (curricula || []).filter((curriculum) => {
    const query = searchQuery.toLowerCase();
    return (
      curriculum.name.toLowerCase().includes(query) ||
      curriculum.description.toLowerCase().includes(query)
    );
  });

  const handleEdit = (curriculum: { _id: Id<'curricula'>; name: string; description: string }) => {
    setEditingCurriculum({
      id: curriculum._id,
      name: curriculum.name,
      description: curriculum.description,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCurriculum) return;

    if (!editingCurriculum.name.trim()) {
      toast.error('Curriculum name is required');
      return;
    }

    if (!editingCurriculum.description.trim()) {
      toast.error('Description is required');
      return;
    }

    setLoading(true);
    try {
      await updateCurriculum({
        id: editingCurriculum.id,
        fields: {
          name: editingCurriculum.name.trim(),
          description: editingCurriculum.description.trim(),
        },
      });

      toast.success('Curriculum updated successfully!');
      setEditingCurriculum(null);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update curriculum');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setLoading(true);
    try {
      await deleteCurriculum({ id: deletingId });
      toast.success('Curriculum deleted successfully!');
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete curriculum');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Manage Curricula
            </DialogTitle>
            <DialogDescription>
              View, edit, and delete existing curricula in the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search curricula..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{filteredCurricula.length} curricula found</span>
              {searchQuery && <Badge variant="secondary">Searching</Badge>}
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-auto flex-1">
              {filteredCurricula.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No curricula found matching your search' : 'No curricula yet'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCurricula.map((curriculum) => (
                      <TableRow key={curriculum._id}>
                        <TableCell className="font-medium">{curriculum.name}</TableCell>
                        <TableCell className="max-w-md truncate">{curriculum.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(curriculum.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(curriculum)}
                              title="Edit Curriculum"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingId(curriculum._id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete Curriculum"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCurriculum} onOpenChange={(open) => !open && setEditingCurriculum(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Curriculum</DialogTitle>
            <DialogDescription>Make changes to the curriculum details.</DialogDescription>
          </DialogHeader>

          {editingCurriculum && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Curriculum Name *</Label>
                <Input
                  id="edit-name"
                  value={editingCurriculum.name}
                  onChange={(e) =>
                    setEditingCurriculum({ ...editingCurriculum, name: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={editingCurriculum.description}
                  onChange={(e) =>
                    setEditingCurriculum({ ...editingCurriculum, description: e.target.value })
                  }
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingCurriculum(null)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Curriculum"
        description="Are you sure you want to delete this curriculum? This action cannot be undone. Programs using this curriculum may be affected."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
