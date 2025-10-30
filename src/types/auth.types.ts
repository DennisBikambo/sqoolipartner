import type { Id } from "../../convex/_generated/dataModel";

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    username: string;
  };
}

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    token: string;
  };
}

export interface LoginValidationErrors {
  email?: string;
  password?: string;
}




export interface AuthenticatedUser {
  id: number; // Laravel user ID
  name: string;
  email: string;

  // Optional Convex partner fields
  _id?: Id<"partners">;
  _creationTime?: number;
  laravelUserId?: number;
  status?: "pending" | "approved" | "declined" | "suspended";
  profile_completed?: boolean;
  remarks?: string;
}


