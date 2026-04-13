import path from "node:path";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

const repoRoot = path.resolve(import.meta.dirname, "..");

/**
 * Real-browser test configuration using @vitest/browser + Playwright (Chromium).
 *
 * Runs only unit tests (no e2e — those require a localnet).
 * Tests execute inside an actual Chromium instance, so WASM loading, Web Crypto,
 * and any other browser-specific behaviour is exercised for real.
 *
 * Prerequisites:
 *   npx playwright install chromium
 *
 * Run with:
 *   pnpm test:browser
 */
export default defineConfig({
  resolve: {
    alias: {
      "@aptos-labs/ts-sdk": path.join(repoRoot, "src/index.ts"),
    },
  },
  server: {
    fs: {
      allow: [repoRoot, import.meta.dirname],
    },
  },
  test: {
    globals: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    include: ["tests/units/**/*.test.ts"],
    // confidentialProofs imports from tests/helpers which uses child_process/fs (Node-only).
    // It's a Node-targeted test; exclude it so failures here are signal, not noise.
    exclude: ["tests/units/api/**", "**/confidentialProofs.test.ts"],
    // No globalSetup — localnet not needed for unit tests
    fileParallelism: true,
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});
