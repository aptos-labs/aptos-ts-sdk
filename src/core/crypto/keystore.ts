// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Aptos Keystore — Encrypted private key storage standard.
 *
 * Based on the Ethereum Web3 Secret Storage Definition (keystore v3) and ERC-2335,
 * adapted for Aptos key types. Supports encrypting Ed25519, Secp256k1, and Secp256r1
 * private keys with a password or key file using industry-standard cryptography:
 *
 * - KDF: scrypt (default) or PBKDF2-HMAC-SHA256
 * - Cipher: AES-128-CTR
 * - MAC: SHA-256
 *
 * The resulting JSON is portable across Aptos SDKs (TypeScript, Rust, Python, Go, etc.).
 *
 * @module
 */

import { sha256 } from "@noble/hashes/sha256";
import { scrypt as nobleScrypt } from "@noble/hashes/scrypt";
import { pbkdf2 as noblePbkdf2 } from "@noble/hashes/pbkdf2";
import { randomBytes, bytesToHex, hexToBytes } from "@noble/hashes/utils";
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

/**
 * The Aptos Keystore JSON structure for encrypted private key storage.
 *
 * This format is based on the Ethereum Web3 Secret Storage Definition (v3),
 * with additions for Aptos-specific key types. It is designed to be portable
 * across all Aptos SDK implementations.
 *
 * @example
 * ```json
 * {
 *   "version": 1,
 *   "id": "a7b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
 *   "key_type": "ed25519",
 *   "address": "0x1234...abcd",
 *   "crypto": {
 *     "cipher": "aes-128-ctr",
 *     "cipherparams": { "iv": "..." },
 *     "ciphertext": "...",
 *     "kdf": "scrypt",
 *     "kdfparams": { "n": 131072, "r": 8, "p": 1, "dklen": 32, "salt": "..." },
 *     "mac": "..."
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
    cipher: "aes-128-ctr";
    /** Cipher parameters. */
    cipherparams: {
      /** Hex-encoded initialization vector (no 0x prefix). */
      iv: string;
    };
    /** Hex-encoded encrypted private key (no 0x prefix). */
    ciphertext: string;
    /** Key derivation function identifier. */
    kdf: "scrypt" | "pbkdf2";
    /** KDF-specific parameters. */
    kdfparams: ScryptKdfParams | Pbkdf2KdfParams;
    /** Hex-encoded MAC for password verification: SHA-256(DK[16..31] ++ ciphertext) (no 0x prefix). */
    mac: string;
  };
}

/**
 * Options for customizing keystore encryption.
 */
export interface KeystoreEncryptOptions {
  /** KDF to use. Defaults to "scrypt". */
  kdf?: "scrypt" | "pbkdf2";
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
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

function passwordToBytes(password: string | Uint8Array): Uint8Array {
  if (typeof password === "string") {
    return new TextEncoder().encode(password);
  }
  return password;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

function computeMac(derivedKey: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const macBody = concat(derivedKey.slice(16, 32), ciphertext);
  return sha256(macBody);
}

function deriveKey(
  password: Uint8Array,
  kdf: "scrypt" | "pbkdf2",
  kdfparams: ScryptKdfParams | Pbkdf2KdfParams,
): Uint8Array {
  const salt = hexToBytes(kdfparams.salt);

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

async function aesCtr128Encrypt(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await globalThis.crypto.subtle.importKey("raw", toArrayBuffer(key), { name: "AES-CTR" }, false, [
    "encrypt",
  ]);
  const result = await globalThis.crypto.subtle.encrypt(
    { name: "AES-CTR", counter: toArrayBuffer(iv), length: 128 },
    cryptoKey,
    toArrayBuffer(plaintext),
  );
  return new Uint8Array(result);
}

async function aesCtr128Decrypt(key: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await globalThis.crypto.subtle.importKey("raw", toArrayBuffer(key), { name: "AES-CTR" }, false, [
    "decrypt",
  ]);
  const result = await globalThis.crypto.subtle.decrypt(
    { name: "AES-CTR", counter: toArrayBuffer(iv), length: 128 },
    cryptoKey,
    toArrayBuffer(ciphertext),
  );
  return new Uint8Array(result);
}

function generateUUID(): string {
  return globalThis.crypto.randomUUID();
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
  const { kdf = "scrypt", scryptN = 131072, scryptR = 8, scryptP = 1, pbkdf2C = 262144, address } = options;

  const passwordBytes = passwordToBytes(password);
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const keyType = getKeyType(privateKey);
  const plaintext = privateKey.toUint8Array();

  let kdfparams: ScryptKdfParams | Pbkdf2KdfParams;
  if (kdf === "scrypt") {
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

  const dk = deriveKey(passwordBytes, kdf, kdfparams);
  const encryptionKey = dk.slice(0, 16);
  const ciphertext = await aesCtr128Encrypt(encryptionKey, iv, plaintext);
  const mac = computeMac(dk, ciphertext);

  const keystore: AptosKeyStore = {
    version: 1,
    id: generateUUID(),
    key_type: keyType,
    crypto: {
      cipher: "aes-128-ctr",
      cipherparams: { iv: bytesToHex(iv) },
      ciphertext: bytesToHex(ciphertext),
      kdf,
      kdfparams,
      mac: bytesToHex(mac),
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
 * Verifies the MAC to ensure the password is correct before decrypting.
 * Returns the appropriate private key type (Ed25519, Secp256k1, or Secp256r1)
 * based on the `key_type` field in the keystore.
 *
 * @param args.keystore - The keystore object or a JSON string to decrypt.
 * @param args.password - The password string or key-file bytes used during encryption.
 * @returns A promise that resolves to the decrypted private key.
 * @throws Error if the password is incorrect (MAC verification fails).
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
  if (cryptoData.cipher !== "aes-128-ctr") {
    throw new Error(`Unsupported cipher: ${cryptoData.cipher}`);
  }

  const passwordBytes = passwordToBytes(password);
  const dk = deriveKey(passwordBytes, cryptoData.kdf, cryptoData.kdfparams);
  const ciphertext = hexToBytes(cryptoData.ciphertext);

  const expectedMac = computeMac(dk, ciphertext);
  const storedMac = hexToBytes(cryptoData.mac);

  if (bytesToHex(expectedMac) !== bytesToHex(storedMac)) {
    throw new Error("Invalid password: MAC verification failed");
  }

  const encryptionKey = dk.slice(0, 16);
  const iv = hexToBytes(cryptoData.cipherparams.iv);
  const plaintext = await aesCtr128Decrypt(encryptionKey, iv, ciphertext);

  return createPrivateKey(plaintext, keystore.key_type);
}

// endregion
