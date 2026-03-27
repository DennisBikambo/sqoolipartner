
import { useState } from 'react';
import { useAction } from 'convex/react';
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-medium text-foreground block mb-1.5">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

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
    admin_name: string;
  } | null>(null);

  const createPartnerOrg = useAction(api.createPartner.createPartnerOrganization);

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

  const isFormValid = () => Object.keys(validateForm(formData)).length === 0;

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
      setNewPartnerCreds({
        partner_name: result.credentials.partner_name,
        admin_email: result.credentials.admin_email,
        admin_name: formData.adminName,
      });
      setShowCredDialog(true);
      toast.success(result.message || 'Partner organization created successfully!');
      setFormData({
        organizationName: '', partnerEmail: '', partnerPhone: '',
        partnerUsername: '', adminName: '', adminEmail: '', adminPhone: '',
      });
      setTouchedFields(new Set());
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (f: keyof PartnerFormData) =>
    touchedFields.has(f) ? errors[f] : undefined;

  const inputClass = (f: keyof PartnerFormData) =>
    touchedFields.has(f) && errors[f] ? 'border-destructive' : '';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0" showCloseButton={false}>

          {/* Gradient header */}
          <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary-foreground leading-none">
                  Register Partner Organization
                </h2>
                <p className="text-xs text-primary-foreground/70 mt-0.5">
                  Creates a complete partner account with login credentials
                </p>
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
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Organization</p>
              </div>

              <Field label="Organization Name *" error={fieldError('organizationName')}>
                <Input
                  value={formData.organizationName}
                  onChange={(e) => handleChange('organizationName', e.target.value)}
                  onBlur={() => handleBlur('organizationName')}
                  placeholder="Acme Corporation"
                  className={inputClass('organizationName')}
                />
              </Field>

              <Field label="Partner Email *" error={fieldError('partnerEmail')}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.partnerEmail}
                    onChange={(e) => handleChange('partnerEmail', e.target.value)}
                    onBlur={() => handleBlur('partnerEmail')}
                    placeholder="partner@acme.com"
                    className={`pl-9 ${inputClass('partnerEmail')}`}
                  />
                </div>
              </Field>

              <Field label="Partner Phone *" error={fieldError('partnerPhone')}>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={formData.partnerPhone}
                    onChange={(e) => handleChange('partnerPhone', e.target.value)}
                    onBlur={() => handleBlur('partnerPhone')}
                    placeholder="+254 700 000000"
                    className={`pl-9 ${inputClass('partnerPhone')}`}
                  />
                </div>
              </Field>

              <Field label="Partner Username *" error={fieldError('partnerUsername')}>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={formData.partnerUsername}
                    onChange={(e) => handleChange('partnerUsername', e.target.value)}
                    onBlur={() => handleBlur('partnerUsername')}
                    placeholder="acmecorp"
                    className={`pl-9 ${inputClass('partnerUsername')}`}
                  />
                </div>
              </Field>
            </div>

            {/* Right: Admin User */}
            <div className="px-6 py-5 space-y-4 flex flex-col">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="h-6 w-6 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-secondary" />
                </div>
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Admin User</p>
              </div>

              <Field label="Admin Full Name *" error={fieldError('adminName')}>
                <Input
                  value={formData.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  onBlur={() => handleBlur('adminName')}
                  placeholder="John Doe"
                  className={inputClass('adminName')}
                />
              </Field>

              <Field label="Admin Email *" error={fieldError('adminEmail')}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange('adminEmail', e.target.value)}
                    onBlur={() => handleBlur('adminEmail')}
                    placeholder="admin@acme.com"
                    className={`pl-9 ${inputClass('adminEmail')}`}
                  />
                </div>
              </Field>

              <Field label="Admin Phone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={formData.adminPhone}
                    onChange={(e) => handleChange('adminPhone', e.target.value)}
                    onBlur={() => handleBlur('adminPhone')}
                    placeholder="+254 700 000000 (optional)"
                    className="pl-9"
                  />
                </div>
              </Field>

              <div className="mt-auto pt-2">
                <div className="bg-muted/40 rounded-xl p-3.5">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    A password and login extension are auto-generated. Credentials are shown once after creation — save them securely.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">Credentials shown once after creation</p>
            <Button onClick={handleSubmit} disabled={!isFormValid() || loading}>
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Partner'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {newPartnerCreds && (
        <UserCredentialsDialog
          open={showCredDialog}
          onOpenChange={setShowCredDialog}
          email={newPartnerCreds.admin_email}
          userName={newPartnerCreds.admin_name}
          partnerName={newPartnerCreds.partner_name}
        />
      )}
    </>
  );
}
