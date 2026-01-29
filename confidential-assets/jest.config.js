module.exports = {
  ...require("../jest.config.js"),
  testPathIgnorePatterns: ["./tests/units/api"],
  coveragePathIgnorePatterns: ["./tests/units/api"],
  coverageThreshold: {
    global: {
      branches: 30, // 90,
      functions: 50, // 95,
      lines: 50, // 95,
      statements: 50, // 95,
    },
  },
  collectCoverage: false,
  globalSetup: "../tests/preTest.cjs",
  globalTeardown: "../tests/postTest.cjs",
};
