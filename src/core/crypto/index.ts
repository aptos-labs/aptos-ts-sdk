// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Side-effect-free crypto exports (no poseidon-lite dependency)
export * from "./abstraction";
export * from "./ed25519";
export * from "./multiEd25519";
export * from "./multiKey";
export * from "./privateKey";
export * from "./publicKey";
export * from "./secp256k1";
export * from "./secp256r1";
export * from "./signature";
export * from "./singleKey";
export * from "./types";
// NOTE: deserializationUtils is NOT re-exported here because it imports keyless types.
// Import it directly from "./deserializationUtils" when needed.

// NOTE: The following are intentionally NOT re-exported from this barrel
// to keep the main import path free of poseidon-lite side effects.
// Import them directly from their sub-paths:
//   - "./ephemeral"         (EphemeralPublicKey, EphemeralSignature)
//   - "./keyless"           (KeylessPublicKey, KeylessSignature, etc.)
//   - "./federatedKeyless"  (FederatedKeylessPublicKey)
//   - "./poseidon"          (poseidonHash, hashStrToField, etc.)
//   - "./hdKey"             (deriveKey, etc.)
