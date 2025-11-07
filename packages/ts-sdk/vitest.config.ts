import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

const packageDir = __dirname;
const repoRoot = path.resolve(packageDir, "..", "..");
const resolveFromRoot = (...segments: string[]) => path.resolve(repoRoot, ...segments);

const envPath = path.resolve(repoRoot, ".env.development");
dotenv.config({ path: envPath });

const workspaceAlias = [
  { find: "@aptos-labs/ts-bcs/utils", replacement: resolveFromRoot("packages/ts-bcs/src/utils") },
  { find: "@aptos-labs/ts-bcs/consts", replacement: resolveFromRoot("packages/ts-bcs/src/consts") },
  { find: "@aptos-labs/ts-bcs", replacement: resolveFromRoot("packages/ts-bcs/dist/esm") },
  { find: "@aptos-labs/ts-types", replacement: resolveFromRoot("packages/ts-types/src") },
  { find: "@aptos-labs/ts-core", replacement: resolveFromRoot("packages/ts-core/src") },
  { find: "@aptos-labs/ts-transactions", replacement: resolveFromRoot("packages/ts-transactions/src") },
  { find: "@aptos-labs/ts-accounts", replacement: resolveFromRoot("packages/ts-accounts/src") },
  { find: "@aptos-labs/ts-client", replacement: resolveFromRoot("packages/ts-client/src") },
  { find: "@aptos-labs/ts-api", replacement: resolveFromRoot("packages/ts-api/src") },
  { find: "@aptos-labs/ts-sdk", replacement: path.resolve(packageDir, "src") },
];

export default defineConfig({
  resolve: {
    alias: workspaceAlias,
  },
  test: {
    globals: true,
    environment: "node",
    testTimeout: 60000,
    maxThreads: 4,
    minThreads: 1,
    setupFiles: ["dotenv/config"],
    globalSetup: path.resolve(packageDir, "tests/vitest.global-setup.ts"),
    globalTeardown: path.resolve(packageDir, "tests/vitest.global-teardown.ts"),
    include: [path.resolve(packageDir, "tests/unit/**/*.test.ts")],
    deps: {
      registerNodeLoader: true,
      optimizer: {
        ssr: {
          exclude: ["poseidon-lite"],
        },
      },
    },
    exclude: [
      "dist/**",
      "examples/**",
      "confidential-assets/**",
      "**/node_modules/**",
      path.resolve(repoRoot, "dist/**"),
    ],
    coverage: {
      enabled: true,
      provider: "v8",
      reports: ["text", "lcov"],
      exclude: [
        "tests/**",
        "src/cli/**",
        "src/bcs/**",
        "src/core/**",
        "src/transactions/**",
        "src/types/**",
        "tsup.config.ts",
        "vitest.config.ts",
        "**/@noble/hashes/**",
        path.resolve(packageDir, "tests/**"),
        path.resolve(packageDir, "src/internal/queries/**"),
        path.resolve(packageDir, "src/types/generated/**"),
        path.resolve(packageDir, "tests/e2e/ans/publishANSContracts.ts"),
        path.resolve(repoRoot, "confidential-assets/**"),
        path.resolve(repoRoot, "packages/**/dist/**"),
        path.resolve(repoRoot, "dist/**"),
        path.resolve(repoRoot, "docs/**"),
      ],
      thresholds: {
        branches: 40,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
  },
});
