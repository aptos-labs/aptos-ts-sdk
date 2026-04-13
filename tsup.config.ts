import { defineConfig } from "tsup";

// Default config, used as a base template
const DEFAULT_CONFIG = {
  bundle: true,
  clean: true, // clean up the dist folder
  dts: true, // generate dts files
  minify: true,
  skipNodeModulesBundle: true,
  sourcemap: true,
  splitting: true,
  target: "es2020",
  platform: "node" as const,
  env: {
    APTOS_NETWORK: process.env.APTOS_NETWORK ?? "Devnet",
    ANS_TEST_ACCOUNT_PRIVATE_KEY:
      process.env.ANS_TEST_ACCOUNT_PRIVATE_KEY ?? "0x37368b46ce665362562c6d1d4ec01a08c8644c488690df5a17e13ba163e20221",
    ANS_TEST_ACCOUNT_ADDRESS:
      process.env.ANS_TEST_ACCOUNT_ADDRESS ?? "0x585fc9f0f0c54183b039ffc770ca282ebd87307916c215a3e692f2f8e4305e82",
  },
};

// ESM config with multiple entry points for sub-path exports
const ESM_CONFIG = {
  ...DEFAULT_CONFIG,
  entry: {
    // Main entry point
    index: "src/index.ts",
    // Sub-path entry points for tree-shakeable imports
    account: "src/functions/account.ts",
    abstraction: "src/functions/abstraction.ts",
    ans: "src/functions/ans.ts",
    coin: "src/functions/coin.ts",
    digitalAsset: "src/functions/digitalAsset.ts",
    faucet: "src/functions/faucet.ts",
    fungibleAsset: "src/functions/fungibleAsset.ts",
    general: "src/functions/general.ts",
    keyless: "src/functions/keyless.ts",
    object: "src/functions/object.ts",
    staking: "src/functions/staking.ts",
    table: "src/functions/table.ts",
    transaction: "src/functions/transaction.ts",
    view: "src/functions/view.ts",
    // Core sub-paths
    crypto: "src/core/crypto/index.ts",
    bcs: "src/bcs/index.ts",
    // CLI
    "cli/index": "src/cli/index.ts",
  },
  format: "esm" as const,
  outDir: "dist",
};

export default defineConfig(ESM_CONFIG);
