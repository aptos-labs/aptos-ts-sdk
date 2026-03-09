import { ed25519 } from "@noble/curves/ed25519.js";
import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { CKDPriv, deriveKey, HARDENED_OFFSET, isValidHardenedPath, mnemonicToSeed, splitPath } from "./hd-key.js";
import { type PrivateKey, PrivateKeyUtils } from "./private-key.js";
import { AccountPublicKey, createAuthKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { PrivateKeyVariants, SigningScheme } from "./types.js";
import { convertSigningMessage } from "./utils.js";

const L: number[] = [
  0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10,
];

/**
 * Checks whether an Ed25519 signature is canonical (i.e. the scalar `s` is
 * reduced modulo the group order `L`).
 *
 * Non-canonical signatures are rejected by the Aptos chain and should be
 * rejected before submitting a transaction.
 *
 * @param signature - The {@link Signature} to check.
 * @returns `true` if the signature is canonical, `false` otherwise.
 */
export function isCanonicalEd25519Signature(signature: Signature): boolean {
  const sigBytes = signature.toUint8Array();
  for (let i = L.length - 1; i >= 0; i -= 1) {
    if (sigBytes[i + 32] < L[i]) return true;
    if (sigBytes[i + 32] > L[i]) return false;
  }
  return false;
}

/**
 * Represents an Ed25519 public key.
 *
 * Ed25519 is the default signing scheme for Aptos accounts and supports fast
 * signature verification.
 *
 * @example
 * ```ts
 * const privateKey = Ed25519PrivateKey.generate();
 * const publicKey = privateKey.publicKey();
 * const isValid = publicKey.verifySignature({ message: "0xdeadbeef", signature });
 * ```
 */
export class Ed25519PublicKey extends AccountPublicKey {
  /** The expected byte length of an Ed25519 public key. */
  static readonly LENGTH: number = 32;

  private readonly key: Hex;

  /**
   * Creates an `Ed25519PublicKey` from raw bytes or a hex string.
   *
   * @param hexInput - A 32-byte public key as a hex string or `Uint8Array`.
   * @throws If the input is not exactly 32 bytes.
   */
  constructor(hexInput: HexInput) {
    super();
    const hex = Hex.fromHexInput(hexInput);
    if (hex.toUint8Array().length !== Ed25519PublicKey.LENGTH) {
      throw new Error(`PublicKey length should be ${Ed25519PublicKey.LENGTH}`);
    }
    this.key = hex;
  }

  /**
   * Verifies that `signature` was produced by signing `message` with the
   * corresponding private key.
   *
   * Non-canonical signatures are rejected before verification.
   *
   * @param args - Object containing `message` and `signature`.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (!isCanonicalEd25519Signature(signature)) return false;
    const messageToVerify = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToVerify).toUint8Array();
    const signatureBytes = signature.toUint8Array();
    const publicKeyBytes = this.key.toUint8Array();
    return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
  }

  /**
   * Derives the Aptos authentication key for this public key using the
   * Ed25519 signing scheme.
   *
   * @returns The `AccountAddress` that represents the authentication key.
   */
  authKey(): unknown {
    return createAuthKey(SigningScheme.Ed25519, this.toUint8Array());
  }

  /**
   * Returns the raw 32-byte public key.
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
   * Deserialises an `Ed25519PublicKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Ed25519PublicKey`.
   */
  static deserialize(deserializer: Deserializer): Ed25519PublicKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PublicKey(bytes);
  }
}

/**
 * Represents an Ed25519 private key.
 *
 * Supports key generation, BIP-39/SLIP-0010 derivation, signing, and secure
 * memory clearing.  Private keys can be serialised as AIP-80 strings (e.g.
 * `"ed25519-priv-0x..."`).
 *
 * @example
 * ```ts
 * const privateKey = Ed25519PrivateKey.generate();
 * const signature = privateKey.sign("0xdeadbeef");
 * privateKey.clear(); // wipe key material from memory
 * ```
 */
export class Ed25519PrivateKey extends Serializable implements PrivateKey {
  /** The expected byte length of an Ed25519 private key. */
  static readonly LENGTH: number = 32;
  /** SLIP-0010 seed string for Ed25519 key derivation. */
  static readonly SLIP_0010_SEED = "ed25519 seed";

  private signingKey: Hex;
  private cleared: boolean = false;

  /**
   * Creates an `Ed25519PrivateKey` from raw bytes or a hex/AIP-80 string.
   *
   * @param hexInput - A 32-byte private key as raw bytes, a hex string, or an
   *   AIP-80 string (`"ed25519-priv-0x..."`).
   * @param strict - When `true`, the input must be AIP-80 formatted.
   *   Defaults to `false`.
   * @throws If the decoded key is not exactly 32 bytes.
   */
  constructor(hexInput: HexInput, strict?: boolean) {
    super();
    const privateKeyHex = PrivateKeyUtils.parseHexInput(hexInput, PrivateKeyVariants.Ed25519, strict);
    if (privateKeyHex.toUint8Array().length !== Ed25519PrivateKey.LENGTH) {
      throw new Error(`PrivateKey length should be ${Ed25519PrivateKey.LENGTH}`);
    }
    this.signingKey = privateKeyHex;
  }

  /**
   * Generates a random Ed25519 private key.
   *
   * @returns A new randomly generated `Ed25519PrivateKey`.
   *
   * @example
   * ```ts
   * const key = Ed25519PrivateKey.generate();
   * ```
   */
  static generate(): Ed25519PrivateKey {
    const keyPair = ed25519.utils.randomSecretKey();
    return new Ed25519PrivateKey(keyPair, false);
  }

  /**
   * Derives an Ed25519 private key from a BIP-39 mnemonic and a SLIP-0010
   * hardened derivation path.
   *
   * @param path - A hardened derivation path, e.g. `"m/44'/637'/0'/0'/0'"`.
   * @param mnemonics - A BIP-39 mnemonic phrase.
   * @returns The derived `Ed25519PrivateKey`.
   * @throws If the derivation path is not a valid hardened path.
   *
   * @example
   * ```ts
   * const key = Ed25519PrivateKey.fromDerivationPath(
   *   "m/44'/637'/0'/0'/0'",
   *   "your twelve word mnemonic phrase here ...",
   * );
   * ```
   */
  static fromDerivationPath(path: string, mnemonics: string): Ed25519PrivateKey {
    if (!isValidHardenedPath(path)) {
      throw new Error(`Invalid derivation path ${path}`);
    }
    return Ed25519PrivateKey.fromDerivationPathInner(path, mnemonicToSeed(mnemonics));
  }

  private static fromDerivationPathInner(path: string, seed: Uint8Array, offset = HARDENED_OFFSET): Ed25519PrivateKey {
    const segments = splitPath(path).map((el) => {
      const n = parseInt(el, 10);
      if (!Number.isInteger(n) || n < 0 || n >= HARDENED_OFFSET) {
        throw new Error(`Invalid derivation path segment: ${el} (must be 0–2147483647)`);
      }
      return n;
    });
    let current = deriveKey(Ed25519PrivateKey.SLIP_0010_SEED, seed);
    for (const segment of segments) {
      const next = CKDPriv(current, segment + offset);
      current.key.fill(0);
      current.chainCode.fill(0);
      current = next;
    }
    current.chainCode.fill(0);
    try {
      return new Ed25519PrivateKey(current.key, false);
    } catch (err) {
      current.key.fill(0);
      throw err;
    }
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
      const keyBytes = this.signingKey.toUint8Array();
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
   * Derives and returns the Ed25519 public key corresponding to this private key.
   *
   * @returns The associated {@link Ed25519PublicKey}.
   * @throws If the key has been cleared.
   */
  publicKey(): Ed25519PublicKey {
    this.ensureNotCleared();
    const bytes = ed25519.getPublicKey(this.signingKey.toUint8Array());
    return new Ed25519PublicKey(bytes);
  }

  /**
   * Signs a message and returns an {@link Ed25519Signature}.
   *
   * The message is normalised via {@link convertSigningMessage} before signing
   * so that plain-text strings are UTF-8 encoded automatically.
   *
   * @param message - The message to sign, as raw bytes, a hex string, or a
   *   plain UTF-8 string.
   * @returns The resulting {@link Ed25519Signature}.
   * @throws If the key has been cleared.
   */
  sign(message: HexInput): Ed25519Signature {
    this.ensureNotCleared();
    const messageToSign = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToSign).toUint8Array();
    const signatureBytes = ed25519.sign(messageBytes, this.signingKey.toUint8Array());
    return new Ed25519Signature(signatureBytes);
  }

  /**
   * Returns the raw 32-byte private key material.
   *
   * @returns The private key as a `Uint8Array`.
   * @throws If the key has been cleared.
   */
  toUint8Array(): Uint8Array {
    this.ensureNotCleared();
    return this.signingKey.toUint8Array();
  }

  /**
   * Returns the private key as an AIP-80 formatted string (equivalent to
   * {@link toAIP80String}).
   *
   * @returns An AIP-80 string, e.g. `"ed25519-priv-0x..."`.
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
    return this.signingKey.toString();
  }

  /**
   * Returns the private key as an AIP-80 compliant string.
   *
   * @returns A string of the form `"ed25519-priv-0x<hex>"`.
   * @throws If the key has been cleared.
   */
  toAIP80String(): string {
    this.ensureNotCleared();
    return PrivateKeyUtils.formatPrivateKey(this.signingKey.toString(), PrivateKeyVariants.Ed25519);
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
   * Deserialises an `Ed25519PrivateKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Ed25519PrivateKey`.
   */
  static deserialize(deserializer: Deserializer): Ed25519PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PrivateKey(bytes, false);
  }
}

/**
 * Represents an Ed25519 signature (64 bytes).
 *
 * @example
 * ```ts
 * const sig = privateKey.sign("0xdeadbeef");
 * console.log(sig.toString()); // "0x..."
 * ```
 */
export class Ed25519Signature extends Signature {
  /** The expected byte length of an Ed25519 signature. */
  static readonly LENGTH = 64;

  private readonly data: Hex;

  /**
   * Creates an `Ed25519Signature` from raw bytes or a hex string.
   *
   * @param hexInput - A 64-byte signature as a hex string or `Uint8Array`.
   * @throws If the input is not exactly 64 bytes.
   */
  constructor(hexInput: HexInput) {
    super();
    const data = Hex.fromHexInput(hexInput);
    if (data.toUint8Array().length !== Ed25519Signature.LENGTH) {
      throw new Error(`Signature length should be ${Ed25519Signature.LENGTH}`);
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
   * Deserialises an `Ed25519Signature` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `Ed25519Signature`.
   */
  static deserialize(deserializer: Deserializer): Ed25519Signature {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519Signature(bytes);
  }
}
