#!/usr/bin/env node

/**
 * Tree-shaking verification tests for the built dist/ output.
 *
 * With plain tsc (no bundler), tree-shaking happens at the consumer's bundler.
 * These tests verify that:
 * 1. Poseidon code is isolated to its own module (not re-exported from main barrel)
 * 2. Non-keyless entry points don't directly import poseidon
 * 3. The exports map entry points all exist
 *
 * Run after `pnpm build`:
 *   node tests/bundle-size/check-tree-shaking.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const distDir = join(import.meta.dirname, "../../dist");
let allPassed = true;

function check(name, condition, detail) {
  const status = condition ? "PASS" : "FAIL";
  console.log(`${status}: ${name}${detail ? ` — ${detail}` : ""}`);
  if (!condition) allPassed = false;
}

function fileExists(relPath) {
  return existsSync(join(distDir, relPath));
}

function fileContains(relPath, needle) {
  if (!fileExists(relPath)) return false;
  return readFileSync(join(distDir, relPath), "utf-8").includes(needle);
}

// 1. Verify all export entry points exist
const entryPoints = [
  [".", "index.js"],
  ["./account", "functions/account.js"],
  ["./abstraction", "functions/abstraction.js"],
  ["./ans", "functions/ans.js"],
  ["./coin", "functions/coin.js"],
  ["./digitalAsset", "functions/digitalAsset.js"],
  ["./faucet", "functions/faucet.js"],
  ["./fungibleAsset", "functions/fungibleAsset.js"],
  ["./general", "functions/general.js"],
  ["./keyless", "functions/keyless.js"],
  ["./object", "functions/object.js"],
  ["./staking", "functions/staking.js"],
  ["./table", "functions/table.js"],
  ["./transaction", "functions/transaction.js"],
  ["./view", "functions/view.js"],
  ["./crypto", "core/crypto/index.js"],
  ["./bcs", "bcs/index.js"],
  ["./cli", "cli/index.js"],
];

console.log("--- Entry point existence ---");
for (const [exportPath, filePath] of entryPoints) {
  check(`${exportPath} → ${filePath}`, fileExists(filePath));
  // Also check .d.ts exists
  const dtsPath = filePath.replace(".js", ".d.ts");
  check(`${exportPath} → ${dtsPath}`, fileExists(dtsPath));
}

// 2. Poseidon isolation: poseidon code lives ONLY in its own module
console.log("\n--- Poseidon isolation ---");
check("poseidon.js exists", fileExists("core/crypto/poseidon.js"));

// Main barrel should NOT contain poseidon function definitions
check(
  "index.js does not inline poseidon",
  !fileContains("index.js", "poseidonHash") && !fileContains("index.js", "numInputsToPoseidonFunc"),
);

// Non-keyless function entry points should not import poseidon
const nonKeylessEntries = [
  "functions/account.js",
  "functions/coin.js",
  "functions/transaction.js",
  "functions/faucet.js",
  "functions/general.js",
  "functions/staking.js",
];
for (const entry of nonKeylessEntries) {
  check(`${entry} does not reference poseidon`, !fileContains(entry, "poseidon"));
}

// 3. Main barrel should not re-export functions (to avoid circular deps)
console.log("\n--- Barrel structure ---");
check(
  "index.js does not re-export functions/",
  !fileContains("index.js", "from \"./functions"),
  "functions are sub-path only",
);

if (!allPassed) {
  console.log("\nSome checks FAILED!");
  process.exit(1);
} else {
  console.log("\nAll tree-shaking checks PASSED!");
}
