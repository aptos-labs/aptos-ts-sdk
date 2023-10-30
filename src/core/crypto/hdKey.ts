// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import * as bip39 from "@scure/bip39";

export type DerivedKeys = {
  key: Uint8Array;
  chainCode: Uint8Array;
};

/**
 * Aptos derive path is 637
 */
export const APTOS_HARDENED_REGEX = /^m\/44'\/637'\/[0-9]+'\/[0-9]+'\/[0-9]+'?$/;
export const APTOS_BIP32_REGEX = /^m\/44'\/637'\/[0-9]+'\/[0-9]+\/[0-9]+$/;

/**
 * A list of supported key types and associated seeds
 */
export enum KeyType {
  ED25519 = "ed25519 seed",
}

export const HARDENED_OFFSET = 0x80000000;

/**
 * Aptos derive path is 637
 *
 * Parse and validate a path that is compliant to BIP-32 in form m/44'/637'/{account_index}'/{change_index}/{address_index}
 * for Secp256k1
 *
 * Note that for secp256k1, last two components must be non-hardened.
 *
 * @param path path string (e.g. `m/44'/637'/0'/0/0`).
 */
export function isValidBIP32Path(path: string): boolean {
  if (!APTOS_BIP32_REGEX.test(path)) {
    return false;
  }
  return true;
}

/**
 * Aptos derive path is 637
 *
 * Parse and validate a path that is compliant to SLIP-0010 in form m/44'/637'/{account_index}'/{change_index}'/{address_index}'.
 * See {@link https://github.com/satoshilabs/slips/blob/master/slip-0044.md}
 *
 * Note that for ed25519, all components must be hardened.
 *
 * @param path path string (e.g. `m/44'/637'/0'/0'/0'`).
 */
export function isValidHardenedPath(path: string): boolean {
  if (!APTOS_HARDENED_REGEX.test(path)) {
    return false;
  }
  return true;
}

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
 * @constructor
 */
export const CKDPriv = ({ key, chainCode }: DerivedKeys, index: number): DerivedKeys => {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint32(0, index);
  const indexBytes = new Uint8Array(buffer);
  const zero = new Uint8Array([0]);
  const data = new Uint8Array([...zero, ...key, ...indexBytes]);
  return deriveKey(chainCode, data);
};

const removeApostrophes = (val: string): string => val.replace("'", "");

/**
 * Splits derive path into segments
 * @param path
 */
export const splitPath = (path: string): Array<string> => path.split("/").slice(1).map(removeApostrophes);

/**
 * Normalizes the mnemonic by removing extra whitespace and making it lowercase
 * @param mnemonic the mnemonic seed phrase
 */
export const mnemonicToSeed = (mnemonic: string): Uint8Array => {
  const normalizedMnemonic = mnemonic
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join(" ");
  return bip39.mnemonicToSeedSync(normalizedMnemonic);
};
