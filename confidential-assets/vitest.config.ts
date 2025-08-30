2; // eslint-disable-next-line import/no-unresolved
import { defineConfig } from "vitest/config";

// 基础配置
const baseConfig = {
  globals: true,
  environment: "node" as const,
  setupFiles: ["dotenv/config"],
  coverage: {
    provider: "v8" as const,
    exclude: [
      "./src/internal/queries/",
      "./src/types/generated",
      "./tests/units/api",
      "dist/*",
      "examples/*",
      "node_modules/*",
    ],
    thresholds: {
      branches: 30,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  exclude: ["dist/*", "examples/*", "node_modules/*"],
  maxConcurrency: 4,
  pool: "forks" as const,
  poolOptions: {
    forks: {
      maxForks: 4,
    },
  },
  testTimeout: 120000, // 120 seconds for long tests
};

// 所有测试都使用 e2e 配置（包括本地节点）
const testConfig = {
  ...baseConfig,
  include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  globalSetup: "../tests/preTest.ts",
};

export default defineConfig({
  test: testConfig,
  resolve: {
    alias: {
      // Handle .js imports in TypeScript files
      "^(\\.{1,2}/.*)\\.js$": "$1",
    },
  },
  esbuild: {
    // Handle module name mapping for .js extensions
    target: "es2020",
  },
});
