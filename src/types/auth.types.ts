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
  is_first_login: boolean;
}

export interface Partner {
  _id: Id<"partners">;
  _creationTime: number;
  name: string;
  laravelUserId?: number;
  email: string;
  phone?: string;
  is_first_login?: boolean;
  username?: string;
  role?: string;
  permission_ids: Id<"permissions">[]; 
}

/**
 * Convex User data (from users table - for extension-based logins)
 */
export interface ConvexUser {
  _id: Id<"users">;
  _creationTime: number;
  partner_id: Id<"partners">;
  email: string;
  name: string;
  phone?: string;
  role: "super_admin" | "partner_admin" | "accountant" | "campaign_manager" | "viewer" | "super_agent" | "master_agent" | "merchant_admin";
  permission_ids: Id<"permissions">[];
  extension: string;
  is_active: boolean;
  is_first_login: boolean;
  is_account_activated: boolean;
  last_login?: string;
  updated_at?: string;
}

/**
 * Convex Partner data (from partners table)
 */
export interface ConvexPartner {
  _id: Id<"partners">;
  _creationTime: number;
  name: string;
  laravelUserId: number;
  email: string;
  phone: string;
  is_first_login: boolean;
  permission_ids: Id<"permissions">[];
  username: string;
  role: string;
}

/**
 * Combined user type for components that need access to both
 */
export type CombinedUser = AuthenticatedUser | ConvexUser;

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
  user: AuthenticatedUser | ConvexUser | null;
  partner: ConvexPartner | null;
  loading: boolean;
  error: string | null;
  isFirstLogin: boolean;
  loginMethod: 'laravel' | 'convex' | null;
  refetch?: () => void | Promise<void>;
}

/**
 * Type guard to check if user is a Convex user
 */
export function isConvexUser(user: AuthenticatedUser | ConvexUser | null): user is ConvexUser {
  if (!user) return false;
  return '_id' in user && 'extension' in user;
}

/**
 * Type guard to check if user is a Laravel user
 */
export function isLaravelUser(user: AuthenticatedUser | ConvexUser | null): user is AuthenticatedUser {
  if (!user) return false;
  return 'id' in user && 'first_name' in user;
}

/**
 * Helper function to get display name from either user type
 */
export function getDisplayName(user: AuthenticatedUser | ConvexUser | ConvexPartner | null): string {
  if (!user) return "";
  
  // Check if it's a Convex user or partner (has 'name' field)
  if ('name' in user) {
    return user.name;
  }
  
  // It's a Laravel user (has 'first_name' and 'last_name')
  if ('first_name' in user && 'last_name' in user) {
    return `${user.first_name} ${user.last_name}`.trim();
  }
  
  return "";
}

/**
 * Helper function to get user initials
 */
export function getUserInitials(user: AuthenticatedUser | ConvexUser | ConvexPartner | null): string {
  if (!user) return "";
  
  // Check if it's a Convex user or partner
  if ('name' in user) {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  
  // It's a Laravel user
  if ('first_name' in user && 'last_name' in user) {
    return `${user.first_name[0] || ""}${user.last_name[0] || ""}`.toUpperCase();
  }
  
  return "";
}

/**
 * Helper function to get user email
 */
export function getUserEmail(user: AuthenticatedUser | ConvexUser | ConvexPartner | null): string {
  return user?.email || "";
}

/**
 * Helper function to get user role
 */
export function getUserRole(user: AuthenticatedUser | ConvexUser | ConvexPartner | null): string {
  if (!user) return "";
  
  if ('role' in user) {
    return user.role;
  }
  
  return "";
}