// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Lite SDK Module (without Keyless Authentication)
 *
 * This module provides core Aptos SDK functionality without the keyless
 * authentication feature. Use this entry point if you don't need keyless
 * authentication to significantly reduce your bundle size (~80% smaller).
 *
 * Note: Some features like MultiKeyAccount support keyless signers and will
 * pull in keyless dependencies. For minimal bundle size, use only Ed25519Account
 * or SingleKeyAccount with non-keyless keys.
 *
 * Import from "@aptos-labs/ts-sdk/lite" for a smaller bundle.
 *
 * @module lite
 */

// Core account functionality (Ed25519 and SingleKey only for minimal bundle)
export { Ed25519Account } from "../account/Ed25519Account";
export { SingleKeyAccount } from "../account/SingleKeyAccount";
// Note: MultiKeyAccount and MultiEd25519Account import keyless dependencies
// Import them from the main SDK if needed

// Core exports
export { AccountAddress } from "../core/accountAddress";
export type { AccountAddressInput } from "../core/accountAddress";
export { AuthenticationKey } from "../core/authenticationKey";
export { Hex } from "../core/hex";
export * from "../core/common";

// Core crypto (without keyless) - import directly to avoid barrel file
export {
  Ed25519PrivateKey,
  Ed25519PublicKey,
  Ed25519Signature,
} from "../core/crypto/ed25519";
export {
  Secp256k1PrivateKey,
  Secp256k1PublicKey,
  Secp256k1Signature,
} from "../core/crypto/secp256k1";
export {
  Secp256r1PrivateKey,
  Secp256r1PublicKey,
  Secp256r1Signature,
  WebAuthnSignature,
} from "../core/crypto/secp256r1";
export {
  MultiEd25519PublicKey,
  MultiEd25519Signature,
} from "../core/crypto/multiEd25519";
export { MultiKey, MultiKeySignature } from "../core/crypto/multiKey";
export { AnyPublicKey, AnySignature } from "../core/crypto/singleKey";
export type { PrivateKeyInput } from "../core/crypto/singleKey";
export * from "../core/crypto/hdKey";
export * from "../core/crypto/types";
export * from "../core/crypto/publicKey";
export * from "../core/crypto/signature";
export * from "../core/crypto/privateKey";

// BCS serialization
export * from "../bcs";

// Transactions
export * from "../transactions";
export * from "../transactions/management";

// API - Note: Aptos class is not included as it imports keyless dependencies
// Use AptosConfig with individual API modules, or import from main SDK for full Aptos class
export { AptosConfig } from "../api/aptosConfig";

// Client
export * from "../client";

// Types (core types only)
export * from "../types/types";

// Utils
export * from "../utils";

// Errors
export * from "../errors";

