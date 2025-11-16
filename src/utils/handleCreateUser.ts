// src/utils/handleCreateUser.ts

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  redeem_code: string;
  metadata: {
    amount_paid: number;
    no_of_lessons: number;
    price_per_lesson: number;
    campaign_id?: string;
  };
}

interface LaravelUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string | null;
  email: string;
  phone: string;
  dob: string | null;
  status: string;
  google_id: string | null;
  avatar: string | null;
  password_changed: number;
  gender: string | null;
  is_email_verified: boolean;
  is_phone_verified: boolean;
}

interface LaravelCreateUserResponse {
  message: string;
  user: LaravelUser;
  temporary_password: string;
}

interface CreateUserResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: LaravelUser;
    email?: string;
    password?: string;
  };
  error?: string;
}

/**
 * Get CSRF token from cookie
 */
function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

/**
 * Fetch CSRF token from Laravel Sanctum
 */
async function fetchCsrfToken(): Promise<string | null> {
  try {
    await fetch("https://api.sqooli.com/sanctum/csrf-cookie", {
      method: "GET",
      credentials: "include",
    });

    return getCookieValue("XSRF-TOKEN");
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
}

/**
 * Create user in Laravel backend
 */
export async function handleCreateUser(
  userData: UserData
): Promise<CreateUserResponse> {
  const API_URL = "https://api.sqooli.com/users/store";

  try {
    const xsrfToken = await fetchCsrfToken();

    if (!xsrfToken) {
      return {
        success: false,
        error: "Failed to obtain CSRF token",
      };
    }

    const response = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-XSRF-TOKEN": decodeURIComponent(xsrfToken),
      },
      body: JSON.stringify({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone_number: userData.phone_number,
        redeem_code: userData.redeem_code,
        "metadata[amount_paid]": userData.metadata.amount_paid,
        "metadata[no_of_lessons]": userData.metadata.no_of_lessons,
        "metadata[price_per_lesson]": userData.metadata.price_per_lesson,
        ...(userData.metadata.campaign_id && {
          "metadata[campaign_id]": userData.metadata.campaign_id,
        }),
      }),
    });

    const data: LaravelCreateUserResponse | { message?: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.message ||
          `HTTP error! status: ${response.status}`,
      };
    }

    const typed = data as LaravelCreateUserResponse;

    return {
      success: true,
      message: typed.message,
      data: {
        user: typed.user,
        email: typed.user.email,
        password: typed.temporary_password,
      },
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Split full name into first_name + last_name
 */
export function parseStudentName(fullName: string): {
  first_name: string;
  last_name: string;
} {
  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length === 1) {
    return {
      first_name: nameParts[0],
      last_name: "",
    };
  }

  return {
    first_name: nameParts[0],
    last_name: nameParts.slice(1).join(" "),
  };
}
