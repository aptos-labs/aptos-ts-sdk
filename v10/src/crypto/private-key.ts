import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import type { PublicKey } from "./public-key.js";
import type { Signature } from "./signature.js";
import { PrivateKeyVariants } from "./types.js";

/**
 * Interface that every private key implementation must satisfy.
 *
 * A private key can sign messages, derive its corresponding public key, and
 * export its raw bytes.
 */
export interface PrivateKey {
  /**
   * Signs the given message and returns a signature.
   *
   * @param message - The message to sign, as a hex string or `Uint8Array`.
   * @returns The resulting {@link Signature}.
   */
  sign(message: HexInput): Signature;

  /**
   * Derives and returns the public key that corresponds to this private key.
   *
   * @returns The associated {@link PublicKey}.
   */
  publicKey(): PublicKey;

  /**
   * Returns the raw byte representation of the private key.
   *
   * @returns The private key as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array;
}

/**
 * Utility helpers shared across all private key implementations.
 *
 * These helpers handle AIP-80 prefix formatting and parsing so that private
 * keys can be safely serialised and deserialised as human-readable strings.
 */
// Static utilities on the PrivateKey namespace
export const PrivateKeyUtils = {
  /**
   * AIP-80 string prefixes keyed by {@link PrivateKeyVariants}.
   *
   * A private key serialised as a string is always prefixed with one of these
   * values to unambiguously identify its algorithm (e.g. `"ed25519-priv-"`).
   */
  AIP80_PREFIXES: {
    [PrivateKeyVariants.Ed25519]: "ed25519-priv-",
    [PrivateKeyVariants.Secp256k1]: "secp256k1-priv-",
    [PrivateKeyVariants.Secp256r1]: "secp256r1-priv-",
  } as Record<PrivateKeyVariants, string>,

  /**
   * Formats a private key value as an AIP-80 compliant string.
   *
   * If the value already contains the correct AIP-80 prefix only the hex
   * portion is kept; otherwise the raw hex is used directly.
   *
   * @param privateKey - The private key bytes or string to format.
   * @param type - The {@link PrivateKeyVariants} algorithm identifier.
   * @returns An AIP-80 string of the form `"<prefix><hex>"`.
   *
   * @example
   * ```ts
   * PrivateKeyUtils.formatPrivateKey("0xabc123", PrivateKeyVariants.Ed25519);
   * // "ed25519-priv-0xabc123"
   * ```
   */
  formatPrivateKey(privateKey: HexInput, type: PrivateKeyVariants): string {
    const aip80Prefix = PrivateKeyUtils.AIP80_PREFIXES[type];
    let formattedPrivateKey = privateKey;
    if (typeof formattedPrivateKey === "string" && formattedPrivateKey.startsWith(aip80Prefix)) {
      formattedPrivateKey = formattedPrivateKey.split("-")[2];
    }
    return `${aip80Prefix}${Hex.fromHexInput(formattedPrivateKey).toString()}`;
  },

  /**
   * Parses a `HexInput` value (raw hex or AIP-80 string) into a {@link Hex}
   * object, stripping any AIP-80 prefix as appropriate.
   *
   * When `strict` is `true` the input **must** carry the correct AIP-80 prefix;
   * passing a bare hex string throws.  When `strict` is `false` (the default) a
   * bare hex string is accepted without validation.
   *
   * @param value - The raw or AIP-80 encoded private key string/bytes.
   * @param type - The expected {@link PrivateKeyVariants} algorithm.
   * @param strict - Whether to require an AIP-80 prefix.
   * @returns A {@link Hex} object containing only the raw key bytes.
   * @throws If `strict` is `true` and the input does not have the expected prefix.
   */
  parseHexInput(value: HexInput, type: PrivateKeyVariants, strict?: boolean): Hex {
    const aip80Prefix = PrivateKeyUtils.AIP80_PREFIXES[type];

    if (typeof value === "string") {
      if (!strict && !value.startsWith(aip80Prefix)) {
        return Hex.fromHexInput(value);
      }
      if (value.startsWith(aip80Prefix)) {
        return Hex.fromHexString(value.split("-")[2]);
      }
      if (strict) {
        throw new Error("Invalid HexString input while parsing private key. Must AIP-80 compliant string.");
      }
      throw new Error("Invalid HexString input while parsing private key.");
    }

    return Hex.fromHexInput(value);
  },
};
