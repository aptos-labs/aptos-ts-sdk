// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Unified WASM loader for confidential assets.
 *
 * This module provides a single initialization point for the unified WASM
 * that contains both discrete log and range proof functionality.
 */

import initWasm, {
  DiscreteLogSolver,
  range_proof as rangeProofWasm,
  verify_proof as verifyProofWasm,
  batch_range_proof as batchRangeProofWasm,
  batch_verify_proof as batchVerifyProofWasm,
} from "@aptos-labs/confidential-asset-wasm-bindings";

// Unified WASM URL
const UNIFIED_WASM_URL =
  "https://unpkg.com/@aptos-labs/confidential-asset-wasm-bindings@0.0.3/aptos_confidential_asset_wasm_bg.wasm";

let initPromise: Promise<void> | undefined;
let initialized = false;

/**
 * Get WASM source - for Node.js, try local file first
 */
async function getWasmSource(): Promise<string | BufferSource> {
  // In Node.js, try to load from local node_modules
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      // Dynamic import for Node.js fs module
      const fs = await import("fs");
      const path = await import("path");

      // Try to find the WASM file in node_modules
      const possiblePaths = [
        path.resolve(
          process.cwd(),
          "node_modules/@aptos-labs/confidential-asset-wasm-bindings/aptos_confidential_asset_wasm_bg.wasm",
        ),
        path.resolve(
          __dirname,
          "../../node_modules/@aptos-labs/confidential-asset-wasm-bindings/aptos_confidential_asset_wasm_bg.wasm",
        ),
      ];

      for (const wasmPath of possiblePaths) {
        if (fs.existsSync(wasmPath)) {
          return fs.readFileSync(wasmPath);
        }
      }
    } catch {
      // Fall through to URL
    }
  }
  return UNIFIED_WASM_URL;
}

/**
 * Initialize the unified confidential asset WASM module.
 * This is shared between discrete log and range proof functionality.
 *
 * @param wasmSource - Optional WASM source: URL string, or Buffer/ArrayBuffer for Node.js
 */
export async function initializeWasm(wasmSource?: string | BufferSource): Promise<void> {
  if (initialized) return;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const source = wasmSource ?? (await getWasmSource());
        await initWasm({ module_or_path: source });
        initialized = true;
      } catch (error) {
        initPromise = undefined;
        throw error;
      }
    })();
  }

  await initPromise;
}

/**
 * Check if the WASM module is initialized.
 */
export function isWasmInitialized(): boolean {
  return initialized;
}

/**
 * Ensure WASM is initialized before use.
 */
export async function ensureWasmInitialized(): Promise<void> {
  if (!initialized) {
    await initializeWasm();
  }
}

// Re-export WASM functions and classes
export {
  DiscreteLogSolver,
  rangeProofWasm,
  verifyProofWasm,
  batchRangeProofWasm,
  batchVerifyProofWasm,
};
