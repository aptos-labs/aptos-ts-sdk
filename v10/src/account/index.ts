// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * @module account
 *
 * Public account types and factory utilities for the Aptos TypeScript SDK.
 *
 * This module exports:
 * - The core {@link Account} interface and related type-guards
 *   ({@link isSingleKeySigner}, {@link isKeylessSigner})
 * - Concrete account implementations:
 *   - {@link Ed25519Account} - legacy Ed25519 signing scheme
 *   - {@link SingleKeyAccount} - unified SingleKey scheme (Ed25519 or Secp256k1)
 *   - {@link MultiKeyAccount} - M-of-N multi-key signing
 *   - {@link MultiEd25519Account} - legacy M-of-N Ed25519 signing
 *   - {@link KeylessAccount} - OIDC-based keyless authentication
 *   - {@link FederatedKeylessAccount} - keyless with a custom JWK provider
 *   - {@link AbstractedAccount} - account abstraction via on-chain Move functions
 *   - {@link DerivableAbstractedAccount} - derivable account abstraction
 * - Supporting types:
 *   - {@link EphemeralKeyPair} - short-lived key pair for keyless flows
 *   - {@link AbstractKeylessAccount} - shared base class for keyless accounts
 * - Factory functions:
 *   - {@link generateAccount}
 *   - {@link accountFromPrivateKey}
 *   - {@link accountFromDerivationPath}
 *   - {@link authKey}
 */

export * from "./abstract-keyless-account.js";
export * from "./abstracted-account.js";
export * from "./ed25519-account.js";
export * from "./ephemeral-key-pair.js";
export * from "./factory.js";
export * from "./federated-keyless-account.js";
export * from "./keyless-account.js";
export * from "./multi-ed25519-account.js";
export * from "./multi-key-account.js";
export * from "./single-key-account.js";
export * from "./types.js";
