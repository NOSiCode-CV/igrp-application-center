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
        // The @igrp packages ship ESM with extensionless relative imports
        // (e.g. app-error.js → './logger', index.js → './components/custom/
        // stats-card-mini'). Node's ESM resolver rejects those, so externalized
        // they fail to load; inlining lets Vite resolve them instead.
        inline: [/@igrp\//],
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
