// types/auth.types.ts

import type { Id } from "../../convex/_generated/dataModel";

/**
 * Registration form data structure (camelCase for React)
 */
export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  confirmPassword: string;
}

/**
 * Registration payload sent to API (snake_case for Laravel)
 */
export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  password_confirmation: string;
}

/**
 * Client-side validation errors (camelCase)
 */
export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * API validation errors from Laravel (snake_case)
 */
export interface ApiValidationErrors {
  first_name?: string[];
  last_name?: string[];
  email?: string[];
  phone?: string[];
  username?: string[];
  password?: string[];
  password_confirmation?: string[];
}

/**
 * Registration response from API
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    username: string;
    created_at: string;
    updated_at: string;
  };
  errors?: ApiValidationErrors;
}

/**
 * Login form data structure
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Login validation errors
 */
export interface LoginValidationErrors {
  email?: string;
  password?: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthenticatedUser;
}

/**
 * Authenticated user data from Laravel API
 * Combines Laravel user fields with optional Convex partner fields
 */
export interface AuthenticatedUser {
  // Laravel user fields (snake_case from API)
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  username: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;

  // Optional Convex partner fields
  _id?: Id<"partners">;
  _creationTime?: number;
  laravelUserId?: number;
  status?: "pending" | "approved" | "declined" | "suspended";
  profile_completed?: boolean;
  remarks?: string;
  isAuthenticated?: boolean;
}

/**
 * Password strength result
 */
export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

/**
 * Logout response
 */
export interface LogoutResponse {
  success: boolean;
  error?: string;
}

/**
 * useAuth hook return type
 */
export interface UseAuthReturn {
  user: AuthenticatedUser | null;
  partner: AuthenticatedUser | null;
  loading: boolean;
  error: string | null;
  refetch?: () => void | Promise<void>;
}