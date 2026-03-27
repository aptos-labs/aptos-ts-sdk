import { defineConfig } from "tsup";
import type { Options, Format } from "tsup";

type MandatoryOptions = Options & {
  outDir: string;
  format: Format | Format[];
};

const DEFAULT_CONFIG: Options = {
  bundle: true,
  clean: true,
  dts: true,
  minify: true,
  entry: ["src/index.ts"],
  skipNodeModulesBundle: true,
  sourcemap: true,
  splitting: true,
  target: "es2020",
  platform: "node",
};

const COMMON_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  format: "cjs",
  outDir: "dist/common",
};

const ESM_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  entry: ["src/**/*.ts"],
  format: "esm",
  outDir: "dist/esm",
};

export default defineConfig([COMMON_CONFIG, ESM_CONFIG]);
