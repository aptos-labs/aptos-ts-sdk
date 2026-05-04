// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Batch encryption primitives for encrypted transaction payloads.
 *
 * Ported from aptos-core/crates/aptos-batch-encryption. Encrypt-only — decryption helpers are not implemented
 * because the SDK never decrypts ciphertexts client-side. `bytesToG1`/`bytesToG2` enforce the prime-order
 * subgroup check on deserialization, matching aptos-core `ts-batch-encrypt`.
 *
 * @module
 */

export { EncryptionKey } from "./ciphertext.js";
