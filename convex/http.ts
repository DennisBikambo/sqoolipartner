import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { c2bValidation, c2bConfirmation } from "./mpesa";

const http = httpRouter();

// Mount all Better Auth endpoints: sign-in, sign-up, session, TOTP, JWKS, etc.
// cors: true is required for Vite SPA (different origin from Convex deployment)
authComponent.registerRoutes(http, createAuth, { cors: true });

// M-Pesa C2B payment webhooks
// Students pay to paybill 247247, account number = campaign promo code
// NOTE: path must NOT contain "mpesa", "m-pesa", or "safaricom" — Safaricom silently rejects those URLs
http.route({
  path: "/payments/c2b/validation",
  method: "POST",
  handler: c2bValidation,
});

http.route({
  path: "/payments/c2b/confirmation",
  method: "POST",
  handler: c2bConfirmation,
});

export default http;
