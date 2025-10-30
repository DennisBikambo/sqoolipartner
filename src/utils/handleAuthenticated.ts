import type { AuthenticatedUser } from "../types/auth.types";

export default async function handleAuthenticated(): Promise<AuthenticatedUser | null> {
  try {

    const xsrfToken = getCookieValue("XSRF-TOKEN");

    const response = await fetch("/api/user", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(xsrfToken ? { "X-XSRF-TOKEN": decodeURIComponent(xsrfToken) } : {}),
      },
    });

    if (!response.ok) {

      return null;
    }

    const result = await response.json();
    const user = result.data as AuthenticatedUser;
    return user;
  } catch (error) {
    console.error("❌ Error checking authentication:", error);
    return null;
  }
}

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}