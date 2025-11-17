/**
 * Create Partner Dialog
 * For Super Admins to create new partner organizations
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
import { Building2, User, Mail, Phone, UserCircle } from 'lucide-react';
import { UserCredentialsDialog } from './UserCredentialsDialog';

interface CreatePartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  // Partner details
  partner_name: string;
  partner_email: string;
  partner_phone: string;
  partner_username: string;

  // Admin user details
  admin_name: string;
  admin_email: string;
  admin_phone: string;
}

export default function CreatePartnerDialog({ open, onOpenChange }: CreatePartnerDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    partner_name: '',
    partner_email: '',
    partner_phone: '',
    partner_username: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
  });

  const [showCredDialog, setShowCredDialog] = useState(false);
  const [newPartnerCreds, setNewPartnerCreds] = useState<{
    partner_name: string;
    admin_email: string;
    admin_password: string;
    admin_extension: string;
    admin_name: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const createPartner = useMutation(api.createPartner.createPartnerOrganization);

  const handleSubmit = async () => {
    // Validation
    if (!formData.partner_name || !formData.partner_email || !formData.partner_username) {
      toast.error('Please fill in all partner details');
      return;
    }

    if (!formData.admin_name || !formData.admin_email) {
      toast.error('Please fill in admin user details');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.partner_email)) {
      toast.error('Please enter a valid partner email');
      return;
    }
    if (!emailRegex.test(formData.admin_email)) {
      toast.error('Please enter a valid admin email');
      return;
    }

    setLoading(true);
    try {
      const res = await createPartner({
        partner_name: formData.partner_name,
        partner_email: formData.partner_email,
        partner_phone: formData.partner_phone,
        partner_username: formData.partner_username,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        admin_phone: formData.admin_phone || undefined,
      });

      // Store credentials to show in dialog
      setNewPartnerCreds({
        partner_name: res.credentials.partner_name,
        admin_email: res.credentials.admin_email,
        admin_password: res.credentials.admin_password,
        admin_extension: res.credentials.admin_extension,
        admin_name: formData.admin_name,
      });
      setShowCredDialog(true);

      toast.success('Partner organization created successfully!');

      // Reset form
      setFormData({
        partner_name: '',
        partner_email: '',
        partner_phone: '',
        partner_username: '',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to create partner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Partner Organization</DialogTitle>
            <DialogDescription>
              Create a new partner organization with an initial admin user. The partner can then manage their own users and campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Partner Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
                <Building2 className="h-4 w-4" />
                Partner Organization Details
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Organization Name *</Label>
                  <Input
                    value={formData.partner_name}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={formData.partner_email}
                      onChange={(e) => setFormData({ ...formData, partner_email: e.target.value })}
                      placeholder="contact@acme.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={formData.partner_phone}
                      onChange={(e) => setFormData({ ...formData, partner_phone: e.target.value })}
                      placeholder="+1234567890"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <Label>Username *</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.partner_username}
                      onChange={(e) => setFormData({ ...formData, partner_username: e.target.value })}
                      placeholder="acme_corp"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique identifier for the partner (lowercase, no spaces)
                  </p>
                </div>
              </div>
            </div>

            {/* Admin User Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
                <User className="h-4 w-4" />
                Partner Admin User Details
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Admin Name *</Label>
                  <Input
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label>Admin Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      placeholder="john@acme.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Admin Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={formData.admin_phone}
                      onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                      placeholder="+1234567890"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> A secure password and extension will be automatically generated for the admin user.
                  You'll receive these credentials after creation.
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Partner Organization'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Show Credentials Dialog */}
      {newPartnerCreds && (
        <UserCredentialsDialog
          open={showCredDialog}
          onOpenChange={setShowCredDialog}
          email={newPartnerCreds.admin_email}
          password={newPartnerCreds.admin_password}
          extension={newPartnerCreds.admin_extension}
          userName={newPartnerCreds.admin_name}
          partnerName={newPartnerCreds.partner_name}
        />
      )}
    </>
  );
}
