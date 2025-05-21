module.exports = {
  ...require("../jest.config.js"),
  testPathIgnorePatterns: [],
  coveragePathIgnorePatterns: [],
  globalSetup: "../tests/preTest.cjs",
  globalTeardown: "../tests/postTest.cjs",
};
