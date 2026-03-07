import type { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519.js";
import { AccountPublicKey, createAuthKey, type PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Secp256k1PublicKey, Secp256k1Signature } from "./secp256k1.js";
import { Secp256r1PublicKey, WebAuthnSignature } from "./secp256r1.js";
import { Signature } from "./signature.js";
import { AnyPublicKeyVariant, AnySignatureVariant, SigningScheme } from "./types.js";

// Forward-declared types to avoid circular dependencies.
// Keyless/FederatedKeyless are imported lazily at deserialization time.
let _KeylessPublicKey: any;
let _FederatedKeylessPublicKey: any;
let _KeylessSignature: any;

export function registerKeylessTypes(keylessPubKey: any, federatedKeylessPubKey: any, keylessSig: any) {
  _KeylessPublicKey = keylessPubKey;
  _FederatedKeylessPublicKey = federatedKeylessPubKey;
  _KeylessSignature = keylessSig;
}

export type PrivateKeyInput = import("./ed25519.js").Ed25519PrivateKey | import("./secp256k1.js").Secp256k1PrivateKey;

export class AnyPublicKey extends AccountPublicKey {
  public readonly publicKey: PublicKey;
  public readonly variant: AnyPublicKeyVariant;

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

  authKey(): unknown {
    return createAuthKey(SigningScheme.SingleKey, this.bcsToBytes());
  }

  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.variant);
    this.publicKey.serialize(serializer);
  }

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

export class AnySignature extends Signature {
  public readonly signature: Signature;
  private readonly variant: AnySignatureVariant;

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

  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(this.variant);
    this.signature.serialize(serializer);
  }

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
