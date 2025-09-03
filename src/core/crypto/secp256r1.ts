// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 } from "@noble/hashes/sha3";
import { p256 } from "@noble/curves/nist.js";
import { Deserializer, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput, PrivateKeyVariants, SigningScheme as AuthenticationKeyScheme } from "../../types";
import { PublicKey, VerifySignatureAsyncArgs } from "./publicKey";
import { PrivateKey } from "./privateKey";
import { Signature } from "./signature";
import { AuthenticationKey } from "../authenticationKey";

/**
 * Represents the Secp256r1 public key
 *
 * Secp256r1 authentication key is represented in the SDK as `AnyPublicKey`.  It is used to verify WebAuthnSignatures.
 */
export class Secp256r1PublicKey extends PublicKey {
  // Secp256r1 ecdsa public keys contain a prefix indicating compression and two 32-byte coordinates.
  static readonly LENGTH: number = 65;

  // If it's compressed, it is only 33 bytes
  static readonly COMPRESSED_LENGTH: number = 33;

  // Hex value of the public key
  private readonly key: Hex;

  /**
   * Create a new PublicKey instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   */
  constructor(hexInput: HexInput) {
    super();

    const hex = Hex.fromHexInput(hexInput);
    if (
      hex.toUint8Array().length !== Secp256r1PublicKey.LENGTH &&
      hex.toUint8Array().length !== Secp256r1PublicKey.COMPRESSED_LENGTH
    ) {
      throw new Error(`PublicKey length should be ${Secp256r1PublicKey.LENGTH}`);
    }
    this.key = hex;
    if (hex.toUint8Array().length === Secp256r1PublicKey.COMPRESSED_LENGTH) {
      const point = p256.ProjectivePoint.fromHex(hex.toUint8Array());
      this.key = Hex.fromHexInput(point.toRawBytes(false));
    }
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
   *
   * @param args.message message
   * @param args.signature The signature
   * @returns true if the signature is valid
   */
  verifySignature(args: { message: HexInput; signature: Signature }): boolean {
    const { message, signature } = args;

    const msgHex = Hex.fromHexInput(message).toUint8Array();
    const sha3Message = sha3_256(msgHex);
    const rawSignature = signature.toUint8Array();

    return p256.verify(rawSignature, sha3Message, this.toUint8Array());
  }

  /**
   * Verifies a signed data with a public key
   *
   * @param args.message message
   * @param args.signature The signature
   * @returns true if the signature is valid
   */
  async verifySignatureAsync(args: VerifySignatureAsyncArgs): Promise<boolean> {
    return this.verifySignature({ message: args.message, signature: args.signature });
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256r1PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256r1PublicKey(bytes);
  }

  static load(deserializer: Deserializer): Secp256r1PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256r1PublicKey(bytes);
  }

  /**
   * Determines if the provided public key is a valid instance of a Secp256r1 public key.
   * This function checks for the presence of a "key" property and validates the length of the key data.
   *
   * @param publicKey - The public key to validate.
   * @returns A boolean indicating whether the public key is a valid Secp256r1 public key.
   * @group Implementation
   * @category Serialization
   */
  static isInstance(publicKey: PublicKey): publicKey is Secp256r1PublicKey {
    if ("key" in publicKey && publicKey.key instanceof Hex) {
      try {
        p256.ProjectivePoint.fromHex(publicKey.key.toUint8Array());
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  authKey(): AuthenticationKey {
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: AuthenticationKeyScheme.SingleKey,
      input: this.toUint8Array(),
    });
  }
}

/**
 * A Secp256r1 ecdsa private key - this is only used for test purposes as signing is done via passkeys
 */
export class Secp256r1PrivateKey extends PrivateKey {
  /**
   * Length of Secp256r1 ecdsa private key
   */
  static readonly LENGTH: number = 32;

  /**
   * The private key bytes
   * @private
   */
  private readonly key: Hex;

  /**
   * Create a new PrivateKey instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   * @param strict If true, the hexInput MUST be compliant with AIP-80.
   */
  constructor(hexInput: HexInput, strict?: boolean) {
    super();

    const privateKeyHex = PrivateKey.parseHexInput(hexInput, PrivateKeyVariants.Secp256r1, strict);
    if (privateKeyHex.toUint8Array().length !== Secp256r1PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Secp256r1PrivateKey.LENGTH}`);
    }

    this.key = privateKeyHex;
  }

  /**
   * Get the private key in bytes (Uint8Array).
   *
   * @returns
   */
  toUint8Array(): Uint8Array {
    return this.key.toUint8Array();
  }

  /**
   * Get the private key as an AIP-80 compliant string with secp256r1-priv- prefix.
   *
   * @returns string representation of the private key
   */
  toString(): string {
    return PrivateKey.formatPrivateKey(this.key.toString(), PrivateKeyVariants.Secp256r1);
  }

  /**
   * Get the private key as a hex string with the 0x prefix.
   *
   * @returns hex string representation of the private key
   */
  toHexString(): string {
    return this.key.toString();
  }

  /**
   * Sign the given message with the private key.
   *
   * @param message in HexInput format
   * @returns Uint8Array
   */
  sign(message: HexInput): Secp256r1Signature {
    const msgHex = Hex.fromHexInput(message);
    const sha3Message = sha3_256(msgHex.toUint8Array());
    const signature = p256.sign(sha3Message, this.key.toUint8Array());
    return new Secp256r1Signature(signature.toCompactRawBytes());
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256r1PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256r1PrivateKey(bytes);
  }

  /**
   * Generate a new random private key.
   *
   * @returns Secp256r1PrivateKey
   */
  static generate(): Secp256r1PrivateKey {
    const hexInput = p256.utils.randomPrivateKey();
    return new Secp256r1PrivateKey(hexInput);
  }

  /**
   * Derive the Secp256r1PublicKey from this private key.
   *
   * @returns Secp256r1PublicKey
   */
  publicKey(): Secp256r1PublicKey {
    const bytes = p256.getPublicKey(this.key.toUint8Array(), false);
    return new Secp256r1PublicKey(bytes);
  }
}

export class WebAuthnSignature extends Signature {
  signature: Hex;

  authenticatorData: Hex;

  clientDataJSON: Hex;

  constructor(signature: HexInput, authenticatorData: HexInput, clientDataJSON: HexInput) {
    super();
    this.signature = Hex.fromHexInput(signature);
    this.authenticatorData = Hex.fromHexInput(authenticatorData);
    this.clientDataJSON = Hex.fromHexInput(clientDataJSON);
  }

  toUint8Array() {
    return this.signature.toUint8Array();
  }

  serialize(serializer: Serializer) {
    serializer.serializeU32AsUleb128(0);
    serializer.serializeBytes(this.signature.toUint8Array());
    serializer.serializeBytes(this.authenticatorData.toUint8Array());
    serializer.serializeBytes(this.clientDataJSON.toUint8Array());
  }

  bcsToBytes() {
    const serializer = new Serializer();
    this.serialize(serializer);
    return serializer.toUint8Array();
  }

  bcsToHex() {
    return Hex.fromHexInput(this.bcsToBytes());
  }

  toStringWithoutPrefix() {
    return Hex.fromHexInput(this.bcsToBytes()).toString();
  }

  static deserialize(deserializer: Deserializer) {
    const id = deserializer.deserializeUleb128AsU32();
    if (id !== 0) {
      throw new Error(`Invalid id for WebAuthnSignature: ${id}`);
    }
    const signature = deserializer.deserializeBytes();
    const authenticatorData = deserializer.deserializeBytes();
    const clientDataJSON = deserializer.deserializeBytes();
    return new WebAuthnSignature(signature, authenticatorData, clientDataJSON);
  }
}

/**
 * A signature of a message signed using an Secp256r1 ecdsa private key
 */
export class Secp256r1Signature extends Signature {
  /**
   * Secp256r1 ecdsa signatures are 256-bit.
   */
  static readonly LENGTH = 64;

  /**
   * The signature bytes
   * @private
   */
  private readonly data: Hex;

  /**
   * Create a new Signature instance from a Uint8Array or String.  It will convert the signature to its canonical if needed.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   */
  constructor(hexInput: HexInput) {
    super();

    const hex = Hex.fromHexInput(hexInput);
    if (hex.toUint8Array().length !== Secp256r1Signature.LENGTH) {
      throw new Error(`Signature length should be ${Secp256r1Signature.LENGTH}, recieved ${hex.toUint8Array().length}`);
    }
    const signature = p256.Signature.fromCompact(hex.toUint8Array()).normalizeS().toCompactRawBytes();
    this.data = Hex.fromHexInput(signature);
  }

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

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256r1Signature {
    const hex = deserializer.deserializeBytes();
    return new Secp256r1Signature(hex);
  }

  static load(deserializer: Deserializer): Secp256r1Signature {
    const bytes = deserializer.deserializeBytes();
    return new Secp256r1Signature(bytes);
  }
}
