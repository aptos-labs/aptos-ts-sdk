module.exports = {
  ...require("../jest.config.js"),
  coveragePathIgnorePatterns: [],
  globalSetup: "../tests/preTest.cjs",
  globalTeardown: "../tests/postTest.cjs",
};
