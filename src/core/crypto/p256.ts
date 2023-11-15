// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 } from "@noble/hashes/sha3";
import { p256 } from "@noble/curves/p256";
import base64url from "base64url";
import { PrivateKey, PublicKey, Signature } from "./asymmetricCrypto";
import { Deserializer, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput } from "../../types";
import type { WebAuthnSignature } from "./webauthn";

/**
 * Represents the P256 public key
 *
 * P256 authentication key is represented in the SDK as `AnyPublicKey`.  It is used to verify WebAuthnSignatures.
 */
export class P256PublicKey extends PublicKey {
  // P256 ecdsa public keys contain a prefix indicating compression and two 32-byte coordinates.
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
    if (hex.toUint8Array().length !== P256PublicKey.LENGTH) {
      throw new Error(`PublicKey length should be ${P256PublicKey.LENGTH}`);
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
  verifySignature(args: { message: HexInput; signature: WebAuthnSignature }): boolean {
    const { message, signature } = args;

    // Check challenge
    const { challenge } = signature.getCollectedClientData();
    const challengeStr = base64url.decode(challenge);
    if (challengeStr !== message.toString()) {
      return false;
    }

    // Get verification data.
    const verificationData = signature.getVerificationData();
    const p256Signature = signature.paar.signature;
    const rawSignature = p256Signature.toUint8Array();

    return p256.verify(rawSignature, verificationData, this.toUint8Array());
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): P256PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new P256PublicKey(bytes);
  }

  static load(deserializer: Deserializer): P256PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new P256PublicKey(bytes);
  }
}

/**
 * A P256 ecdsa private key - this is only used for test purposes as signing is done via passkeys
 */
export class P256PrivateKey extends PrivateKey {
  /**
   * Length of P256 ecdsa private key
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
    if (privateKeyHex.toUint8Array().length !== P256PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${P256PrivateKey.LENGTH}`);
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
  sign(message: HexInput): P256Signature {
    const msgHex = Hex.fromHexInput(message);
    const sha3Message = sha3_256(msgHex.toUint8Array());
    const signature = p256.sign(sha3Message, this.key.toUint8Array());
    return new P256Signature(signature.toCompactRawBytes());
  }

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): P256PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new P256PrivateKey(bytes);
  }

  /**
   * Generate a new random private key.
   *
   * @returns P256PrivateKey
   */
  static generate(): P256PrivateKey {
    const hexInput = p256.utils.randomPrivateKey();
    return new P256PrivateKey(hexInput);
  }

  /**
   * Derive the P256PublicKey from this private key.
   *
   * @returns P256PublicKey
   */
  publicKey(): P256PublicKey {
    const bytes = p256.getPublicKey(this.key.toUint8Array(), false);
    return new P256PublicKey(bytes);
  }
}

/**
 * A signature of a message signed using an P256 ecdsa private key
 */
export class P256Signature extends Signature {
  /**
   * P256 ecdsa signatures are 256-bit.
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
    if (hex.toUint8Array().length !== P256Signature.LENGTH) {
      throw new Error(`Signature length should be ${P256Signature.LENGTH}, recieved ${hex.toUint8Array().length}`);
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

  static deserialize(deserializer: Deserializer): P256Signature {
    const hex = deserializer.deserializeBytes();
    return new P256Signature(hex);
  }

  static load(deserializer: Deserializer): P256Signature {
    const bytes = deserializer.deserializeBytes();
    return new P256Signature(bytes);
  }
}
