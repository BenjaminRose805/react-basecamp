import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: "jsdom",
    globals: true,

    // Setup files
    setupFiles: ["./vitest.setup.ts"],

    // Include patterns
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".next", "e2e"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",

      // Coverage thresholds (set low for template, increase as you add tests)
      thresholds: {
        lines: 30,
        branches: 30,
        functions: 30,
        statements: 30,
      },

      // Files to include in coverage
      include: ["src/**/*.{ts,tsx}"],

      // Files to exclude from coverage
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/index.ts",
        "src/**/*.stories.{ts,tsx}",
      ],
    },

    // Reporter configuration
    reporters: ["default"],

    // Timeout for tests (ms)
    testTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
  },

  // Path aliases (matches tsconfig paths)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
