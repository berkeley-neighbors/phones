import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import { config } from "dotenv";
let API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  config();

  API_TOKEN = process.env.API_TOKEN;

  if (!API_TOKEN) {
    throw new Error("API_TOKEN environment variable is not set.");
  }
}

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
          const cleanPath = path.replace(/^\/api/, "");
          const separator = cleanPath.includes("?") ? "&" : "?";
          return `${cleanPath}${separator}token=${API_TOKEN}`;
        },
      },
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
