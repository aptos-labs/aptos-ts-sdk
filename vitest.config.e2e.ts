/**
 * Localnet e2e tests. Runs **sequentially** (one worker, no file parallelism) because
 * every file shares a single Docker-backed local testnet started in `globalSetup`.
 *
 * Run: `pnpm e2e-test`
 */
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
    globalSetup: [path.resolve(__dirname, "tests/preTest.ts")],
    include: ["tests/e2e/**/*.test.ts"],
    exclude: ["dist/**", "examples/**", "confidential-asset/**"],
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "html", "clover", "json", "lcov"],
      exclude: [
        "tests/**",
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
