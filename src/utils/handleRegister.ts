import type { RegisterFormData, RegisterPayload, RegisterResponse, ValidationErrors } from '../types/auth.types';

/**
 * Validates registration form data
 * @param data - The form data to validate
 * @returns Object containing validation errors, or empty object if valid
 */
export const validateRegistrationData = (data: RegisterFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // First Name validation
  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  // Last Name validation
  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone Number validation
  const phoneRegex = /^[+]?[\d\s-()]+$/;
  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!phoneRegex.test(data.phoneNumber) || data.phoneNumber.replace(/\D/g, '').length < 10) {
    errors.phoneNumber = 'Please enter a valid phone number';
  }

  // Username validation
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!data.username.trim()) {
    errors.username = 'Username is required';
  } else if (data.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (!usernameRegex.test(data.username)) {
    errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])/.test(data.password)) {
    errors.password = 'Password must contain at least one lowercase letter';
  } else if (!/(?=.*[A-Z])/.test(data.password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  } else if (!/(?=.*\d)/.test(data.password)) {
    errors.password = 'Password must contain at least one number';
  }

  // Confirm Password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

/**
 * Checks password strength and returns a score and label
 * @param password - The password to check
 * @returns Object with strength score (0-4) and label
 */
export const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const strengths = [
    { label: 'Very Weak', color: 'text-destructive' },
    { label: 'Weak', color: 'text-chart-3' },
    { label: 'Fair', color: 'text-chart-3' },
    { label: 'Good', color: 'text-secondary' },
    { label: 'Strong', color: 'text-secondary' }
  ];

  return { score, ...strengths[Math.min(score, 4)] };
};

/**
 * Handles user registration
 * @param data - The registration form data
 * @returns Promise with registration response
 */
export const handleRegister = async (data: RegisterFormData): Promise<RegisterResponse> => {
  try {
    // Validate data first
    const errors = validateRegistrationData(data);
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Please fix the validation errors',
      };
    }

    // Prepare payload (exclude confirmPassword)
    const payload: RegisterPayload = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLowerCase(),
      phoneNumber: data.phoneNumber.trim(),
      username: data.username.trim(),
      password: data.password,
    };

    // Make API request
    const response = await fetch('https://api.sqooli.com/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Registration failed. Please try again.',
      };
    }

    return {
      success: true,
      message: result.message || 'Registration successful!',
      data: result.data,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
};

/**
 * Debounce function for real-time validation
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

