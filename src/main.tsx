import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "./context/ThemeProvider";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "./components/ui/sonner"; 

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ConvexProvider client={convex}>
          <App />
          
          <Toaster />
        </ConvexProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
