import { Serializable } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import type { Signature } from "./signature.js";

/**
 * Arguments passed to {@link PublicKey.verifySignature}.
 */
export interface VerifySignatureArgs {
  /** The original message that was signed, as hex bytes or a `HexInput`. */
  message: HexInput;
  /** The signature to verify against this public key. */
  signature: Signature;
}

/**
 * Abstract base class for all public keys in the SDK.
 *
 * Concrete subclasses must implement {@link verifySignature} and the BCS
 * `serialize` method inherited from {@link Serializable}.
 */
export abstract class PublicKey extends Serializable {
  /**
   * Verifies that a signature was produced by the private key corresponding
   * to this public key.
   *
   * @param args - An object containing the `message` and `signature` to verify.
   * @returns `true` if the signature is valid for the given message, `false` otherwise.
   */
  abstract verifySignature(args: VerifySignatureArgs): boolean;

  /**
   * Returns the raw byte representation of the public key.
   *
   * The default implementation serialises via BCS.  Subclasses may override
   * this to return a more efficient encoding.
   *
   * @returns The public key as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * Returns a hex-encoded string representation of the public key.
   *
   * @returns A `0x`-prefixed hex string of the public key bytes.
   */
  toString(): string {
    const bytes = this.toUint8Array();
    return Hex.fromHexInput(bytes).toString();
  }
}

// ── Auth key derivation (registered by core module to break circular dep) ──

type AuthKeyFactory = (scheme: number, publicKeyBytes: Uint8Array) => unknown;
let _authKeyFactory: AuthKeyFactory | null = null;

/**
 * Registers the authentication-key factory function used by {@link createAuthKey}.
 *
 * This function is called once during module initialisation by the `core`
 * package to inject the `AccountAddress`-based factory without creating a
 * circular dependency between the `crypto` and `core` packages.
 *
 * @param factory - A function that accepts a signing `scheme` discriminant and
 *   the raw `publicKeyBytes`, and returns an `AccountAddress` (or equivalent).
 */
export function registerAuthKeyFactory(factory: AuthKeyFactory): void {
  _authKeyFactory = factory;
}

/**
 * Creates an authentication key for the given signing scheme and public key bytes.
 *
 * Delegates to the factory registered via {@link registerAuthKeyFactory}.
 * Throws if the factory has not been registered yet (i.e. the `core` module
 * has not been imported).
 *
 * @param scheme - The numeric {@link SigningScheme} discriminant.
 * @param publicKeyBytes - The raw bytes of the public key.
 * @returns An `AccountAddress` representing the authentication key.
 * @throws If the auth-key factory has not been registered.
 */
export function createAuthKey(scheme: number, publicKeyBytes: Uint8Array): unknown {
  if (!_authKeyFactory) {
    throw new Error("AuthKey factory not registered. Import core module first.");
  }
  return _authKeyFactory(scheme, publicKeyBytes);
}

/**
 * Abstract base class for public keys that can derive an on-chain
 * authentication key (i.e. keys that can be the root of an Aptos account).
 *
 * Extends {@link PublicKey} with an {@link authKey} method.
 */
export abstract class AccountPublicKey extends PublicKey {
  /**
   * Derives the on-chain authentication key associated with this public key.
   *
   * @returns The `AccountAddress` that serves as the authentication key for
   *   this public key.
   */
  abstract authKey(): unknown;
}
