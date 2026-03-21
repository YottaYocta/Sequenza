import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: ["**/*.glsl", "**/*.vert", "**/*.frag"],
    },
  },
  resolve: {
    alias: {
      "@sequenza/lib": resolve(__dirname, "../library/src/index.ts"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),

    dts({
      tsconfigPath: "./tsconfig.app.json",
      include: ["src"],
      exclude: ["src/main.tsx", "src/App.tsx"],
      rollupTypes: true,
      compilerOptions: { allowImportingTsExtensions: false, noEmit: false },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Sequenza",
      fileName: "sequenza",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "react",
        "react/jsx-runtime",
        "react-dom",
        "@xyflow/react",
        "twgl.js",
      ],
    },
  },
});
