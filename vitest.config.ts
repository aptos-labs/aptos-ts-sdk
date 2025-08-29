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
      "./tests/e2e/ans/publishANSContracts.ts",
      "./confidential-assets/*",
      "dist/*",
      "examples/*",
      "node_modules/*",
    ],
    thresholds: {
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  exclude: [
    "dist/*",
    "examples/*", 
    "confidential-assets/*",
    "node_modules/*",
  ],
  maxConcurrency: 4,
  pool: "forks" as const,
  poolOptions: {
    forks: {
      maxForks: 4,
    },
  },
};

// 根据环境变量决定测试类型
const testType = process.env.VITEST_MODE || "all";

let testConfig;

switch (testType) {
  case "unit":
    testConfig = {
      ...baseConfig,
      include: ["tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      // 单元测试不需要 globalSetup/Teardown
    };
    break;
  
  case "e2e":
    testConfig = {
      ...baseConfig,
      include: ["tests/e2e/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      globalSetup: "./tests/preTest.ts",
    };
    break;
  
  default: // "all"
    testConfig = {
      ...baseConfig,
      include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      globalSetup: "./tests/preTest.ts",
    };
}

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