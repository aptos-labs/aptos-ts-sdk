import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use node environment for proper HTTP networking support
    // The SDK's browser compatibility is verified through the build process
    // and the offline tests (account generation, crypto operations)
    environment: "node",
    testTimeout: 120_000, // 2 minutes for network requests
    hookTimeout: 60_000,
    globals: true,
  },
});
