import { defineConfig, type Options } from "tsup";

const shared: Options = {
  entry: ["src/index.ts"],
  dts: true,
  minify: true,
  sourcemap: true,
  skipNodeModulesBundle: true,
  target: "es2020",
  clean: true,
  platform: "neutral",
  tsconfig: "tsconfig.build.json",
};

export default defineConfig([
  {
    ...shared,
    format: "cjs",
    splitting: false,
    outDir: "dist/common",
  },
  {
    ...shared,
    format: "esm",
    splitting: true,
    outDir: "dist/esm",
    clean: false,
  },
]);
