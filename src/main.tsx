import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ThemeProvider } from "./context/ThemeProvider";
import { PermissionProvider } from "./context/PermissionProvider";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Provider } from "react-redux";
import { store } from "./store";
import { authClient } from "./lib/auth-client";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string, {
  // Pause queries until Better Auth has resolved the auth state
  unsavedChangesWarning: false,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <ThemeProvider>
          <ConvexBetterAuthProvider client={convex} authClient={authClient}>
            <PermissionProvider>
              <App />
              <Toaster />
            </PermissionProvider>
          </ConvexBetterAuthProvider>
        </ThemeProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
