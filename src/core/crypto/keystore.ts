// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Aptos Keystore — Encrypted private key storage standard.
 *
 * Based on the Ethereum Web3 Secret Storage Definition (keystore v3) and ERC-2335,
 * adapted for Aptos key types. Supports encrypting Ed25519, Secp256k1, and Secp256r1
 * private keys with a password or key file using modern cryptography:
 *
 * - KDF: Argon2id (default), scrypt, or PBKDF2-HMAC-SHA256
 * - Cipher: AES-256-GCM (authenticated encryption)
 *
 * AES-256-GCM provides both confidentiality and integrity in a single operation,
 * eliminating the need for a separate MAC. The GCM authentication tag verifies
 * both the ciphertext integrity and the correctness of the password.
 *
 * The resulting JSON is portable across Aptos SDKs (TypeScript, Rust, Python, Go, etc.).
 *
 * @module
 */

import { sha256 } from "@noble/hashes/sha256";
import { scrypt as nobleScrypt } from "@noble/hashes/scrypt";
import { pbkdf2 as noblePbkdf2 } from "@noble/hashes/pbkdf2";
import { randomBytes, bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { argon2id as hashWasmArgon2id } from "hash-wasm";
import { Ed25519PrivateKey } from "./ed25519";
import { Secp256k1PrivateKey } from "./secp256k1";
import { Secp256r1PrivateKey } from "./secp256r1";
import { PrivateKeyVariants } from "../../types";

/**
 * Union type of all private key types supported by the Aptos Keystore.
 */
export type KeystorePrivateKey = Ed25519PrivateKey | Secp256k1PrivateKey | Secp256r1PrivateKey;

// region Types

/**
 * Argon2id KDF parameters stored in the keystore JSON.
 */
export interface Argon2idKdfParams {
  /** Number of iterations (time cost). */
  iterations: number;
  /** Degree of parallelism. */
  parallelism: number;
  /** Memory size in kibibytes (1024 bytes). */
  memorySize: number;
  /** Derived key length in bytes. */
  dklen: number;
  /** Hex-encoded salt (no 0x prefix). */
  salt: string;
}

/**
 * Scrypt KDF parameters stored in the keystore JSON.
 */
export interface ScryptKdfParams {
  /** CPU/memory cost parameter (must be a power of 2). */
  n: number;
  /** Block size parameter. */
  r: number;
  /** Parallelization parameter. */
  p: number;
  /** Derived key length in bytes. */
  dklen: number;
  /** Hex-encoded salt (no 0x prefix). */
  salt: string;
}

/**
 * PBKDF2 KDF parameters stored in the keystore JSON.
 */
export interface Pbkdf2KdfParams {
  /** Iteration count. */
  c: number;
  /** Derived key length in bytes. */
  dklen: number;
  /** Pseudorandom function identifier. */
  prf: "hmac-sha256";
  /** Hex-encoded salt (no 0x prefix). */
  salt: string;
}

/** Supported KDF algorithms. */
export type KeystoreKdf = "argon2id" | "scrypt" | "pbkdf2";

/** Union of all KDF parameter types. */
export type KeystoreKdfParams = Argon2idKdfParams | ScryptKdfParams | Pbkdf2KdfParams;

/**
 * The Aptos Keystore JSON structure for encrypted private key storage.
 *
 * Uses AES-256-GCM authenticated encryption: the GCM authentication tag provides
 * both integrity and password verification, so no separate MAC field is needed.
 *
 * @example
 * ```json
 * {
 *   "version": 1,
 *   "id": "a7b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
 *   "key_type": "ed25519",
 *   "address": "0x1234...abcd",
 *   "crypto": {
 *     "cipher": "aes-256-gcm",
 *     "cipherparams": { "iv": "...", "tag": "..." },
 *     "ciphertext": "...",
 *     "kdf": "argon2id",
 *     "kdfparams": { "iterations": 3, "parallelism": 4, "memorySize": 65536, "dklen": 32, "salt": "..." }
 *   }
 * }
 * ```
 */
export interface AptosKeyStore {
  /** Keystore format version (always 1). */
  version: 1;
  /** UUID v4 identifier for this keystore. */
  id: string;
  /** Aptos key type stored in this keystore. */
  key_type: PrivateKeyVariants;
  /** Optional Aptos account address associated with this key (0x-prefixed hex). */
  address?: string;
  /** Cryptographic parameters and encrypted data. */
  crypto: {
    /** Symmetric cipher algorithm. */
    cipher: "aes-256-gcm";
    /** Cipher parameters. */
    cipherparams: {
      /** Hex-encoded 12-byte GCM nonce (no 0x prefix). */
      iv: string;
      /** Hex-encoded 16-byte GCM authentication tag (no 0x prefix). */
      tag: string;
    };
    /** Hex-encoded encrypted private key (no 0x prefix). */
    ciphertext: string;
    /** Key derivation function identifier. */
    kdf: KeystoreKdf;
    /** KDF-specific parameters. */
    kdfparams: KeystoreKdfParams;
  };
}

/**
 * Options for customizing keystore encryption.
 */
export interface KeystoreEncryptOptions {
  /** KDF to use. Defaults to "argon2id". */
  kdf?: KeystoreKdf;
  /** Argon2id iterations (time cost). Defaults to 3. */
  argon2Iterations?: number;
  /** Argon2id parallelism. Defaults to 4. */
  argon2Parallelism?: number;
  /** Argon2id memory size in KiB. Defaults to 65536 (64 MiB). */
  argon2MemorySize?: number;
  /** scrypt cost parameter N. Defaults to 131072 (2^17). Must be a power of 2. */
  scryptN?: number;
  /** scrypt block size parameter r. Defaults to 8. */
  scryptR?: number;
  /** scrypt parallelization parameter p. Defaults to 1. */
  scryptP?: number;
  /** PBKDF2 iteration count. Defaults to 262144 (2^18). */
  pbkdf2C?: number;
  /** Optional Aptos account address to include in the keystore. */
  address?: string;
}

// endregion

// region Internal helpers

const DKLEN = 32;
const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function passwordToBytes(password: string | Uint8Array): Uint8Array {
  if (typeof password === "string") {
    return new TextEncoder().encode(password);
  }
  return password;
}

async function deriveKey(password: Uint8Array, kdf: KeystoreKdf, kdfparams: KeystoreKdfParams): Promise<Uint8Array> {
  const salt = hexToBytes(kdfparams.salt);

  if (kdf === "argon2id") {
    const params = kdfparams as Argon2idKdfParams;
    return hashWasmArgon2id({
      password,
      salt,
      iterations: params.iterations,
      parallelism: params.parallelism,
      memorySize: params.memorySize,
      hashLength: params.dklen,
      outputType: "binary",
    });
  }

  if (kdf === "scrypt") {
    const params = kdfparams as ScryptKdfParams;
    return nobleScrypt(password, salt, {
      N: params.n,
      r: params.r,
      p: params.p,
      dkLen: params.dklen,
    });
  }

  const params = kdfparams as Pbkdf2KdfParams;
  return noblePbkdf2(sha256, password, salt, {
    c: params.c,
    dkLen: params.dklen,
  });
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(data.length);
  new Uint8Array(buf).set(data);
  return buf;
}

async function aes256GcmEncrypt(
  key: Uint8Array,
  iv: Uint8Array,
  plaintext: Uint8Array,
): Promise<{ ciphertext: Uint8Array; tag: Uint8Array }> {
  const cryptoKey = await globalThis.crypto.subtle.importKey("raw", toArrayBuffer(key), { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const result = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv), tagLength: GCM_TAG_LENGTH * 8 },
    cryptoKey,
    toArrayBuffer(plaintext),
  );
  const resultBytes = new Uint8Array(result);
  return {
    ciphertext: resultBytes.slice(0, resultBytes.length - GCM_TAG_LENGTH),
    tag: resultBytes.slice(resultBytes.length - GCM_TAG_LENGTH),
  };
}

async function aes256GcmDecrypt(
  key: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await globalThis.crypto.subtle.importKey("raw", toArrayBuffer(key), { name: "AES-GCM" }, false, [
    "decrypt",
  ]);
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);
  const result = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv), tagLength: GCM_TAG_LENGTH * 8 },
    cryptoKey,
    toArrayBuffer(combined),
  );
  return new Uint8Array(result);
}

function getKeyType(privateKey: KeystorePrivateKey): PrivateKeyVariants {
  if (privateKey instanceof Ed25519PrivateKey) return PrivateKeyVariants.Ed25519;
  if (privateKey instanceof Secp256k1PrivateKey) return PrivateKeyVariants.Secp256k1;
  if (privateKey instanceof Secp256r1PrivateKey) return PrivateKeyVariants.Secp256r1;
  throw new Error("Unsupported private key type for keystore encryption");
}

function createPrivateKey(bytes: Uint8Array, keyType: PrivateKeyVariants): KeystorePrivateKey {
  switch (keyType) {
    case PrivateKeyVariants.Ed25519:
      return new Ed25519PrivateKey(bytes, false);
    case PrivateKeyVariants.Secp256k1:
      return new Secp256k1PrivateKey(bytes, false);
    case PrivateKeyVariants.Secp256r1:
      return new Secp256r1PrivateKey(bytes, false);
    default:
      throw new Error(`Unsupported key type in keystore: ${keyType}`);
  }
}

// endregion

// region Public API

/**
 * Encrypt a private key into an Aptos Keystore JSON object.
 *
 * Supports all Aptos private key types (Ed25519, Secp256k1, Secp256r1).
 * The password can be a string (passphrase) or raw bytes (e.g., contents of a key file).
 *
 * Uses AES-256-GCM authenticated encryption with Argon2id key derivation by default.
 *
 * @param args.privateKey - The private key to encrypt.
 * @param args.password - Password string or key-file bytes used to derive the encryption key.
 * @param args.options - Optional encryption parameters (KDF, cost parameters, address).
 * @returns A promise that resolves to the encrypted AptosKeyStore JSON object.
 *
 * @example
 * ```typescript
 * import { Ed25519PrivateKey, encryptKeystore } from "@aptos-labs/ts-sdk";
 *
 * const privateKey = Ed25519PrivateKey.generate();
 * const keystore = await encryptKeystore({
 *   privateKey,
 *   password: "my-secure-password",
 * });
 * console.log(JSON.stringify(keystore, null, 2));
 * ```
 */
export async function encryptKeystore(args: {
  privateKey: KeystorePrivateKey;
  password: string | Uint8Array;
  options?: KeystoreEncryptOptions;
}): Promise<AptosKeyStore> {
  const { privateKey, password, options = {} } = args;
  const {
    kdf = "argon2id",
    argon2Iterations = 3,
    argon2Parallelism = 4,
    argon2MemorySize = 65536,
    scryptN = 131072,
    scryptR = 8,
    scryptP = 1,
    pbkdf2C = 262144,
    address,
  } = options;

  const passwordBytes = passwordToBytes(password);
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(GCM_IV_LENGTH);
  const keyType = getKeyType(privateKey);
  const plaintext = privateKey.toUint8Array();

  let kdfparams: KeystoreKdfParams;
  if (kdf === "argon2id") {
    kdfparams = {
      iterations: argon2Iterations,
      parallelism: argon2Parallelism,
      memorySize: argon2MemorySize,
      dklen: DKLEN,
      salt: bytesToHex(salt),
    };
  } else if (kdf === "scrypt") {
    kdfparams = {
      n: scryptN,
      r: scryptR,
      p: scryptP,
      dklen: DKLEN,
      salt: bytesToHex(salt),
    };
  } else {
    kdfparams = {
      c: pbkdf2C,
      dklen: DKLEN,
      prf: "hmac-sha256",
      salt: bytesToHex(salt),
    };
  }

  const dk = await deriveKey(passwordBytes, kdf, kdfparams);
  const { ciphertext, tag } = await aes256GcmEncrypt(dk, iv, plaintext);

  const keystore: AptosKeyStore = {
    version: 1,
    id: globalThis.crypto.randomUUID(),
    key_type: keyType,
    crypto: {
      cipher: "aes-256-gcm",
      cipherparams: {
        iv: bytesToHex(iv),
        tag: bytesToHex(tag),
      },
      ciphertext: bytesToHex(ciphertext),
      kdf,
      kdfparams,
    },
  };

  if (address !== undefined) {
    keystore.address = address;
  }

  return keystore;
}

/**
 * Decrypt an Aptos Keystore to recover the private key.
 *
 * Uses AES-256-GCM authenticated decryption: the GCM tag verifies both the
 * ciphertext integrity and the correctness of the derived key (and therefore
 * the password). If the password is wrong, decryption will fail with an error.
 *
 * @param args.keystore - The keystore object or a JSON string to decrypt.
 * @param args.password - The password string or key-file bytes used during encryption.
 * @returns A promise that resolves to the decrypted private key.
 * @throws Error if the password is incorrect (GCM authentication fails).
 * @throws Error if the keystore format is invalid.
 *
 * @example
 * ```typescript
 * import { decryptKeystore } from "@aptos-labs/ts-sdk";
 *
 * const privateKey = await decryptKeystore({
 *   keystore: keystoreJson,
 *   password: "my-secure-password",
 * });
 * ```
 */
export async function decryptKeystore(args: {
  keystore: AptosKeyStore | string;
  password: string | Uint8Array;
}): Promise<KeystorePrivateKey> {
  const { password } = args;
  const keystore: AptosKeyStore = typeof args.keystore === "string" ? JSON.parse(args.keystore) : args.keystore;

  if (keystore.version !== 1) {
    throw new Error(`Unsupported keystore version: ${keystore.version}`);
  }

  const { crypto: cryptoData } = keystore;
  if (cryptoData.cipher !== "aes-256-gcm") {
    throw new Error(`Unsupported cipher: ${cryptoData.cipher}`);
  }

  const passwordBytes = passwordToBytes(password);
  const dk = await deriveKey(passwordBytes, cryptoData.kdf, cryptoData.kdfparams);
  const ciphertext = hexToBytes(cryptoData.ciphertext);
  const iv = hexToBytes(cryptoData.cipherparams.iv);
  const tag = hexToBytes(cryptoData.cipherparams.tag);

  let plaintext: Uint8Array;
  try {
    plaintext = await aes256GcmDecrypt(dk, iv, ciphertext, tag);
  } catch {
    throw new Error("Invalid password: decryption failed (GCM authentication)");
  }

  return createPrivateKey(plaintext, keystore.key_type);
}

// endregion
