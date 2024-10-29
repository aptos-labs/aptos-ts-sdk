// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ed25519 } from "@noble/curves/ed25519";
import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";
import { AuthenticationKey } from "../authenticationKey";
import { Hex } from "../hex";
import { HexInput, SigningScheme as AuthenticationKeyScheme } from "../../types";
import { CKDPriv, deriveKey, HARDENED_OFFSET, isValidHardenedPath, mnemonicToSeed, splitPath } from "./hdKey";
import { PrivateKey } from "./privateKey";
import { AccountPublicKey, PublicKey, VerifySignatureArgs } from "./publicKey";
import { Signature } from "./signature";
import { convertSigningMessage } from "./utils";

/**
 * L is the value that greater than or equal to will produce a non-canonical signature, and must be rejected
 */
const L: number[] = [
  0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10,
];

/**
 * Checks if an ED25519 signature is non-canonical.
 * This function helps determine the validity of a signature by verifying its canonical form.
 *
 * @param signature - The signature to be checked for canonicality.
 * @returns A boolean indicating whether the signature is non-canonical.
 *
 * Comes from Aptos Core
 * https://github.com/aptos-labs/aptos-core/blob/main/crates/aptos-crypto/src/ed25519/ed25519_sigs.rs#L47-L85
 */
export function isCanonicalEd25519Signature(signature: Signature): boolean {
  const s = signature.toUint8Array().slice(32);
  for (let i = L.length - 1; i >= 0; i -= 1) {
    if (s[i] < L[i]) {
      return true;
    }
    if (s[i] > L[i]) {
      return false;
    }
  }
  // As this stage S == L which implies a non-canonical S.
  return false;
}

/**
 * Represents the public key of an Ed25519 key pair.
 *
 * Since [AIP-55](https://github.com/aptos-foundation/AIPs/pull/263) Aptos supports
 * `Legacy` and `Unified` authentication keys.
 *
 * Ed25519 scheme is represented in the SDK as `Legacy authentication key` and also
 * as `AnyPublicKey` that represents any `Unified authentication key`.
 */
export class Ed25519PublicKey extends AccountPublicKey {
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
   * Creates an instance of the Ed25519Signature class from a hex input.
   * This constructor validates the length of the signature to ensure it meets the required specifications.
   *
   * @param hexInput - The hex input representing the Ed25519 signature.
   * @throws Error if the signature length is not equal to Ed25519Signature.LENGTH.
   */
  constructor(hexInput: HexInput) {
    super();

    const hex = Hex.fromHexInput(hexInput);
    if (hex.toUint8Array().length !== Ed25519PublicKey.LENGTH) {
      throw new Error(`PublicKey length should be ${Ed25519PublicKey.LENGTH}`);
    }
    this.key = hex;
  }

  // region AccountPublicKey

  /**
   * Verifies a signed message using a public key.
   *
   * @param args - The arguments for verification.
   * @param args.message - A signed message as a Hex string or Uint8Array.
   * @param args.signature - The signature of the message.
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    // Verify malleability
    if (!isCanonicalEd25519Signature(signature)) {
      return false;
    }

    const messageToVerify = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToVerify).toUint8Array();
    const signatureBytes = signature.toUint8Array();
    const publicKeyBytes = this.key.toUint8Array();
    return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
  }

  /**
   * Generates an authentication key from the public key using the Ed25519 scheme.
   * This function is essential for creating a secure authentication key that can be used for further cryptographic operations.
   *
   * @returns {AuthenticationKey} The generated authentication key.
   */
  authKey(): AuthenticationKey {
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: AuthenticationKeyScheme.Ed25519,
      input: this.toUint8Array(),
    });
  }

  /**
   * Convert the internal data representation to a Uint8Array.
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
   * This allows for the conversion of data into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  /**
   * Deserialize bytes into an Ed25519Signature object.
   * This function is used to convert serialized byte data into a usable Ed25519Signature instance.
   *
   * @param deserializer - The deserializer instance used to read the byte data.
   */
  static deserialize(deserializer: Deserializer): Ed25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PublicKey(bytes);
  }

  // endregion

  /**
   * Determine if the provided public key is an instance of Ed25519PublicKey.
   *
   * @param publicKey - The public key to check.
   * @returns True if the public key is an instance of Ed25519PublicKey, otherwise false.
   * @deprecated use `instanceof Ed25519PublicKey` instead.
   */
  static isPublicKey(publicKey: AccountPublicKey): publicKey is Ed25519PublicKey {
    return publicKey instanceof Ed25519PublicKey;
  }

  /**
   * Determines if the provided public key is a valid Ed25519 public key.
   * This function checks for the presence of the "key" property and verifies that its data length matches the expected length
   * for Ed25519 public keys.
   *
   * @param publicKey - The public key to validate.
   * @returns A boolean indicating whether the public key is a valid Ed25519 public key.
   */
  static isInstance(publicKey: PublicKey): publicKey is Ed25519PublicKey {
    return "key" in publicKey && (publicKey.key as any)?.data?.length === Ed25519PublicKey.LENGTH;
  }
}

/**
 * Represents the private key of an Ed25519 key pair.
 *
 * @static
 * @readonly LENGTH - Length of an Ed25519 private key.
 * @static
 * @readonly SLIP_0010_SEED - The Ed25519 key seed to use for BIP-32 compatibility.
 */
export class Ed25519PrivateKey extends Serializable implements PrivateKey {
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
  private readonly signingKey: Hex;

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
    this.signingKey = privateKeyHex;
  }

  /**
   * Generate a new random private key.
   *
   * @returns Ed25519PrivateKey A newly generated Ed25519 private key.
   */
  static generate(): Ed25519PrivateKey {
    const keyPair = ed25519.utils.randomPrivateKey();
    return new Ed25519PrivateKey(keyPair);
  }

  /**
   * Derives a private key from a mnemonic seed phrase using a specified BIP44 path.
   * To derive multiple keys from the same phrase, change the path
   *
   * IMPORTANT: Ed25519 supports hardened derivation only, as it lacks a key homomorphism, making non-hardened derivation impossible.
   *
   * @param path - The BIP44 path used for key derivation.
   * @param mnemonics - The mnemonic seed phrase from which the key will be derived.
   * @throws Error if the provided path is not a valid hardened path.
   */
  static fromDerivationPath(path: string, mnemonics: string): Ed25519PrivateKey {
    if (!isValidHardenedPath(path)) {
      throw new Error(`Invalid derivation path ${path}`);
    }
    return Ed25519PrivateKey.fromDerivationPathInner(path, mnemonicToSeed(mnemonics));
  }

  /**
   * Derives a child private key from a given BIP44 path and seed.
   * A private inner function so we can separate from the main fromDerivationPath() method
   * to add tests to verify we create the keys correctly.
   *
   * @param path - The BIP44 path used for key derivation.
   * @param seed - The seed phrase created by the mnemonics, represented as a Uint8Array.
   * @param offset - The offset used for key derivation, defaults to HARDENED_OFFSET.
   * @returns An instance of Ed25519PrivateKey derived from the specified path and seed.
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

  /**
   * Derive the Ed25519PublicKey for this private key.
   *
   * @returns Ed25519PublicKey - The derived public key corresponding to the private key.
   */
  publicKey(): Ed25519PublicKey {
    const bytes = ed25519.getPublicKey(this.signingKey.toUint8Array());
    return new Ed25519PublicKey(bytes);
  }

  /**
   * Sign the given message with the private key.
   * This function generates a digital signature for the specified message, ensuring its authenticity and integrity.
   *
   * @param message - A message as a string or Uint8Array in HexInput format.
   * @returns A digital signature for the provided message.
   */
  sign(message: HexInput): Ed25519Signature {
    const messageToSign = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToSign).toUint8Array();
    const signatureBytes = ed25519.sign(messageBytes, this.signingKey.toUint8Array());
    return new Ed25519Signature(signatureBytes);
  }

  /**
   * Get the private key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the private key
   */
  toUint8Array(): Uint8Array {
    return this.signingKey.toUint8Array();
  }

  /**
   * Get the private key as a hex string with the 0x prefix.
   *
   * @returns string representation of the private key.
   */
  toString(): string {
    return this.signingKey.toString();
  }

  // endregion

  // region Serializable

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PrivateKey(bytes);
  }

  // endregion

  /**
   * Determines if the provided private key is an instance of Ed25519PrivateKey.
   *
   * @param privateKey - The private key to check.
   * @returns A boolean indicating whether the private key is an Ed25519PrivateKey.
   *
   * @deprecated Use `instanceof Ed25519PrivateKey` instead.
   */
  static isPrivateKey(privateKey: PrivateKey): privateKey is Ed25519PrivateKey {
    return privateKey instanceof Ed25519PrivateKey;
  }
}

/**
 * Represents a signature of a message signed using an Ed25519 private key.
 *
 * @static LENGTH - Length of an Ed25519 signature, which is 64 bytes.
 */
export class Ed25519Signature extends Signature {
  /**
   * Length of an Ed25519 signature
   */
  static readonly LENGTH = 64;

  /**
   * The signature bytes
   * @private
   */
  private readonly data: Hex;

  // region Constructors

  constructor(hexInput: HexInput) {
    super();
    const data = Hex.fromHexInput(hexInput);
    if (data.toUint8Array().length !== Ed25519Signature.LENGTH) {
      throw new Error(`Signature length should be ${Ed25519Signature.LENGTH}`);
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

  static deserialize(deserializer: Deserializer): Ed25519Signature {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519Signature(bytes);
  }

  // endregion
}
