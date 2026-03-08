import { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519.js";
import { PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { EphemeralPublicKeyVariant, EphemeralSignatureVariant } from "./types.js";

/**
 * A short-lived public key used during Keyless authentication.
 *
 * An `EphemeralPublicKey` wraps a concrete {@link PublicKey} (currently only
 * Ed25519 is supported) and tags it with a variant discriminant so that it can
 * be BCS-serialised as part of a {@link KeylessSignature}.
 *
 * @example
 * ```ts
 * const epk = new EphemeralPublicKey(new Ed25519PublicKey(ephemeralKeyBytes));
 * ```
 */
export class EphemeralPublicKey extends PublicKey {
  /** The underlying concrete public key. */
  public readonly publicKey: PublicKey;
  /** The variant discriminant identifying the key algorithm. */
  public readonly variant: EphemeralPublicKeyVariant;

  /**
   * Creates an `EphemeralPublicKey` wrapping the given public key.
   *
   * @param publicKey - The concrete public key to wrap.  Currently only
   *   {@link Ed25519PublicKey} is supported.
   * @throws If the provided public key type is not supported.
   */
  constructor(publicKey: PublicKey) {
    super();
    if (publicKey instanceof Ed25519PublicKey) {
      this.publicKey = publicKey;
      this.variant = EphemeralPublicKeyVariant.Ed25519;
    } else {
      throw new Error(`Unsupported key for EphemeralPublicKey - ${publicKey.constructor.name}`);
    }
  }

  /**
   * Verifies that `signature` was produced by the corresponding ephemeral
   * private key signing `message`.
   *
   * If `signature` is an {@link EphemeralSignature} the inner signature is
   * unwrapped before verification.
   *
   * @param args - Object containing `message` and `signature`.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (signature instanceof EphemeralSignature) {
      return this.publicKey.verifySignature({ message, signature: signature.signature });
    }
    return this.publicKey.verifySignature({ message, signature });
  }

  /**
   * BCS-serialises the ephemeral public key, writing a ULEB128 variant tag
   * followed by the serialised inner public key.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    if (this.publicKey instanceof Ed25519PublicKey) {
      serializer.serializeU32AsUleb128(EphemeralPublicKeyVariant.Ed25519);
      this.publicKey.serialize(serializer);
    } else {
      throw new Error("Unknown public key type");
    }
  }

  /**
   * Deserialises an `EphemeralPublicKey` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `EphemeralPublicKey`.
   * @throws If the variant index is not recognised.
   */
  static deserialize(deserializer: Deserializer): EphemeralPublicKey {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case EphemeralPublicKeyVariant.Ed25519:
        return new EphemeralPublicKey(Ed25519PublicKey.deserialize(deserializer));
      default:
        throw new Error(`Unknown variant index for EphemeralPublicKey: ${index}`);
    }
  }
}

/**
 * A short-lived signature used during Keyless authentication.
 *
 * An `EphemeralSignature` wraps a concrete {@link Signature} (currently only
 * Ed25519 is supported) and tags it with a variant discriminant for BCS
 * serialisation inside a {@link KeylessSignature}.
 *
 * @example
 * ```ts
 * const ephemeralSig = new EphemeralSignature(ed25519PrivKey.sign(message));
 * ```
 */
export class EphemeralSignature extends Signature {
  /** The underlying concrete signature. */
  public readonly signature: Signature;

  /**
   * Creates an `EphemeralSignature` wrapping the given signature.
   *
   * @param signature - The concrete signature to wrap.  Currently only
   *   {@link Ed25519Signature} is supported.
   * @throws If the provided signature type is not supported.
   */
  constructor(signature: Signature) {
    super();
    if (signature instanceof Ed25519Signature) {
      this.signature = signature;
    } else {
      throw new Error(`Unsupported signature for EphemeralSignature - ${signature.constructor.name}`);
    }
  }

  /**
   * Constructs an `EphemeralSignature` by deserialising BCS bytes supplied as
   * a hex string or `Uint8Array`.
   *
   * @param hexInput - BCS-encoded `EphemeralSignature` bytes.
   * @returns A new `EphemeralSignature`.
   */
  static fromHex(hexInput: HexInput): EphemeralSignature {
    const data = Hex.fromHexInput(hexInput);
    const deserializer = new Deserializer(data.toUint8Array());
    return EphemeralSignature.deserialize(deserializer);
  }

  /**
   * BCS-serialises the ephemeral signature, writing a ULEB128 variant tag
   * followed by the serialised inner signature.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    if (this.signature instanceof Ed25519Signature) {
      serializer.serializeU32AsUleb128(EphemeralSignatureVariant.Ed25519);
      this.signature.serialize(serializer);
    } else {
      throw new Error("Unknown signature type");
    }
  }

  /**
   * Deserialises an `EphemeralSignature` from a BCS stream.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `EphemeralSignature`.
   * @throws If the variant index is not recognised.
   */
  static deserialize(deserializer: Deserializer): EphemeralSignature {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case EphemeralSignatureVariant.Ed25519:
        return new EphemeralSignature(Ed25519Signature.deserialize(deserializer));
      default:
        throw new Error(`Unknown variant index for EphemeralSignature: ${index}`);
    }
  }
}
