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
 *
 * See https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
export const APTOS_PATH_REGEX = /^m\/44'\/637'\/[0-9]+'\/[0-9]+'\/[0-9]+'?$/;

/**
 * A list of supported key types and associated seeds
 */
export enum KeyType {
  ED25519 = "ed25519 seed",
}

const HARDENED_OFFSET = 0x80000000;

const deriveKey = (hashSeed: Uint8Array | string, data: Uint8Array | string): DerivedKeys => {
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
const CKDPriv = ({ key, chainCode }: DerivedKeys, index: number): DerivedKeys => {
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
const splitPath = (path: string): Array<string> => path.split("/").slice(1).map(removeApostrophes);

/**
 * Checks if the BIP44 path is valid for Aptos
 * @param path the BIP44 path
 *
 * @returns true if the path is a valid Aptos path
 */
export const isValidPath = (path: string): boolean => {
  if (!APTOS_PATH_REGEX.test(path)) {
    return false;
  }
  return !splitPath(path).some(Number.isNaN as any);
};

/**
 * Normalizes the mnemonic by removing extra whitespace and making it lowercase
 * @param mnemonic the mnemonic seed phrase
 */
const mnemonicToSeed = (mnemonic: string): Uint8Array => {
  const normalizedMnemonic = mnemonic
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join(" ");
  return bip39.mnemonicToSeedSync(normalizedMnemonic);
};

/**
 * Derives a private key from a mnemonic seed phrase.
 *
 * To derive multiple keys from the same phrase, change the path
 * @param keyType the key type seed used to derive keys
 * @param path the BIP44 path
 * @param seedPhrase the mnemonic seed phrase
 * @param offset the offset used for key derivation, defaults to [HARDENED_OFFSET]
 */
export const derivePrivateKeyFromMnemonic = (
  keyType: KeyType,
  path: string,
  seedPhrase: string,
  offset = HARDENED_OFFSET,
): DerivedKeys => {
  if (!isValidPath(path)) {
    throw new Error("Invalid derivation path");
  }

  // Derive the master key from the mnemonic
  const { key, chainCode } = deriveKey(keyType, mnemonicToSeed(seedPhrase));
  const segments = splitPath(path).map((el) => parseInt(el, 10));

  // Derive the child key based on the path
  return segments.reduce((parentKeys, segment) => CKDPriv(parentKeys, segment + offset), { key, chainCode });
};
