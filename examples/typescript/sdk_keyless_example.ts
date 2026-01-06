/* eslint-disable no-console */

/**
 * Keyless SDK Example
 *
 * This example demonstrates keyless authentication functionality.
 * In a bundled application (webpack, vite, etc.), import from "@aptos-labs/ts-sdk/keyless"
 * for modular loading of keyless-specific features.
 *
 * Bundle size with /keyless: ~788KB minified (includes poseidon-lite for ZK proofs)
 *
 * Best for:
 * - Adding keyless auth to an app already using the lite SDK
 * - Modular applications that load keyless features on demand
 * - Code-splitting scenarios where keyless is loaded lazily
 *
 * Note: For most applications, just use the full SDK. The /keyless entry point
 * is for advanced use cases where you need fine-grained control over
 * what's included in your bundle.
 *
 * This example imports from the main SDK for CommonJS compatibility.
 * In your bundled application, use: import { ... } from "@aptos-labs/ts-sdk/keyless"
 */

import {
  // Ephemeral key management
  EphemeralKeyPair,

  // Poseidon hashing (for advanced use)
  poseidonHash,
  ensurePoseidonLoaded,

  // Configuration
  EPK_HORIZON_SECS,
} from "@aptos-labs/ts-sdk";

// For a complete keyless flow, you'd also need the core SDK types
// In practice, use the full SDK unless you have specific bundle size requirements

async function main() {
  console.log("=== Keyless SDK Example ===\n");
  console.log('In bundled apps, import from "@aptos-labs/ts-sdk/keyless"\n');

  // 1. Generate an ephemeral key pair
  console.log("1. Generating ephemeral key pair...");
  // Note: generate() is now async to support lazy loading of poseidon constants
  const ephemeralKeyPair = await EphemeralKeyPair.generate({
    expiryDateSecs: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  });

  console.log(`   Public key: ${ephemeralKeyPair.getPublicKey()}`);
  console.log(`   Expiry: ${new Date(ephemeralKeyPair.expiryDateSecs * 1000).toISOString()}`);
  console.log(`   Nonce: ${ephemeralKeyPair.nonce}`);
  console.log(`   Is expired: ${ephemeralKeyPair.isExpired()}`);

  // 2. The nonce is used in the OAuth flow
  console.log("\n2. OAuth Integration...");
  console.log("   In your OAuth redirect URL, include the nonce:");
  console.log(`   https://accounts.google.com/o/oauth2/v2/auth?`);
  console.log(`     client_id=YOUR_CLIENT_ID&`);
  console.log(`     redirect_uri=YOUR_REDIRECT_URI&`);
  console.log(`     response_type=id_token&`);
  console.log(`     scope=openid email&`);
  console.log(`     nonce=${ephemeralKeyPair.nonce}`);

  // 3. Demonstrate poseidon hashing (used internally for keyless)
  console.log("\n3. Poseidon hashing (internal to keyless)...");
  // Ensure poseidon is loaded (happens automatically, but can be explicit)
  await ensurePoseidonLoaded();
  const hash = poseidonHash([1n, 2n, 3n]);
  console.log(`   poseidonHash([1, 2, 3]) = ${hash}`);

  // 4. Keyless configuration constants
  console.log("\n4. Keyless configuration...");
  console.log(`   Max EPK horizon: ${EPK_HORIZON_SECS} seconds`);

  // 5. Serialization of ephemeral key pair
  console.log("\n5. Serializing ephemeral key pair...");
  const serializedBytes = ephemeralKeyPair.bcsToBytes();
  console.log(`   Serialized to ${serializedBytes.length} bytes`);

  // Deserialize it back
  const restored = await EphemeralKeyPair.fromBytes(serializedBytes);
  console.log(`   Restored nonce matches: ${restored.nonce === ephemeralKeyPair.nonce}`);

  // 6. Sign data with ephemeral key
  console.log("\n6. Signing with ephemeral key...");
  const message = new TextEncoder().encode("Hello, Keyless!");
  const signature = ephemeralKeyPair.sign(message);
  console.log(`   Signature type: ${signature.constructor.name}`);

  console.log("\n=== Keyless SDK Example Complete ===");
  console.log("\nTo complete a full keyless flow:");
  console.log("1. Generate EphemeralKeyPair (done above)");
  console.log("2. Redirect user to OAuth provider with nonce");
  console.log("3. Receive JWT from OAuth callback");
  console.log("4. Fetch pepper from Aptos pepper service");
  console.log("5. Derive KeylessPublicKey from JWT + pepper");
  console.log("6. Fetch ZK proof from Aptos prover service");
  console.log("7. Create KeylessAccount with all components");
  console.log("8. Sign and submit transactions!");
}

main().catch(console.error);
