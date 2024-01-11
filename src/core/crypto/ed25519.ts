// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import nacl from "tweetnacl";
import { AuthenticationKey } from "../authenticationKey";
import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";
import { Hex } from "../hex";
import { HexInput, SigningScheme as AuthenticationKeyScheme } from "../../types";
import { CKDPriv, deriveKey, HARDENED_OFFSET, isValidHardenedPath, mnemonicToSeed, splitPath } from "./hdKey";

/**
 * Represents the public key of an Ed25519 key pair.
 *
 * Since [AIP-55](https://github.com/aptos-foundation/AIPs/pull/263) Aptos supports
 * `Legacy` and `Unified` authentication keys.
 *
 * Ed25519 scheme is represented in the SDK as `Legacy authentication key` and also
 * as `AnyPublicKey` that represents any `Unified authentication key`
 */
export class Ed25519PublicKey extends Serializable {
  /**
   * Length of an Ed25519 public key
   */
  static readonly LENGTH: number = 32;

  /**
   * Authentication scheme
   */
  public readonly scheme = AuthenticationKeyScheme.Ed25519;

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
    super();

    const hex = Hex.fromHexInput(hexInput);
    if (hex.toUint8Array().length !== Ed25519PublicKey.LENGTH) {
      throw new Error(`PublicKey length should be ${Ed25519PublicKey.LENGTH}`);
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
   * Verifies a signed data with a public key
   * @param args.message a signed message
   * @param args.signature the signature of the message
   */
  verifySignature(args: { message: HexInput; signature: Ed25519Signature }): boolean {
    const { message, signature } = args;
    if (!(signature instanceof Ed25519Signature)) {
      return false;
    }

    const messageBytes = Hex.fromHexInput(message).toUint8Array();
    const signatureBytes = signature.toUint8Array();
    const publicKeyBytes = this.key.toUint8Array();
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  }

  authKey() {
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: this.scheme,
      input: this.key.toUint8Array(),
    });
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PublicKey(bytes);
  }
}

/**
 * Represents the private key of an Ed25519 key pair.
 */
export class Ed25519PrivateKey extends Serializable {
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
  private readonly signingKeyPair: nacl.SignKeyPair;

  // region Constructors

  /**
   * Create a new PrivateKey instance from a Uint8Array or String.
   *
   * @param hexInput HexInput (string or Uint8Array)
   */
  constructor(hexInput: HexInput) {
    super();

    const privateKeyHex = Hex.fromHexInput(hexInput);
    if (privateKeyHex.toUint8Array().length !== Ed25519PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Ed25519PrivateKey.LENGTH}`);
    }

    // Create keyPair from Private key in Uint8Array format
    this.signingKeyPair = nacl.sign.keyPair.fromSeed(privateKeyHex.toUint8Array().slice(0, Ed25519PrivateKey.LENGTH));
  }

  /**
   * Generate a new random private key.
   *
   * @returns Ed25519PrivateKey
   */
  static generate(): Ed25519PrivateKey {
    const keyPair = nacl.sign.keyPair();
    return new Ed25519PrivateKey(keyPair.secretKey.slice(0, Ed25519PrivateKey.LENGTH));
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
  static fromDerivationPath(path: string, mnemonics: string): Ed25519PrivateKey {
    if (!isValidHardenedPath(path)) {
      throw new Error(`Invalid derivation path ${path}`);
    }
    return Ed25519PrivateKey.fromDerivationPathInner(path, mnemonicToSeed(mnemonics));
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
  private static fromDerivationPathInner(path: string, seed: Uint8Array, offset = HARDENED_OFFSET): Ed25519PrivateKey {
    const { key, chainCode } = deriveKey(Ed25519PrivateKey.SLIP_0010_SEED, seed);

    const segments = splitPath(path).map((el) => parseInt(el, 10));

    // Derive the child key based on the path
    const { key: privateKey } = segments.reduce((parentKeys, segment) => CKDPriv(parentKeys, segment + offset), {
      key,
      chainCode,
    });
    return new Ed25519PrivateKey(privateKey);
  }

  // endregion

  // region PrivateKey

  // // eslint-disable-next-line class-methods-use-this
  // scheme() {
  //   return SigningSchemeInput.Ed25519;
  // }

  /**
   * Derive the Ed25519PublicKey for this private key.
   *
   * @returns Ed25519PublicKey
   */
  publicKey(): Ed25519PublicKey {
    const bytes = this.signingKeyPair.publicKey;
    return new Ed25519PublicKey(bytes);
  }

  /**
   * Sign the given message with the private key.
   *
   * @param message in HexInput format
   * @returns Signature
   */
  sign(message: HexInput): Ed25519Signature {
    const messageBytes = Hex.fromHexInput(message).toUint8Array();
    const signatureBytes = nacl.sign.detached(messageBytes, this.signingKeyPair.secretKey);
    return new Ed25519Signature(signatureBytes);
  }

  // endregion

  // region Serializable

  /**
   * Get the private key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the private key
   */
  toUint8Array(): Uint8Array {
    return this.signingKeyPair.secretKey.slice(0, Ed25519PrivateKey.LENGTH);
  }

  /**
   * Get the private key as a hex string with the 0x prefix.
   *
   * @returns string representation of the private key
   */
  toString(): string {
    return Hex.fromHexInput(this.toUint8Array()).toString();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PrivateKey(bytes);
  }

  // endregion
}

/**
 * A signature of a message signed using an Ed25519 private key
 */
export class Ed25519Signature extends Serializable {
  /**
   * Length of an Ed25519 signature
   */
  static readonly LENGTH = 64;

  /**
   * Authentication scheme
   */
  public readonly scheme = AuthenticationKeyScheme.Ed25519;

  /**
   * The signature bytes
   * @private
   */
  private readonly data: Hex;

  // region Constructors

  constructor(hexInput: HexInput) {
    super();
    const hex = Hex.fromHexInput(hexInput);
    if (hex.toUint8Array().length !== Ed25519Signature.LENGTH) {
      throw new Error(`Signature length should be ${Ed25519Signature.LENGTH}`);
    }

    this.data = hex;
  }

  // endregion

  // region Serializable

  /**
   * Get the signature in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the signature
   */
  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  /**
   * Get the signature as a hex string with the 0x prefix.
   *
   * @returns string representation of the signature
   */
  toString(): string {
    return this.data.toString();
  }

  // endregion

  // region BcsSerializable

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519Signature {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519Signature(bytes);
  }

  // endregion
}
