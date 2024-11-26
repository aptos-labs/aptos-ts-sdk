// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 } from "@noble/hashes/sha3";
import { secp256k1 } from "@noble/curves/secp256k1";
import { HDKey } from "@scure/bip32";
import { Serializable, Deserializer, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput, PrivateKeyVariants } from "../../types";
import { isValidBIP44Path, mnemonicToSeed } from "./hdKey";
import { PrivateKey } from "./privateKey";
import { PublicKey, VerifySignatureArgs } from "./publicKey";
import { Signature } from "./signature";
import { convertSigningMessage } from "./utils";

/**
 * Represents a Secp256k1 ECDSA public key.
 *
 * @extends PublicKey
 * @property LENGTH - The length of the Secp256k1 public key in bytes.
 */
export class Secp256k1PublicKey extends PublicKey {
  // Secp256k1 ecdsa public keys contain a prefix indicating compression and two 32-byte coordinates.
  static readonly LENGTH: number = 65;

  // If it's compressed, it is only 33 bytes
  static readonly COMPRESSED_LENGTH: number = 33;

  // Hex value of the public key
  private readonly key: Hex;

  /**
   * Create a new PublicKey instance from a HexInput, which can be a string or Uint8Array.
   * This constructor validates the length of the provided signature data.
   *
   * @param hexInput - A HexInput (string or Uint8Array) representing the signature data.
   * @throws Error if the length of the signature data is not equal to Secp256k1Signature.LENGTH.
   */
  constructor(hexInput: HexInput) {
    super();

    const hex = Hex.fromHexInput(hexInput);
    const { length } = hex.toUint8Array();
    if (length === Secp256k1PublicKey.LENGTH) {
      this.key = hex;
    } else if (length === Secp256k1PublicKey.COMPRESSED_LENGTH) {
      const point = secp256k1.ProjectivePoint.fromHex(hex.toUint8Array());
      this.key = Hex.fromHexInput(point.toRawBytes(false));
    } else {
      throw new Error(
        `PublicKey length should be ${Secp256k1PublicKey.LENGTH} or ${Secp256k1PublicKey.COMPRESSED_LENGTH}, received ${length}`,
      );
    }
  }

  // region PublicKey
  /**
   * Verifies a Secp256k1 signature against the public key.
   *
   * This function checks the validity of a signature for a given message, ensuring that the signature is canonical as a malleability check.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.message - The message that was signed.
   * @param args.signature - The signature to verify against the public key.
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    const messageToVerify = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToVerify).toUint8Array();
    const messageSha3Bytes = sha3_256(messageBytes);
    const signatureBytes = signature.toUint8Array();
    return secp256k1.verify(signatureBytes, messageSha3Bytes, this.key.toUint8Array(), { lowS: true });
  }

  /**
   * Get the data as a Uint8Array representation.
   *
   * @returns Uint8Array representation of the data.
   */
  toUint8Array(): Uint8Array {
    return this.key.toUint8Array();
  }

  // endregion

  // region Serializable

  /**
   * Serializes the data into a byte array using the provided serializer.
   * This function is essential for converting data into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer instance used to convert the data.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  /**
   * Deserializes a Secp256k1Signature from the provided deserializer.
   * This function allows you to reconstruct a Secp256k1Signature object from its serialized byte representation.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   */
  // eslint-disable-next-line class-methods-use-this
  deserialize(deserializer: Deserializer) {
    const hex = deserializer.deserializeBytes();
    return new Secp256k1Signature(hex);
  }

  static deserialize(deserializer: Deserializer): Secp256k1PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256k1PublicKey(bytes);
  }

  // endregion

  /**
   * Determine if the provided public key is an instance of Secp256k1PublicKey.
   *
   * @deprecated use `instanceof Secp256k1PublicKey` instead
   * @param publicKey - The public key to check.
   */
  static isPublicKey(publicKey: PublicKey): publicKey is Secp256k1PublicKey {
    return publicKey instanceof Secp256k1PublicKey;
  }

  /**
   * Determines if the provided public key is a valid instance of a Secp256k1 public key.
   * This function checks for the presence of a "key" property and validates the length of the key data.
   *
   * @param publicKey - The public key to validate.
   * @returns A boolean indicating whether the public key is a valid Secp256k1 public key.
   */
  static isInstance(publicKey: PublicKey): publicKey is Secp256k1PublicKey {
    return "key" in publicKey && (publicKey.key as any)?.data?.length === Secp256k1PublicKey.LENGTH;
  }
}

/**
 * Represents a Secp256k1 ECDSA private key, providing functionality to create, sign messages,
 * derive public keys, and serialize/deserialize the key.
 */
export class Secp256k1PrivateKey extends Serializable implements PrivateKey {
  /**
   * Length of Secp256k1 ecdsa private key
   */
  static readonly LENGTH: number = 32;

  /**
   * The private key bytes
   * @private
   */
  private readonly key: Hex;

  // region Constructors

  /**
   * Create a new PrivateKey instance from a Uint8Array or String.
   *
   * [Read about AIP-80](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md)
   *
   * @param hexInput A HexInput (string or Uint8Array)
   * @param strict If true, private key must AIP-80 compliant.
   */
  constructor(hexInput: HexInput, strict?: boolean) {
    super();

    const privateKeyHex = PrivateKey.parseHexInput(hexInput, PrivateKeyVariants.Secp256k1, strict);
    if (privateKeyHex.toUint8Array().length !== Secp256k1PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Secp256k1PrivateKey.LENGTH}`);
    }

    this.key = privateKeyHex;
  }

  /**
   * Generate a new random private key.
   *
   * @returns Secp256k1PrivateKey - A newly generated Secp256k1 private key.
   */
  static generate(): Secp256k1PrivateKey {
    const hexInput = secp256k1.utils.randomPrivateKey();
    return new Secp256k1PrivateKey(hexInput, false);
  }

  /**
   * Derives a private key from a mnemonic seed phrase using a specified BIP44 path.
   *
   * @param path - The BIP44 path to derive the key from.
   * @param mnemonics - The mnemonic seed phrase used for key generation.
   *
   * @returns The generated private key.
   *
   * @throws Error if the provided path is not a valid BIP44 path.
   */
  static fromDerivationPath(path: string, mnemonics: string): Secp256k1PrivateKey {
    if (!isValidBIP44Path(path)) {
      throw new Error(`Invalid derivation path ${path}`);
    }
    return Secp256k1PrivateKey.fromDerivationPathInner(path, mnemonicToSeed(mnemonics));
  }

  /**
   * Derives a private key from a specified BIP44 path using a given seed.
   * This function is essential for generating keys that follow the hierarchical deterministic (HD) wallet structure.
   *
   * @param path - The BIP44 path used for key derivation.
   * @param seed - The seed phrase created by the mnemonics, represented as a Uint8Array.
   * @returns The generated private key as an instance of Secp256k1PrivateKey.
   * @throws Error if the derived private key is invalid.
   */
  private static fromDerivationPathInner(path: string, seed: Uint8Array): Secp256k1PrivateKey {
    const { privateKey } = HDKey.fromMasterSeed(seed).derive(path);
    // library returns privateKey as Uint8Array | null
    if (privateKey === null) {
      throw new Error("Invalid key");
    }

    return new Secp256k1PrivateKey(privateKey, false);
  }

  // endregion

  // region PrivateKey

  /**
   * Sign the given message with the private key.
   * This function generates a cryptographic signature for the provided message, ensuring the signature is canonical and non-malleable.
   *
   * @param message - A message in HexInput format to be signed.
   * @returns Signature - The generated signature for the provided message.
   */
  sign(message: HexInput): Secp256k1Signature {
    const messageToSign = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToSign);
    const messageHashBytes = sha3_256(messageBytes.toUint8Array());
    const signature = secp256k1.sign(messageHashBytes, this.key.toUint8Array(), { lowS: true });
    return new Secp256k1Signature(signature.toCompactRawBytes());
  }

  /**
   * Derive the Secp256k1PublicKey from this private key.
   *
   * @returns Secp256k1PublicKey The derived public key.
   */
  publicKey(): Secp256k1PublicKey {
    const bytes = secp256k1.getPublicKey(this.key.toUint8Array(), false);
    return new Secp256k1PublicKey(bytes);
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
   * Get the private key as a string representation.
   *
   * @returns string representation of the private key
   */
  toString(): string {
    return this.toHexString();
  }

  /**
   * Get the private key as a hex string with the 0x prefix.
   *
   * @returns string representation of the private key.
   */
  toHexString(): string {
    return this.key.toString();
  }

  /**
   * Get the private key as a AIP-80 compliant hex string.
   *
   * [Read about AIP-80](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md)
   *
   * @returns AIP-80 compliant string representation of the private key.
   */
  toAIP80String(): string {
    return PrivateKey.formatPrivateKey(this.key.toString(), PrivateKeyVariants.Secp256k1);
  }

  // endregion

  // region Serializable

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256k1PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256k1PrivateKey(bytes, false);
  }

  // endregion

  /**
   * Determines if the provided private key is an instance of Secp256k1PrivateKey.
   *
   * @param privateKey - The private key to be checked.
   *
   * @deprecated use `instanceof Secp256k1PrivateKey` instead
   */
  static isPrivateKey(privateKey: PrivateKey): privateKey is Secp256k1PrivateKey {
    return privateKey instanceof Secp256k1PrivateKey;
  }
}

/**
 * Represents a signature of a message signed using a Secp256k1 ECDSA private key.
 *
 */
export class Secp256k1Signature extends Signature {
  /**
   * Secp256k1 ecdsa signatures are 256-bit or 64 bytes
   * @readonly
   */
  static readonly LENGTH = 64;

  /**
   * The signature bytes
   * @private
   */
  private readonly data: Hex;

  // region Constructors

  /**
   * Create a new Signature instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   */
  constructor(hexInput: HexInput) {
    super();
    const data = Hex.fromHexInput(hexInput);
    if (data.toUint8Array().length !== Secp256k1Signature.LENGTH) {
      throw new Error(
        `Signature length should be ${Secp256k1Signature.LENGTH}, received ${data.toUint8Array().length}`,
      );
    }
    this.data = data;
  }

  // endregion

  // region Signature

  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  // endregion

  // region Serializable

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Secp256k1Signature {
    const hex = deserializer.deserializeBytes();
    return new Secp256k1Signature(hex);
  }

  // endregion
}
