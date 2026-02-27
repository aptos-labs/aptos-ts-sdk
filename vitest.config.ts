import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [path.resolve(__dirname, "tests/setupDotenv.ts")],
    globalSetup: [path.resolve(__dirname, "tests/preTest.ts")],
    include: ["tests/**/*.test.ts"],
    exclude: ["dist/**", "examples/**", "confidential-assets/**"],
    coverage: {
      provider: "v8",
      exclude: [
        "src/internal/queries/**",
        "src/types/generated/**",
        "tests/e2e/ans/publishANSContracts.ts",
        "confidential-assets/**",
      ],
      thresholds: {
        branches: 40,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
    pool: "forks",
    maxWorkers: 4,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
});
