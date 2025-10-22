import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";


export function useAuth() {
  // Only run authentication query if user_id is provided

  const auth = useQuery(
    api.partner.authenticateUser,
    {user_name:"Azhar Ahmed"}
  );

  // Only fetch partners if authentication succeeded
  const partners = useQuery(
    api.partner.getAllPartners,
    auth?.authenticated ? {} : "skip"
  );


  if (auth === undefined) {
    return { loading: true, error: null, partners: null };
  }

  if (!auth?.authenticated) {
    return { loading: false, error: "User not authenticated", partners: null };
  }

  if (partners === undefined) {
    return { loading: true, error: null, partners: null };
  }

  return { loading: false, error: null, partners, user: auth.partner,role:"partner" };
}
