import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha3_256 } from "@noble/hashes/sha3.js";
import { HDKey } from "@scure/bip32";
import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { isValidBIP44Path, mnemonicToSeed } from "./hd-key.js";
import { type PrivateKey, PrivateKeyUtils } from "./private-key.js";
import { PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { PrivateKeyVariants } from "./types.js";
import { convertSigningMessage } from "./utils.js";

/**
 * Represents a secp256k1 public key (65-byte uncompressed or 33-byte compressed).
 *
 * Internally the key is always stored in uncompressed form (65 bytes).
 * Compressed keys provided to the constructor are expanded automatically.
 *
 * @example
 * ```ts
 * const privateKey = Secp256k1PrivateKey.generate();
 * const publicKey = privateKey.publicKey();
 * const isValid = publicKey.verifySignature({ message: "0xdeadbeef", signature });
 * ```
 */
export class Secp256k1PublicKey extends PublicKey {
  /** The expected byte length of an uncompressed secp256k1 public key. */
  static readonly LENGTH: number = 65;
  /** The expected byte length of a compressed secp256k1 public key. */
  static readonly COMPRESSED_LENGTH: number = 33;

  private readonly key: Hex;

  /**
   * Creates a `Secp256k1PublicKey` from raw bytes or a hex string.
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
    const { length } = hex.toUint8Array();
    if (length === Secp256k1PublicKey.LENGTH) {
      // Validate uncompressed key is a valid curve point
      secp256k1.Point.fromBytes(hex.toUint8Array());
      this.key = hex;
    } else if (length === Secp256k1PublicKey.COMPRESSED_LENGTH) {
      const point = secp256k1.Point.fromBytes(hex.toUint8Array());
      this.key = Hex.fromHexInput(point.toBytes(false));
    } else {
      throw new Error(
        `PublicKey length should be ${Secp256k1PublicKey.LENGTH} or ${Secp256k1PublicKey.COMPRESSED_LENGTH}, received ${length}`,
      );
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
    const messageBytes = Hex.fromHexInput(messageToVerify).toUint8Array();
    const messageSha3Bytes = sha3_256(messageBytes);
    const signatureBytes = signature.toUint8Array();
    return secp256k1.verify(signatureBytes, messageSha3Bytes, this.key.toUint8Array(), { lowS: true, prehash: false });
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
   * Deserialises a `Secp256k1PublicKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Secp256k1PublicKey`.
   */
  static deserialize(deserializer: Deserializer): Secp256k1PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256k1PublicKey(bytes);
  }
}

/**
 * Represents a secp256k1 ECDSA private key (32 bytes).
 *
 * Supports key generation, BIP-44 derivation via BIP-32/BIP-39, signing, and
 * secure memory clearing.
 *
 * @example
 * ```ts
 * const privateKey = Secp256k1PrivateKey.generate();
 * const signature = privateKey.sign("0xdeadbeef");
 * ```
 */
export class Secp256k1PrivateKey extends Serializable implements PrivateKey {
  /** The expected byte length of a secp256k1 private key. */
  static readonly LENGTH: number = 32;

  private key: Hex;
  private cleared: boolean = false;

  /**
   * Creates a `Secp256k1PrivateKey` from raw bytes or a hex/AIP-80 string.
   *
   * @param hexInput - A 32-byte private key as raw bytes, a hex string, or an
   *   AIP-80 string (`"secp256k1-priv-0x..."`).
   * @param strict - When `true`, the input must be AIP-80 formatted.
   *   Defaults to `false`.
   * @throws If the decoded key is not exactly 32 bytes.
   */
  constructor(hexInput: HexInput, strict?: boolean) {
    super();
    const privateKeyHex = PrivateKeyUtils.parseHexInput(hexInput, PrivateKeyVariants.Secp256k1, strict);
    if (privateKeyHex.toUint8Array().length !== Secp256k1PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Secp256k1PrivateKey.LENGTH}`);
    }
    this.key = privateKeyHex;
  }

  /**
   * Generates a random secp256k1 private key.
   *
   * @returns A new randomly generated `Secp256k1PrivateKey`.
   *
   * @example
   * ```ts
   * const key = Secp256k1PrivateKey.generate();
   * ```
   */
  static generate(): Secp256k1PrivateKey {
    const hexInput = secp256k1.utils.randomSecretKey();
    return new Secp256k1PrivateKey(hexInput, false);
  }

  /**
   * Derives a secp256k1 private key from a BIP-39 mnemonic and a BIP-44
   * derivation path.
   *
   * @param path - A BIP-44 derivation path, e.g. `"m/44'/637'/0'/0/0"`.
   * @param mnemonics - A BIP-39 mnemonic phrase.
   * @returns The derived `Secp256k1PrivateKey`.
   * @throws If the derivation path is not a valid BIP-44 path.
   *
   * @example
   * ```ts
   * const key = Secp256k1PrivateKey.fromDerivationPath(
   *   "m/44'/637'/0'/0/0",
   *   "your twelve word mnemonic phrase here ...",
   * );
   * ```
   */
  static fromDerivationPath(path: string, mnemonics: string): Secp256k1PrivateKey {
    if (!isValidBIP44Path(path)) {
      throw new Error(`Invalid derivation path ${path}`);
    }
    return Secp256k1PrivateKey.fromDerivationPathInner(path, mnemonicToSeed(mnemonics));
  }

  private static fromDerivationPathInner(path: string, seed: Uint8Array): Secp256k1PrivateKey {
    const hdKey = HDKey.fromMasterSeed(seed).derive(path);
    const { privateKey } = hdKey;
    if (privateKey === null) {
      throw new Error("Invalid key");
    }
    // Copy the private key before wiping HDKey internals
    const keyCopy = privateKey.slice();
    // Zero HDKey internals to prevent key material lingering in memory
    if (hdKey.privateKey) hdKey.privateKey.fill(0);
    if (hdKey.chainCode) hdKey.chainCode.fill(0);
    return new Secp256k1PrivateKey(keyCopy, false);
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
   * Signs a message and returns a {@link Secp256k1Signature}.
   *
   * The message is SHA3-256 hashed before signing.  The signature is
   * normalised to low-S form as required by the Aptos chain.
   *
   * @param message - The message to sign, as raw bytes, a hex string, or a
   *   plain UTF-8 string.
   * @returns The resulting {@link Secp256k1Signature}.
   * @throws If the key has been cleared.
   */
  sign(message: HexInput): Secp256k1Signature {
    this.ensureNotCleared();
    const messageToSign = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToSign);
    const messageHashBytes = sha3_256(messageBytes.toUint8Array());
    const signatureBytes = secp256k1.sign(messageHashBytes, this.key.toUint8Array(), { lowS: true, prehash: false });
    return new Secp256k1Signature(signatureBytes);
  }

  /**
   * Derives and returns the secp256k1 public key corresponding to this private key.
   *
   * @returns The associated {@link Secp256k1PublicKey} in uncompressed form.
   * @throws If the key has been cleared.
   */
  publicKey(): Secp256k1PublicKey {
    this.ensureNotCleared();
    const bytes = secp256k1.getPublicKey(this.key.toUint8Array(), false);
    return new Secp256k1PublicKey(bytes);
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
   * Returns the private key as an AIP-80 formatted string (equivalent to
   * {@link toAIP80String}).
   *
   * @returns An AIP-80 string, e.g. `"secp256k1-priv-0x..."`.
   * @throws If the key has been cleared.
   */
  toString(): string {
    this.ensureNotCleared();
    return this.toAIP80String();
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
   * Returns the private key as an AIP-80 compliant string.
   *
   * @returns A string of the form `"secp256k1-priv-0x<hex>"`.
   * @throws If the key has been cleared.
   */
  toAIP80String(): string {
    this.ensureNotCleared();
    return PrivateKeyUtils.formatPrivateKey(this.key.toString(), PrivateKeyVariants.Secp256k1);
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
   * Deserialises a `Secp256k1PrivateKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Secp256k1PrivateKey`.
   */
  static deserialize(deserializer: Deserializer): Secp256k1PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Secp256k1PrivateKey(bytes, false);
  }
}

/**
 * Represents a secp256k1 ECDSA signature (64 bytes, DER-encoded compact form).
 *
 * @example
 * ```ts
 * const sig = privateKey.sign("0xdeadbeef");
 * console.log(sig.toString()); // "0x..."
 * ```
 */
export class Secp256k1Signature extends Signature {
  /** The expected byte length of a secp256k1 signature (compact form). */
  static readonly LENGTH = 64;

  private readonly data: Hex;

  /**
   * Creates a `Secp256k1Signature` from raw bytes or a hex string.
   *
   * @param hexInput - A 64-byte signature in compact form as a hex string or `Uint8Array`.
   * @throws If the input is not exactly 64 bytes.
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

  /**
   * Returns the raw 64-byte signature.
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
   * Deserialises a `Secp256k1Signature` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Secp256k1Signature`.
   */
  static deserialize(deserializer: Deserializer): Secp256k1Signature {
    const hex = deserializer.deserializeBytes();
    return new Secp256k1Signature(hex);
  }
}
