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
  tsconfig: "tsconfig.build.json",
  env: {
    APTOS_NETWORK: process.env.APTOS_NETWORK ?? "Devnet",
    ANS_TEST_ACCOUNT_PRIVATE_KEY:
      process.env.ANS_TEST_ACCOUNT_PRIVATE_KEY ??
      "0x37368b46ce665362562c6d1d4ec01a08c8644c488690df5a17e13ba163e20221",
    ANS_TEST_ACCOUNT_ADDRESS:
      process.env.ANS_TEST_ACCOUNT_ADDRESS ?? "0x585fc9f0f0c54183b039ffc770ca282ebd87307916c215a3e692f2f8e4305e82",
  },
};

const COMMON_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  entry: ["src/index.ts", "src/cli/index.ts"],
  format: "cjs",
  outDir: "dist/common",
  splitting: false,
};

const ESM_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  entry: ["src/**/*.ts"],
  format: "esm",
  outDir: "dist/esm",
};

export default defineConfig([COMMON_CONFIG, ESM_CONFIG]);
