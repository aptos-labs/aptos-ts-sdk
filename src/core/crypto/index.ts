// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Side-effect-free crypto exports (no poseidon-lite dependency)
export * from "./abstraction.js";
export * from "./ed25519.js";
export * from "./multiEd25519.js";
export * from "./multiKey.js";
export * from "./privateKey.js";
export * from "./publicKey.js";
export * from "./secp256k1.js";
export * from "./secp256r1.js";
export * from "./signature.js";
export * from "./singleKey.js";
export * from "./types.js";
export * from "./encryption.js";
// NOTE: deserializationUtils is NOT re-exported here because it imports keyless types.
// Import it directly from "./deserializationUtils.js" when needed.

// NOTE: The following are intentionally NOT re-exported from this barrel
// to keep the main import path free of poseidon-lite side effects.
// Import them directly from their sub-paths:
//   - "./ephemeral"         (EphemeralPublicKey, EphemeralSignature)
//   - "./keyless"           (KeylessPublicKey, KeylessSignature, etc.)
//   - "./federatedKeyless"  (FederatedKeylessPublicKey)
//   - "./poseidon"          (poseidonHash, hashStrToField, etc.)
//   - "./hdKey"             (deriveKey, etc.)
