module.exports = {
  ...require("../jest.config.js"),
  testPathIgnorePatterns: ["./tests/units/api"],
  coveragePathIgnorePatterns: ["./tests/units/api"],
  globalSetup: "../tests/preTest.cjs",
  globalTeardown: "../tests/postTest.cjs",
};
