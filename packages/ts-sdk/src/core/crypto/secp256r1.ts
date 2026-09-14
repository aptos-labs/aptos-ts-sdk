// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 } from "@noble/hashes/sha3.js";
import { p256 } from "@noble/curves/nist.js";
import { Deserializer, Serializer } from "../../bcs/index.js";
import { Hex } from "../hex.js";
import {
  HexInput,
  PrivateKeyVariants,
  SigningScheme as AuthenticationKeyScheme,
  AnyPublicKeyVariant,
} from "../../types/index.js";
import { PublicKey, VerifySignatureAsyncArgs } from "./publicKey.js";
import { PrivateKey } from "./privateKey.js";
import { Signature } from "./signature.js";
import { AuthenticationKey } from "../authenticationKey.js";
import { convertSigningMessage } from "./utils.js";
import { TEXT_ENCODER } from "../../utils/const.js";

/**
 * Represents a Secp256r1 ECDSA public key.
 *
 * @extends PublicKey
 * @property LENGTH - The length of the Secp256r1 public key in bytes.
 * @group Implementation
 * @category Serialization
 */
export class Secp256r1PublicKey extends PublicKey {
  // Secp256r1 ecdsa public keys contain a prefix indicating compression and two 32-byte coordinates.
  static readonly LENGTH: number = 65;

  // If it's compressed, it is only 33 bytes
  static readonly COMPRESSED_LENGTH: number = 33;

  // Hex value of the public key
  private readonly key: Hex;

  // Identifier to distinguish from Secp256k1PublicKey
  public readonly keyType: string = "secp256r1";

  /**
   * Create a new PublicKey instance from a HexInput, which can be a string or Uint8Array.
   * This constructor validates the length of the provided public key data.
   *
   * @param hexInput - A HexInput (string or Uint8Array) representing the public key data.
   * @throws Error if the length of the public key data is not equal to Secp256r1PublicKey.LENGTH or COMPRESSED_LENGTH.
   * @group Implementation
   * @category Serialization
   */
  constructor(hexInput: HexInput) {
    super();

    const hex = Hex.fromHexInput(hexInput);
    const keyLength = hex.toUint8Array().length;
    if (keyLength !== Secp256r1PublicKey.LENGTH && keyLength !== Secp256r1PublicKey.COMPRESSED_LENGTH) {
      throw new Error(
        `PublicKey length should be ${Secp256r1PublicKey.LENGTH} or ${Secp256r1PublicKey.COMPRESSED_LENGTH}, received ${keyLength}`,
      );
    }

    if (keyLength === Secp256r1PublicKey.COMPRESSED_LENGTH) {
      const point = p256.Point.fromBytes(hex.toUint8Array());
      this.key = Hex.fromHexInput(point.toBytes(false));
    } else {
      this.key = hex;
    }
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

  /**
   * Get the public key as a hex string with the 0x prefix.
   *
   * @returns string representation of the public key.
   * @group Implementation
   * @category Serialization
   */
  toString(): string {
    return this.key.toString();
  }

  /**
   * Converts the public key to BCS (Binary Canonical Serialization) bytes.
   * This function serializes the public key data into a byte array format suitable for transmission or storage.
   *
   * @returns Uint8Array representation of the serialized public key.
   * @group Implementation
   * @category Serialization
   */
  bcsToBytes() {
    const serializer = new Serializer();
    this.serialize(serializer);
    return serializer.toUint8Array();
  }

  /**
   * Verifies a signature against the exact bytes of `message`. This is the
   * unambiguous form — the input is interpreted as raw bytes regardless of
   * what they encode. Pair with {@link Secp256r1PrivateKey.signBytes}.
   *
   * The message is SHA3-256 hashed before verification (matching the
   * Aptos-side Secp256r1 signing convention), and the signature is required
   * to be in canonical low-S form for malleability resistance.
   *
   * @param args - The arguments for verification.
   * @param args.message - The exact bytes that were signed.
   * @param args.signature - The signature to verify.
   * @group Implementation
   * @category Serialization
   */
  verifyBytes(args: { message: Uint8Array; signature: Signature }): boolean {
    const { message, signature } = args;
    const sha3Message = sha3_256(message);
    return p256.verify(signature.toUint8Array(), sha3Message, this.toUint8Array(), { prehash: false, lowS: true });
  }

  /**
   * Verifies a signature against the UTF-8 encoding of `message`. The input
   * is always treated as text — there is no hex/text heuristic. Pair with
   * {@link Secp256r1PrivateKey.signText}.
   *
   * @param args - The arguments for verification.
   * @param args.message - The text that was signed.
   * @param args.signature - The signature to verify.
   * @group Implementation
   * @category Serialization
   */
  verifyText(args: { message: string; signature: Signature }): boolean {
    return this.verifyBytes({ message: TEXT_ENCODER.encode(args.message), signature: args.signature });
  }

  /**
   * Verifies a Secp256r1 signature against the public key.
   *
   * @deprecated The polymorphic `message: HexInput` input is ambiguous — a
   * bare even-length string of hex characters (e.g., `"cafe"`) is verified
   * against the 2 bytes `[0xCA, 0xFE]`, not 4 UTF-8 text bytes. Use
   * {@link verifyBytes} for `Uint8Array` input or {@link verifyText} for
   * `string` input; both are unambiguous. See
   * {@link convertSigningMessage} for the full legacy rule.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.message - The message that was signed.
   * @param args.signature - The signature to verify against the public key.
   * @group Implementation
   * @category Serialization
   */
  verifySignature(args: { message: HexInput; signature: Signature }): boolean {
    const { message, signature } = args;
    const messageToVerify = convertSigningMessage(message);
    const msgBytes = Hex.fromHexInput(messageToVerify).toUint8Array();
    return this.verifyBytes({ message: msgBytes, signature });
  }

  /**
   * Note: Secp256r1Signatures can be verified synchronously.
   *
   * Verifies the provided signature against the given message.
   * This function helps ensure the integrity and authenticity of the message by confirming that the signature is valid.
   *
   * @param args - The arguments for signature verification.
   * @param args.message - The message that was signed.
   * @param args.signature - The signature to verify, which must be an instance of Secp256r1Signature.
   * @returns A boolean indicating whether the signature is valid for the given message.
   * @group Implementation
   * @category Serialization
   */
  async verifySignatureAsync(args: VerifySignatureAsyncArgs): Promise<boolean> {
    return this.verifySignature({ message: args.message, signature: args.signature });
  }

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
   * Deserializes a Secp256r1PublicKey from the provided deserializer.
   * This function allows you to reconstruct a Secp256r1PublicKey object from its serialized byte representation.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Serialization
   */
  static deserialize(deserializer: Deserializer): Secp256r1PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256r1PublicKey(bytes);
  }

  /**
   * Loads a Secp256r1PublicKey from the provided deserializer.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Serialization
   */
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
    return (
      "key" in publicKey &&
      typeof publicKey.key === "object" &&
      publicKey.key !== null &&
      "data" in publicKey.key &&
      typeof publicKey.key.data === "object" &&
      publicKey.key.data !== null &&
      "length" in publicKey.key.data &&
      publicKey.key?.data?.length === Secp256r1PublicKey.LENGTH &&
      "keyType" in publicKey &&
      typeof publicKey === "object" &&
      publicKey.keyType === "secp256r1"
    );
  }

  /**
   * Generates an authentication key from the public key using the Secp256r1 scheme.
   * This function is essential for creating a secure authentication key that can be used for further cryptographic operations.
   *
   * @returns {AuthenticationKey} The generated authentication key.
   * @group Implementation
   * @category Serialization
   */
  authKey(): AuthenticationKey {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(AnyPublicKeyVariant.Secp256r1);
    serializer.serializeFixedBytes(this.bcsToBytes());
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: AuthenticationKeyScheme.SingleKey,
      input: serializer.toUint8Array(),
    });
  }
}

/**
 * Represents a Secp256r1 ECDSA private key, providing functionality to create, sign messages,
 * derive public keys, and serialize/deserialize the key.
 * @group Implementation
 * @category Serialization
 */
export class Secp256r1PrivateKey extends PrivateKey {
  /**
   * Length of Secp256r1 ecdsa private key
   * @group Implementation
   * @category Serialization
   */
  static readonly LENGTH: number = 32;

  /**
   * The private key bytes
   * @private
   * @group Implementation
   * @category Serialization
   */
  private readonly key: Hex;

  /**
   * Whether the key has been cleared from memory.
   * @private
   */
  private cleared: boolean = false;

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

    const privateKeyHex = PrivateKey.parseHexInput(hexInput, PrivateKeyVariants.Secp256r1, strict);
    const keyLength = privateKeyHex.toUint8Array().length;
    if (keyLength !== Secp256r1PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Secp256r1PrivateKey.LENGTH}, received ${keyLength}`);
    }

    this.key = privateKeyHex;
  }

  /**
   * Get the private key in bytes (Uint8Array).
   *
   * @returns
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  toUint8Array(): Uint8Array {
    this.ensureNotCleared();
    return this.key.toUint8Array();
  }

  /**
   * Get the private key as a string representation.
   *
   * SECURITY: This produces an immutable JS string containing the key
   * material. Strings cannot be zeroed by `clear()` (see the `clear()`
   * JSDoc for the four classes of unreachable copies). Avoid calling this
   * method on long-lived `Secp256r1PrivateKey` instances in processes
   * where memory hygiene matters; prefer `toUint8Array()`, which returns
   * a clearable `Uint8Array`.
   *
   * @returns string representation of the private key
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  toString(): string {
    this.ensureNotCleared();
    return PrivateKey.formatPrivateKey(this.key.toString(), PrivateKeyVariants.Secp256r1);
  }

  /**
   * Get the private key as a hex string with the 0x prefix.
   *
   * SECURITY: Same caveat as `toString()` — produces an immutable JS string
   * containing the key material; cannot be zeroed by `clear()`.
   *
   * @returns string representation of the private key.
   * @throws Error if the private key has been cleared from memory.
   */
  toHexString(): string {
    this.ensureNotCleared();
    return this.key.toString();
  }

  /**
   * Sign exactly the bytes of `message`. The input is interpreted as raw
   * bytes regardless of what they encode. Pair with
   * {@link Secp256r1PublicKey.verifyBytes}.
   *
   * The message is SHA3-256 hashed before signing (matching the Aptos-side
   * Secp256r1 signing convention).
   *
   * @param message - The exact bytes to sign.
   * @returns The generated signature for the provided bytes.
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  signBytes(message: Uint8Array): Secp256r1Signature {
    this.ensureNotCleared();
    const sha3Message = sha3_256(message);
    const signature = p256.sign(sha3Message, this.key.toUint8Array(), { prehash: false });
    return new Secp256r1Signature(signature);
  }

  /**
   * Sign the UTF-8 encoding of `message`. The input is always treated as
   * text — there is no hex/text heuristic. Pair with
   * {@link Secp256r1PublicKey.verifyText}.
   *
   * @param message - The text to sign.
   * @returns The generated signature for the UTF-8 bytes of the provided text.
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  signText(message: string): Secp256r1Signature {
    return this.signBytes(TEXT_ENCODER.encode(message));
  }

  /**
   * Sign the given message with the private key.
   * This function generates a cryptographic signature for the provided message.
   *
   * @deprecated The polymorphic `message: HexInput` input is ambiguous — a
   * bare even-length string of hex characters (e.g., `"cafe"`) is signed
   * as the 2 bytes `[0xCA, 0xFE]`, not 4 UTF-8 text bytes. Use
   * {@link signBytes} for `Uint8Array` input or {@link signText} for
   * `string` input; both are unambiguous. See
   * {@link convertSigningMessage} for the full legacy rule.
   *
   * @param message - A message in HexInput format to be signed.
   * @returns Signature - The generated signature for the provided message.
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  sign(message: HexInput): Secp256r1Signature {
    const messageToSign = convertSigningMessage(message);
    const msgBytes = Hex.fromHexInput(messageToSign).toUint8Array();
    return this.signBytes(msgBytes);
  }

  /**
   * Serializes the data into a byte array using the provided serializer.
   * This function is essential for converting data into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer instance used to convert the data.
   * @group Implementation
   * @category Serialization
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  /**
   * Deserializes a Secp256r1PrivateKey from the provided deserializer.
   * This function allows you to reconstruct a Secp256r1PrivateKey object from its serialized byte representation.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Serialization
   */
  static deserialize(deserializer: Deserializer): Secp256r1PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256r1PrivateKey(bytes);
  }

  /**
   * Generate a new random private key.
   *
   * @returns Secp256r1PrivateKey - A newly generated Secp256r1 private key.
   * @group Implementation
   * @category Serialization
   */
  static generate(): Secp256r1PrivateKey {
    const hexInput = p256.utils.randomSecretKey();
    return new Secp256r1PrivateKey(hexInput);
  }

  /**
   * Derive the Secp256r1PublicKey from this private key.
   *
   * @returns Secp256r1PublicKey The derived public key.
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  publicKey(): Secp256r1PublicKey {
    this.ensureNotCleared();
    const bytes = p256.getPublicKey(this.key.toUint8Array(), false);
    return new Secp256r1PublicKey(bytes);
  }

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
   * then zeros. After calling this method the key can no longer sign or
   * derive a public key.
   *
   * SECURITY: This is a best-effort window-narrowing tool, NOT a true
   * zeroization guarantee. See `Ed25519PrivateKey.clear()` for the full
   * enumeration of JavaScript-level limits (immutable string copies, noble
   * `BigInt` intermediates, JIT register/stack residue, GC-relocated
   * copies). For Secp256r1 specifically, non-extractable `crypto.subtle`
   * P-256 keys are universally supported across modern runtimes and are
   * the architecturally-correct path for callers who need real memory
   * hygiene; consider that alternative for new code.
   *
   * @group Implementation
   * @category Serialization
   */
  clear(): void {
    if (!this.cleared) {
      const keyBytes = this.key.toUint8Array();
      // Multiple overwrite passes for consistency with the other private-key classes.
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
 * Represents a signature of a message signed using a Secp256r1 ECDSA private key.
 *
 * @group Implementation
 * @category Serialization
 */
export class Secp256r1Signature extends Signature {
  /**
   * Secp256r1 ecdsa signatures are 256-bit.
   * @group Implementation
   * @category Serialization
   */
  static readonly LENGTH = 64;

  /**
   * The signature bytes
   * @private
   * @group Implementation
   * @category Serialization
   */
  private readonly data: Hex;

  /**
   * Create a new Signature instance from a Uint8Array or String.
   *
   * @param hexInput A HexInput (string or Uint8Array)
   * @group Implementation
   * @category Serialization
   */
  constructor(hexInput: HexInput) {
    super();

    const hex = Hex.fromHexInput(hexInput);
    const signatureLength = hex.toUint8Array().length;
    if (signatureLength !== Secp256r1Signature.LENGTH) {
      throw new Error(`Signature length should be ${Secp256r1Signature.LENGTH}, received ${signatureLength}`);
    }
    const signature = p256.Signature.fromBytes(hex.toUint8Array());
    this.data = Hex.fromHexInput(signature.toBytes());
  }

  /**
   * Get the signature in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the signature
   * @group Implementation
   * @category Serialization
   */
  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  /**
   * Get the signature as a hex string with the 0x prefix.
   *
   * @returns string representation of the signature
   * @group Implementation
   * @category Serialization
   */
  toString(): string {
    return this.data.toString();
  }

  /**
   * Serializes the data into a byte array using the provided serializer.
   * This function is essential for converting data into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer instance used to convert the data.
   * @group Implementation
   * @category Serialization
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  /**
   * Deserializes a Secp256r1Signature from the provided deserializer.
   * This function allows you to reconstruct a Secp256r1Signature object from its serialized byte representation.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Serialization
   */
  static deserialize(deserializer: Deserializer): Secp256r1Signature {
    const hex = deserializer.deserializeBytes();
    return new Secp256r1Signature(hex);
  }
}
