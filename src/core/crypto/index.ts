// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Core crypto exports (always loaded)
export * from "./abstraction";
export * from "./ed25519";
export * from "./hdKey";
export * from "./multiEd25519";
export * from "./multiKey";
export * from "./privateKey";
export * from "./publicKey";
export * from "./secp256k1";
export * from "./secp256r1";
export * from "./signature";
export * from "./singleKey";
export * from "./types";
export * from "./deserializationUtils";
export * from "./anyKeyRegistry";

// Keyless-specific exports (heavy dependencies: poseidon-lite, bn254)
// These are re-exported here for backward compatibility, but can be
// imported separately from "@aptos-labs/ts-sdk/keyless" to enable tree-shaking
export * from "./ephemeral";
export * from "./federatedKeyless";
export * from "./keyless";
export * from "./poseidon";
export * from "./proof";

// NOTE: Keyless registration is done in src/index.ts to allow tree-shaking
// when importing from sub-modules. The main entry point imports keylessRegistry
// to ensure backward compatibility.
