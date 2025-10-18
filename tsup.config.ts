import { defineConfig } from "tsup";
import type { Options, Format } from "tsup";

// Ensure that these option fields are not undefined
type MandatoryOptions = Options & {
  outDir: string;
  format: Format | Format[];
};

// Default config, used as a base template
const DEFAULT_CONFIG: Options = {
  clean: true, // clean up the dist folder
  dts: true, // generate dts files
  minify: true,
  skipNodeModulesBundle: true,
  sourcemap: true,
  target: "es2020",
  platform: "node",
  env: {
    APTOS_NETWORK: process.env.APTOS_NETWORK ?? "Devnet",
    ANS_TEST_ACCOUNT_PRIVATE_KEY:
      process.env.ANS_TEST_ACCOUNT_PRIVATE_KEY ?? "0x37368b46ce665362562c6d1d4ec01a08c8644c488690df5a17e13ba163e20221",
    ANS_TEST_ACCOUNT_ADDRESS:
      process.env.ANS_TEST_ACCOUNT_ADDRESS ?? "0x585fc9f0f0c54183b039ffc770ca282ebd87307916c215a3e692f2f8e4305e82",
  },
};

// Common.js config
const COMMON_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  bundle: true,
  entry: ["src/index.ts", "src/cli/index.ts"],
  format: "cjs",
  splitting: true,
  outDir: "dist/common",
};

// ESM config
const ESM_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  entry: ["src/**/*.ts"],
  format: "esm",
  bundle: false,
  splitting: false,
  outExtension: () => ({
    js: ".mjs",
  }),
  outDir: "dist/esm",
};

export default defineConfig([COMMON_CONFIG, ESM_CONFIG]);
