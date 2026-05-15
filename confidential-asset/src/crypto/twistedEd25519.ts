// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ed25519, ristretto255 } from "@noble/curves/ed25519.js";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/utils.js";
import {
  CKDPriv,
  deriveKey,
  Deserializer,
  Ed25519Signature,
  HARDENED_OFFSET,
  Hex,
  HexInput,
  isValidHardenedPath,
  mnemonicToSeed,
  Serializable,
  Serializer,
  splitPath,
} from "@aptos-labs/ts-sdk";
import { type RistrettoPoint } from "./ristrettoPoint.js";
import { ed25519InvertN, ed25519modN } from "../utils.js";

/**
 * The hash of the basepoint of the Ristretto255 group using SHA3_512
 */
export const HASH_BASE_POINT = "8c9240b456a9e6dc65c377a1048d745f94a08cdb7f44cbcd7b46f34048871134";
/**
 * Ristretto point from HASH_BASE_POINT
 */
export const H_RISTRETTO: RistrettoPoint = ristretto255.Point.fromHex(HASH_BASE_POINT);

/**
 * Represents the public key of a Twisted ElGamal Ed25519 key pair.
 */
export class TwistedEd25519PublicKey {
  /**
   * Length of an Ed25519 public key
   */
  static readonly LENGTH: number = 32;

  /**
   * Bytes of the public key
   * @private
   */
  private readonly key: Hex;

  /**
   * Create a new PublicKey instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   */
  constructor(hexInput: HexInput) {
    const hex = Hex.fromHexInput(hexInput);
    if (hex.toUint8Array().length !== TwistedEd25519PublicKey.LENGTH) {
      throw new Error(`PublicKey length should be ${TwistedEd25519PublicKey.LENGTH}`);
    }
    this.key = hex;
  }

  /**
   * Get the public key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the public key
   */
  toUint8Array(): Uint8Array {
    return this.key.toUint8Array();
  }

  /**
   * Get the public key as a hex string with the 0x prefix.
   *
   * @returns string representation of the public key
   */
  toString(): string {
    return this.key.toString();
  }

  /**
   * Get the public key as a hex string without the 0x prefix.
   *
   * @returns string representation of the public key
   */
  toStringWithoutPrefix(): string {
    return this.key.toStringWithoutPrefix();
  }

  // region Serializable

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): TwistedEd25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new TwistedEd25519PublicKey(bytes);
  }

  // endregion
}

/**
 * Represents the private key of a Twisted ElGamal Ed25519 key pair.
 */
export class TwistedEd25519PrivateKey extends Serializable {
  /**
   * Length of an Ed25519 private key
   */
  static readonly LENGTH: number = 32;

  /**
   * The Ed25519 key seed to use for BIP-32 compatibility
   * See more {@link https://github.com/satoshilabs/slips/blob/master/slip-0010.md}
   */
  static readonly SLIP_0010_SEED = "ed25519 seed";

  /**
   * The Ed25519 signing key
   * @private
   */
  private readonly key: Hex;

  /**
   * Whether the key has been cleared from memory.
   * @private
   */
  private cleared: boolean = false;

  // region Constructors

  /**
   * Create a new PrivateKey instance from a Uint8Array or String.
   *
   * @param hexInput HexInput (string or Uint8Array)
   */
  constructor(hexInput: HexInput) {
    super();

    const privateKeyHex = Hex.fromHexInput(hexInput);
    if (privateKeyHex.toUint8Array().length !== TwistedEd25519PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${TwistedEd25519PrivateKey.LENGTH}`);
    }

    // Create keyPair from Private key in Uint8Array format
    this.key = privateKeyHex;
  }

  /**
   * Generate a new random private key.
   *
   * @returns TwistedEd25519PrivateKey
   */
  static generate(): TwistedEd25519PrivateKey {
    const keyPair = ed25519.utils.randomSecretKey();
    return new TwistedEd25519PrivateKey(keyPair);
  }

  /**
   * Derives a private key from a mnemonic seed phrase.
   *
   * To derive multiple keys from the same phrase, change the path
   *
   * IMPORTANT: Ed25519 supports hardened derivation only (since it lacks a key homomorphism,
   * so non-hardened derivation cannot work)
   *
   * @param path the BIP44 path
   * @param mnemonics the mnemonic seed phrase
   */
  static fromDerivationPath(path: string, mnemonics: string): TwistedEd25519PrivateKey {
    if (!isValidHardenedPath(path)) {
      throw new Error(`Invalid derivation path ${path}`);
    }
    return TwistedEd25519PrivateKey.fromDerivationPathInner(path, mnemonicToSeed(mnemonics));
  }

  static decryptionKeyDerivationMessage = "Sign this message to derive decryption key from your private key";

  static fromSignature(signature: Ed25519Signature): TwistedEd25519PrivateKey {
    const scalarLE = bytesToNumberLE(signature.toUint8Array());
    const invertModScalarLE = ed25519modN(scalarLE);
    const key = numberToBytesLE(invertModScalarLE, 32);

    return new TwistedEd25519PrivateKey(key);
  }

  /**
   * A private inner function so we can separate from the main fromDerivationPath() method
   * to add tests to verify we create the keys correctly.
   *
   * @param path the BIP44 path
   * @param seed the seed phrase created by the mnemonics
   * @param offset the offset used for key derivation, defaults to 0x80000000
   * @returns
   */
  private static fromDerivationPathInner(
    path: string,
    seed: Uint8Array,
    offset = HARDENED_OFFSET,
  ): TwistedEd25519PrivateKey {
    const { key, chainCode } = deriveKey(TwistedEd25519PrivateKey.SLIP_0010_SEED, seed);

    const segments = splitPath(path).map((el) => parseInt(el, 10));

    // Derive the child key based on the path
    const { key: privateKey } = segments.reduce((parentKeys, segment) => CKDPriv(parentKeys, segment + offset), {
      key,
      chainCode,
    });
    return new TwistedEd25519PrivateKey(privateKey);
  }

  // endregion

  // region PrivateKey

  /**
   * Derive the TwistedEd25519PublicKey for this private key.
   *
   * @returns TwistedEd25519PublicKey
   */
  publicKey(): TwistedEd25519PublicKey {
    this.ensureNotCleared();
    const scalarLE = bytesToNumberLE(this.key.toUint8Array());
    const invertModScalarLE = ed25519InvertN(scalarLE);
    const key = H_RISTRETTO.multiply(invertModScalarLE).toBytes();

    return new TwistedEd25519PublicKey(key);
  }

  /**
   * Get the private key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the private key
   */
  toUint8Array(): Uint8Array {
    this.ensureNotCleared();
    return this.key.toUint8Array();
  }

  /**
   * Get the private key as a hex string with the 0x prefix.
   *
   * @returns string representation of the private key
   */
  toString(): string {
    this.ensureNotCleared();
    return this.key.toString();
  }

  /**
   * Get the private key as a hex string without the 0x prefix.
   *
   * @returns string representation of the private key
   */
  toStringWithoutPrefix(): string {
    this.ensureNotCleared();
    return this.key.toStringWithoutPrefix();
  }

  // endregion

  // region Memory lifecycle

  /**
   * Throws if the key has already been cleared.
   * @private
   */
  private ensureNotCleared(): void {
    if (this.cleared) {
      throw new Error("Private key has been cleared from memory and can no longer be used");
    }
  }

  /**
   * Overwrites the underlying private-key byte buffer with random bytes and
   * then zeros. After calling this method the key can no longer be used for
   * `publicKey()`, `toUint8Array()`, `toString()`, or `serialize()`.
   *
   * SECURITY: Due to JavaScript's memory model this CANNOT fully erase the
   * key material. Specifically:
   *   - any `toString()` / `toStringWithoutPrefix()` output retained by the
   *     caller is an immutable JS string and can't be overwritten;
   *   - noble-curves and downstream `ed25519modN` / `ed25519InvertN`
   *     operations may have produced intermediate `BigInt` copies (also
   *     immutable);
   *   - the GC may have relocated the buffer between heap regions.
   *
   * This method zeros the `Uint8Array` backing the SDK's own `Hex` wrapper,
   * which is the most reachable copy and the only one we can reliably wipe
   * from pure JS. Treat the API as a best-effort window-narrowing tool, not
   * a true zeroization guarantee.
   */
  clear(): void {
    if (!this.cleared) {
      const keyBytes = this.key.toUint8Array();
      // Multiple overwrite passes for consistency with the main SDK.
      crypto.getRandomValues(keyBytes);
      keyBytes.fill(0xff);
      crypto.getRandomValues(keyBytes);
      keyBytes.fill(0);
      this.cleared = true;
    }
  }

  /**
   * Returns whether `clear()` has been called.
   */
  isCleared(): boolean {
    return this.cleared;
  }

  // endregion

  // region Serializable

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): TwistedEd25519PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new TwistedEd25519PrivateKey(bytes);
  }

  // endregion
}
