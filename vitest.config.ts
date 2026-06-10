import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    pool: "threads",
    server: {
      deps: {
        // @igrp/framework-next ships ESM with extensionless relative imports
        // (e.g. app-error.js → './logger'); inlining lets Vite resolve them.
        inline: [/@igrp\/framework-next/],
      },
    },
    maxWorkers: 1,
    vmMemoryLimit: "4096MB",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/test-stubs/server-only.ts"),
    },
  },
});
