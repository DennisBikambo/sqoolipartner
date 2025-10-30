import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/sanctum/csrf-cookie": {
        target: "https://api.sqooli.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "localhost", 
      },
      "/login": {
        target: "https://api.sqooli.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "localhost",
      },
      "/logout": {
        target: "https://api.sqooli.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "localhost",
      },
      "/api": {
        target: "https://api.sqooli.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "localhost",
      },
    },
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
