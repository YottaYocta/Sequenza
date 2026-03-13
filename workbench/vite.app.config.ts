import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@sequenza/lib": resolve(__dirname, "../library/src/index.ts"),
    },
  },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "app",
    emptyOutDir: true,
  },
});
