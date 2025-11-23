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
import { Building2, User, Mail, Phone, UserCircle, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { UserCredentialsDialog } from './UserCredentialsDialog';
import { handleRegister, validateRegistrationData, getPasswordStrength } from '../../utils/handleRegister';
import type { RegisterFormData, ValidationErrors } from '../../types/auth.types';

interface CreatePartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PartnerFormData extends RegisterFormData {
  organizationName: string;
}

export default function CreatePartnerDialog({ open, onOpenChange }: CreatePartnerDialogProps) {
  const [formData, setFormData] = useState<PartnerFormData>({
    organizationName: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof PartnerFormData>>(new Set());
  const [errors, setErrors] = useState<ValidationErrors & { organizationName?: string }>({});
  const [loading, setLoading] = useState(false);

  const [showCredDialog, setShowCredDialog] = useState(false);
  const [newPartnerCreds, setNewPartnerCreds] = useState<{
    partner_name: string;
    admin_email: string;
    admin_password: string;
    admin_extension: string;
    admin_name: string;
  } | null>(null);

  const createPartner = useMutation(api.partner.register);

  const validateSingleField = (field: keyof PartnerFormData, value: string) => {
    if (field === 'organizationName') {
      if (!value.trim()) return 'Organization name is required';
      if (value.trim().length < 2) return 'Organization name must be at least 2 characters';
      return undefined;
    }

    const tempData: RegisterFormData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      username: formData.username,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      [field]: value
    };
    const allErrors = validateRegistrationData(tempData);
    return allErrors[field as keyof RegisterFormData];
  };

  const handleBlur = (field: keyof PartnerFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateSingleField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof PartnerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (touchedFields.has(field)) {
      const error = validateSingleField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }

    if (field === 'password' && touchedFields.has('confirmPassword')) {
      const tempData: RegisterFormData = {
        ...formData,
        password: value
      };
      const allErrors = validateRegistrationData(tempData);
      setErrors(prev => ({ ...prev, confirmPassword: allErrors.confirmPassword }));
    }
  };

  const isFormValid = () => {
    if (!formData.organizationName.trim() || formData.organizationName.trim().length < 2) {
      return false;
    }

    const registerData: RegisterFormData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      username: formData.username,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };

    const allErrors = validateRegistrationData(registerData);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    const allFields = new Set(Object.keys(formData) as (keyof PartnerFormData)[]);
    setTouchedFields(allFields);

    // Validate organization name
    if (!formData.organizationName.trim() || formData.organizationName.trim().length < 2) {
      setErrors(prev => ({ ...prev, organizationName: 'Organization name is required' }));
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    // Validate registration fields
    const registerData: RegisterFormData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      username: formData.username,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };

    const newErrors = validateRegistrationData(registerData);
    setErrors({ ...newErrors });

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    setLoading(true);

    try {
      // Call the handleRegister function (same as SignUp page)
      const result = await handleRegister(registerData, createPartner);

      if (!result.success) {
        // Handle server-side validation errors
        if (result.errors) {
          const serverErrors: ValidationErrors = {};
          
          // Map Laravel errors (snake_case) to form errors (camelCase)
          if (result.errors.first_name) serverErrors.firstName = result.errors.first_name[0];
          if (result.errors.last_name) serverErrors.lastName = result.errors.last_name[0];
          if (result.errors.email) serverErrors.email = result.errors.email[0];
          if (result.errors.phone) serverErrors.phoneNumber = result.errors.phone[0];
          if (result.errors.username) serverErrors.username = result.errors.username[0];
          if (result.errors.password) serverErrors.password = result.errors.password[0];
          if (result.errors.password_confirmation) serverErrors.confirmPassword = result.errors.password_confirmation[0];

          setErrors(serverErrors);
          toast.error('Please fix the highlighted errors.');
        } else {
          toast.error(result.message || 'Partner registration failed. Please try again.');
        }
        return;
      }

      // Success! Show credentials dialog
      setNewPartnerCreds({
        partner_name: formData.organizationName,
        admin_email: formData.email,
        admin_password: formData.password,
        admin_extension: formData.username, // Use username as extension
        admin_name: `${formData.firstName} ${formData.lastName}`,
      });
      setShowCredDialog(true);

      toast.success(result.message || 'Partner organization registered successfully! 🎉');

      // Reset form
      setFormData({
        organizationName: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        username: '',
        password: '',
        confirmPassword: ''
      });
      setTouchedFields(new Set());
      setErrors({});
      onOpenChange(false);

    } catch (error) {
      console.error('Partner registration error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

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
            </div>

            {/* Admin User Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
                <User className="h-4 w-4" />
                Admin User Details
              </div>

              {/* First/Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    placeholder="John"
                    className={errors.firstName && touchedFields.has('firstName') ? 'border-destructive' : ''}
                  />
                  {errors.firstName && touchedFields.has('firstName') && (
                    <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                    placeholder="Doe"
                    className={errors.lastName && touchedFields.has('lastName') ? 'border-destructive' : ''}
                  />
                  {errors.lastName && touchedFields.has('lastName') && (
                    <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label>Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="admin@acme.com"
                    className={`pl-10 ${errors.email && touchedFields.has('email') ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && touchedFields.has('email') && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label>Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    onBlur={() => handleBlur('phoneNumber')}
                    placeholder="+254 700 000000"
                    className={`pl-10 ${errors.phoneNumber && touchedFields.has('phoneNumber') ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.phoneNumber && touchedFields.has('phoneNumber') && (
                  <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <Label>Username *</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    onBlur={() => handleBlur('username')}
                    placeholder="johndoe"
                    className={`pl-10 ${errors.username && touchedFields.has('username') ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.username && touchedFields.has('username') && (
                  <p className="text-xs text-destructive mt-1">{errors.username}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Unique username for login
                </p>
              </div>

              {/* Password */}
              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                    className={`pr-10 ${errors.password && touchedFields.has('password') ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && touchedFields.has('password') && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
                {passwordStrength && formData.password && !errors.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i < passwordStrength.score ? passwordStrength.color : 'bg-muted'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      Password strength: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label>Confirm Password *</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="••••••••"
                    className={`pr-10 ${
                      errors.confirmPassword && touchedFields.has('confirmPassword')
                        ? 'border-destructive'
                        : passwordsMatch
                        ? 'border-secondary'
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && touchedFields.has('confirmPassword') && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
                {passwordsMatch && touchedFields.has('confirmPassword') && !errors.confirmPassword && (
                  <p className="text-xs text-secondary mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> These credentials will be used for the admin user to log in to their partner account.
                  Make sure to save them securely.
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