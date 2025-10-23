import type { LoginFormData, LoginResponse, LoginValidationErrors } from '../types/auth.types';

/**
 * Validates login form data
 * @param data - The form data to validate
 * @returns Object containing validation errors, or empty object if valid
 */
export const validateLoginData = (data: LoginFormData): LoginValidationErrors => {
  const errors: LoginValidationErrors = {};

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
};

/**
 * Handles user login
 * @param data - The login form data
 * @returns Promise with login response
 */
export const handleLogin = async (data: LoginFormData): Promise<LoginResponse> => {
  try {
    // Validate data first
    const errors = validateLoginData(data);
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Please fix the validation errors',
      };
    }

    // Make API request
    const response = await fetch('https://api.sqooli.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Login failed. Please check your credentials.',
      };
    }

    return {
      success: true,
      message: result.message || 'Login successful!',
      data: result.data,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
};