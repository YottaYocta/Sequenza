import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@sequenza/lib/style.css": resolve(__dirname, "../library/src/index.css"),
      "@sequenza/lib": resolve(__dirname, "../library/src/index.ts"),
    },
  },
});
