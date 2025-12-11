// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { slh_dsa_sha2_128s } from "@noble/post-quantum/slh-dsa.js";
import { Serializable, Deserializer, Serializer } from "../../bcs";
import { Hex } from "../hex";
import { HexInput, PrivateKeyVariants } from "../../types";
import { PrivateKey } from "./privateKey";
import { PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { convertSigningMessage } from "./utils";
import { AptosConfig } from "../../api";
import { CKDPriv, deriveKey, HARDENED_OFFSET, isValidHardenedPath, mnemonicToSeed, splitPath } from "./hdKey";

/**
 * Represents a SLH-DSA-SHA2-128s public key.
 *
 * @extends PublicKey
 * @property LENGTH - The length of the SLH-DSA-SHA2-128s public key in bytes (32 bytes).
 * @group Implementation
 * @category Serialization
 */
export class SlhDsaSha2128sPublicKey extends PublicKey {
  /**
   * Length of SLH-DSA-SHA2-128s public key
   * @group Implementation
   * @category Serialization
   */
  static readonly LENGTH: number = 32;

  /**
   * Hex value of the public key
   * @private
   * @group Implementation
   * @category Serialization
   */
  private readonly key: Hex;

  /**
   * Identifier to distinguish from other public key types
   * @group Implementation
   * @category Serialization
   */
  public readonly keyType: string = "slh-dsa-sha2-128s";

  /**
   * Create a new PublicKey instance from a HexInput, which can be a string or Uint8Array.
   * This constructor validates the length of the provided public key data.
   *
   * @param hexInput - A HexInput (string or Uint8Array) representing the public key data.
   * @throws Error if the length of the public key data is not equal to SlhDsaSha2128sPublicKey.LENGTH.
   * @group Implementation
   * @category Serialization
   */
  constructor(hexInput: HexInput) {
    super();

    const hex = Hex.fromHexInput(hexInput);
    const { length } = hex.toUint8Array();
    if (length !== SlhDsaSha2128sPublicKey.LENGTH) {
      throw new Error(`PublicKey length should be ${SlhDsaSha2128sPublicKey.LENGTH}, received ${length}`);
    }
    this.key = hex;
  }

  // region PublicKey

  /**
   * Verifies a SLH-DSA-SHA2-128s signature against the public key.
   *
   * This function checks the validity of a signature for a given message.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.message - The message that was signed.
   * @param args.signature - The signature to verify against the public key.
   * @group Implementation
   * @category Serialization
   */
  verifySignature(args: { message: HexInput; signature: SlhDsaSha2128sSignature }): boolean {
    const { message, signature } = args;
    const messageToVerify = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToVerify).toUint8Array();
    const signatureBytes = signature.toUint8Array();
    const publicKeyBytes = this.key.toUint8Array();
    return slh_dsa_sha2_128s.verify(signatureBytes, messageBytes, publicKeyBytes);
  }

  /**
   * Note: SLH-DSA-SHA2-128s signatures can be verified synchronously.
   *
   * Verifies the provided signature against the given message.
   * This function helps ensure the integrity and authenticity of the message by confirming that the signature is valid.
   *
   * @param args - The arguments for signature verification.
   * @param args.aptosConfig - The configuration object for connecting to the Aptos network
   * @param args.message - The message that was signed.
   * @param args.signature - The signature to verify, which must be an instance of SlhDsaSha2128sSignature.
   * @returns A boolean indicating whether the signature is valid for the given message.
   * @group Implementation
   * @category Serialization
   */
  async verifySignatureAsync(args: {
    aptosConfig: AptosConfig;
    message: HexInput;
    signature: SlhDsaSha2128sSignature;
  }): Promise<boolean> {
    return this.verifySignature(args);
  }

  /**
   * Get the data as a Uint8Array representation.
   *
   * @returns Uint8Array representation of the data.
   * @group Implementation
   * @category Serialization
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
   * @group Implementation
   * @category Serialization
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  /**
   * Deserializes a SlhDsaSha2128sPublicKey from the provided deserializer.
   * This function allows you to reconstruct a SlhDsaSha2128sPublicKey object from its serialized byte representation.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Serialization
   */
  static deserialize(deserializer: Deserializer): SlhDsaSha2128sPublicKey {
    const bytes = deserializer.deserializeBytes();
    return new SlhDsaSha2128sPublicKey(bytes);
  }

  // endregion

  /**
   * Determine if the provided public key is an instance of SlhDsaSha2128sPublicKey.
   *
   * @deprecated use `instanceof SlhDsaSha2128sPublicKey` instead
   * @param publicKey - The public key to check.
   * @group Implementation
   * @category Serialization
   */
  static isPublicKey(publicKey: PublicKey): publicKey is SlhDsaSha2128sPublicKey {
    return publicKey instanceof SlhDsaSha2128sPublicKey;
  }

  /**
   * Determines if the provided public key is a valid instance of a SLH-DSA-SHA2-128s public key.
   * This function checks for the presence of a "key" property and validates the length of the key data.
   *
   * @param publicKey - The public key to validate.
   * @returns A boolean indicating whether the public key is a valid SLH-DSA-SHA2-128s public key.
   * @group Implementation
   * @category Serialization
   */
  static isInstance(publicKey: PublicKey): publicKey is SlhDsaSha2128sPublicKey {
    return (
      "key" in publicKey &&
      (publicKey.key as any)?.data?.length === SlhDsaSha2128sPublicKey.LENGTH &&
      "keyType" in publicKey &&
      (publicKey as any).keyType === "slh-dsa-sha2-128s"
    );
  }
}

/**
 * Represents a SLH-DSA-SHA2-128s private key, providing functionality to create, sign messages,
 * derive public keys, and serialize/deserialize the key.
 * @group Implementation
 * @category Serialization
 */
export class SlhDsaSha2128sPrivateKey extends Serializable implements PrivateKey {
  /**
   * Length of SLH-DSA-SHA2-128s private key (48 bytes: SK seed + PRF seed + PK seed)
   * @group Implementation
   * @category Serialization
   */
  static readonly LENGTH: number = 48;

  /**
   * The SLH-DSA-SHA2-128s key seed to use for BIP-32 compatibility
   * See more {@link https://github.com/satoshilabs/slips/blob/master/slip-0010.md}
   *
   * TODO: This is not standardized... AFAIK.
   *
   * @group Implementation
   * @category Serialization
   */
  static readonly SLIP_0010_SEED = "SLH-DSA-SHA2-128s seed";

  /**
   * The 48-byte three seeds (SK seed + PRF seed + PK seed) used for serialization
   * @private
   * @group Implementation
   * @category Serialization
   */
  private readonly threeSeeds: Hex;

  /**
   * The full secret key from noble-post-quantum, computed from the three seeds.
   * @private
   * @group Implementation
   * @category Serialization
   */
  private readonly secretKey: Uint8Array;

  // region Constructors

  /**
   * Create a new PrivateKey instance from a Uint8Array or String.
   *
   * [Read about AIP-80](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md)
   *
   * @param hexInput A HexInput (string or Uint8Array)
   * @param strict If true, private key must AIP-80 compliant.
   * @group Implementation
   * @category Serialization
   */
  constructor(hexInput: HexInput, strict?: boolean) {
    super();

    const privateKeyHex = PrivateKey.parseHexInput(hexInput, PrivateKeyVariants.SlhDsaSha2128s, strict);
    if (privateKeyHex.toUint8Array().length !== SlhDsaSha2128sPrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${SlhDsaSha2128sPrivateKey.LENGTH}`);
    }

    this.threeSeeds = privateKeyHex;
    // Compute the secret key immediately from the three seeds
    const threeSeedsBytes = this.threeSeeds.toUint8Array();
    const keys = slh_dsa_sha2_128s.keygen(threeSeedsBytes);
    this.secretKey = keys.secretKey;
  }

  /**
   * Generate a new random private key.
   * The private key contains the 48-byte three seeds (SK seed + PRF seed + PK seed).
   * The public key can be derived from these seeds using the publicKey() method.
   *
   * @returns SlhDsaSha2128sPrivateKey - A newly generated SLH-DSA-SHA2-128s private key.
   * @group Implementation
   * @category Serialization
   */
  static generate(): SlhDsaSha2128sPrivateKey {
    // Generate a random 48-byte three seeds (3 * 16 bytes: SK seed + PRF seed + PK seed)
    const threeSeeds = new Uint8Array(48);
    crypto.getRandomValues(threeSeeds);
    const privateKey = new SlhDsaSha2128sPrivateKey(threeSeeds, false);
    return privateKey;
  }

  // endregion

  // region PrivateKey

  /**
   * Sign the given message with the private key.
   * This function generates a cryptographic signature for the provided message.
   *
   * @param message - A message in HexInput format to be signed.
   * @returns Signature - The generated signature for the provided message.
   * @group Implementation
   * @category Serialization
   */
  sign(message: HexInput): SlhDsaSha2128sSignature {
    const messageToSign = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToSign).toUint8Array();
    // Use the pre-computed secret key for fast signing
    const signatureBytes = slh_dsa_sha2_128s.sign(messageBytes, this.secretKey);
    return new SlhDsaSha2128sSignature(signatureBytes);
  }

  /**
   * Derives a private key from a mnemonic seed phrase using a specified BIP44 path.
   * To derive multiple keys from the same phrase, change the path
   *
   * IMPORTANT: SLH-DSA-SHA2-128s supports hardened derivation only, as it lacks a key homomorphism, making non-hardened derivation impossible.
   *
   * @param path - The BIP44 path used for key derivation.
   * @param mnemonics - The mnemonic seed phrase from which the key will be derived.
   * @throws Error if the provided path is not a valid hardened path.
   * @group Implementation
   * @category Serialization
   */
  static fromDerivationPath(path: string, mnemonics: string): SlhDsaSha2128sPrivateKey {
    if (!isValidHardenedPath(path)) {
      throw new Error(`Invalid derivation path ${path}`);
    }
    return SlhDsaSha2128sPrivateKey.fromDerivationPathInner(path, mnemonicToSeed(mnemonics));
  }

  /**
   * Derives a child private key from a given BIP44 path and seed.
   *
   * We derive our 48-byte SLH-DSA key (three 16-byte seeds) from:
   *  - the 32-byte, BIP-32-derived, secret key
   *  - the first 16 bytes of the BIP-32-derived chain code
   *
   * @param path - The BIP44 path used for key derivation.
   * @param seed - The seed phrase created by the mnemonics, represented as a Uint8Array.
   * @param offset - The offset used for key derivation, defaults to HARDENED_OFFSET.
   * @returns An instance of SlhDsaSha2128sPrivateKey derived from the specified path and seed.
   * @group Implementation
   * @category Serialization
   */
  private static fromDerivationPathInner(
    path: string,
    seed: Uint8Array,
    offset = HARDENED_OFFSET,
  ): SlhDsaSha2128sPrivateKey {
    const { key, chainCode } = deriveKey(SlhDsaSha2128sPrivateKey.SLIP_0010_SEED, seed);

    const segments = splitPath(path).map((el) => parseInt(el, 10));

    // Derive the child key based on the path
    const { key: privateKey, chainCode: finalChainCode } = segments.reduce(
      (parentKeys, segment) => CKDPriv(parentKeys, segment + offset),
      {
        key,
        chainCode,
      },
    );

    const threeSeeds = new Uint8Array(48);
    threeSeeds.set(privateKey, 0); // First 32 bytes from the derived secret key

    // TODO: We would need to reason about the security of this.
    // e.g., is it okay to treat the chain code as public?
    threeSeeds.set(finalChainCode.slice(0, 16), 32); // Last 16 bytes from the derived chain code

    return new SlhDsaSha2128sPrivateKey(threeSeeds, false);
  }

  /**
   * Derive the SlhDsaSha2128sPublicKey from this private key.
   * The public key is extracted from the pre-computed secret key.
   *
   * @returns SlhDsaSha2128sPublicKey The derived public key.
   * @group Implementation
   * @category Serialization
   */
  publicKey(): SlhDsaSha2128sPublicKey {
    // Use getPublicKey to extract the public key from the secret key
    const publicKeyBytes = slh_dsa_sha2_128s.getPublicKey(this.secretKey);
    return new SlhDsaSha2128sPublicKey(publicKeyBytes);
  }

  /**
   * Get the private key in bytes (Uint8Array).
   * Returns the 48-byte three seeds (SK seed + PRF seed + PK seed) for serialization.
   *
   * @returns The 48-byte three seeds
   * @group Implementation
   * @category Serialization
   */
  toUint8Array(): Uint8Array {
    return this.threeSeeds.toUint8Array();
  }

  /**
   * Get the private key as a string representation.
   *
   * @returns string representation of the private key
   * @group Implementation
   * @category Serialization
   */
  toString(): string {
    return this.toAIP80String();
  }

  /**
   * Get the private key as a hex string with the 0x prefix.
   *
   * @returns string representation of the private key.
   */
  toHexString(): string {
    return this.threeSeeds.toString();
  }

  /**
   * Get the private key as a AIP-80 compliant hex string.
   *
   * [Read about AIP-80](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md)
   *
   * @returns AIP-80 compliant string representation of the private key.
   */
  toAIP80String(): string {
    return PrivateKey.formatPrivateKey(this.threeSeeds.toString(), PrivateKeyVariants.SlhDsaSha2128s);
  }

  // endregion

  // region Serializable

  serialize(serializer: Serializer): void {
    // Serialize only the 48-byte three seeds (not the full secret key)
    serializer.serializeBytes(this.threeSeeds.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): SlhDsaSha2128sPrivateKey {
    // Deserialize the 48-byte three seeds
    const bytes = deserializer.deserializeBytes();
    // The constructor will compute the secret key immediately
    return new SlhDsaSha2128sPrivateKey(bytes, false);
  }

  // endregion

  /**
   * Determines if the provided private key is an instance of SlhDsaSha2128sPrivateKey.
   *
   * @param privateKey - The private key to be checked.
   *
   * @deprecated use `instanceof SlhDsaSha2128sPrivateKey` instead
   * @group Implementation
   * @category Serialization
   */
  static isPrivateKey(privateKey: PrivateKey): privateKey is SlhDsaSha2128sPrivateKey {
    return privateKey instanceof SlhDsaSha2128sPrivateKey;
  }
}

/**
 * Represents a signature of a message signed using a SLH-DSA-SHA2-128s private key.
 *
 * @group Implementation
 * @category Serialization
 */
export class SlhDsaSha2128sSignature extends Signature {
  /**
   * SLH-DSA-SHA2-128s signatures are 7,856 bytes.
   * @group Implementation
   * @category Serialization
   */
  static readonly LENGTH = 7856;

  /**
   * The signature bytes
   * @private
   * @group Implementation
   * @category Serialization
   */
  private readonly data: Hex;

  // region Constructors

  /**
   * Create a new Signature instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   * @group Implementation
   * @category Serialization
   */
  constructor(hexInput: HexInput) {
    super();
    const data = Hex.fromHexInput(hexInput);
    if (data.toUint8Array().length !== SlhDsaSha2128sSignature.LENGTH) {
      throw new Error(
        `Signature length should be ${SlhDsaSha2128sSignature.LENGTH}, received ${data.toUint8Array().length}`,
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

  static deserialize(deserializer: Deserializer): SlhDsaSha2128sSignature {
    const hex = deserializer.deserializeBytes();
    return new SlhDsaSha2128sSignature(hex);
  }

  // endregion
}

/**
 * A key pair containing both public and private keys for SLH-DSA-SHA2-128s.
 * The private key stores a 48-byte seed, and the public key can be derived from it.
 * This class provides a convenient way to work with both keys together.
 *
 * @group Implementation
 * @category Serialization
 */
export class SlhDsaSha2128sKeyPair {
  /**
   * The private key
   * @group Implementation
   * @category Serialization
   */
  public readonly privateKey: SlhDsaSha2128sPrivateKey;

  /**
   * The public key
   * @group Implementation
   * @category Serialization
   */
  public readonly publicKey: SlhDsaSha2128sPublicKey;

  /**
   * Create a new key pair from existing keys.
   * The public key will be validated against the private key three seeds.
   *
   * @param privateKey - The private key (48-byte three seeds)
   * @param publicKey - The public key
   * @group Implementation
   * @category Serialization
   */
  constructor(privateKey: SlhDsaSha2128sPrivateKey, publicKey: SlhDsaSha2128sPublicKey) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    // Validate that the public key matches the private key three seeds
    const derivedPublicKey = privateKey.publicKey();
    if (!derivedPublicKey.toUint8Array().every((byte, i) => byte === publicKey.toUint8Array()[i])) {
      throw new Error("Public key does not match the private key three seeds");
    }
  }

  /**
   * Generate a new random key pair.
   *
   * @returns SlhDsaSha2128sKeyPair - A newly generated key pair.
   * @group Implementation
   * @category Serialization
   */
  static generate(): SlhDsaSha2128sKeyPair {
    // Generate a random 48-byte three seeds (SK seed + PRF seed + PK seed)
    const threeSeeds = new Uint8Array(48);
    crypto.getRandomValues(threeSeeds);
    // Generate key pair from the three seeds
    const keys = slh_dsa_sha2_128s.keygen(threeSeeds);
    // Store the three seeds in the private key (constructor will compute secret key)
    const privateKey = new SlhDsaSha2128sPrivateKey(threeSeeds, false);
    const publicKey = new SlhDsaSha2128sPublicKey(keys.publicKey);
    // Verify that the public key derived from the private key matches the one from keygen
    const derivedPublicKey = privateKey.publicKey();
    const derivedBytes = derivedPublicKey.toUint8Array();
    const expectedBytes = publicKey.toUint8Array();
    if (derivedBytes.length !== expectedBytes.length || derivedBytes.some((byte, i) => byte !== expectedBytes[i])) {
      throw new Error("Public key mismatch: derived public key does not match keygen result");
    }
    return new SlhDsaSha2128sKeyPair(privateKey, publicKey);
  }
}
