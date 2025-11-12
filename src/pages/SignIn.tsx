'use client';

import React from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { handleLogin, validateLoginData } from '../utils/handleLogin';
import type { LoginFormData, LoginValidationErrors } from '../types/auth.types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { HeroHeader } from '../components/layout/HeroHeader';
import { useAuth } from '../hooks/useAuth';
import { useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocation } from 'react-router-dom';

export default function SignIn() {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Set<keyof LoginFormData>>(new Set());
  const [errors, setErrors] = React.useState<LoginValidationErrors>({});
  const navigate = useNavigate();
  const location = useLocation();

  // Convex mutations
  const loginMutation = useConvexMutation(api.user.login);
  const createSessionMutation = useConvexMutation(api.session.createSession);

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

  // Handle field blur
  const handleBlur = (field: keyof LoginFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateSingleField(field, loginData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle field change with live validation
  const handleChange = (field: keyof LoginFormData, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));

    if (touchedFields.has(field)) {
      const error = validateSingleField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const isFormValid = () => {
    const allErrors = validateLoginData(loginData);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async () => {
    const params = new URLSearchParams(location.search);
    const extension = params.get("extension");
    const allFields = new Set(Object.keys(loginData) as (keyof LoginFormData)[]);
    setTouchedFields(allFields);

    const newErrors = validateLoginData(loginData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please correct the highlighted errors before continuing.');
      return;
    }

    setIsLoading(true);

    try {
  

      let result;
      if (extension) {
        // Convex user login using hooks
        console.log("In here!")
        try {
          const loginResponse = await loginMutation({ 
            email: loginData.email, 
            password: loginData.password 
          });

          if (!loginResponse.user) {
            throw new Error('Invalid login credentials.');
          }

          if (!loginResponse.user.is_account_activated) {
            throw new Error('Account not activated. Contact your partner admin.');
          }

          const sessionResponse = await createSessionMutation({
            user_id: loginResponse.user._id,
          });

          result = {
            success: true,
            message: 'Login successful',
            session: sessionResponse,
            user: loginResponse.user,
          };
        } catch (error: unknown) {
          console.error('Convex login failed:', error);
          let message = 'Login failed';
          if (
            error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof (error as { message?: unknown }).message === 'string'
          ) {
            message = (error as { message: string }).message;
          }
          result = {
            success: false,
            message,
          };
        }
      } else {
        // Default Laravel login
        result = await handleLogin(loginData);
      }

      if (!result?.success) {
        toast.error(result?.message || 'Invalid email or password');
        return;
      }

      toast.success('Login successful! 🎉');

      // Store the Convex session token in cookies if using Convex login
      const sessionToken = (result as { session?: { token?: string } })?.session?.token;
      if (typeof sessionToken === 'string') {
        document.cookie = `convex_session=${sessionToken}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax`;
      }
      
      navigate('/dashboard');
      window.location.reload(); 
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid() && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <>
      <HeroHeader />
      <div className="h-[calc(100vh-64px)] bg-background flex overflow-hidden p-4 lg:p-6">
        {/* Left Side - Green Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-[24px] mr-6">
          {/* Background with teal gradient */}
          <div className="absolute inset-0 bg-[#5a9c92] w-min" />
          
          {/* Green blob covering full container */}
          <div className="absolute inset-0 flex items-start justify-center pt-20">
            
          </div>
          
          <div className="relative h-full flex flex-col items-center justify-between p-0 w-fit rounded-3xl">
          <img 
              src="/images/sign-in/greeb-blob.svg" 
              alt="" 
              className="h-auto z-[10] absolute opacity-30 w-min"
              style={{
                zIndex: 9,
                top: '-6rem',
              }}
            />
            {/* Welcome text */}
            <div className="relative flex flex-col items-center gap-4 z-10">
              {/* Text SVG */}
              <img 
                src="/images/sign-in/text.svg" 
                alt="Welcome to Sqooli - The ultimate school management tool designed for everyone" 
                className="w-full max-w-[437px] top-[2rem] relative"
              />
            </div>

            {/* Background image of students */}
            <div className="flex-1 flex items-end justify-center pb-0 max-w-full">
              <img
                src="/images/sign-in/bg-image.png"
                alt="Students with books"
                className="object-contain relative bottom-[15rem]"
              />
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-[400px]">
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <img 
                src="/images/sign-in/logo.svg" 
                alt="Sqooli" 
                className="h-[60px] w-auto"
              />
            </div>

            {/* Already Signed In Ribbon */}
            {user ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-secondary/10 border-2 border-secondary rounded-lg p-8 text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="w-16 h-16 text-secondary" />
                  </div>
                  <h2 className="text-signin-heading dark:text-foreground">
                    You're Already Signed In!
                  </h2>
                  <p className="text-signin-description dark:text-muted-foreground">
                    Welcome back! You're currently logged in and ready to go.
                  </p>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-11 mt-4"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              /* Sign In Form */
              <div className="flex flex-col gap-8" onKeyPress={handleKeyPress}>
                {/* Header */}
                <div className="flex flex-col gap-2 text-center">
                  <h2 className="text-signin-heading dark:text-foreground">Sign In</h2>
                  <p className="text-signin-description dark:text-muted-foreground">
                    Please provide your credentials to proceed
                  </p>
                </div>

                {/* Form Fields */}
                <div className="flex flex-col gap-4">
                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-signin-label dark:text-foreground">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="james@schoolhub.com"
                      value={loginData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full h-12 text-signin-input dark:text-foreground border-[#D0D5DD] dark:border-border rounded-lg bg-white dark:bg-input ${
                        errors.email && touchedFields.has('email') ? 'border-destructive' : ''
                      }`}
                      disabled={isLoading}
                    />
                    {errors.email && touchedFields.has('email') && (
                      <p className="text-xs text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-signin-label dark:text-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        className={`w-full h-12 pr-10 text-signin-input dark:text-foreground border-[#D0D5DD] dark:border-border rounded-lg bg-white dark:bg-input ${
                          errors.password && touchedFields.has('password') ? 'border-destructive' : ''
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] dark:text-muted-foreground hover:text-[#344054] dark:hover:text-foreground"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && touchedFields.has('password') && (
                      <p className="text-xs text-destructive mt-1">{errors.password}</p>
                    )}
                  </div>

                  {/* Submit Button and Link */}
                  <div className="flex flex-col gap-2 mt-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={!isFormValid() || isLoading}
                      className="w-full bg-[#3498db] hover:bg-[#2980b9] dark:bg-primary dark:hover:bg-primary/90 text-signin-button dark:text-primary-foreground h-12 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

                    <div className="text-center">
                      <p className="text-signin-description dark:text-muted-foreground">
                        Don't have an account?{' '}
                        <a 
                          onClick={() => navigate('/signUp')} 
                          className="text-signin-link dark:text-primary hover:underline cursor-pointer"
                        >
                          Learn how to Get Started
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}