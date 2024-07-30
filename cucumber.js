// cucumber.js
let common = [
  'tests/features/**/*.feature',                // Specify our feature files
  '--loader ts-node/esm',
  '--import tests/step-definitions/**/*.mts',   // Load step definitions
  '--format progress-bar',                // Load custom formatter
].join(' ');

module.exports = {
  default: common
};
