import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { KeylessPublicKey } from "./keyless.js";
import { AccountPublicKey, type PublicKey, type VerifySignatureArgs } from "./public-key.js";

/** Lazy-loaded interface for AccountAddress to break circular deps between crypto and core. */
interface LazyAccountAddressClass {
  from(input: unknown): { serialize(s: Serializer): void };
  deserialize(d: Deserializer): unknown;
}

// Forward-declared: AccountAddress lives in core (L2), so we use lazy registration.
// registerAccountAddressForKeyless() is called from core/index.ts during module init.
let _AccountAddress: LazyAccountAddressClass | undefined;

/**
 * Registers the `AccountAddress` class with the federated-keyless module.
 *
 * This function is called once during module initialisation by the `core`
 * package so that `FederatedKeylessPublicKey` can serialise and deserialise
 * the `jwkAddress` field without a circular dependency between `crypto` and
 * `core`.
 *
 * @param accountAddress - The `AccountAddress` class (or compatible
 *   constructor) from the `core` package.
 */
export function registerAccountAddressForKeyless(accountAddress: LazyAccountAddressClass): void {
  _AccountAddress = accountAddress;
}

/**
 * The public key for a Federated Keyless account.
 *
 * A `FederatedKeylessPublicKey` extends the standard {@link KeylessPublicKey}
 * by associating it with a specific on-chain address (`jwkAddress`) that holds
 * the JWK set used to verify the OIDC provider's tokens.  This allows
 * organisations to host their own JWK endpoint as a Move resource.
 *
 * Like {@link KeylessPublicKey}, signature verification is asynchronous; the
 * synchronous {@link verifySignature} method always throws.
 *
 * @example
 * ```ts
 * const pubKey = FederatedKeylessPublicKey.create({
 *   iss: "https://accounts.google.com",
 *   uidKey: "sub",
 *   uidVal: "1234567890",
 *   aud: "my-app-client-id",
 *   pepper: pepperBytes,
 *   jwkAddress: "0x<jwk-resource-account>",
 * });
 * ```
 */
export class FederatedKeylessPublicKey extends AccountPublicKey {
  /** The address that contains the JWK set to be used for verification. */
  readonly jwkAddress: unknown; // AccountAddress at runtime

  /** The inner public key which contains the standard Keyless public key. */
  readonly keylessPublicKey: KeylessPublicKey;

  /**
   * Creates a `FederatedKeylessPublicKey`.
   *
   * @param jwkAddress - The on-chain address of the JWK resource.  May be
   *   an `AccountAddress` instance, a hex string, or any value accepted by
   *   `AccountAddress.from`.
   * @param keylessPublicKey - The inner {@link KeylessPublicKey}.
   */
  constructor(jwkAddress: unknown, keylessPublicKey: KeylessPublicKey) {
    super();
    if (_AccountAddress) {
      this.jwkAddress = _AccountAddress.from(jwkAddress);
    } else {
      this.jwkAddress = jwkAddress;
    }
    this.keylessPublicKey = keylessPublicKey;
  }

  /**
   * Not supported for Federated Keyless keys — auth keys are derived through
   * `AnyPublicKey` wrapping.
   *
   * @throws Always throws.
   */
  authKey(): unknown {
    // FederatedKeyless keys are wrapped in AnyPublicKey for on-chain use;
    // the auth key is derived via the SingleKey scheme by the caller.
    throw new Error("FederatedKeyless auth keys are derived through AnyPublicKey wrapping");
  }

  /**
   * Not supported synchronously — use `verifySignatureAsync` instead.
   *
   * @throws Always throws.
   */
  verifySignature(_args: VerifySignatureArgs): boolean {
    throw new Error("Use verifySignatureAsync to verify FederatedKeyless signatures");
  }

  /**
   * BCS-serialises the public key by writing the JWK address followed by the
   * inner Keyless public key.
   *
   * @param serializer - The BCS serializer to write into.
   * @throws If `AccountAddress` has not been registered via
   *   {@link registerAccountAddressForKeyless}.
   */
  serialize(serializer: Serializer): void {
    if (!_AccountAddress) {
      throw new Error("AccountAddress not registered. Import core module first.");
    }
    (this.jwkAddress as { serialize(s: Serializer): void }).serialize(serializer);
    this.keylessPublicKey.serialize(serializer);
  }

  /**
   * Deserialises a `FederatedKeylessPublicKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `FederatedKeylessPublicKey`.
   * @throws If `AccountAddress` has not been registered via
   *   {@link registerAccountAddressForKeyless}.
   */
  static deserialize(deserializer: Deserializer): FederatedKeylessPublicKey {
    if (!_AccountAddress) {
      throw new Error("AccountAddress not registered. Import core module first.");
    }
    const jwkAddress = _AccountAddress.deserialize(deserializer);
    const keylessPublicKey = KeylessPublicKey.deserialize(deserializer);
    return new FederatedKeylessPublicKey(jwkAddress, keylessPublicKey);
  }

  /**
   * Convenience factory that creates a `FederatedKeylessPublicKey` by
   * computing the identity commitment from the provided JWT claims and pepper.
   *
   * @param args - The JWT identity parameters and JWK address.
   * @param args.iss - The OIDC issuer URL.
   * @param args.uidKey - The JWT claim name used as the user identifier.
   * @param args.uidVal - The value of the UID claim.
   * @param args.aud - The `aud` (audience) claim.
   * @param args.pepper - The secret pepper bytes.
   * @param args.jwkAddress - The on-chain address of the JWK resource.
   * @returns A new `FederatedKeylessPublicKey`.
   */
  static create(args: {
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    jwkAddress: unknown;
  }): FederatedKeylessPublicKey {
    return new FederatedKeylessPublicKey(args.jwkAddress, KeylessPublicKey.create(args));
  }

  /**
   * Duck-type check that returns `true` if `publicKey` has the shape of a
   * `FederatedKeylessPublicKey`.
   *
   * @param publicKey - The public key to inspect.
   * @returns `true` if the key looks like a `FederatedKeylessPublicKey`.
   */
  static isInstance(publicKey: PublicKey) {
    return (
      "jwkAddress" in publicKey &&
      "keylessPublicKey" in publicKey &&
      publicKey.keylessPublicKey instanceof KeylessPublicKey
    );
  }
}
