import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import { Hex, type HexInput } from "../hex/index.js";
import { AccountPublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";

/**
 * A generic signature container used for account abstraction.
 *
 * `AbstractSignature` stores arbitrary bytes that represent a signature
 * produced by an abstracted account (e.g. a smart-contract account that
 * implements its own verification logic).
 *
 * @example
 * ```ts
 * const sig = new AbstractSignature(signatureBytes);
 * ```
 */
export class AbstractSignature extends Signature {
  /** The raw signature bytes. */
  readonly value: Uint8Array;

  /**
   * Creates an `AbstractSignature` from raw bytes or a hex string.
   *
   * @param value - The signature data as a hex string or `Uint8Array`.
   */
  constructor(value: HexInput) {
    super();
    this.value = Hex.fromHexInput(value).toUint8Array();
  }

  /**
   * BCS-serialises the signature by writing its bytes with a length prefix.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeBytes(this.value);
  }

  /**
   * Deserialises an `AbstractSignature` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `AbstractSignature`.
   */
  static deserialize(deserializer: Deserializer): AbstractSignature {
    return new AbstractSignature(deserializer.deserializeBytes());
  }
}

/**
 * A placeholder public key for account abstraction (smart-contract accounts).
 *
 * `AbstractPublicKey` stores the account address rather than a traditional
 * cryptographic public key, because abstracted accounts authenticate via
 * on-chain Move logic rather than a fixed signing algorithm.
 *
 * @example
 * ```ts
 * const pubKey = new AbstractPublicKey(accountAddress);
 * ```
 */
export class AbstractPublicKey extends AccountPublicKey {
  /** The account address — typed as `unknown` because AccountAddress is in core (L2). */
  readonly accountAddress: unknown;

  /**
   * Creates an `AbstractPublicKey` from an account address.
   *
   * @param accountAddress - The `AccountAddress` associated with this abstract
   *   account.  Typed as `unknown` to avoid a circular dependency with the
   *   `core` package.
   */
  constructor(accountAddress: unknown) {
    super();
    this.accountAddress = accountAddress;
  }

  /**
   * Not implemented for abstracted accounts.
   *
   * @throws Always throws indicating that the `core` module must be ported first.
   */
  authKey(): unknown {
    throw new Error("authKey() not yet available; port the core module first");
  }

  /**
   * Not implemented for abstracted accounts.
   *
   * Abstracted accounts perform signature verification on-chain in Move.
   *
   * @throws Always throws.
   */
  verifySignature(_args: VerifySignatureArgs): boolean {
    throw new Error("This function is not implemented for AbstractPublicKey.");
  }

  /**
   * Not implemented for abstracted accounts.
   *
   * @throws Always throws.
   */
  serialize(_serializer: Serializer): void {
    throw new Error("This function is not implemented for AbstractPublicKey.");
  }
}
