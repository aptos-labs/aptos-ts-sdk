import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/e2e/**/*.test.ts"],
    pool: "forks",
    maxForks: 2,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    globalSetup: "tests/e2e/setup.ts",
  },
});
