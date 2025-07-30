import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@schemas": resolve(__dirname, "./src/schemas"),
      "@services": resolve(__dirname, "./src/services"),
      "@core": resolve(__dirname, "./src/core"),
      "@types": resolve(__dirname, "./src/types"),
    },
  },
  test: {
    // Environment configuration
    environment: "jsdom",
    globals: true,
    
    // Test file patterns
    include: [
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/test-output/**",
      "**/.next/**",
    ],

    // Setup files
    setupFiles: ["./tests/setup.ts"],

    // Coverage configuration - targeting 80%
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./test-output/coverage",
      exclude: [
        "test-output/**",
        "coverage/**",
        "dist/**",
        "**/node_modules/**",
        "**/tests/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/debug_artifacts/**",
        "**/examples/**",
        "**/.next/**",
      ],
      // 80% coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Per-directory thresholds
        "src/core/": {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        "src/services/": {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        "src/schemas/": {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
    },

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Retry failed tests
    retry: 1,

    // Reporter configuration
    reporter: ["verbose", "json", "html"],
    outputFile: {
      json: "./test-output/reports/test-results.json",
      html: "./test-output/reports/test-results.html",
    },

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    // TypeScript configuration
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.json",
    },
  },
});