import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";

// Standalone P91 Pulse web app (ported from p91pulse_stage FE).
// Same-origin /api calls are proxied to the Go backend (:8080 by default).
export default defineConfig({
  plugins: [react(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      "@shared/schema": path.resolve(import.meta.dirname, "src/lib/shared-schema"),
      "@shared/erp-schema": path.resolve(import.meta.dirname, "src/lib/shared-erp-schema"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
