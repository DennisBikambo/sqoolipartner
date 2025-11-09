'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../hooks/useAuth';
import { UserCredentialsDialog } from './UserCredentialsDialog';
import { toast } from 'sonner';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  role:
    | 'partner_admin'
    | 'accountant'
    | 'campaign_manager'
    | 'viewer'
    | 'super_agent'
    | 'master_agent'
    | 'merchant_admin';
}

export default function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    role: 'viewer',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Id<'permissions'>[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showCredDialog, setShowCredDialog] = useState(false);
  const [newUserCreds, setNewUserCreds] = useState<{ email: string; password: string } | null>(null);

  const { partner } = useAuth();
  const partnerId = partner?._id;

  const permissions = useQuery(api.permission.getAllPermissions);
  const defaultPermission = useQuery(api.permission.getPermissions, { is_default: true });
  const createUser = useMutation(api.user.createUser);

  // Group permissions by category
  const groupedPermissions = (permissions || []).reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category]?.push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  const handleTogglePermission = (id: Id<'permissions'>) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const perms =
      selectedPermissions.length > 0
        ? selectedPermissions
        : defaultPermission?.map((p) => p._id) || [];

    if (perms.length === 0 || !partnerId) {
      toast.error('Missing permissions or partner ID');
      return;
    }

    try {
      const res = await createUser({
        partner_id: partnerId,
        email: formData.email,
        name: formData.name,
        phone: formData.phone || undefined,
        role: formData.role,
        permission_ids: perms,
      });

      // Store new credentials to show in dialog
      setNewUserCreds({ email: formData.email, password: res.generatedPassword });
      setShowCredDialog(true);

      toast.success('User created successfully!');

      // Reset form
      setFormData({ name: '', email: '', phone: '', role: 'viewer' });
      setSelectedPermissions([]);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create user');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a user and assign one or more permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254712345678"
              />
            </div>

            <div>
              <Label>Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val as FormData['role'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="campaign_manager">Campaign Manager</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="merchant_admin">Merchant Admin</SelectItem>
                  <SelectItem value="super_agent">Super Agent</SelectItem>
                  <SelectItem value="master_agent">Master Agent</SelectItem>
                  <SelectItem value="partner_admin">Partner Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissions */}
            <div>
              <Label>Setup Permissions</Label>
              <ScrollArea className="h-80 border rounded-lg p-3">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="mb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                        {category}
                      </h4>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [category]: !prev[category] }))
                        }
                      >
                        {expanded[category] ? 'Hide' : 'Show'}
                      </Badge>
                    </div>

                    {expanded[category] && (
                      <div className="mt-2 space-y-2">
                        {perms?.map((perm) => (
                          <div
                            key={perm._id}
                            className="flex items-center justify-between p-2 hover:bg-muted/20 rounded-lg transition"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedPermissions.includes(perm._id)}
                                onCheckedChange={() => handleTogglePermission(perm._id)}
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{perm.name}</span>
                                {perm.is_default && <Badge variant="secondary">Default</Badge>}
                              </div>
                            </div>
                            {perm.description && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-transparent hover:text-primary"
                                onClick={() =>
                                  setExpanded((prev) => ({ ...prev, [perm.key]: !prev[perm.key] }))
                                }
                              >
                                <Eye
                                  className={`h-4 w-4 ${
                                    expanded[perm.key] ? 'text-primary' : 'text-muted-foreground'
                                  }`}
                                />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </div>

            <Button className="w-full" onClick={handleSubmit}>
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Show Credentials Dialog */}
      <UserCredentialsDialog
        open={showCredDialog}
        onOpenChange={setShowCredDialog}
        email={newUserCreds?.email || ''}
        password={newUserCreds?.password || ''}
      />
    </>
  );
}
