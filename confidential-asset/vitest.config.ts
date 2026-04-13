import path from "path";
import { defineConfig } from "vitest/config";

// Monorepo checkout: `@aptos-labs/ts-sdk` is linked via `file:..`. Vite resolves
// `package.json#exports` and expects `dist/*`; CI can run tests before `dist/`
// exists or after a clean. Point Vitest at the SDK source so suites always load.
const repoRoot = path.resolve(__dirname, "..");

export default defineConfig({
  resolve: {
    alias: {
      "@aptos-labs/ts-sdk": path.join(repoRoot, "src/index.ts"),
    },
  },
  server: {
    fs: {
      allow: [repoRoot, __dirname],
    },
  },
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
