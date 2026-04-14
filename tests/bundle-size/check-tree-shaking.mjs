#!/usr/bin/env node

/**
 * Tree-shaking verification tests for the built dist/ output.
 *
 * Checks that:
 * 1. Poseidon code is isolated to its own chunk (not inlined in entry points)
 * 2. The main index.js is significantly smaller than the pre-tree-shaking size
 * 3. Non-keyless entry points don't directly contain poseidon code
 *
 * Run after `pnpm build`:
 *   node tests/bundle-size/check-tree-shaking.mjs
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const distDir = join(import.meta.dirname, "../../dist");

const allJsFiles = readdirSync(distDir).filter((f) => f.endsWith(".js") && !f.endsWith(".map"));
const entryFiles = allJsFiles.filter((f) => !f.startsWith("chunk-"));
const chunkFiles = allJsFiles.filter((f) => f.startsWith("chunk-"));

// Find which chunks directly contain poseidon code
const poseidonChunks = chunkFiles.filter((f) => {
  const content = readFileSync(join(distDir, f), "utf-8");
  return content.includes("poseidon") || content.includes("numInputsToPoseidonFunc");
});

console.log(`Dist entry files: ${entryFiles.length}`);
console.log(`Dist chunk files: ${chunkFiles.length}`);
console.log(`Chunks with poseidon: ${poseidonChunks.join(", ") || "none"}\n`);

let allPassed = true;

function check(name, file, expectPoseidon) {
  const content = readFileSync(join(distDir, file), "utf-8");
  // Check if the entry file DIRECTLY contains poseidon code (not just imports a chunk)
  const hasPoseidonInline =
    content.includes("poseidonHash") || content.includes("numInputsToPoseidonFunc") || content.includes("poseidon1");
  const sizeKB = (Buffer.byteLength(content) / 1024).toFixed(1);

  let passed = true;
  const issues = [];

  if (!expectPoseidon && hasPoseidonInline) {
    passed = false;
    issues.push("contains poseidon inline (should not)");
  }

  const status = passed ? "PASS" : "FAIL";
  console.log(`${status}: ${name} — ${sizeKB}KB${issues.length ? ` [${issues.join(", ")}]` : ""}`);
  if (!passed) allPassed = false;
}

// Entry points should NOT contain poseidon inline
check("index.js (main entry)", "index.js", false);
check("general.js", "general.js", false);
check("account.js", "account.js", false);
check("coin.js", "coin.js", false);
check("transaction.js", "transaction.js", false);
check("faucet.js", "faucet.js", false);
check("staking.js", "staking.js", false);
check("crypto.js", "crypto.js", false);
check("bcs.js", "bcs.js", false);
check("keyless.js", "keyless.js", false); // keyless entry is a tiny re-export

// Verify poseidon is only in chunk files
const poseidonOnlyInChunks = poseidonChunks.length > 0 && poseidonChunks.every((f) => f.startsWith("chunk-"));
console.log(`\n${poseidonOnlyInChunks ? "PASS" : "FAIL"}: Poseidon isolated to chunk files only`);
if (!poseidonOnlyInChunks) allPassed = false;

// Verify main index size is under 50KB (was 228KB)
const indexSize = Buffer.byteLength(readFileSync(join(distDir, "index.js")));
const indexSizeKB = (indexSize / 1024).toFixed(1);
const indexUnder50KB = indexSize < 50 * 1024;
console.log(`${indexUnder50KB ? "PASS" : "FAIL"}: index.js size ${indexSizeKB}KB (limit: 50KB)`);
if (!indexUnder50KB) allPassed = false;

if (!allPassed) {
  console.log("\nSome checks FAILED!");
  process.exit(1);
} else {
  console.log("\nAll tree-shaking checks PASSED!");
}
