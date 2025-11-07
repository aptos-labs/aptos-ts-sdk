const path = require("path");

const envPath = path.resolve(__dirname, "../.env.development");

require("dotenv").config({
  path: [envPath],
});

module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: "node",
  testPathIgnorePatterns: ["./tests/units/api"],
  coveragePathIgnorePatterns: ["./tests/units/api"],
  collectCoverage: true,
  setupFiles: ["dotenv/config"],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  maxWorkers: 4,
  globalSetup: "../tests/preTest.cjs",
  globalTeardown: "../tests/postTest.cjs",
};
