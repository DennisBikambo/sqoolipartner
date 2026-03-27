import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Mount all Better Auth endpoints: sign-in, sign-up, session, TOTP, JWKS, etc.
// cors: true is required for Vite SPA (different origin from Convex deployment)
authComponent.registerRoutes(http, createAuth, { cors: true });

// Payment endpoints will be added separately here.

export default http;
