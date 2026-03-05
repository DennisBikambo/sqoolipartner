
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
import { Building2, User, Mail, Phone, UserCircle, Loader2 } from 'lucide-react';
import { UserCredentialsDialog } from './UserCredentialsDialog';

interface CreatePartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PartnerFormData {
  organizationName: string;
  partnerEmail: string;
  partnerPhone: string;
  partnerUsername: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}

interface FormErrors {
  organizationName?: string;
  partnerEmail?: string;
  partnerPhone?: string;
  partnerUsername?: string;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+]?[\d\s\-()]+$/;

const validateForm = (data: PartnerFormData): FormErrors => {
  const errors: FormErrors = {};
  if (!data.organizationName.trim() || data.organizationName.trim().length < 2)
    errors.organizationName = 'Organization name must be at least 2 characters';
  if (!data.partnerEmail.trim()) errors.partnerEmail = 'Partner email is required';
  else if (!emailRegex.test(data.partnerEmail)) errors.partnerEmail = 'Please enter a valid email address';
  if (!data.partnerPhone.trim()) errors.partnerPhone = 'Partner phone is required';
  else if (!phoneRegex.test(data.partnerPhone) || data.partnerPhone.replace(/\D/g, '').length < 10)
    errors.partnerPhone = 'Please enter a valid phone number';
  if (!data.partnerUsername.trim() || data.partnerUsername.trim().length < 3)
    errors.partnerUsername = 'Username must be at least 3 characters';
  if (!data.adminName.trim() || data.adminName.trim().length < 2)
    errors.adminName = 'Admin name must be at least 2 characters';
  if (!data.adminEmail.trim()) errors.adminEmail = 'Admin email is required';
  else if (!emailRegex.test(data.adminEmail)) errors.adminEmail = 'Please enter a valid email address';
  return errors;
};

export default function CreatePartnerDialog({ open, onOpenChange }: CreatePartnerDialogProps) {
  const [formData, setFormData] = useState<PartnerFormData>({
    organizationName: '',
    partnerEmail: '',
    partnerPhone: '',
    partnerUsername: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });

  const [touchedFields, setTouchedFields] = useState<Set<keyof PartnerFormData>>(new Set());
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const [showCredDialog, setShowCredDialog] = useState(false);
  const [newPartnerCreds, setNewPartnerCreds] = useState<{
    partner_name: string;
    admin_email: string;
    admin_password: string;
    admin_extension: string;
    admin_name: string;
  } | null>(null);

  const createPartnerOrg = useMutation(api.createPartner.createPartnerOrganization);

  const handleBlur = (field: keyof PartnerFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const allErrors = validateForm({ ...formData });
    setErrors(prev => ({ ...prev, [field]: allErrors[field] }));
  };

  const handleChange = (field: keyof PartnerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touchedFields.has(field)) {
      const allErrors = validateForm({ ...formData, [field]: value });
      setErrors(prev => ({ ...prev, [field]: allErrors[field] }));
    }
  };

  const isFormValid = () => {
    return Object.keys(validateForm(formData)).length === 0;
  };

  const handleSubmit = async () => {
    const allFields = new Set(Object.keys(formData) as (keyof PartnerFormData)[]);
    setTouchedFields(allFields);

    const newErrors = validateForm(formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    setLoading(true);

    try {
      const result = await createPartnerOrg({
        partner_name: formData.organizationName,
        partner_email: formData.partnerEmail,
        partner_phone: formData.partnerPhone,
        partner_username: formData.partnerUsername,
        admin_name: formData.adminName,
        admin_email: formData.adminEmail,
        admin_phone: formData.adminPhone || undefined,
      });

      // Success! Show credentials dialog
      setNewPartnerCreds({
        partner_name: result.credentials.partner_name,
        admin_email: result.credentials.admin_email,
        admin_password: result.credentials.admin_password,
        admin_extension: result.credentials.admin_extension,
        admin_name: formData.adminName,
      });
      setShowCredDialog(true);

      toast.success(result.message || 'Partner organization created successfully!');

      // Reset form
      setFormData({
        organizationName: '',
        partnerEmail: '',
        partnerPhone: '',
        partnerUsername: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
      });
      setTouchedFields(new Set());
      setErrors({});
      onOpenChange(false);

    } catch (error) {
      console.error('Partner creation error:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Partner Organization</DialogTitle>
            <DialogDescription>
              Register a new partner organization with an admin user. This creates a complete partner account with login credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Organization Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
                <Building2 className="h-4 w-4" />
                Organization Details
              </div>

              <div>
                <Label>Organization Name *</Label>
                <Input
                  value={formData.organizationName}
                  onChange={(e) => handleChange('organizationName', e.target.value)}
                  onBlur={() => handleBlur('organizationName')}
                  placeholder="Acme Corporation"
                  className={errors.organizationName && touchedFields.has('organizationName') ? 'border-destructive' : ''}
                />
                {errors.organizationName && touchedFields.has('organizationName') && (
                  <p className="text-xs text-destructive mt-1">{errors.organizationName}</p>
                )}
              </div>

              <div>
                <Label>Partner Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.partnerEmail}
                    onChange={(e) => handleChange('partnerEmail', e.target.value)}
                    onBlur={() => handleBlur('partnerEmail')}
                    placeholder="partner@acme.com"
                    className={`pl-10 ${errors.partnerEmail && touchedFields.has('partnerEmail') ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.partnerEmail && touchedFields.has('partnerEmail') && (
                  <p className="text-xs text-destructive mt-1">{errors.partnerEmail}</p>
                )}
              </div>

              <div>
                <Label>Partner Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={formData.partnerPhone}
                    onChange={(e) => handleChange('partnerPhone', e.target.value)}
                    onBlur={() => handleBlur('partnerPhone')}
                    placeholder="+254 700 000000"
                    className={`pl-10 ${errors.partnerPhone && touchedFields.has('partnerPhone') ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.partnerPhone && touchedFields.has('partnerPhone') && (
                  <p className="text-xs text-destructive mt-1">{errors.partnerPhone}</p>
                )}
              </div>

              <div>
                <Label>Partner Username *</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.partnerUsername}
                    onChange={(e) => handleChange('partnerUsername', e.target.value)}
                    onBlur={() => handleBlur('partnerUsername')}
                    placeholder="acmecorp"
                    className={`pl-10 ${errors.partnerUsername && touchedFields.has('partnerUsername') ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.partnerUsername && touchedFields.has('partnerUsername') && (
                  <p className="text-xs text-destructive mt-1">{errors.partnerUsername}</p>
                )}
              </div>
            </div>

            {/* Admin User Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
                <User className="h-4 w-4" />
                Admin User Details
              </div>

              <div>
                <Label>Admin Full Name *</Label>
                <Input
                  value={formData.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  onBlur={() => handleBlur('adminName')}
                  placeholder="John Doe"
                  className={errors.adminName && touchedFields.has('adminName') ? 'border-destructive' : ''}
                />
                {errors.adminName && touchedFields.has('adminName') && (
                  <p className="text-xs text-destructive mt-1">{errors.adminName}</p>
                )}
              </div>

              <div>
                <Label>Admin Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange('adminEmail', e.target.value)}
                    onBlur={() => handleBlur('adminEmail')}
                    placeholder="admin@acme.com"
                    className={`pl-10 ${errors.adminEmail && touchedFields.has('adminEmail') ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.adminEmail && touchedFields.has('adminEmail') && (
                  <p className="text-xs text-destructive mt-1">{errors.adminEmail}</p>
                )}
              </div>

              <div>
                <Label>Admin Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={formData.adminPhone}
                    onChange={(e) => handleChange('adminPhone', e.target.value)}
                    onBlur={() => handleBlur('adminPhone')}
                    placeholder="+254 700 000000 (optional)"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> A password and extension will be auto-generated for the admin user. These credentials will be shown after creation — make sure to save them securely.
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering Partner...
                </>
              ) : (
                'Register Partner Organization'
              )}
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
          userName={newPartnerCreds.admin_name}
          partnerName={newPartnerCreds.partner_name}
        />
      )}
    </>
  );
}