import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "cjs",
  outDir: "dist",
  clean: true,
  dts: false,
  minify: false,
  sourcemap: true,
  target: "es2020",
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
