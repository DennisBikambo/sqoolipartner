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
import discussion from "../assets/discussion.webp";
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
      <div className="min-h-screen bg-background flex">
        {/* Left Side */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-r-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5a9c92] to-[#4a8c82]" />

          <div className="relative h-full flex flex-col justify-between p-12">
            <div className="text-white text-center space-y-2">
              <h1 className="text-3xl font-bold">Welcome to Sqooli</h1>
              <p className="text-white/90 text-sm">
                The ultimate school management tool<br />designed for everyone
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-card border border-border">
                <img
                  src={discussion}
                  alt="Student discussion"
                  className="object-cover w-full h-full opacity-90 mix-blend-multiply dark:mix-blend-normal"
                />

                {/* Decorative target lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 border border-primary/30 rounded-full" />
                  <div className="absolute top-1/2 left-0 w-1/4 h-px bg-primary/30" />
                  <div className="absolute top-1/2 right-0 w-1/4 h-px bg-primary/30" />
                  <div className="absolute top-0 left-1/2 h-1/4 w-px bg-primary/30" />
                  <div className="absolute bottom-0 left-1/2 h-1/4 w-px bg-primary/30" />
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              </div>
            </div>

            <div className="h-20" />
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" className="w-full h-24 opacity-20">
              <path
                d="M0,64 C150,100 350,0 600,64 C850,128 1050,0 1200,64 L1200,120 L0,120 Z"
                fill="currentColor"
                className="text-white/20"
              />
            </svg>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
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

            {/* Already Signed In Ribbon */}
            {user ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-secondary/10 border-2 border-secondary rounded-lg p-8 text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="w-16 h-16 text-secondary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    You're Already Signed In!
                  </h2>
                  <p className="text-muted-foreground">
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
              <div className="space-y-6" onKeyPress={handleKeyPress}>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
                  <p className="text-sm text-muted-foreground">
                    Please provide your credentials to proceed
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Email */}
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
                      className={`w-full h-11 ${
                        errors.email && touchedFields.has('email') ? 'border-destructive' : ''
                      }`}
                      disabled={isLoading}
                    />
                    {errors.email && touchedFields.has('email') && (
                      <p className="text-xs text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        className={`w-full h-11 pr-10 ${
                          errors.password && touchedFields.has('password') ? 'border-destructive' : ''
                        }`}
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

                  {/* Submit Button */}
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
                      <a onClick={() => navigate('/signUp')} className="text-primary hover:underline font-medium cursor-pointer">
                        Learn how to Get Started
                      </a>
                    </p>
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