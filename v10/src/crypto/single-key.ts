import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519.js";
import { AccountPublicKey, createAuthKey, type PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Secp256k1PublicKey, Secp256k1Signature } from "./secp256k1.js";
import { Secp256r1PublicKey, WebAuthnSignature } from "./secp256r1.js";
import { Signature } from "./signature.js";
import { AnyPublicKeyVariant, AnySignatureVariant, SigningScheme } from "./types.js";

/** Lazy-loaded constructor interface for public key types, to break circular deps. */
interface LazyPublicKeyClass {
  new (...args: never[]): PublicKey;
  deserialize(d: Deserializer): PublicKey;
}

/** Lazy-loaded constructor interface for signature types, to break circular deps. */
interface LazySignatureClass {
  new (...args: never[]): Signature;
  deserialize(d: Deserializer): Signature;
}

// Forward-declared types to avoid circular dependencies.
// Keyless/FederatedKeyless are imported lazily at deserialization time.
let _KeylessPublicKey: LazyPublicKeyClass | undefined;
let _FederatedKeylessPublicKey: LazyPublicKeyClass | undefined;
let _KeylessSignature: LazySignatureClass | undefined;

/**
 * Registers the Keyless and FederatedKeyless public-key and signature types
 * with the `AnyPublicKey` / `AnySignature` deserialisers.
 *
 * This function must be called once during module initialisation (it is called
 * automatically when the `crypto` index module is imported) to break the
 * circular dependency between `single-key.ts` and `keyless.ts`.
 *
 * @param keylessPubKey - The `KeylessPublicKey` class.
 * @param federatedKeylessPubKey - The `FederatedKeylessPublicKey` class.
 * @param keylessSig - The `KeylessSignature` class.
 */
export function registerKeylessTypes(
  keylessPubKey: LazyPublicKeyClass,
  federatedKeylessPubKey: LazyPublicKeyClass,
  keylessSig: LazySignatureClass,
) {
  _KeylessPublicKey = keylessPubKey;
  _FederatedKeylessPublicKey = federatedKeylessPubKey;
  _KeylessSignature = keylessSig;
}

/**
 * Union type of the private key classes that can be used with `SingleKey`
 * accounts.
 */
export type PrivateKeyInput = import("./ed25519.js").Ed25519PrivateKey | import("./secp256k1.js").Secp256k1PrivateKey;

/**
 * A type-tagged wrapper around any concrete {@link PublicKey}, used with the
 * `SingleKey` authenticator on Aptos.
 *
 * `AnyPublicKey` is serialised as a ULEB128 variant index followed by the
 * inner public key bytes, allowing the on-chain verifier to dispatch to the
 * correct algorithm.
 *
 * @example
 * ```ts
 * const anyPubKey = new AnyPublicKey(new Ed25519PublicKey(keyBytes));
 * const authKey = anyPubKey.authKey();
 * ```
 */
export class AnyPublicKey extends AccountPublicKey {
  /** The underlying concrete public key. */
  public readonly publicKey: PublicKey;
  /** The variant discriminant identifying the key algorithm. */
  public readonly variant: AnyPublicKeyVariant;

  /**
   * Creates an `AnyPublicKey` wrapping the given concrete public key.
   *
   * The variant is inferred automatically from the key's runtime type.
   *
   * @param publicKey - The concrete public key to wrap.
   * @throws If the public key type is not one of the supported variants
   *   (Ed25519, Secp256k1, Secp256r1, Keyless, FederatedKeyless).
   */
  constructor(publicKey: PublicKey) {
    super();
    this.publicKey = publicKey;
    if (publicKey instanceof Ed25519PublicKey) {
      this.variant = AnyPublicKeyVariant.Ed25519;
    } else if (publicKey instanceof Secp256k1PublicKey) {
      this.variant = AnyPublicKeyVariant.Secp256k1;
    } else if (publicKey instanceof Secp256r1PublicKey) {
      this.variant = AnyPublicKeyVariant.Secp256r1;
    } else if (_KeylessPublicKey && publicKey instanceof _KeylessPublicKey) {
      this.variant = AnyPublicKeyVariant.Keyless;
    } else if (_FederatedKeylessPublicKey && publicKey instanceof _FederatedKeylessPublicKey) {
      this.variant = AnyPublicKeyVariant.FederatedKeyless;
    } else {
      throw new Error("Unsupported public key type");
    }
  }

  /**
   * Verifies that `signature` was produced by the corresponding private key
   * signing `message`.
   *
   * If the inner key is a Keyless key, verification is asynchronous and this
   * synchronous method throws — use `verifySignatureAsync` instead.
   *
   * @param args - Object containing `message` and `signature`.
   * @returns `true` if the signature is valid, `false` otherwise.
   * @throws If the inner key is a Keyless key.
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (_KeylessPublicKey && this.publicKey instanceof _KeylessPublicKey) {
      throw new Error("Use verifySignatureAsync to verify Keyless signatures");
    }
    if (signature instanceof AnySignature) {
      return this.publicKey.verifySignature({ message, signature: signature.signature });
    }
    return this.publicKey.verifySignature({ message, signature });
  }

  /**
   * Derives the on-chain authentication key using the `SingleKey` signing
   * scheme.
   *
   * @returns The `AccountAddress` representing the authentication key.
   */
  authKey(): unknown {
    return createAuthKey(SigningScheme.SingleKey, this.bcsToBytes());
  }

  /**
   * Returns the BCS-serialised bytes of this `AnyPublicKey`.
   *
   * @returns The serialised public key as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * BCS-serialises the `AnyPublicKey` by writing the ULEB128 variant index
   * followed by the inner public key bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.variant);
    this.publicKey.serialize(serializer);
  }

  /**
   * Deserialises an `AnyPublicKey` from a BCS stream.
   *
   * The variant index determines which concrete public-key type to deserialise.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `AnyPublicKey`.
   * @throws If the variant index is not recognised, or if the required Keyless
   *   types have not been registered via {@link registerKeylessTypes}.
   */
  static deserialize(deserializer: Deserializer): AnyPublicKey {
    const variantIndex = deserializer.deserializeUleb128AsU32();
    let publicKey: PublicKey;
    switch (variantIndex) {
      case AnyPublicKeyVariant.Ed25519:
        publicKey = Ed25519PublicKey.deserialize(deserializer);
        break;
      case AnyPublicKeyVariant.Secp256k1:
        publicKey = Secp256k1PublicKey.deserialize(deserializer);
        break;
      case AnyPublicKeyVariant.Secp256r1:
        publicKey = Secp256r1PublicKey.deserialize(deserializer);
        break;
      case AnyPublicKeyVariant.Keyless:
        if (!_KeylessPublicKey) throw new Error("KeylessPublicKey not registered");
        publicKey = _KeylessPublicKey.deserialize(deserializer);
        break;
      case AnyPublicKeyVariant.FederatedKeyless:
        if (!_FederatedKeylessPublicKey) throw new Error("FederatedKeylessPublicKey not registered");
        publicKey = _FederatedKeylessPublicKey.deserialize(deserializer);
        break;
      default:
        throw new Error(`Unknown variant index for AnyPublicKey: ${variantIndex}`);
    }
    return new AnyPublicKey(publicKey);
  }
}

/**
 * A type-tagged wrapper around any concrete {@link Signature}, used with the
 * `SingleKey` (and `MultiKey`) authenticator on Aptos.
 *
 * `AnySignature` is serialised as a ULEB128 variant index followed by the
 * inner signature bytes, allowing the on-chain verifier to dispatch to the
 * correct algorithm.
 *
 * @example
 * ```ts
 * const anySig = new AnySignature(ed25519Sig);
 * ```
 */
export class AnySignature extends Signature {
  /** The underlying concrete signature. */
  public readonly signature: Signature;
  private readonly variant: AnySignatureVariant;

  /**
   * Creates an `AnySignature` wrapping the given concrete signature.
   *
   * The variant is inferred automatically from the signature's runtime type.
   *
   * @param signature - The concrete signature to wrap.
   * @throws If the signature type is not one of the supported variants
   *   (Ed25519, Secp256k1, WebAuthn, Keyless).
   */
  constructor(signature: Signature) {
    super();
    this.signature = signature;
    if (signature instanceof Ed25519Signature) {
      this.variant = AnySignatureVariant.Ed25519;
    } else if (signature instanceof Secp256k1Signature) {
      this.variant = AnySignatureVariant.Secp256k1;
    } else if (signature instanceof WebAuthnSignature) {
      this.variant = AnySignatureVariant.WebAuthn;
    } else if (_KeylessSignature && signature instanceof _KeylessSignature) {
      this.variant = AnySignatureVariant.Keyless;
    } else {
      throw new Error("Unsupported signature type");
    }
  }

  /**
   * Returns the BCS-serialised bytes of this `AnySignature`.
   *
   * @returns The serialised signature as a `Uint8Array`.
   */
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * BCS-serialises the `AnySignature` by writing the ULEB128 variant index
   * followed by the inner signature bytes.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.variant);
    this.signature.serialize(serializer);
  }

  /**
   * Deserialises an `AnySignature` from a BCS stream.
   *
   * The variant index determines which concrete signature type to deserialise.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `AnySignature`.
   * @throws If the variant index is not recognised, or if the Keyless signature
   *   type has not been registered via {@link registerKeylessTypes}.
   */
  static deserialize(deserializer: Deserializer): AnySignature {
    const variantIndex = deserializer.deserializeUleb128AsU32();
    let signature: Signature;
    switch (variantIndex) {
      case AnySignatureVariant.Ed25519:
        signature = Ed25519Signature.deserialize(deserializer);
        break;
      case AnySignatureVariant.Secp256k1:
        signature = Secp256k1Signature.deserialize(deserializer);
        break;
      case AnySignatureVariant.WebAuthn:
        signature = WebAuthnSignature.deserialize(deserializer);
        break;
      case AnySignatureVariant.Keyless:
        if (!_KeylessSignature) throw new Error("KeylessSignature not registered");
        signature = _KeylessSignature.deserialize(deserializer);
        break;
      default:
        throw new Error(`Unknown variant index for AnySignature: ${variantIndex}`);
    }
    return new AnySignature(signature);
  }
}
