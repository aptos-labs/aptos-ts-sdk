import { defineConfig } from "tsup";
import type { Options, Format } from "tsup";

// Ensure that these option fields are not undefined
type MandatoryOptions = Options & {
  outDir: string;
  format: Format | Format[];
};

// Default config, used as a base template
const DEFAULT_CONFIG: Options = {
  bundle: true,
  clean: true, // clean up the dist folder
  dts: true, // generate dts files
  minify: false, // don't minify for better debugging
  entry: ["src/index.ts"], // entry point
  skipNodeModulesBundle: true,
  sourcemap: true,
  splitting: false, // disable code splitting for library
  target: "es2020",
  treeshake: true,
};

// Common.js config for Node.js
const CJS_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  format: "cjs",
  outDir: "dist/cjs",
  platform: "node",
};

// ESM config for modern Node.js and bundlers
const ESM_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  format: "esm",
  outDir: "dist/esm",
  platform: "neutral", // works in both browser and node
};

export default defineConfig([CJS_CONFIG, ESM_CONFIG]);





