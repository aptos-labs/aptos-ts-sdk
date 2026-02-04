import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    include: ["@aptos-labs/ts-sdk"],
  },
});
