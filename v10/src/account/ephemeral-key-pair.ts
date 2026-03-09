// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from "@noble/hashes/utils.js";
import { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { Ed25519PrivateKey } from "../crypto/ed25519.js";
import { EphemeralPublicKey, EphemeralSignature } from "../crypto/ephemeral.js";
import { bytesToBigIntLE, padAndPackBytesWithLen, poseidonHash } from "../crypto/poseidon.js";
import type { PrivateKey } from "../crypto/private-key.js";
import { EphemeralPublicKeyVariant } from "../crypto/types.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";

const TWO_WEEKS_IN_SECONDS = 1_209_600;

function floorToWholeHour(timestampInSeconds: number): number {
  return Math.floor(timestampInSeconds / 3600) * 3600;
}

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * A short-lived key pair used as the inner signing key for keyless accounts.
 *
 * In the keyless flow the user's OAuth/OIDC provider issues a JWT whose `nonce`
 * field commits to the ephemeral public key and an expiry timestamp.  The
 * ephemeral private key is used to sign the actual transaction, while a
 * zero-knowledge proof binds the ephemeral key to the user's OIDC identity.
 *
 * The private key is automatically wiped from memory via {@link clear} once it
 * is no longer needed; after clearing the pair cannot be used for signing.
 *
 * @example
 * ```typescript
 * // Generate a key pair expiring in two weeks (default)
 * const ekp = EphemeralKeyPair.generate();
 * console.log(ekp.nonce); // pass this as the OIDC nonce parameter
 *
 * // Sign a message (throws if expired or cleared)
 * const sig = ekp.sign(message);
 *
 * // Securely erase the private key
 * ekp.clear();
 * ```
 */
export class EphemeralKeyPair extends Serializable {
  /** Length in bytes of the blinder value used in the nonce computation. */
  static readonly BLINDER_LENGTH: number = 31;

  /**
   * The random 31-byte blinder included in the Poseidon hash that produces
   * the JWT nonce.
   */
  readonly blinder: Uint8Array;
  /**
   * Unix timestamp (seconds) after which this key pair is considered expired
   * and can no longer be used for signing.
   */
  readonly expiryDateSecs: number;
  /**
   * The string nonce value that must be embedded in the OIDC authentication
   * request so that the JWT commits to this ephemeral public key.
   *
   * Not zeroed on {@link clear} because the nonce is a public Poseidon hash
   * derived from the ephemeral public key, expiry, and blinder — it does not
   * reveal private key material.
   */
  readonly nonce: string;

  private privateKey: PrivateKey;
  private publicKey: EphemeralPublicKey;
  private cleared: boolean = false;

  /**
   * Creates an {@link EphemeralKeyPair} from an existing private key.
   *
   * @param args.privateKey - The underlying private key.
   * @param args.expiryDateSecs - Unix timestamp (seconds) for the expiry.
   *   Defaults to two weeks from now, floored to the nearest whole hour.
   * @param args.blinder - Optional 31-byte blinder.  A random blinder is
   *   generated if omitted.
   */
  constructor(args: { privateKey: PrivateKey; expiryDateSecs?: number; blinder?: HexInput }) {
    super();
    const { privateKey, expiryDateSecs, blinder } = args;
    this.privateKey = privateKey;
    this.publicKey = new EphemeralPublicKey(privateKey.publicKey());
    this.expiryDateSecs = expiryDateSecs || floorToWholeHour(nowInSeconds() + TWO_WEEKS_IN_SECONDS);
    this.blinder =
      blinder !== undefined ? Hex.fromHexInput(blinder).toUint8Array() : randomBytes(EphemeralKeyPair.BLINDER_LENGTH);

    // Calculate the nonce
    const fields = padAndPackBytesWithLen(this.publicKey.bcsToBytes(), 93);
    fields.push(BigInt(this.expiryDateSecs));
    fields.push(bytesToBigIntLE(this.blinder));
    this.nonce = poseidonHash(fields).toString();
  }

  /**
   * Returns the {@link EphemeralPublicKey} for this key pair.
   *
   * @returns The {@link EphemeralPublicKey} derived from the underlying private key.
   */
  getPublicKey(): EphemeralPublicKey {
    return this.publicKey;
  }

  /**
   * Returns whether this key pair has passed its expiry date.
   *
   * @returns `true` if the current time is past {@link expiryDateSecs}.
   */
  isExpired(): boolean {
    return Math.floor(Date.now() / 1000) > this.expiryDateSecs;
  }

  /**
   * Securely erases the private key and blinder from memory.
   *
   * After calling this method, the key pair can no longer be used for signing.
   * Subsequent calls to {@link sign} will throw an error.  This method is
   * idempotent; calling it more than once has no additional effect.
   */
  clear(): void {
    if (!this.cleared) {
      if ("clear" in this.privateKey && typeof this.privateKey.clear === "function") {
        this.privateKey.clear();
      } else {
        const keyBytes = this.privateKey.toUint8Array();
        crypto.getRandomValues(keyBytes);
        keyBytes.fill(0xff);
        crypto.getRandomValues(keyBytes);
        keyBytes.fill(0);
      }
      crypto.getRandomValues(this.blinder);
      this.blinder.fill(0xff);
      crypto.getRandomValues(this.blinder);
      this.blinder.fill(0);
      this.cleared = true;
    }
  }

  /**
   * Returns whether this key pair has been cleared from memory.
   *
   * @returns `true` if {@link clear} has been called at least once.
   */
  isCleared(): boolean {
    return this.cleared;
  }

  /**
   * Serializes this key pair into BCS bytes.
   *
   * **Security warning:** The serialized output includes the private key material.
   * Only persist the result in secure storage (e.g. encrypted at rest) and avoid
   * logging or transmitting it over insecure channels.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    if (this.cleared) {
      throw new Error("EphemeralKeyPair has been cleared from memory and cannot be serialized");
    }
    serializer.serializeU32AsUleb128(this.publicKey.variant);
    serializer.serializeBytes(this.privateKey.toUint8Array());
    serializer.serializeU64(this.expiryDateSecs);
    serializer.serializeFixedBytes(this.blinder);
  }

  /**
   * Deserializes an {@link EphemeralKeyPair} from a BCS byte stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A fully-constructed {@link EphemeralKeyPair}.
   *
   * @throws Error if the key variant is unsupported.
   */
  static deserialize(deserializer: Deserializer): EphemeralKeyPair {
    const variantIndex = deserializer.deserializeUleb128AsU32();
    let privateKey: PrivateKey;
    switch (variantIndex) {
      case EphemeralPublicKeyVariant.Ed25519:
        privateKey = Ed25519PrivateKey.deserialize(deserializer);
        break;
      default:
        throw new Error(`Unknown variant index for EphemeralPublicKey: ${variantIndex}`);
    }
    const expiryDateSecs = deserializer.deserializeU64();
    const blinder = deserializer.deserializeFixedBytes(31);
    return new EphemeralKeyPair({ privateKey, expiryDateSecs: Number(expiryDateSecs), blinder });
  }

  /**
   * Deserializes an {@link EphemeralKeyPair} from raw bytes.
   *
   * @param bytes - BCS bytes previously produced by {@link EphemeralKeyPair.serialize}.
   * @returns A fully-constructed {@link EphemeralKeyPair}.
   */
  static fromBytes(bytes: Uint8Array): EphemeralKeyPair {
    return EphemeralKeyPair.deserialize(new Deserializer(bytes));
  }

  /**
   * Generates a new {@link EphemeralKeyPair} with a randomly generated Ed25519
   * private key.
   *
   * @param args - Optional generation parameters.
   * @param args.scheme - The key variant to generate.  Currently only Ed25519
   *   is supported.
   * @param args.expiryDateSecs - Optional explicit expiry timestamp (seconds).
   *   Defaults to two weeks from now, floored to the nearest whole hour.
   * @returns A new {@link EphemeralKeyPair}.
   *
   * @example
   * ```typescript
   * const ekp = EphemeralKeyPair.generate();
   * ```
   */
  static generate(args?: { scheme?: EphemeralPublicKeyVariant; expiryDateSecs?: number }): EphemeralKeyPair {
    // Only Ed25519 is supported for now
    return new EphemeralKeyPair({ privateKey: Ed25519PrivateKey.generate(), expiryDateSecs: args?.expiryDateSecs });
  }

  /**
   * Signs a message with the ephemeral private key and returns an
   * {@link EphemeralSignature}.
   *
   * @param data - The message bytes to sign, in any supported hex input format.
   * @returns An {@link EphemeralSignature} over the message.
   *
   * @throws Error if the key pair has been cleared from memory.
   * @throws Error if the key pair has expired.
   */
  sign(data: HexInput): EphemeralSignature {
    if (this.cleared) {
      throw new Error("EphemeralKeyPair has been cleared from memory and can no longer be used");
    }
    if (this.isExpired()) {
      throw new Error("EphemeralKeyPair has expired");
    }
    return new EphemeralSignature(this.privateKey.sign(data));
  }
}
