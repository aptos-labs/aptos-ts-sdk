import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [path.resolve(__dirname, "../tests/setupDotenv.ts")],
    globalSetup: [path.resolve(__dirname, "../tests/preTest.ts")],
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/units/api/**"],
    coverage: {
      provider: "v8",
      exclude: ["tests/units/api/**"],
      thresholds: {
        branches: 30,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
    pool: "forks",
    poolOptions: {
      forks: {
        maxForks: 4,
      },
    },
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
