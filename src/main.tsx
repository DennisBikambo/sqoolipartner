import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "./context/ThemeProvider";
import { PermissionProvider } from "./context/PermissionProvider";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Provider } from "react-redux";
import { store } from "./store";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <ThemeProvider>
          <ConvexProvider client={convex}>
            <PermissionProvider>
              <App />
              <Toaster />
            </PermissionProvider>
          </ConvexProvider>
        </ThemeProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
