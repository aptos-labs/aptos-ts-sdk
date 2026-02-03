# Confidential Assets SDK

## WASM Dependencies

This package uses a unified WebAssembly module for cryptographic operations:
- **Discrete log solver**: TBSGS-k32 algorithm for decryption (~512 KiB table)
- **Range proofs**: Bulletproofs for range proof generation/verification

### How WASM Loading Works

The WASM binary is **not bundled** with the SDK. Instead, it is loaded dynamically at runtime when needed. This is intentional:

**Why not bundle the WASM?**
- The `.wasm` binary is large (~774 KiB for the unified module)
- Bundling would bloat every app using the SDK, even if they never use confidential assets
- WASM binaries don't tree-shake - you'd pay the full size cost even if the feature is unused

**What the npm dependency provides:**
- TypeScript type definitions
- JavaScript glue code (thin wrappers that call into WASM)
- These are small and get bundled normally with the SDK

**What gets loaded at runtime:**
- The actual `.wasm` binary file
- Loaded via `fetch()` + `WebAssembly.instantiate()` only when `initializeWasm()`, `initializeSolver()`, or range proof functions are called
- **Single initialization**: Both discrete log and range proof functionality share the same WASM module, so it only needs to be loaded once

**Environment-specific loading:**

In **browser environments**, WASM is fetched from unpkg.com CDN.

In **Node.js environments** (e.g., running tests), the code automatically detects Node.js and loads WASM from local `node_modules`. This avoids network requests and ensures tests work offline.

### WASM Initialization

The SDK provides unified WASM initialization:

```typescript
import { initializeWasm, isWasmInitialized } from "@aptos-labs/confidential-assets";

// Initialize once - shared between discrete log and range proofs
await initializeWasm();

// Check if initialized
if (isWasmInitialized()) {
  // Both discrete log and range proof functions are ready
}
```

For convenience, the SDK auto-initializes when you call any function that needs WASM. Manual initialization is only needed if you want to control when the WASM download happens.

### Setting Up Local WASM for Development

If you want to use locally-built WASM bindings (e.g., for development or testing changes):

1. Clone and build the WASM bindings:
   ```bash
   cd ~/repos
   git clone https://github.com/aptos-labs/confidential-asset-wasm-bindings
   cd confidential-asset-wasm-bindings
   ./scripts/build-all.sh
   ```

2. Update `package.json` to use the local path:
   ```json
   "@aptos-labs/confidential-asset-wasm-bindings": "file:../../confidential-asset-wasm-bindings/aptos-confidential-asset-wasm-bindings"
   ```

3. Install dependencies:
   ```bash
   # Use --force if you've made some local changes to the DL algorithm; otherwise the version remains the same and this does nothing
   pnpm install
   ```

Now tests will use your locally-built WASM.

---

# Testing

To test against a modified `aptos-core` repo:

First, run a local node from your modified `aptos-core` branch:
```
ulimit -n unlimited
cargo run -p aptos -- node run-localnet --with-indexer-api --assume-yes --force-restart
```

Second, run the SDK test of your choosing; e.g.:
```
pnpm test tests/e2e/confidentialAsset.test.ts
```

Or, run all tests:
```
pnpm test
```

## Useful tests to know about

### Discrete log / decryption benchmarks

```bash
pnpm jest tests/units/discrete-log.test.ts
```

### Range proof tests

```bash
pnpm jest tests/units/confidentialProofs.test.ts
```
