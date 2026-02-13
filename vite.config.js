import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import { resolve } from "path";
import { config } from "dotenv";
import { getEnvironmentVariable } from "./get-environment-variable.js";
import { API_DEVELOPMENT_PORT } from "./config.js";
config();

process.env.VITE_SYNOLOGY_SSO_APP_ID = process.env.SYNOLOGY_SSO_APP_ID;
process.env.VITE_SYNOLOGY_SSO_URL = process.env.SYNOLOGY_SSO_URL;
process.env.VITE_FOOTER_TEXT = process.env.FOOTER_TEXT;
process.env.VITE_DRAWER_TEXT = process.env.DRAWER_TEXT;
process.env.VITE_RUNBOOK_URL = process.env.RUNBOOK_URL;
process.env.VITE_LOADING_TEXT = process.env.LOADING_TEXT;
process.env.VITE_HEADER_SUBTITLE_TEXT = process.env.HEADER_SUBTITLE_TEXT;

const PORT = getEnvironmentVariable("PORT", 3000);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    allowedHosts: [process.env.ALLOWED_HOST],
    host: "0.0.0.0",
    port: PORT,
    proxy: {
      "/api": {
        target: `http://localhost:${API_DEVELOPMENT_PORT}`,
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
