#!/usr/bin/env node
/**
 * Bundle Size Analysis Script
 *
 * Analyzes the minified bundle sizes for each SDK entry point using esbuild.
 * This shows what end users will actually download when bundling with the SDK.
 *
 * Usage: pnpm bundle:size
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ENTRY_POINTS = [
  { name: "Full SDK", entry: "src/index.ts", external: ["@aptos-labs/aptos-cli"] },
  { name: "Lite SDK", entry: "src/lite/index.ts", external: [] },
  { name: "Keyless", entry: "src/keyless/index.ts", external: [] },
];

const TEMP_DIR = path.join(__dirname, "..", ".bundle-analysis");

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function analyzeBundle(entryPoint) {
  const outfile = path.join(TEMP_DIR, `${entryPoint.name.replace(/\s+/g, "-").toLowerCase()}.js`);
  const metafile = path.join(TEMP_DIR, `${entryPoint.name.replace(/\s+/g, "-").toLowerCase()}.meta.json`);

  const externalArgs = entryPoint.external.map((e) => `--external:${e}`).join(" ");

  try {
    execSync(
      `npx esbuild ${entryPoint.entry} --bundle --minify --format=esm --outfile="${outfile}" --metafile="${metafile}" ${externalArgs}`,
      { stdio: "pipe", cwd: path.join(__dirname, "..") },
    );

    const stats = fs.statSync(outfile);
    const meta = JSON.parse(fs.readFileSync(metafile, "utf8"));

    // Check for problematic dependencies
    const hasPoseidon = Object.keys(meta.inputs).some((k) => k.includes("poseidon"));
    const hasKeyless = Object.keys(meta.inputs).some((k) => k.includes("keyless"));

    return {
      name: entryPoint.name,
      size: stats.size,
      hasPoseidon,
      hasKeyless,
    };
  } catch (error) {
    return {
      name: entryPoint.name,
      error: error.message,
    };
  }
}

function main() {
  console.log("\n📦 Aptos TypeScript SDK - Bundle Size Analysis\n");
  console.log("=".repeat(55));

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const results = ENTRY_POINTS.map(analyzeBundle);

  // Display results
  console.log("\nEntry Point          │ Minified Size │ Notes");
  console.log("─".repeat(55));

  for (const result of results) {
    if (result.error) {
      console.log(`${result.name.padEnd(20)} │ ERROR         │ ${result.error}`);
    } else {
      const notes = [];
      if (result.name === "Lite SDK" && result.hasPoseidon) {
        notes.push("⚠️  includes poseidon-lite");
      }
      if (result.name === "Lite SDK" && result.hasKeyless) {
        notes.push("⚠️  includes keyless");
      }
      console.log(`${result.name.padEnd(20)} │ ${formatSize(result.size).padEnd(13)} │ ${notes.join(", ")}`);
    }
  }

  console.log("─".repeat(55));

  // Show lite vs full comparison
  const fullResult = results.find((r) => r.name === "Full SDK");
  const liteResult = results.find((r) => r.name === "Lite SDK");

  if (fullResult && liteResult && !fullResult.error && !liteResult.error) {
    const reduction = ((1 - liteResult.size / fullResult.size) * 100).toFixed(0);
    console.log(`\n✨ Lite SDK is ${reduction}% smaller than Full SDK`);
  }

  // Cleanup
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log("\n");
}

main();
