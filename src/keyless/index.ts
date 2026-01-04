// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Keyless Authentication Module
 *
 * This module contains all keyless authentication functionality including:
 * - KeylessAccount and FederatedKeylessAccount
 * - EphemeralKeyPair for temporary key management
 * - Poseidon hashing utilities
 * - ZK proof verification
 *
 * Import from "@aptos-labs/ts-sdk/keyless" to only include keyless
 * functionality in your bundle, or import from "@aptos-labs/ts-sdk"
 * for the full SDK.
 *
 * @module keyless
 */

// Keyless crypto primitives
export {
  KeylessPublicKey,
  KeylessSignature,
  KeylessConfiguration,
  Groth16Zkp,
  ZeroKnowledgeSig,
  ZkProof,
  getKeylessConfig,
  MoveJWK,
  verifyKeylessSignature,
  verifyKeylessSignatureWithJwkAndConfig,
  EphemeralCertificate,
  EPK_HORIZON_SECS,
  MAX_AUD_VAL_BYTES,
  MAX_UID_KEY_BYTES,
  MAX_UID_VAL_BYTES,
  MAX_ISS_VAL_BYTES,
  MAX_EXTRA_FIELD_BYTES,
  MAX_JWT_HEADER_B64_BYTES,
  MAX_COMMITED_EPK_BYTES,
} from "../core/crypto/keyless";

export { FederatedKeylessPublicKey } from "../core/crypto/federatedKeyless";

export { EphemeralPublicKey, EphemeralSignature } from "../core/crypto/ephemeral";

export { Proof } from "../core/crypto/proof";

// Poseidon hashing (used by keyless)
export {
  poseidonHash,
  hashStrToField,
  padAndPackBytesWithLen,
  bytesToBigIntLE,
  bigIntToBytesLE,
} from "../core/crypto/poseidon";

// Keyless account implementations
export { KeylessAccount } from "../account/KeylessAccount";
export { FederatedKeylessAccount } from "../account/FederatedKeylessAccount";
export { AbstractKeylessAccount } from "../account/AbstractKeylessAccount";
export { EphemeralKeyPair } from "../account/EphemeralKeyPair";

// Keyless API
export { Keyless } from "../api/keyless";

// Keyless types from AbstractKeylessAccount
export type {
  ProofFetchCallback,
  ProofFetchStatus,
  ProofFetchSuccess,
  ProofFetchFailure,
} from "../account/AbstractKeylessAccount";

export type {
  PepperFetchRequest,
  PepperFetchResponse,
  ProverRequest,
  ProverResponse,
  Groth16VerificationKeyResponse,
  KeylessConfigurationResponse,
  PatchedJWKsResponse,
} from "../types/keyless";
