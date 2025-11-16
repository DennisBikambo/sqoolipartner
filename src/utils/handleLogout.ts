import { getApiEndpoint } from "./apiConfig";

export async function handleLogout() {
  try {

    await fetch(getApiEndpoint("/sanctum/csrf-cookie"), {
      method: "GET",
      credentials: "include",
    });

    const xsrfToken = getCookieValue("XSRF-TOKEN");

    const response = await fetch(getApiEndpoint("/logout"), {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(xsrfToken ? { "X-XSRF-TOKEN": decodeURIComponent(xsrfToken) } : {}),
      },
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error("Logout failed:", errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error };
  }
}

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}
