import type { LoginFormData, LoginValidationErrors } from '../types/auth.types'
import { getApiEndpoint } from './apiConfig'
export const validateLoginData = (data: LoginFormData): LoginValidationErrors => {
  const errors: LoginValidationErrors = {}

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!data.email.trim()) {
    errors.email = 'Email is required'
  } else if (!emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!data.password) {
    errors.password = 'Password is required'
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  return errors
}

/**
 * Gets CSRF token from cookies
 * Note: In cross-origin setups (sqooli.org -> api.sqooli.com), the XSRF-TOKEN cookie
 * is set by api.sqooli.com but cannot be read by JavaScript on sqooli.org due to
 * browser security. The cookie IS sent with credentials: 'include', but we can't access it.
 */
export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=')
    if (key === name) return decodeURIComponent(value)
  }
  return null
}

/**
 * Fetches CSRF cookie from Laravel Sanctum
 * This sets the XSRF-TOKEN cookie which will be automatically sent with subsequent requests
 */
export const handleGetCSRF = async (): Promise<void> => {
  const response = await fetch(getApiEndpoint('/sanctum/csrf-cookie'), {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch CSRF cookie')

  // The cookie is now set and will be sent automatically with credentials: 'include'
  // In cross-origin scenarios, we can't read it but the browser will send it
}

export const handleLogin = async (data: LoginFormData) => {
  const errors = validateLoginData(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Please fix the validation errors' }
  }

  try {
    // Fetch CSRF cookie immediately before login to ensure it's fresh
    await handleGetCSRF()

    const xsrfToken = getCookie('XSRF-TOKEN')

    // Debug logging for cross-origin issues
    if (!xsrfToken) {
      console.warn('⚠️ XSRF-TOKEN cookie not found. This may indicate a cross-origin cookie issue.')
      console.warn('   Available cookies:', document.cookie)
      console.warn('   Make sure the API server sets cookies with domain=.sqooli.com')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Only add X-XSRF-TOKEN header if we have the token
    // For cross-origin requests, if cookie domain is not shared, we can't read it
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken
    }

    const response = await fetch(getApiEndpoint('/login'), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    })

    if (response.status === 419) {
      console.error('❌ CSRF token mismatch. Cookie found:', !!xsrfToken)
      return {
        success: false,
        message: 'CSRF token mismatch. Please ensure cookies are enabled and the API server is configured for cross-origin requests with domain=.sqooli.com'
      }
    }

    // Laravel returns 204 No Content on successful login
    if (response.status === 204 ) {


      // Verify user is authenticated
      const userRes = await fetch(getApiEndpoint('/api/user'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!userRes.ok) {
        return { success: false, message: 'Login succeeded but user verification failed' }
      }

      const userData = await userRes.json()
      
      return { success: true, message: 'Login successful!', user: userData }
    }

    return { success: false, message: `Login failed: ${response.status}` }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    console.error('❌ Login error:', message)
    return { success: false, message }
  }
}