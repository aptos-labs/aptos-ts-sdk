"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const __filename = (0, node_url_1.fileURLToPath)(import.meta.url);
const __dirname = node_path_1.default.dirname(__filename);
exports.default = (0, config_1.defineConfig)({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [node_path_1.default.resolve(__dirname, "../tests/setupDotenv.ts")],
    // NOTE: We typically test confidential assets after making changes to the
    // Aptos framework, which require a manual localnet re-deployment. So this
    // automatic deployment before every test is disabled, as a result.
    globalSetup: process.env.SKIP_SETUP ? [] : [node_path_1.default.resolve(__dirname, "../tests/preTest.ts")],
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/units/api/**"],
    coverage: {
      provider: "v8",
      exclude: ["tests/units/api/**"],
      thresholds: {
        branches: 30,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
    pool: "forks",
    fileParallelism: false, // e2e tests share a localnet and modify global on-chain state
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
//# sourceMappingURL=vitest.config.js.map
