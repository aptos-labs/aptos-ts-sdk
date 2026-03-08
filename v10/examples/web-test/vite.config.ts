import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5174,
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    include: ["@aptos-labs/ts-sdk"],
  },
});
