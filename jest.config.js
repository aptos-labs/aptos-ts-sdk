const path = require("path");
const envPath = path.resolve(__dirname, ".env.development");

require("dotenv").config({
  path: [envPath],
});

/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!.*@noble/(post-quantum|hashes))",
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.jsx?$": ["ts-jest", {
      tsconfig: {
        allowJs: true,
      },
    }],
  },
  coveragePathIgnorePatterns: [
    "./src/internal/queries/",
    "./src/types/generated",
    "./tests/e2e/ans/publishANSContracts.ts",
    "./confidential-assets/*",
  ],
  testPathIgnorePatterns: ["dist/*", "examples/*", "confidential-assets/*"],
  collectCoverage: true,
  setupFiles: ["dotenv/config"],
  coverageThreshold: {
    global: {
      branches: 40, // 90,
      functions: 50, // 95,
      lines: 50, // 95,
      statements: 50, // 95,
    },
  },
  // To help avoid exhausting all the available fds.
  maxWorkers: 4,
  globalSetup: "./tests/preTest.cjs",
  globalTeardown: "./tests/postTest.cjs",
};
