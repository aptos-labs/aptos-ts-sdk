#!/usr/bin/env node

/**
 * Tree-shaking verification tests for the built dist/ output.
 *
 * With plain tsc (no bundler), tree-shaking happens at the consumer's bundler.
 * These tests verify that:
 * 1. All sub-path entry points exist
 * 2. Poseidon code is isolated to its own module (not re-exported from main barrel)
 * 3. Non-keyless entry points do not STATICALLY reach `poseidon-lite` through
 *    their transitive import graph. Dynamic `import()` calls are ignored (they
 *    are the intended lazy-load escape hatch).
 *
 * Run after `pnpm build`:
 *   node tests/bundle-size/check-tree-shaking.mjs
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

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

// --- Transitive import graph walker ---

// Matches static `import ... from "..."` and `export ... from "..."` (single or
// double quoted). Captures the specifier. Deliberately does NOT match
// `import(...)` (dynamic imports, which we want to treat as lazy leaves).
//
// We use a single combined regex and iterate matches. tsc ESM output is regular
// enough that regex-based parsing is sufficient here (no template literals in
// specifiers, no comments inside import statements).
const STATIC_IMPORT_RE = /(?:^|[\s;])(?:import|export)\s+(?:[^'"();]*?\s+from\s+)?["']([^"']+)["']/gm;

function parseStaticSpecifiers(source) {
  const specifiers = [];
  for (const m of source.matchAll(STATIC_IMPORT_RE)) {
    specifiers.push(m[1]);
  }
  return specifiers;
}

/**
 * Resolve a specifier from a source file to an absolute path inside dist/, or
 * return null if it's a bare specifier (external package).
 */
function resolveSpecifier(fromFile, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    // Bare module specifier (e.g. "poseidon-lite", "@noble/hashes/sha3.js").
    return null;
  }
  let resolved = resolve(dirname(fromFile), specifier);
  // tsc emits `.js` extensions, but be defensive: if it's a directory,
  // check for index.js; if no extension, try appending .js.
  if (existsSync(resolved) && statSync(resolved).isDirectory()) {
    resolved = join(resolved, "index.js");
  } else if (!existsSync(resolved) && existsSync(`${resolved}.js`)) {
    resolved = `${resolved}.js`;
  }
  return resolved;
}

/**
 * Walk the static transitive import graph starting from `entryRelPath`
 * (relative to dist/). Returns the set of bare specifiers (external packages)
 * reached statically.
 */
function collectStaticExternals(entryRelPath) {
  const entry = join(distDir, entryRelPath);
  const visited = new Set();
  const externals = new Set();
  const stack = [entry];

  while (stack.length > 0) {
    const file = stack.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    if (!existsSync(file)) continue;

    const source = readFileSync(file, "utf-8");
    for (const spec of parseStaticSpecifiers(source)) {
      const resolved = resolveSpecifier(file, spec);
      if (resolved === null) {
        externals.add(spec);
      } else if (!visited.has(resolved)) {
        stack.push(resolved);
      }
    }
  }

  return externals;
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

// 3. Transitive import graph: non-keyless sub-path entry points must not reach
//    `poseidon-lite` through their static import graph. Dynamic `import()`
//    call sites are allowed (they are the escape hatch used by
//    `src/internal/account.ts` and `src/internal/transactionSubmission.ts`).
//
//    NOTE: the main `index.js` barrel is intentionally not checked here — it
//    exposes the full `Aptos` class (with its `.keyless` namespace) and is
//    documented as not tree-shakeable. Consumers that care about bundle size
//    should import from sub-paths like `@aptos-labs/ts-sdk/account`.
console.log("\n--- Transitive poseidon-lite isolation ---");
const nonKeylessEntries = [
  "functions/account.js",
  "functions/coin.js",
  "functions/transaction.js",
  "functions/faucet.js",
  "functions/general.js",
  "functions/staking.js",
];
for (const entry of nonKeylessEntries) {
  const externals = collectStaticExternals(entry);
  const pullsPoseidon = [...externals].some((s) => s === "poseidon-lite" || s.startsWith("poseidon-lite/"));
  check(
    `${entry} does not statically import poseidon-lite`,
    !pullsPoseidon,
    pullsPoseidon
      ? `reachable externals include: ${[...externals].filter((s) => s.includes("poseidon")).join(", ")}`
      : undefined,
  );
}

// Keyless entry SHOULD statically pull poseidon-lite — sanity check that the
// walker actually works and would catch a regression elsewhere.
const keylessExternals = collectStaticExternals("functions/keyless.js");
check(
  "functions/keyless.js DOES statically import poseidon-lite (walker sanity check)",
  [...keylessExternals].some((s) => s === "poseidon-lite" || s.startsWith("poseidon-lite/")),
);

// 4. Main barrel should not re-export functions (to avoid circular deps)
console.log("\n--- Barrel structure ---");
check(
  "index.js does not re-export functions/",
  !fileContains("index.js", 'from "./functions'),
  "functions are sub-path only",
);

if (!allPassed) {
  console.log("\nSome checks FAILED!");
  process.exit(1);
} else {
  console.log("\nAll tree-shaking checks PASSED!");
}
