// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import * as bip39 from "@scure/bip39";

/**
 * Contains the derived cryptographic key as a Uint8Array.
 * @group Implementation
 * @category Serialization
 */
export type DerivedKeys = {
  key: Uint8Array;
  chainCode: Uint8Array;
};

/**
 * Aptos derive path is 637
 * @group Implementation
 * @category Serialization
 */
export const APTOS_HARDENED_REGEX = /^m\/44'\/637'\/[0-9]+'\/[0-9]+'\/[0-9]+'?$/;

/**
 * @group Implementation
 * @category Serialization
 */
export const APTOS_BIP44_REGEX = /^m\/44'\/637'\/[0-9]+'\/[0-9]+\/[0-9]+$/;

/**
 * Supported key types and their associated seeds.
 * @group Implementation
 * @category Serialization
 */
export enum KeyType {
  ED25519 = "ed25519 seed",
}

/**
 * @group Implementation
 * @category Serialization
 */
export const HARDENED_OFFSET = 0x80000000;

/**
 * Validate a BIP-44 derivation path string to ensure it meets the required format.
 * This function checks if the provided path adheres to the BIP-44 standard for Secp256k1.
 * Parse and validate a path that is compliant to BIP-44 in form m/44'/637'/{account_index}'/{change_index}/{address_index}
 * for Secp256k1
 *
 * Note that for Secp256k1, the last two components must be non-hardened.
 *
 * @param path - The path string to validate (e.g. `m/44'/637'/0'/0/0`).
 * @group Implementation
 * @category Serialization
 */
export function isValidBIP44Path(path: string): boolean {
  return APTOS_BIP44_REGEX.test(path);
}

/**
 * Aptos derive path is 637
 *
 * Parse and validate a path that is compliant to SLIP-0010 and BIP-44
 * in form m/44'/637'/{account_index}'/{change_index}'/{address_index}'.
 * See SLIP-0010 {@link https://github.com/satoshilabs/slips/blob/master/slip-0044.md}
 * See BIP-44 {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki}
 *
 * Note that for Ed25519, all components must be hardened.
 * This is because non-hardened [PK] derivation would not work due to Ed25519's lack of a key homomorphism.
 * Specifically, you cannot derive the PK associated with derivation path a/b/c given the PK of a/b.
 * This is because the PK in Ed25519 is, more or less, computed as 𝑔𝐻(𝑠𝑘),
 * with the hash function breaking the homomorphism.
 *
 * @param path - The derivation path string to validate (e.g. `m/44'/637'/0'/0'/0'`).
 * @group Implementation
 * @category Serialization
 */
export function isValidHardenedPath(path: string): boolean {
  return APTOS_HARDENED_REGEX.test(path);
}

/**
 * @group Implementation
 * @category Serialization
 */
export const deriveKey = (hashSeed: Uint8Array | string, data: Uint8Array | string): DerivedKeys => {
  const digest = hmac.create(sha512, hashSeed).update(data).digest();
  return {
    key: digest.slice(0, 32),
    chainCode: digest.slice(32),
  };
};

/**
 * Derive a child key from the private key
 * @param key
 * @param chainCode
 * @param index
 * @group Implementation
 * @category Serialization
 */
export const CKDPriv = ({ key, chainCode }: DerivedKeys, index: number): DerivedKeys => {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint32(0, index);
  const indexBytes = new Uint8Array(buffer);
  const zero = new Uint8Array([0]);
  const data = new Uint8Array([...zero, ...key, ...indexBytes]);
  return deriveKey(chainCode, data);
};

const removeApostrophes = (val: string): string => val.replace(/'/g, "");

/**
 * Splits derive path into segments
 * @param path
 * @group Implementation
 * @category Serialization
 */
export const splitPath = (path: string): Array<string> => path.split("/").slice(1).map(removeApostrophes);

/**
 * Normalizes the mnemonic by removing extra whitespace and making it lowercase
 * @param mnemonic the mnemonic seed phrase
 * @group Implementation
 * @category Serialization
 */
export const mnemonicToSeed = (mnemonic: string): Uint8Array => {
  const normalizedMnemonic = mnemonic
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join(" ");
  return bip39.mnemonicToSeedSync(normalizedMnemonic);
};
