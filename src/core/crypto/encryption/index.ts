// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Batch encryption primitives for encrypted transaction payloads.
 *
 * Reference implementation: aptos-core/crates/aptos-batch-encryption/ts-batch-encrypt/src/
 * Rust types:               aptos-core/crates/aptos-batch-encryption/src/shared/
 *
 * This module is encrypt-only; decrypt-side helpers (hash_to_fq, bytesToG1, leBytesToFp*)
 * are intentionally omitted since SDK clients never decrypt.
 *
 * @module
 */

export { EncryptionKey, Ciphertext, BIBECiphertext } from "./ciphertext";
export { SymmetricKey, SymmetricCiphertext, OneTimePad } from "./symmetric";
