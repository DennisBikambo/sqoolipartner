import type { LoginFormData, LoginValidationErrors } from '../types/auth.types'

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

export const handleGetCSRF = async (): Promise<void> => {
  const response = await fetch('/sanctum/csrf-cookie', {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Failed to fetch CSRF cookie')
}

export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=')
    if (key === name) return decodeURIComponent(value)
  }
  return null
}

export const handleLogin = async (data: LoginFormData) => {
  const errors = validateLoginData(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Please fix the validation errors' }
  }

  try {
    const xsrfToken = getCookie('XSRF-TOKEN')

    const response = await fetch('/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', 
        'X-XSRF-TOKEN': xsrfToken ?? '',
      },
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    })

 

    if (response.status === 419) {
      return { success: false, message: 'CSRF token mismatch (419)' }
    }

    // Laravel returns 204 No Content on successful login
    if (response.status === 204 ) {

      
      // Verify user is authenticated
      const userRes = await fetch('/api/user', {
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