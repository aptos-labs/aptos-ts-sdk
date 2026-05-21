import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [path.resolve(__dirname, "tests/setupDotenv.ts")],
    include: ["tests/unit/**/*.test.ts"],
    pool: "forks",
    maxWorkers: 4,
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "tests/**",
        // Keep this list in lockstep with vitest.config.ts.
        "src/internal/queries/**",
        "src/types/generated/**",
        "src/cli/**",
        "src/utils/normalizeBundle.ts",
        "src/transactions/management/asyncQueue.ts",
        "src/index.ts",
        "src/version.ts",
      ],
    },
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
});
