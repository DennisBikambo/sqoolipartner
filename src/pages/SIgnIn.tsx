import React from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { handleLogin, validateLoginData } from '../utils/handleLogin';
import type { LoginFormData, LoginValidationErrors } from '../types/auth.types';

export default function SignIn() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<keyof LoginFormData>>(new Set());
  const [errors, setErrors] = React.useState<LoginValidationErrors>({});
  
  const [loginData, setLoginData] = React.useState<LoginFormData>({
    email: '',
    password: ''
  });

  // Validate single field
  const validateSingleField = (field: keyof LoginFormData, value: string) => {
    const tempData = { ...loginData, [field]: value };
    const allErrors = validateLoginData(tempData);
    return allErrors[field];
  };

  // Handle field blur (when user leaves field)
  const handleBlur = (field: keyof LoginFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateSingleField(field, loginData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle field change with real-time validation for touched fields
  const handleChange = (field: keyof LoginFormData, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    
    // Only validate if field has been touched
    if (touchedFields.has(field)) {
      const error = validateSingleField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    const allErrors = validateLoginData(loginData);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    const allFields = new Set(Object.keys(loginData) as (keyof LoginFormData)[]);
    setTouchedFields(allFields);

    // Validate all fields
    const newErrors = validateLoginData(loginData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await handleLogin(loginData);

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert(result.message || 'Login successful!');
      // Store token if needed
      if (result.data?.token) {
        localStorage.setItem('authToken', result.data.token);
      }
      // Redirect to dashboard or handle success
      // window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid() && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-r-3xl">
        {/* Background Color */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5a9c92] to-[#4a8c82]"></div>
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-12">
          {/* Top Text */}
          <div className="text-white text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome to Sqooli</h1>
            <p className="text-white/90 text-sm">
              The ultimate school management tool<br />
              designed for everyone
            </p>
          </div>

          {/* Image Placeholder - Replace with your image */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm aspect-[3/4] bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white/50 text-sm">
              [Your Image Here]
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="h-20"></div>
        </div>

        {/* Decorative waves at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" className="w-full h-24 opacity-20">
            <path d="M0,64 C150,100 350,0 600,64 C850,128 1050,0 1200,64 L1200,120 L0,120 Z" fill="currentColor" className="text-white/20"></path>
          </svg>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center lg:justify-end mb-12">
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
              <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
              <p className="text-sm text-muted-foreground">
                Please provide your credentials to proceed
              </p>
            </div>

            <div className="space-y-5" onKeyPress={handleKeyPress}>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@schoolmail.com"
                  value={loginData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full h-11 ${errors.email && touchedFields.has('email') ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
                {errors.email && touchedFields.has('email') && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
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
                    value={loginData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`w-full h-11 pr-10 ${errors.password && touchedFields.has('password') ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && touchedFields.has('password') && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
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
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <a href="#signup" className="text-primary hover:underline font-medium">
                    Learn how to Get Started
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