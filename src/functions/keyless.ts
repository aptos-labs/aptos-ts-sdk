// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Keyless sub-path entry. NOT included in the main entry point to avoid
 * pulling in poseidon-lite. Import from '@aptos-labs/ts-sdk/keyless'.
 */

// Standalone functions
export {
  getPepper,
  getProof,
  deriveKeylessAccount,
  updateFederatedKeylessJwkSetTransaction,
} from "../internal/keyless.js";

// Namespace class and config
export { Keyless } from "../api/keyless.js";
export { AptosConfig } from "../api/aptosConfig.js";

// Account classes (pull in poseidon-lite)
export { KeylessAccount } from "../account/KeylessAccount.js";
export { FederatedKeylessAccount } from "../account/FederatedKeylessAccount.js";
export { AbstractKeylessAccount } from "../account/AbstractKeylessAccount.js";
export { EphemeralKeyPair } from "../account/EphemeralKeyPair.js";

// Crypto primitives
export {
  KeylessPublicKey,
  KeylessSignature,
  EphemeralCertificate,
  ZeroKnowledgeSig,
  Groth16Zkp,
  Groth16ProofAndStatement,
  ZkProof,
  KeylessConfiguration,
} from "../core/crypto/keyless.js";
export { FederatedKeylessPublicKey } from "../core/crypto/federatedKeyless.js";
export { EphemeralPublicKey, EphemeralSignature } from "../core/crypto/ephemeral.js";

// Poseidon utilities
export { poseidonHash, hashStrToField } from "../core/crypto/poseidon.js";
