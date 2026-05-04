/**
 * Devnet-targeted e2e tests (e.g. encrypted transactions). Inherits the root config but drops
 * the local-node `globalSetup` and lengthens timeouts for cross-network calls. Run: `pnpm e2e-encrypted`.
 */
import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config.js";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      globalSetup: [],
      maxWorkers: 1,
      testTimeout: 120000,
    },
  }),
);
