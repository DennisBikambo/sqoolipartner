/**
 * Manage Subjects Dialog
 * For Super Admins to view, edit, and delete subjects
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
import { GraduationCap, Edit, Trash2, Search } from 'lucide-react';
import { ConfirmDialog } from './ConfirmationDialog';

interface ManageSubjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditingSubject {
  id: Id<'subjects'>;
  name: string;
}

export default function ManageSubjectsDialog({ open, onOpenChange }: ManageSubjectsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSubject, setEditingSubject] = useState<EditingSubject | null>(null);
  const [deletingId, setDeletingId] = useState<Id<'subjects'> | null>(null);
  const [loading, setLoading] = useState(false);

  const subjects = useQuery(api.subjects.listSubjects);
  const updateSubject = useMutation(api.subjects.updateSubject);
  const deleteSubject = useMutation(api.subjects.deleteSubject);

  const filteredSubjects = (subjects || []).filter((subject) => {
    const query = searchQuery.toLowerCase();
    return subject.name.toLowerCase().includes(query);
  });

  const handleEdit = (subject: { _id: Id<'subjects'>; name: string }) => {
    setEditingSubject({
      id: subject._id,
      name: subject.name,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSubject) return;

    if (!editingSubject.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setLoading(true);
    try {
      await updateSubject({
        id: editingSubject.id,
        fields: {
          name: editingSubject.name.trim(),
        },
      });

      toast.success('Subject updated successfully!');
      setEditingSubject(null);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setLoading(true);
    try {
      await deleteSubject({ id: deletingId });
      toast.success('Subject deleted successfully!');
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete subject');
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Manage Subjects
            </DialogTitle>
            <DialogDescription>
              View, edit, and delete existing subjects in the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{filteredSubjects.length} subjects found</span>
              {searchQuery && <Badge variant="secondary">Searching</Badge>}
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-auto flex-1">
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No subjects found matching your search' : 'No subjects yet'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.map((subject) => (
                      <TableRow key={subject._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <span>{subject.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(subject.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(subject)}
                              title="Edit Subject"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingId(subject._id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete Subject"
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
      <Dialog open={!!editingSubject} onOpenChange={(open) => !open && setEditingSubject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Make changes to the subject name.</DialogDescription>
          </DialogHeader>

          {editingSubject && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Subject Name *</Label>
                <Input
                  id="edit-name"
                  value={editingSubject.name}
                  onChange={(e) =>
                    setEditingSubject({ ...editingSubject, name: e.target.value })
                  }
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingSubject(null)}
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
        title="Delete Subject"
        description="Are you sure you want to delete this subject? This action cannot be undone. Programs using this subject may be affected."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
