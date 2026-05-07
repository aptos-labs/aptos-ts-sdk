/**
 * Devnet-targeted e2e tests (e.g. encrypted transactions). Inherits the root config but drops
 * the local-node `globalSetup` and lengthens timeouts for cross-network calls. Run: `pnpm e2e-encrypted`.
 *
 * NOTE: vite's `mergeConfig` concatenates arrays, so it cannot be used to clear `globalSetup` —
 * the base entry would survive. We spread the base `test` block and explicitly override fields instead.
 */
import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config.js";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    globalSetup: undefined,
    maxWorkers: 1,
    testTimeout: 120000,
  },
});
