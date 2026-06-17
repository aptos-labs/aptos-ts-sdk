// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha512 } from "@noble/hashes/sha2.js";
import { randomBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { TwistedEd25519PrivateKey } from "./twistedEd25519.js";
import { MAX_ENCRYPTED_DK_BYTES } from "../consts.js";

/**
 * IND-CCA symmetric encryption of a confidential-asset decryption key (DK) under an Ed25519 backup
 * key, for backing the DK up on-chain (see aptos-core PR #19458 / the keyless-integration entry
 * functions). The DK is recoverable in two ways: from the OIDC pepper (re-deriving the DK), or — if
 * the keyless account has an Ed25519 backup key — by fetching this ciphertext from chain and
 * decrypting it with the backup key.
 *
 * Scheme:
 *   key        = HKDF-SHA512(ikm = ed25519_seed_32, salt = SALT, info = INFO, length = 32)
 *   nonce      = randomBytes(24)
 *   inner      = XChaCha20-Poly1305(key, nonce, aad = empty).encrypt(DK)
 *   ciphertext = nonce(24) || inner
 *
 * The byte layout and HKDF/AEAD parameters MUST match the Petra/Rust reference implementation
 * exactly, otherwise on-chain ciphertexts produced elsewhere will not decrypt here (and vice versa).
 */

/**
 * HKDF salt. A low-entropy salt is acceptable here because the IKM (the Ed25519 seed) is
 * high-entropy. MUST byte-for-byte match the reference implementation.
 */
export const DK_AEAD_SALT = "aptos-ca-aead-v1";

/** HKDF info string. MUST byte-for-byte match the reference implementation. */
export const DK_AEAD_INFO = "confidential assets DK encryption under Ed25519";

const SALT_BYTES = utf8ToBytes(DK_AEAD_SALT);
const INFO_BYTES = utf8ToBytes(DK_AEAD_INFO);

/** Derived XChaCha20-Poly1305 key length. */
const AEAD_KEY_LENGTH = 32;

/** XChaCha20-Poly1305 nonce length (24 bytes for the extended-nonce variant). */
const XCHACHA_NONCE_LENGTH = 24;

/**
 * Derive the 32-byte XChaCha20-Poly1305 key from an Ed25519 backup key's 32-byte seed:
 *
 *   key = HKDF-SHA512(ikm = ed25519_seed, salt = SALT, info = INFO, length = 32)
 *
 * Exported primarily for known-answer testing; application code should use
 * {@link encryptDecryptionKey} / {@link decryptDecryptionKey}.
 *
 * @param ed25519Seed - the 32-byte Ed25519 seed (i.e. `Ed25519PrivateKey.toUint8Array()`), NOT the
 *   64-byte expanded form.
 */
export function deriveDkAeadKey(ed25519Seed: Uint8Array): Uint8Array {
  if (ed25519Seed.length !== Ed25519PrivateKey.LENGTH) {
    throw new Error(`Expected a ${Ed25519PrivateKey.LENGTH}-byte Ed25519 seed, got ${ed25519Seed.length} bytes`);
  }
  return hkdf(sha512, ed25519Seed, SALT_BYTES, INFO_BYTES, AEAD_KEY_LENGTH);
}

/**
 * Encrypt a confidential-asset decryption key (DK) under an Ed25519 backup key, producing the
 * opaque `dk_ciphertext` consumed by the keyless DK-backup entry functions.
 *
 * @param args.backupPrivateKey - the Ed25519 backup PRIVATE key; its 32-byte seed keys the AEAD.
 * @param args.decryptionKey    - the confidential-asset DK to back up.
 * @returns the ciphertext bytes (`nonce(24) || inner`; 72 bytes for a 32-byte DK).
 * @throws if the resulting ciphertext exceeds {@link MAX_ENCRYPTED_DK_BYTES}.
 */
export function encryptDecryptionKey(args: {
  backupPrivateKey: Ed25519PrivateKey;
  decryptionKey: TwistedEd25519PrivateKey;
}): Uint8Array {
  const { backupPrivateKey, decryptionKey } = args;
  const key = deriveDkAeadKey(backupPrivateKey.toUint8Array());
  const nonce = randomBytes(XCHACHA_NONCE_LENGTH);
  const inner = xchacha20poly1305(key, nonce).encrypt(decryptionKey.toUint8Array());

  const ciphertext = new Uint8Array(nonce.length + inner.length);
  ciphertext.set(nonce, 0);
  ciphertext.set(inner, nonce.length);

  if (ciphertext.length > MAX_ENCRYPTED_DK_BYTES) {
    throw new Error(
      `Encrypted DK is ${ciphertext.length} bytes, exceeds the on-chain maximum of ${MAX_ENCRYPTED_DK_BYTES}`,
    );
  }
  return ciphertext;
}

/**
 * Decrypt a `dk_ciphertext` produced by {@link encryptDecryptionKey} (or its Petra/Rust
 * counterpart), recovering the confidential-asset DK.
 *
 * @param args.backupPrivateKey - the Ed25519 backup PRIVATE key whose seed keys the AEAD.
 * @param args.ciphertext       - the `nonce(24) || inner` ciphertext bytes (e.g. from
 *   `getEncryptedDk`).
 * @returns the recovered DK, ready to use with the rest of the SDK.
 * @throws if the ciphertext is malformed or authentication fails (wrong backup key / tampering).
 */
export function decryptDecryptionKey(args: {
  backupPrivateKey: Ed25519PrivateKey;
  ciphertext: Uint8Array;
}): TwistedEd25519PrivateKey {
  const { backupPrivateKey, ciphertext } = args;
  if (ciphertext.length <= XCHACHA_NONCE_LENGTH) {
    throw new Error(`DK ciphertext is too short: ${ciphertext.length} bytes`);
  }
  const key = deriveDkAeadKey(backupPrivateKey.toUint8Array());
  const nonce = ciphertext.subarray(0, XCHACHA_NONCE_LENGTH);
  const inner = ciphertext.subarray(XCHACHA_NONCE_LENGTH);

  let plaintext: Uint8Array;
  try {
    plaintext = xchacha20poly1305(key, nonce).decrypt(inner);
  } catch (e) {
    throw new Error(`Failed to decrypt DK (wrong backup key or corrupted ciphertext): ${e}`);
  }
  return new TwistedEd25519PrivateKey(plaintext);
}
