import { api } from "../../convex/_generated/api";
import { fetchMutation } from "convex/nextjs"; // or use convex/react if on client

export async function handleLoginWithConvex(email: string, password: string, extension?: string) {
  try {
    
    if (!extension) {
      throw new Error("Extension missing. Cannot identify Convex user.");
    }

    
    const loginResponse = await fetchMutation(api.user.login, { email, password });

    const user = loginResponse.user;
    if (!user) throw new Error("Invalid login credentials.");

    
    if (!user.is_account_activated) {
      throw new Error("Account not activated. Contact your partner admin.");
    }

    const sessionResponse = await fetchMutation(api.session.createSession, {
      user_id: user._id,
    });



    return {
      success: true,
      message: "Login successful",
      session: sessionResponse,
      user,
    };
  } catch (error: any) {
    console.error("Convex login failed:", error);
    return {
      success: false,
      message: error.message || "Login failed",
    };
  }
}
