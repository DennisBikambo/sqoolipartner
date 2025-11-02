import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  
  // Only use proxy in development mode
  server: mode === 'development' ? {
    proxy: {
      "/sanctum/csrf-cookie": {
        target: "https://api.sqooli.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          "sqooli.com": "localhost",
          ".sqooli.com": "localhost"
        },
      },
      "/login": {
        target: "https://api.sqooli.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          "sqooli.com": "localhost",
          ".sqooli.com": "localhost"
        },
      },
      "/register": {
        target: "https://api.sqooli.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          "sqooli.com": "localhost",
          ".sqooli.com": "localhost"
        },
      },
      "/logout": {
        target: "https://api.sqooli.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          "sqooli.com": "localhost",
          ".sqooli.com": "localhost"
        },
      },
      "/api": {
        target: "https://api.sqooli.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          "sqooli.com": "localhost",
          ".sqooli.com": "localhost"
        },
      },
    },
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  } : undefined,
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  
  // Production build settings
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'convex': ['convex/react'],
        }
      }
    }
  }
}))