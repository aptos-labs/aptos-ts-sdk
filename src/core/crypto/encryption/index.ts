// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Batch encryption primitives for encrypted transaction payloads.
 *
 * Reference implementation: aptos-core/crates/aptos-batch-encryption/ts-batch-encrypt/src/
 * Rust types:               aptos-core/crates/aptos-batch-encryption/src/shared/
 *
 * This module is encrypt-only; full decrypt helpers are omitted. `curveSerialization.bytesToG1/G2`
 * include subgroup checks when deserializing keys/ciphertexts from the node (aptos-core parity).
 *
 * @module
 */

export { EncryptionKey, Ciphertext, BIBECiphertext } from "./ciphertext.js";
export { SymmetricKey, SymmetricCiphertext, OneTimePad } from "./symmetric.js";
