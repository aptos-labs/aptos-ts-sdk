// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 } from "@noble/hashes/sha3";
import { p256 } from "@noble/curves/p256";
import { bufferToBase64URLString } from "@simplewebauthn/browser";
import { sha256 } from "@noble/hashes/sha256";
import { PrivateKey, PublicKey, Signature } from "./asymmetricCrypto";
import { Deserializer, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput } from "../../types";
import type { WebAuthnSignature } from "./webauthn";

/**
 * Represents the Secp256r1 public key
 *
 * Secp256r1 authentication key is represented in the SDK as `AnyPublicKey`.  It is used to verify WebAuthnSignatures.
 */
export class Secp256r1PublicKey extends PublicKey {
  // Secp256r1 ecdsa public keys contain a prefix indicating compression and two 32-byte coordinates.
  static readonly LENGTH: number = 65;

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
    if (hex.toUint8Array().length !== Secp256r1PublicKey.LENGTH) {
      throw new Error(`PublicKey length should be ${Secp256r1PublicKey.LENGTH}`);
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
   *
   * @param args.message message
   * @param args.signature The signature
   * @returns true if the signature is valid
   */
  verifySignature(args: { message: HexInput; signature: Secp256r1Signature }): boolean {
    const { message, signature } = args;

    const msgHex = Hex.fromHexInput(message).toUint8Array();
    const sha3Message = sha256(msgHex);
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
  verifyWebAuthnSignature(args: { message: HexInput; signature: WebAuthnSignature }): boolean {
    const { message, signature } = args;

    if (!(signature.paar.signature.signature instanceof Secp256r1Signature)) {
      throw new Error("Attestation signature is not a Secp256r1Signature");
    }

    // Check challenge
    const { challenge } = signature.getCollectedClientData();

    const messageBase64URLString = bufferToBase64URLString(Hex.fromHexInput(message).toUint8Array());
    if (challenge !== messageBase64URLString) {
      return false;
    }

    // Get verification data.
    const verificationData = signature.getVerificationData();

    // Verify the the signature is the signed verification data.
    return this.verifySignature({ message: verificationData, signature: signature.paar.signature.signature });
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
   */
  constructor(hexInput: HexInput) {
    super();

    const privateKeyHex = Hex.fromHexInput(hexInput);
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
   * Get the private key as a hex string with the 0x prefix.
   *
   * @returns string representation of the private key
   */
  toString(): string {
    return this.key.toString();
  }

  /**
   * Sign the given message with the private key.
   *
   * @param message in HexInput format
   * @returns Signature
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
    const signature = p256.Signature.fromCompact(hexInput).normalizeS().toCompactRawBytes();
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
