import type { AuthenticatedUser } from "../types/auth.types";


export default async function handleAuthenticated(): Promise<AuthenticatedUser | null> {
  try {
    const response = await fetch('https://api.sqooli.com/api/user', {
      method: 'GET',
      credentials: 'include', // sends cookies for session auth
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AuthenticatedUser;
    return data;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return null;
  }
}
