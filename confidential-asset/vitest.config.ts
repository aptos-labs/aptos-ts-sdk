import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [path.resolve(__dirname, "../tests/setupDotenv.ts")],
    // NOTE: We typically test confidential assets after making changes to the
    // Aptos framework, which require a manual localnet re-deployment. So this
    // automatic deployment before every test is disabled, as a result.
    globalSetup: process.env.SKIP_SETUP ? [] : [path.resolve(__dirname, "../tests/preTest.ts")],
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
    fileParallelism: false, // e2e tests share a localnet and modify global on-chain state
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
