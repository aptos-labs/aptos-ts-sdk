/**
 * Vitest config for devnet-targeted e2e tests (e.g. encrypted transactions).
 * Unlike the root vitest.config.ts, this has NO globalSetup (no local Docker node)
 * and uses longer timeouts for network calls.
 */
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [path.resolve(__dirname, "tests/setupDotenv.ts")],
    include: ["tests/**/*.test.ts"],
    exclude: ["dist/**", "examples/**", "confidential-assets/**"],
    pool: "forks",
    maxWorkers: 1,
    testTimeout: 120000,
    hookTimeout: 120000,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
});
