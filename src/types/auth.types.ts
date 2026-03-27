// types/auth.types.ts

import type { Id } from "../../convex/_generated/dataModel";

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
}

export interface Partner {
  _id: Id<"partners">;
  _creationTime: number;
  name: string;
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
  extension?: string;
  avatar_url?: string;
  better_auth_id?: string;
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
  email: string;
  phone: string;
  is_first_login: boolean;
  permission_ids: Id<"permissions">[];
  username: string;
  role: string;
  social_media?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
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
  user: ConvexUser | null;
  partner: ConvexPartner | null;
  loading: boolean;
  error: string | null;
  isFirstLogin: boolean;
  loginMethod: 'convex' | null;
  refetch?: () => void | Promise<void>;
}

/**
 * Type guard to check if user is a Convex user
 */
export function isConvexUser(user: ConvexUser | null): user is ConvexUser {
  if (!user) return false;
  return '_id' in user && 'partner_id' in user;
}

/**
 * Helper function to get display name from either user type
 */
export function getDisplayName(user: ConvexUser | ConvexPartner | null): string {
  if (!user) return "";

  if ('name' in user) {
    return user.name;
  }

  return "";
}

/**
 * Helper function to get user initials
 */
export function getUserInitials(user: ConvexUser | ConvexPartner | null): string {
  if (!user) return "";

  if ('name' in user) {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return "";
}

/**
 * Helper function to get user email
 */
export function getUserEmail(user: ConvexUser | ConvexPartner | null): string {
  return user?.email || "";
}

/**
 * Helper function to get user role
 */
export function getUserRole(user: ConvexUser | ConvexPartner | null): string {
  if (!user) return "";

  if ('role' in user) {
    return user.role;
  }

  return "";
}
