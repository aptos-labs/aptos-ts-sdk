import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    testTimeout: 120_000, // 2 minutes for network requests
    hookTimeout: 60_000,
    globals: true,
  },
});
