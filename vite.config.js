import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import { resolve } from "path";
import { config } from "dotenv";

config();

process.env.VITE_SYNOLOGY_SSO_APP_ID = process.env.SYNOLOGY_SSO_APP_ID;
process.env.VITE_SYNOLOGY_SSO_URL = process.env.SYNOLOGY_SSO_URL;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    allowedHosts: [process.env.ALLOWED_HOST],
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        rewrite: path => {
          return path.replace(/^\/api/, "");
        },
      },
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
