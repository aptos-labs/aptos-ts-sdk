import { defineConfig, type Options } from "tsup";

const shared: Options = {
  entry: [
    "src/index.ts",
    "src/indexer.ts",
    "src/types.ts",
    "src/utils/index.ts",
    "src/keyless.ts",
    "src/abstraction.ts",
    "src/generated/queries.ts",
    "src/generated/operations.ts",
    "src/generated/types.ts",
  ],
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
