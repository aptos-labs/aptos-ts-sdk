import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    pool: "forks",
    maxForks: 4,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    coverage: {
      provider: "v8",
      thresholds: {
        branches: 60,
        functions: 70,
        lines: 70,
        statements: 70,
      },
      exclude: ["dist", "node_modules", "tests"],
    },
  },
});
