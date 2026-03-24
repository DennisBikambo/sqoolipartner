
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Building2, User, Mail, Phone, UserCircle, Loader2, XIcon } from 'lucide-react';
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

  const fieldError = (field: keyof PartnerFormData) =>
    errors[field] && touchedFields.has(field) ? errors[field] : undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0" showCloseButton={false}>
          {/* Gradient header */}
          <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary-foreground leading-none">Register Partner Organization</h2>
                <p className="text-xs text-primary-foreground/70 mt-0.5">Creates a complete partner account with login credentials</p>
              </div>
            </div>
            <DialogClose className="absolute top-4 right-4 p-1.5 rounded-md opacity-70 hover:opacity-100 transition-opacity text-primary-foreground [&_svg]:size-4">
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-2 divide-x divide-border">
            {/* Left: Organization */}
            <div className="px-6 py-5 space-y-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Organization</span>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Organization Name <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.organizationName}
                  onChange={(e) => handleChange('organizationName', e.target.value)}
                  onBlur={() => handleBlur('organizationName')}
                  placeholder="Acme Corporation"
                  className={fieldError('organizationName') ? 'border-destructive' : ''}
                />
                {fieldError('organizationName') && (
                  <p className="text-xs text-destructive mt-1">{fieldError('organizationName')}</p>
                )}
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Partner Email <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.partnerEmail}
                    onChange={(e) => handleChange('partnerEmail', e.target.value)}
                    onBlur={() => handleBlur('partnerEmail')}
                    placeholder="partner@acme.com"
                    className={`pl-9 ${fieldError('partnerEmail') ? 'border-destructive' : ''}`}
                  />
                </div>
                {fieldError('partnerEmail') && (
                  <p className="text-xs text-destructive mt-1">{fieldError('partnerEmail')}</p>
                )}
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Partner Phone <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={formData.partnerPhone}
                    onChange={(e) => handleChange('partnerPhone', e.target.value)}
                    onBlur={() => handleBlur('partnerPhone')}
                    placeholder="+254 700 000000"
                    className={`pl-9 ${fieldError('partnerPhone') ? 'border-destructive' : ''}`}
                  />
                </div>
                {fieldError('partnerPhone') && (
                  <p className="text-xs text-destructive mt-1">{fieldError('partnerPhone')}</p>
                )}
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Partner Username <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={formData.partnerUsername}
                    onChange={(e) => handleChange('partnerUsername', e.target.value)}
                    onBlur={() => handleBlur('partnerUsername')}
                    placeholder="acmecorp"
                    className={`pl-9 ${fieldError('partnerUsername') ? 'border-destructive' : ''}`}
                  />
                </div>
                {fieldError('partnerUsername') && (
                  <p className="text-xs text-destructive mt-1">{fieldError('partnerUsername')}</p>
                )}
              </div>
            </div>

            {/* Right: Admin User */}
            <div className="px-6 py-5 space-y-3.5">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Admin User</span>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Admin Full Name <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  onBlur={() => handleBlur('adminName')}
                  placeholder="John Doe"
                  className={fieldError('adminName') ? 'border-destructive' : ''}
                />
                {fieldError('adminName') && (
                  <p className="text-xs text-destructive mt-1">{fieldError('adminName')}</p>
                )}
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Admin Email <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange('adminEmail', e.target.value)}
                    onBlur={() => handleBlur('adminEmail')}
                    placeholder="admin@acme.com"
                    className={`pl-9 ${fieldError('adminEmail') ? 'border-destructive' : ''}`}
                  />
                </div>
                {fieldError('adminEmail') && (
                  <p className="text-xs text-destructive mt-1">{fieldError('adminEmail')}</p>
                )}
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Admin Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={formData.adminPhone}
                    onChange={(e) => handleChange('adminPhone', e.target.value)}
                    onBlur={() => handleBlur('adminPhone')}
                    placeholder="+254 700 000000"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="bg-muted/40 border border-border rounded-xl p-3 mt-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A password and extension will be auto-generated for the admin user. Save the credentials shown after creation.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">Credentials auto-generated after creation</p>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
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
