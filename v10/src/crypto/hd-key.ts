import { hmac } from "@noble/hashes/hmac.js";
import { sha512 } from "@noble/hashes/sha2.js";
import * as bip39 from "@scure/bip39";

/**
 * A derived key and its associated chain code, as produced by the SLIP-0010
 * hierarchical-deterministic key derivation algorithm.
 */
export type DerivedKeys = {
  /** The 32-byte derived private key. */
  key: Uint8Array;
  /** The 32-byte chain code used for further child derivation. */
  chainCode: Uint8Array;
};

/**
 * Regular expression that matches Aptos hardened derivation paths of the form
 * `m/44'/637'/<account>'/<change>'/<index>'?`.
 *
 * Used by {@link isValidHardenedPath}.
 */
export const APTOS_HARDENED_REGEX = /^m\/44'\/637'\/[0-9]+'\/[0-9]+'\/[0-9]+'?$/;

/**
 * Regular expression that matches Aptos BIP-44 derivation paths of the form
 * `m/44'/637'/<account>'/<change>/<index>`.
 *
 * Used by {@link isValidBIP44Path}.
 */
export const APTOS_BIP44_REGEX = /^m\/44'\/637'\/[0-9]+'\/[0-9]+\/[0-9]+$/;

/**
 * The SLIP-0010 hardened key offset (2^31).
 *
 * Add this offset to a path segment index to request a hardened child key.
 */
export const HARDENED_OFFSET = 0x80000000;

/**
 * Returns whether `path` is a valid Aptos BIP-44 derivation path.
 *
 * A valid BIP-44 path for Aptos matches `m/44'/637'/<account>'/<change>/<index>`,
 * where the last two segments are **not** hardened.
 *
 * @param path - The derivation path string to validate.
 * @returns `true` if the path is valid, `false` otherwise.
 *
 * @example
 * ```ts
 * isValidBIP44Path("m/44'/637'/0'/0/0"); // true
 * isValidBIP44Path("m/44'/637'/0'/0'/0'"); // false (hardened)
 * ```
 */
export function isValidBIP44Path(path: string): boolean {
  return APTOS_BIP44_REGEX.test(path);
}

/**
 * Returns whether `path` is a valid Aptos hardened derivation path.
 *
 * A valid hardened path matches `m/44'/637'/<account>'/<change>'/<index>'?`,
 * where all segments are hardened (primed).
 *
 * @param path - The derivation path string to validate.
 * @returns `true` if the path is a valid hardened path, `false` otherwise.
 *
 * @example
 * ```ts
 * isValidHardenedPath("m/44'/637'/0'/0'/0'"); // true
 * isValidHardenedPath("m/44'/637'/0'/0/0");   // false
 * ```
 */
export function isValidHardenedPath(path: string): boolean {
  return APTOS_HARDENED_REGEX.test(path);
}

const textEncoder = new TextEncoder();
const toBytes = (input: Uint8Array | string): Uint8Array =>
  typeof input === "string" ? textEncoder.encode(input) : input;

const removeApostrophes = (val: string): string => val.replace(/'/g, "");

/**
 * Derives a key and chain code from a seed using HMAC-SHA512, as specified by
 * SLIP-0010.
 *
 * @param hashSeed - The HMAC key (a curve-specific seed string such as
 *   `"ed25519 seed"` or raw bytes).
 * @param data - The data to derive from (the BIP-39 seed bytes for the master
 *   key, or child data for subsequent levels).
 * @returns A {@link DerivedKeys} object containing the 32-byte `key` and
 *   32-byte `chainCode`.
 *
 * @example
 * ```ts
 * const { key, chainCode } = deriveKey("ed25519 seed", seedBytes);
 * ```
 */
export const deriveKey = (hashSeed: Uint8Array | string, data: Uint8Array | string): DerivedKeys => {
  const digest = hmac.create(sha512, toBytes(hashSeed)).update(toBytes(data)).digest();
  return {
    key: digest.slice(0, 32),
    chainCode: digest.slice(32),
  };
};

/**
 * Derives a hardened child key from a parent key and chain code using the
 * SLIP-0010 `CKDpriv` function.
 *
 * @param param0 - The parent {@link DerivedKeys} (`key` and `chainCode`).
 * @param index - The child index.  Pass a hardened index (i.e. `index + HARDENED_OFFSET`)
 *   to derive a hardened child.
 * @returns The child {@link DerivedKeys}.
 *
 * @example
 * ```ts
 * const child = CKDPriv(parentKeys, 0 + HARDENED_OFFSET);
 * ```
 */
export const CKDPriv = ({ key, chainCode }: DerivedKeys, index: number): DerivedKeys => {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint32(0, index);
  const indexBytes = new Uint8Array(buffer);
  const zero = new Uint8Array([0]);
  const data = new Uint8Array([...zero, ...key, ...indexBytes]);
  return deriveKey(chainCode, data);
};

/**
 * Splits a BIP-32/SLIP-0010 derivation path into its individual numeric
 * segment strings, stripping the leading `"m"` component and removing
 * hardened apostrophes.
 *
 * @param path - A derivation path such as `"m/44'/637'/0'/0'/0'"`.
 * @returns An array of segment strings without apostrophes, e.g.
 *   `["44", "637", "0", "0", "0"]`.
 *
 * @example
 * ```ts
 * splitPath("m/44'/637'/0'/0'/0'"); // ["44", "637", "0", "0", "0"]
 * ```
 */
export const splitPath = (path: string): Array<string> => path.split("/").slice(1).map(removeApostrophes);

/**
 * Converts a BIP-39 mnemonic phrase to its 64-byte seed using
 * `bip39.mnemonicToSeedSync`.
 *
 * The mnemonic is normalised (trimmed, collapsed whitespace, lower-cased)
 * before derivation.
 *
 * @param mnemonic - A space-separated BIP-39 mnemonic phrase.
 * @returns The 64-byte seed as a `Uint8Array`.
 *
 * @example
 * ```ts
 * const seed = mnemonicToSeed("abandon abandon abandon ... about");
 * ```
 */
export const mnemonicToSeed = (mnemonic: string): Uint8Array => {
  const normalizedMnemonic = mnemonic
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join(" ");
  return bip39.mnemonicToSeedSync(normalizedMnemonic);
};
