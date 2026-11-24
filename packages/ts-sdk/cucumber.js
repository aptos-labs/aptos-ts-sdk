// cucumber.js
export const common = [
  "tests/features/**/*.feature", // Specify our feature files
  "--import tsx",
  "--import tests/step-definitions/**/*.mts", // Load step definitions
  "--format progress-bar", // Load custom formatter
].join(" ");

export default common;
