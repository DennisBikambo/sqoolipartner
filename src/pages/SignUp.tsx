import React from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { handleRegister, validateRegistrationData, getPasswordStrength } from '../utils/handleRegister';
import type { RegisterFormData, ValidationErrors } from '../types/auth.types';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<keyof RegisterFormData>>(new Set());
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  
  const [signupData, setSignupData] = React.useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // Validate single field
  const validateSingleField = (field: keyof RegisterFormData, value: string) => {
    const tempData = { ...signupData, [field]: value };
    const allErrors = validateRegistrationData(tempData);
    return allErrors[field];
  };

  // Handle field blur (when user leaves field)
  const handleBlur = (field: keyof RegisterFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateSingleField(field, signupData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle field change with real-time validation for touched fields
  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
    
    // Only validate if field has been touched
    if (touchedFields.has(field)) {
      const error = validateSingleField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }

    // Special case: if confirm password is touched and password changes, revalidate confirm
    if (field === 'password' && touchedFields.has('confirmPassword')) {
      const tempData = { ...signupData, password: value };
      const allErrors = validateRegistrationData(tempData);
      setErrors(prev => ({ ...prev, confirmPassword: allErrors.confirmPassword }));
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    const allErrors = validateRegistrationData(signupData);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    const allFields = new Set(Object.keys(signupData) as (keyof RegisterFormData)[]);
    setTouchedFields(allFields);

    // Validate all fields
    const newErrors = validateRegistrationData(signupData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await handleRegister(signupData);

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert(result.message || 'Registration successful! You can now sign in.');
      // Redirect to login or handle success
      // window.location.href = '/login';
    } catch (error) {
      console.error('Registration error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = signupData.password ? getPasswordStrength(signupData.password) : null;
  const passwordsMatch = signupData.password && signupData.confirmPassword && signupData.password === signupData.confirmPassword;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-r-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5a9c92] to-[#4a8c82]"></div>
        
        <div className="relative h-full flex flex-col justify-between p-12">
          <div className="text-white text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome to Sqooli</h1>
            <p className="text-white/90 text-sm">
              The ultimate school management tool<br />
              designed for everyone
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm aspect-[3/4] bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white/50 text-sm">
              [Your Image Here]
            </div>
          </div>

          <div className="h-20"></div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" className="w-full h-24 opacity-20">
            <path d="M0,64 C150,100 350,0 600,64 C850,128 1050,0 1200,64 L1200,120 L0,120 Z" fill="currentColor" className="text-white/20"></path>
          </svg>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-8">
          {/* Logo */}
          <div className="flex justify-center lg:justify-end mb-8">
            <div className="flex items-center gap-0.5 text-3xl font-bold">
              <span className="text-primary bg-primary/10 px-2 py-1 rounded">s</span>
              <span className="text-secondary bg-secondary/10 px-2 py-1 rounded">q</span>
              <span className="text-chart-3 bg-chart-3/10 px-2 py-1 rounded">o</span>
              <span className="text-chart-3 bg-chart-3/10 px-2 py-1 rounded">o</span>
              <span className="text-secondary bg-secondary/10 px-2 py-1 rounded">l</span>
              <span className="text-chart-5 bg-chart-5/10 px-2 py-1 rounded">i</span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Sign Up</h2>
              <p className="text-sm text-muted-foreground">
                Create your account to get started
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    First Name
                  </label>
                  <Input
                    type="text"
                    placeholder="John"
                    value={signupData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    className={`h-11 ${errors.firstName && touchedFields.has('firstName') ? 'border-destructive' : ''}`}
                  />
                  {errors.firstName && touchedFields.has('firstName') && (
                    <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Doe"
                    value={signupData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                    className={`h-11 ${errors.lastName && touchedFields.has('lastName') ? 'border-destructive' : ''}`}
                  />
                  {errors.lastName && touchedFields.has('lastName') && (
                    <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@schoolmail.com"
                  value={signupData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`h-11 ${errors.email && touchedFields.has('email') ? 'border-destructive' : ''}`}
                />
                {errors.email && touchedFields.has('email') && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="+254 700 000000"
                  value={signupData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  onBlur={() => handleBlur('phoneNumber')}
                  className={`h-11 ${errors.phoneNumber && touchedFields.has('phoneNumber') ? 'border-destructive' : ''}`}
                />
                {errors.phoneNumber && touchedFields.has('phoneNumber') && (
                  <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="johndoe"
                  value={signupData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  className={`h-11 ${errors.username && touchedFields.has('username') ? 'border-destructive' : ''}`}
                />
                {errors.username && touchedFields.has('username') && (
                  <p className="text-xs text-destructive mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`h-11 pr-10 ${errors.password && touchedFields.has('password') ? 'border-destructive' : ''}`}
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
                {passwordStrength && signupData.password && !errors.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i < passwordStrength.score ? passwordStrength.color : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      Password strength: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`h-11 pr-10 ${
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

              <Button
                onClick={handleSubmit}
                disabled={!isFormValid() || isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <a href="#login" className="text-primary hover:underline font-medium">
                    Sign In
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}