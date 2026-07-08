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
      "@sequenza/workbench/style.css": resolve(
        __dirname,
        "../workbench/src/index.css",
      ),
      "@sequenza/workbench": resolve(__dirname, "../workbench/src/index.ts"),
      "@sequenza/gradient": resolve(__dirname, "../gradient/src/index.ts"),
    },
  },
  server: {
    fs: {
      allow: [resolve(__dirname, "..")],
    },
  },
});
