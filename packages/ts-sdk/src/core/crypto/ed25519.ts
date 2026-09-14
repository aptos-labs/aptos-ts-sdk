// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { ed25519 } from "@noble/curves/ed25519.js";
import { Deserializer } from "../../bcs/deserializer.js";
import { Serializable, Serializer } from "../../bcs/serializer.js";
import { AuthenticationKey } from "../authenticationKey.js";
import { Hex } from "../hex.js";
import { HexInput, SigningScheme as AuthenticationKeyScheme, PrivateKeyVariants } from "../../types/index.js";
import { CKDPriv, deriveKey, HARDENED_OFFSET, isValidHardenedPath, mnemonicToSeed, splitPath } from "./hdKey.js";
import { PrivateKey } from "./privateKey.js";
import { AccountPublicKey, PublicKey, VerifySignatureArgs, VerifySignatureAsyncArgs } from "./publicKey.js";
import { Signature } from "./signature.js";
import { TEXT_ENCODER } from "../../utils/const.js";
import { convertSigningMessage } from "./utils.js";

/**
 * L is the value that greater than or equal to will produce a non-canonical signature, and must be rejected
 * @group Implementation
 * @category Serialization
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
 * @group Implementation
 * @category Serialization
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
 * @group Implementation
 * @category Serialization
 */
export class Ed25519PublicKey extends AccountPublicKey {
  /**
   * Length of an Ed25519 public key
   * @group Implementation
   * @category Serialization
   */
  static readonly LENGTH: number = 32;

  /**
   * Bytes of the public key
   * @private
   * @group Implementation
   * @category Serialization
   */
  private readonly key: Hex;

  /**
   * Creates an instance of the Ed25519Signature class from a hex input.
   * This constructor validates the length of the signature to ensure it meets the required specifications.
   *
   * @param hexInput - The hex input representing the Ed25519 signature.
   * @throws Error if the signature length is not equal to Ed25519Signature.LENGTH.
   * @group Implementation
   * @category Serialization
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
   * Verifies a signature against the exact bytes of `message`. This is the
   * unambiguous form — the input is interpreted as raw bytes regardless of
   * what they encode. Pair with {@link Ed25519PrivateKey.signBytes}.
   *
   * Performs an Ed25519 malleability check (rejects non-canonical S values)
   * before delegating to the underlying curve verifier.
   *
   * @param args - The arguments for verification.
   * @param args.message - The exact bytes that were signed.
   * @param args.signature - The signature to verify.
   * @group Implementation
   * @category Serialization
   */
  verifyBytes(args: { message: Uint8Array; signature: Signature }): boolean {
    const { message, signature } = args;
    if (!isCanonicalEd25519Signature(signature)) {
      return false;
    }
    return ed25519.verify(signature.toUint8Array(), message, this.key.toUint8Array());
  }

  /**
   * Verifies a signature against the UTF-8 encoding of `message`. The input
   * is always treated as text — there is no hex/text heuristic. Pair with
   * {@link Ed25519PrivateKey.signText}.
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
   * Verifies a signed message using a public key.
   *
   * @deprecated The polymorphic `message: HexInput` input is ambiguous — a
   * bare even-length string of hex characters (e.g., `"cafe"`) is
   * interpreted as the 2 bytes `[0xCA, 0xFE]`, not as 4 UTF-8 text bytes.
   * Use {@link verifyBytes} for `Uint8Array` input or {@link verifyText}
   * for `string` input; both are unambiguous. See
   * {@link convertSigningMessage} for the full legacy rule.
   *
   * @param args - The arguments for verification.
   * @param args.message - A signed message as a Hex string or Uint8Array.
   * @param args.signature - The signature of the message.
   * @group Implementation
   * @category Serialization
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    const messageToVerify = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToVerify).toUint8Array();
    return this.verifyBytes({ message: messageBytes, signature });
  }

  /**
   * Note: Ed25519Signatures can be verified syncronously.
   *
   * Verifies the provided signature against the given message.
   * This function helps ensure the integrity and authenticity of the message by confirming that the signature is valid.
   *
   * @param args - The arguments for signature verification.
   * @param args.aptosConfig - The configuration object for connecting to the Aptos network
   * @param args.message - The message that was signed.
   * @param args.signature - The signature to verify, which must be an instance of Secp256k1Signature.
   * @returns A boolean indicating whether the signature is valid for the given message.
   * @group Implementation
   * @category Serialization
   */
  async verifySignatureAsync(args: VerifySignatureAsyncArgs): Promise<boolean> {
    return this.verifySignature(args);
  }

  /**
   * Generates an authentication key from the public key using the Ed25519 scheme.
   * This function is essential for creating a secure authentication key that can be used for further cryptographic operations.
   *
   * @returns {AuthenticationKey} The generated authentication key.
   * @group Implementation
   * @category Serialization
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
   * This allows for the conversion of data into a format suitable for transmission or storage.
   *
   * @param serializer - The serializer instance used to perform the serialization.
   * @group Implementation
   * @category Serialization
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.key.toUint8Array());
  }

  /**
   * Deserialize bytes into an Ed25519Signature object.
   * This function is used to convert serialized byte data into a usable Ed25519Signature instance.
   *
   * @param deserializer - The deserializer instance used to read the byte data.
   * @group Implementation
   * @category Serialization
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
   * @group Implementation
   * @category Serialization
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
   * @group Implementation
   * @category Serialization
   */
  static isInstance(publicKey: PublicKey): publicKey is Ed25519PublicKey {
    return (
      "key" in publicKey &&
      typeof publicKey.key === "object" &&
      publicKey.key !== null &&
      "data" in publicKey.key &&
      typeof publicKey.key.data === "object" &&
      publicKey.key.data !== null &&
      "length" in publicKey.key.data &&
      publicKey.key?.data?.length === Ed25519PublicKey.LENGTH
    );
  }
}

/**
 * Represents the private key of an Ed25519 key pair.
 * @group Implementation
 * @category Serialization
 */
export class Ed25519PrivateKey extends Serializable implements PrivateKey {
  /**
   * Length of an Ed25519 private key
   * @group Implementation
   * @category Serialization
   */
  static readonly LENGTH: number = 32;

  /**
   * The Ed25519 key seed to use for BIP-32 compatibility
   * See more {@link https://github.com/satoshilabs/slips/blob/master/slip-0010.md}
   * @group Implementation
   * @category Serialization
   */
  static readonly SLIP_0010_SEED = "ed25519 seed";

  /**
   * The Ed25519 signing key
   * @private
   * @group Implementation
   * @category Serialization
   */
  private signingKey: Hex;

  /**
   * Whether the key has been cleared from memory
   * @private
   */
  private cleared: boolean = false;

  // region Constructors

  /**
   * Create a new PrivateKey instance from a Uint8Array or String.
   *
   * [Read about AIP-80](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md)
   *
   * @param hexInput HexInput (string or Uint8Array)
   * @param strict If true, private key must AIP-80 compliant.
   * @group Implementation
   * @category Serialization
   */
  constructor(hexInput: HexInput, strict?: boolean) {
    super();

    const privateKeyHex = PrivateKey.parseHexInput(hexInput, PrivateKeyVariants.Ed25519, strict);
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
   * @group Implementation
   * @category Serialization
   */
  static generate(): Ed25519PrivateKey {
    const keyPair = ed25519.utils.randomSecretKey();
    return new Ed25519PrivateKey(keyPair, false);
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
   * @group Implementation
   * @category Serialization
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
   * @group Implementation
   * @category Serialization
   */
  private static fromDerivationPathInner(path: string, seed: Uint8Array, offset = HARDENED_OFFSET): Ed25519PrivateKey {
    const { key, chainCode } = deriveKey(Ed25519PrivateKey.SLIP_0010_SEED, seed);

    const segments = splitPath(path).map((el) => parseInt(el, 10));

    // Derive the child key based on the path
    const { key: privateKey } = segments.reduce((parentKeys, segment) => CKDPriv(parentKeys, segment + offset), {
      key,
      chainCode,
    });
    return new Ed25519PrivateKey(privateKey, false);
  }

  // endregion

  // region PrivateKey

  /**
   * Checks if the key has been cleared and throws an error if so.
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
   * zeroization guarantee. In JavaScript, four classes of copies cannot be
   * reached from user code and so survive `clear()`:
   *
   *   1. **JS string copies.** Any value previously produced by `toString()`,
   *      `toHexString()`, or `bcsToHex().toString()` is an immutable string
   *      in the heap. The language provides no API to overwrite string
   *      memory; it is reclaimed only when GC collects it.
   *   2. **noble-curves internals.** The sign path inside `@noble/curves`
   *      expands the private key into scalar `BigInt` field elements, which
   *      are also immutable in V8/JSC/Hermes. Even if noble explicitly zeroed
   *      its own byte copies after use, the `BigInt` intermediates persist.
   *   3. **JIT register / stack residue.** The engine may have held key
   *      bytes in CPU registers or on the engine stack during a sign call.
   *      There is no JS-visible way to scrub those.
   *   4. **GC-relocated copies.** Generational GCs (V8, JSC) copy live
   *      objects between heap regions during minor/major collections. The
   *      `Uint8Array` we zeroed may have stale copies sitting in survivor
   *      space until the next cycle reclaims them.
   *
   * This method zeros the SDK's own `Uint8Array` (the most reachable
   * copy), but downstream consumers should treat it as a hardening signal,
   * not a guarantee. If you need real key-material hygiene, prefer
   * non-extractable `crypto.subtle` keys (where the underlying algorithm
   * is supported by the host runtime), a WASM-backed crypto library, or
   * hardware-backed keys (passkeys / secure enclave / HSM).
   *
   * To minimize the size of the unreachable-copy set, avoid calling
   * `toString()` / `toHexString()` on private keys at all in long-lived
   * processes — the byte form is what gets cleared.
   *
   * @group Implementation
   * @category Serialization
   */
  clear(): void {
    if (!this.cleared) {
      const keyBytes = this.signingKey.toUint8Array();
      // Multiple overwrite passes for better security
      // Pass 1: Random data
      crypto.getRandomValues(keyBytes);
      // Pass 2: Ones pattern (0xFF)
      keyBytes.fill(0xff);
      // Pass 3: Random data again
      crypto.getRandomValues(keyBytes);
      // Pass 4: Zeros pattern (final state)
      keyBytes.fill(0);
      this.cleared = true;
    }
  }

  /**
   * Returns whether the private key has been cleared from memory.
   *
   * @returns true if the key has been cleared, false otherwise
   * @group Implementation
   * @category Serialization
   */
  isCleared(): boolean {
    return this.cleared;
  }

  /**
   * Derive the Ed25519PublicKey for this private key.
   *
   * @returns Ed25519PublicKey - The derived public key corresponding to the private key.
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  publicKey(): Ed25519PublicKey {
    this.ensureNotCleared();
    const bytes = ed25519.getPublicKey(this.signingKey.toUint8Array());
    return new Ed25519PublicKey(bytes);
  }

  /**
   * Sign exactly the bytes of `message`. The input is interpreted as raw
   * bytes regardless of what they encode. Pair with
   * {@link Ed25519PublicKey.verifyBytes}.
   *
   * @param message - The exact bytes to sign.
   * @returns A digital signature for the provided bytes.
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  signBytes(message: Uint8Array): Ed25519Signature {
    this.ensureNotCleared();
    const signatureBytes = ed25519.sign(message, this.signingKey.toUint8Array());
    return new Ed25519Signature(signatureBytes);
  }

  /**
   * Sign the UTF-8 encoding of `message`. The input is always treated as
   * text — there is no hex/text heuristic. Pair with
   * {@link Ed25519PublicKey.verifyText}.
   *
   * @param message - The text to sign.
   * @returns A digital signature for the UTF-8 bytes of the provided text.
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  signText(message: string): Ed25519Signature {
    return this.signBytes(TEXT_ENCODER.encode(message));
  }

  /**
   * Sign the given message with the private key.
   * This function generates a digital signature for the specified message, ensuring its authenticity and integrity.
   *
   * @deprecated The polymorphic `message: HexInput` input is ambiguous — a
   * bare even-length string of hex characters (e.g., `"cafe"`) is signed
   * as the 2 bytes `[0xCA, 0xFE]`, not as 4 UTF-8 text bytes. Use
   * {@link signBytes} for `Uint8Array` input or {@link signText} for
   * `string` input; both are unambiguous. See
   * {@link convertSigningMessage} for the full legacy rule.
   *
   * @param message - A message as a string or Uint8Array in HexInput format.
   * @returns A digital signature for the provided message.
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  sign(message: HexInput): Ed25519Signature {
    const messageToSign = convertSigningMessage(message);
    const messageBytes = Hex.fromHexInput(messageToSign).toUint8Array();
    return this.signBytes(messageBytes);
  }

  /**
   * Get the private key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the private key
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  toUint8Array(): Uint8Array {
    this.ensureNotCleared();
    return this.signingKey.toUint8Array();
  }

  /**
   * Get the private key as a hex string with the 0x prefix.
   *
   * SECURITY: This produces an immutable JS string containing the key
   * material in hex. Strings cannot be zeroed by `clear()` (see the
   * `clear()` JSDoc for the four classes of unreachable copies). Avoid
   * calling this method on long-lived `Ed25519PrivateKey` instances in
   * processes where memory hygiene matters; prefer `toUint8Array()`,
   * which returns a clearable `Uint8Array`.
   *
   * @returns string representation of the private key.
   * @throws Error if the private key has been cleared from memory.
   * @group Implementation
   * @category Serialization
   */
  toString(): string {
    this.ensureNotCleared();
    return this.toAIP80String();
  }

  /**
   * Get the private key as a hex string with the 0x prefix.
   *
   * SECURITY: Same caveat as `toString()` — the returned string is an
   * immutable JS heap allocation that `clear()` cannot zero.
   *
   * @returns string representation of the private key.
   * @throws Error if the private key has been cleared from memory.
   */
  toHexString(): string {
    this.ensureNotCleared();
    return this.signingKey.toString();
  }

  /**
   * Get the private key as a AIP-80 compliant hex string.
   *
   * [Read about AIP-80](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md)
   *
   * SECURITY: Same caveat as `toString()` — produces an immutable JS string
   * containing the key material; cannot be zeroed by `clear()`.
   *
   * @returns AIP-80 compliant string representation of the private key.
   * @throws Error if the private key has been cleared from memory.
   */
  toAIP80String(): string {
    this.ensureNotCleared();
    return PrivateKey.formatPrivateKey(this.signingKey.toString(), PrivateKeyVariants.Ed25519);
  }

  // endregion

  // region Serializable

  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.toUint8Array());
  }

  static deserialize(deserializer: Deserializer): Ed25519PrivateKey {
    const bytes = deserializer.deserializeBytes();
    return new Ed25519PrivateKey(bytes, false);
  }

  // endregion

  /**
   * Determines if the provided private key is an instance of Ed25519PrivateKey.
   *
   * @param privateKey - The private key to check.
   * @returns A boolean indicating whether the private key is an Ed25519PrivateKey.
   *
   * @deprecated Use `instanceof Ed25519PrivateKey` instead.
   * @group Implementation
   * @category Serialization
   */
  static isPrivateKey(privateKey: PrivateKey): privateKey is Ed25519PrivateKey {
    return privateKey instanceof Ed25519PrivateKey;
  }
}

/**
 * Represents a signature of a message signed using an Ed25519 private key.
 * @group Implementation
 * @category Serialization
 */
export class Ed25519Signature extends Signature {
  /**
   * Length of an Ed25519 signature, which is 64 bytes.
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
