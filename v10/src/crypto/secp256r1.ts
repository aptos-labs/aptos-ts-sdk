import { p256 } from "@noble/curves/nist.js";
import { sha3_256 } from "@noble/hashes/sha3.js";
import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { type PrivateKey, PrivateKeyUtils } from "./private-key.js";
import { PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { PrivateKeyVariants } from "./types.js";
import { convertSigningMessage } from "./utils.js";

/**
 * Represents a secp256r1 (NIST P-256) public key (65-byte uncompressed or
 * 33-byte compressed).
 *
 * Internally the key is always stored in uncompressed form (65 bytes).
 * Compressed keys provided to the constructor are expanded automatically.
 *
 * @example
 * ```ts
 * const privateKey = Secp256r1PrivateKey.generate();
 * const publicKey = privateKey.publicKey();
 * const isValid = publicKey.verifySignature({ message: "0xdeadbeef", signature });
 * ```
 */
export class Secp256r1PublicKey extends PublicKey {
  /** The expected byte length of an uncompressed secp256r1 public key. */
  static readonly LENGTH: number = 65;
  /** The expected byte length of a compressed secp256r1 public key. */
  static readonly COMPRESSED_LENGTH: number = 33;

  private readonly key: Hex;

  /**
   * Creates a `Secp256r1PublicKey` from raw bytes or a hex string.
   *
   * Both uncompressed (65-byte) and compressed (33-byte) keys are accepted.
   * Compressed keys are expanded to uncompressed form before storage.
   *
   * @param hexInput - The public key as a hex string or `Uint8Array`.
   * @throws If the input is neither 33 nor 65 bytes.
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
      // Validate uncompressed key is a valid curve point
      p256.Point.fromBytes(hex.toUint8Array());
      this.key = hex;
    }
  }

  /**
   * Verifies that `signature` was produced by signing `message` with the
   * corresponding private key.
   *
   * The message is hashed with SHA3-256 before verification.
   *
   * @param args - Object containing `message` and `signature`.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    const messageToVerify = convertSigningMessage(message);
    const msgHex = Hex.fromHexInput(messageToVerify).toUint8Array();
    const sha3Message = sha3_256(msgHex);
    const rawSignature = signature.toUint8Array();
    return p256.verify(rawSignature, sha3Message, this.toUint8Array(), { prehash: false, lowS: true });
  }

  /**
   * Returns the uncompressed 65-byte public key.
   *
   * @returns The public key as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array {
    return this.key.toUint8Array();
  }

  /**
   * BCS-serialises the public key by writing its bytes with a length prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  /**
   * Deserialises a `Secp256r1PublicKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Secp256r1PublicKey`.
   */
  static deserialize(deserializer: Deserializer): Secp256r1PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256r1PublicKey(bytes);
  }
}

/**
 * Represents a secp256r1 (NIST P-256) ECDSA private key (32 bytes).
 *
 * Supports key generation, signing, and raw byte export.
 *
 * @example
 * ```ts
 * const privateKey = Secp256r1PrivateKey.generate();
 * const signature = privateKey.sign("0xdeadbeef");
 * ```
 */
export class Secp256r1PrivateKey extends Serializable implements PrivateKey {
  /** The expected byte length of a secp256r1 private key. */
  static readonly LENGTH: number = 32;

  private key: Hex;
  private cleared: boolean = false;

  /**
   * Creates a `Secp256r1PrivateKey` from raw bytes or a hex/AIP-80 string.
   *
   * @param hexInput - A 32-byte private key as raw bytes, a hex string, or an
   *   AIP-80 string (`"secp256r1-priv-0x..."`).
   * @param strict - When `true`, the input must be AIP-80 formatted.
   *   Defaults to `false`.
   * @throws If the decoded key is not exactly 32 bytes.
   */
  constructor(hexInput: HexInput, strict?: boolean) {
    super();
    const privateKeyHex = PrivateKeyUtils.parseHexInput(hexInput, PrivateKeyVariants.Secp256r1, strict);
    const keyLength = privateKeyHex.toUint8Array().length;
    if (keyLength !== Secp256r1PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Secp256r1PrivateKey.LENGTH}, received ${keyLength}`);
    }
    this.key = privateKeyHex;
  }

  /**
   * Generates a random secp256r1 private key.
   *
   * @returns A new randomly generated `Secp256r1PrivateKey`.
   *
   * @example
   * ```ts
   * const key = Secp256r1PrivateKey.generate();
   * ```
   */
  static generate(): Secp256r1PrivateKey {
    const hexInput = p256.utils.randomSecretKey();
    return new Secp256r1PrivateKey(hexInput);
  }

  private ensureNotCleared(): void {
    if (this.cleared) {
      throw new Error("Private key has been cleared from memory and can no longer be used");
    }
  }

  /**
   * Overwrites the private key material in memory with random and zero bytes,
   * then marks the key as cleared.
   *
   * After calling this method any further use of the key will throw.
   *
   * **Note:** If the key was constructed from a hex string, the original string
   * cannot be zeroed (JavaScript strings are immutable). For maximum security,
   * construct keys from `Uint8Array` sources when possible and ensure the
   * original string reference is not retained.
   */
  clear(): void {
    if (!this.cleared) {
      const keyBytes = this.key.toUint8Array();
      crypto.getRandomValues(keyBytes);
      keyBytes.fill(0xff);
      crypto.getRandomValues(keyBytes);
      keyBytes.fill(0);
      this.cleared = true;
    }
  }

  /**
   * Returns whether the key has been cleared from memory.
   *
   * @returns `true` if {@link clear} has been called, `false` otherwise.
   */
  isCleared(): boolean {
    return this.cleared;
  }

  /**
   * Signs a message and returns a {@link Secp256r1Signature}.
   *
   * The message is SHA3-256 hashed before signing.  The signature is
   * normalised to low-S form.
   *
   * @param message - The message to sign, as raw bytes or a hex string.
   * @returns The resulting {@link Secp256r1Signature}.
   * @throws If the key has been cleared.
   */
  sign(message: HexInput): Secp256r1Signature {
    this.ensureNotCleared();
    const messageToSign = convertSigningMessage(message);
    const msgHex = Hex.fromHexInput(messageToSign);
    const sha3Message = sha3_256(msgHex.toUint8Array());
    const signatureBytes = p256.sign(sha3Message, this.key.toUint8Array(), { prehash: false, lowS: true });
    return new Secp256r1Signature(signatureBytes);
  }

  /**
   * Derives and returns the secp256r1 public key corresponding to this private key.
   *
   * @returns The associated {@link Secp256r1PublicKey} in uncompressed form.
   * @throws If the key has been cleared.
   */
  publicKey(): Secp256r1PublicKey {
    this.ensureNotCleared();
    const bytes = p256.getPublicKey(this.key.toUint8Array(), false);
    return new Secp256r1PublicKey(bytes);
  }

  /**
   * Returns the raw 32-byte private key material.
   *
   * @returns The private key as a `Uint8Array`.
   * @throws If the key has been cleared.
   */
  toUint8Array(): Uint8Array {
    this.ensureNotCleared();
    return this.key.toUint8Array();
  }

  /**
   * Returns the private key as an AIP-80 compliant string.
   *
   * @returns A string of the form `"secp256r1-priv-0x<hex>"`.
   * @throws If the key has been cleared.
   */
  toString(): string {
    this.ensureNotCleared();
    return PrivateKeyUtils.formatPrivateKey(this.key.toString(), PrivateKeyVariants.Secp256r1);
  }

  /**
   * Returns the private key as a plain hex string (without AIP-80 prefix).
   *
   * @returns A `0x`-prefixed hex string.
   * @throws If the key has been cleared.
   */
  toHexString(): string {
    this.ensureNotCleared();
    return this.key.toString();
  }

  /**
   * BCS-serialises the private key by writing its bytes with a length prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  /**
   * Deserialises a `Secp256r1PrivateKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Secp256r1PrivateKey`.
   */
  static deserialize(deserializer: Deserializer): Secp256r1PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256r1PrivateKey(bytes);
  }
}

/**
 * Represents a WebAuthn assertion signature, consisting of the ECDSA
 * signature, authenticator data, and client data JSON.
 *
 * Used for passkey-based authentication on Aptos.
 */
export class WebAuthnSignature extends Signature {
  /** The raw ECDSA signature bytes. */
  readonly signature: Hex;
  /** The authenticator data from the WebAuthn assertion response. */
  readonly authenticatorData: Hex;
  /** The client data JSON from the WebAuthn assertion response. */
  readonly clientDataJSON: Hex;

  /**
   * Creates a `WebAuthnSignature`.
   *
   * @param signature - The raw ECDSA signature bytes.
   * @param authenticatorData - The authenticator data from the WebAuthn response.
   * @param clientDataJSON - The client data JSON from the WebAuthn response.
   */
  constructor(signature: HexInput, authenticatorData: HexInput, clientDataJSON: HexInput) {
    super();
    this.signature = Hex.fromHexInput(signature);
    this.authenticatorData = Hex.fromHexInput(authenticatorData);
    this.clientDataJSON = Hex.fromHexInput(clientDataJSON);
  }

  /**
   * Returns the raw ECDSA signature bytes.
   *
   * @returns The signature bytes as a `Uint8Array`.
   */
  toUint8Array() {
    return this.signature.toUint8Array();
  }

  /**
   * BCS-serialises the WebAuthn signature, including the variant tag,
   * raw signature, authenticator data, and client data JSON.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer) {
    serializer.serializeU32AsUleb128(0);
    serializer.serializeBytes(this.signature.toUint8Array());
    serializer.serializeBytes(this.authenticatorData.toUint8Array());
    serializer.serializeBytes(this.clientDataJSON.toUint8Array());
  }

  /**
   * Deserialises a `WebAuthnSignature` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `WebAuthnSignature`.
   * @throws If the variant id is not `0`.
   */
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
 * Represents a secp256r1 ECDSA signature (64 bytes, compact form).
 *
 * The constructor normalises the signature to low-S form if necessary.
 *
 * @example
 * ```ts
 * const sig = privateKey.sign("0xdeadbeef");
 * console.log(sig.toString()); // "0x..."
 * ```
 */
export class Secp256r1Signature extends Signature {
  /** The expected byte length of a secp256r1 signature (compact form). */
  static readonly LENGTH = 64;

  private readonly data: Hex;

  /**
   * Creates a `Secp256r1Signature` from raw bytes or a hex string.
   *
   * If the signature has a high-S value it is normalised to the equivalent
   * low-S form to comply with Aptos chain requirements.
   *
   * @param hexInput - A 64-byte signature in compact form as a hex string or `Uint8Array`.
   * @throws If the input is not exactly 64 bytes.
   */
  constructor(hexInput: HexInput) {
    super();
    const hex = Hex.fromHexInput(hexInput);
    const signatureLength = hex.toUint8Array().length;
    if (signatureLength !== Secp256r1Signature.LENGTH) {
      throw new Error(`Signature length should be ${Secp256r1Signature.LENGTH}, received ${signatureLength}`);
    }
    const sig = p256.Signature.fromBytes(hex.toUint8Array());
    if (sig.hasHighS()) {
      // biome-ignore lint/suspicious/noExplicitAny: Point.Fn.ORDER is not in the TypeScript types
      const n = (p256.Point as any).Fn.ORDER as bigint;
      this.data = Hex.fromHexInput(new p256.Signature(sig.r, n - sig.s).toBytes());
    } else {
      this.data = hex;
    }
  }

  /**
   * Returns the raw 64-byte signature (low-S normalised).
   *
   * @returns The signature as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array {
    return this.data.toUint8Array();
  }

  /**
   * BCS-serialises the signature by writing its bytes with a length prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.data.toUint8Array());
  }

  /**
   * Deserialises a `Secp256r1Signature` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Secp256r1Signature`.
   */
  static deserialize(deserializer: Deserializer): Secp256r1Signature {
    const hex = deserializer.deserializeBytes();
    return new Secp256r1Signature(hex);
  }
}
