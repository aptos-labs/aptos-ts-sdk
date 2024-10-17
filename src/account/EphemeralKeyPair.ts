// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from "@noble/hashes/utils";

import {
  bytesToBigIntLE,
  padAndPackBytesWithLen,
  poseidonHash,
  Ed25519PrivateKey,
  EphemeralPublicKey,
  EphemeralSignature,
  PrivateKey,
} from "../core/crypto";
import { Hex } from "../core/hex";
import { EphemeralPublicKeyVariant, HexInput } from "../types";
import { Deserializer, Serializable, Serializer } from "../bcs";
import { floorToWholeHour, nowInSeconds } from "../utils/helpers";

const TWO_WEEKS_IN_SECONDS = 1_209_600;

/**
 * Represents an ephemeral key pair used for signing transactions via the Keyless authentication scheme.
 * This key pair is temporary and includes an expiration time.
 * For more details on how this class is used, refer to the documentation:
 * https://aptos.dev/guides/keyless-accounts/#1-present-the-user-with-a-sign-in-with-idp-button-on-the-ui
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export class EphemeralKeyPair extends Serializable {
  static readonly BLINDER_LENGTH: number = 31;

  /**
   * A byte array of length BLINDER_LENGTH used to obfuscate the public key from the IdP.
   * Used in calculating the nonce passed to the IdP and as a secret witness in proof generation.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly blinder: Uint8Array;

  /**
   * A timestamp in seconds indicating when the ephemeral key pair is expired.  After expiry, a new
   * EphemeralKeyPair must be generated and a new JWT needs to be created.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly expiryDateSecs: number;

  /**
   * The value passed to the IdP when the user authenticates.  It consists of a hash of the
   * ephemeral public key, expiry date, and blinder.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly nonce: string;

  /**
   * A private key used to sign transactions.  This private key is not tied to any account on the chain as it
   * is ephemeral (not permanent) in nature.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  private privateKey: PrivateKey;

  /**
   * A public key used to verify transactions.  This public key is not tied to any account on the chain as it
   * is ephemeral (not permanent) in nature.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  private publicKey: EphemeralPublicKey;

  /**
   * Creates an instance of the class with a specified private key, optional expiry date, and optional blinder.
   * This constructor initializes the public key, sets the expiry date to a default value if not provided,
   * generates a blinder if not supplied, and calculates the nonce based on the public key, expiry date, and blinder.
   *
   * @param args - The parameters for constructing the instance.
   * @param args.privateKey - The private key used for creating the instance.
   * @param args.expiryDateSecs - Optional expiry date in seconds from the current time. Defaults to two weeks from now.
   * @param args.blinder - Optional blinder value. If not provided, a new blinder will be generated.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  constructor(args: { privateKey: PrivateKey; expiryDateSecs?: number; blinder?: HexInput }) {
    super();
    const { privateKey, expiryDateSecs, blinder } = args;
    this.privateKey = privateKey;
    this.publicKey = new EphemeralPublicKey(privateKey.publicKey());
    // By default, we set the expiry date to be two weeks in the future floored to the nearest hour
    this.expiryDateSecs = expiryDateSecs || floorToWholeHour(nowInSeconds() + TWO_WEEKS_IN_SECONDS);
    // Generate the blinder if not provided
    this.blinder = blinder !== undefined ? Hex.fromHexInput(blinder).toUint8Array() : generateBlinder();
    // Calculate the nonce
    const fields = padAndPackBytesWithLen(this.publicKey.bcsToBytes(), 93);
    fields.push(BigInt(this.expiryDateSecs));
    fields.push(bytesToBigIntLE(this.blinder));
    const nonceHash = poseidonHash(fields);
    this.nonce = nonceHash.toString();
  }

  /**
   * Returns the public key of the key pair.
   * @return EphemeralPublicKey
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  getPublicKey(): EphemeralPublicKey {
    return this.publicKey;
  }

  /**
   * Checks if the current time has surpassed the expiry date of the key pair.
   * @return boolean - Returns true if the key pair is expired, otherwise false.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  isExpired(): boolean {
    const currentTimeSecs: number = Math.floor(Date.now() / 1000);
    return currentTimeSecs > this.expiryDateSecs;
  }

  /**
   * Serializes the object's properties into a format suitable for transmission or storage.
   * This function is essential for preparing the object data for serialization processes.
   *
   * @param serializer - The serializer instance used to serialize the object's properties.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.publicKey.variant);
    serializer.serializeBytes(this.privateKey.toUint8Array());
    serializer.serializeU64(this.expiryDateSecs);
    serializer.serializeFixedBytes(this.blinder);
  }

  /**
   * Deserializes an ephemeral key pair from the provided deserializer.
   * This function helps in reconstructing an ephemeral key pair, which is essential for cryptographic operations.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Account (On-Chain Model)
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
   * Deserialize a byte array into an EphemeralKeyPair object.
   * This function allows you to reconstruct an EphemeralKeyPair from its serialized byte representation.
   *
   * @param bytes - The byte array representing the serialized EphemeralKeyPair.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static fromBytes(bytes: Uint8Array): EphemeralKeyPair {
    return EphemeralKeyPair.deserialize(new Deserializer(bytes));
  }

  /**
   * Generates a new ephemeral key pair with an optional expiry date.
   * This function allows you to create a temporary key pair for secure operations.
   *
   * @param args - Optional parameters for key pair generation.
   * @param args.scheme - The type of key pair to use for the EphemeralKeyPair. Only Ed25519 is supported for now.
   * @param args.expiryDateSecs - The date of expiry for the key pair in seconds.
   * @returns An instance of EphemeralKeyPair containing the generated private key and expiry date.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static generate(args?: { scheme?: EphemeralPublicKeyVariant; expiryDateSecs?: number }): EphemeralKeyPair {
    let privateKey: PrivateKey;

    switch (args?.scheme) {
      case EphemeralPublicKeyVariant.Ed25519:
      default:
        privateKey = Ed25519PrivateKey.generate();
    }

    return new EphemeralKeyPair({ privateKey, expiryDateSecs: args?.expiryDateSecs });
  }

  /**
   * Sign the given data using the private key, returning an ephemeral signature.
   * This function is essential for creating a secure signature that can be used for authentication or verification purposes.
   *
   * @param data - The data to be signed, provided in HexInput format.
   * @returns EphemeralSignature - The resulting ephemeral signature.
   * @throws Error - Throws an error if the EphemeralKeyPair has expired.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  sign(data: HexInput): EphemeralSignature {
    if (this.isExpired()) {
      throw new Error("EphemeralKeyPair has expired");
    }
    return new EphemeralSignature(this.privateKey.sign(data));
  }
}

/**
 * Generates a random byte array of length EphemeralKeyPair.BLINDER_LENGTH.
 * @returns Uint8Array A random byte array used for blinding.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
function generateBlinder(): Uint8Array {
  return randomBytes(EphemeralKeyPair.BLINDER_LENGTH);
}
