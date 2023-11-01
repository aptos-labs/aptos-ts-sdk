import type { Deserializer, Serializer } from "../../bcs";
import { HexInput, SigningScheme as AuthenticationKeyScheme } from "../../types";
import { AuthenticationKey } from "./authenticationKey";
import { bcsToBytes } from "./bcs";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519";
import type { PublicKey } from "./interfaces";
import { SignatureScheme } from "./scheme";
import { Secp256k1PublicKey, Secp256k1Signature } from "./secp256k1";

export type AllowedSignatures = Ed25519Signature | Secp256k1Signature;

export class WrappedSignature<TSignature extends AllowedSignatures = AllowedSignatures> {
  constructor(public readonly signature: TSignature) {}

  serialize(serializer: Serializer): void {
    if (this.signature instanceof Ed25519Signature) {
      serializer.serializeU32AsUleb128(SignatureScheme.Ed25519);
    } else if (this.signature instanceof Secp256k1Signature) {
      serializer.serializeU32AsUleb128(SignatureScheme.Secp256k1);
    } else {
      throw new Error("Unknown signature type");
    }
    this.signature.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): WrappedSignature {
    const scheme = deserializer.deserializeUleb128AsU32();
    switch (scheme) {
      case SignatureScheme.Ed25519:
        return new WrappedSignature(Ed25519Signature.deserialize(deserializer));
      case SignatureScheme.Secp256k1:
        return new WrappedSignature(Secp256k1Signature.deserialize(deserializer));
      default:
        throw new Error(`Unknown signature scheme ${scheme}`);
    }
  }
}

export class WrappedPublicKey<
  TSignature extends AllowedSignatures = AllowedSignatures,
  TPublicKey extends PublicKey<TSignature> = PublicKey<TSignature>,
> implements PublicKey<WrappedSignature<TSignature>>
{
  constructor(public readonly publicKey: TPublicKey) {}

  verifySignature(message: HexInput, signature: WrappedSignature<TSignature>) {
    return this.publicKey.verifySignature(message, signature.signature);
  }

  authKey(): AuthenticationKey {
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: AuthenticationKeyScheme.SingleKey,
      input: bcsToBytes(this.publicKey),
    });
  }

  serialize(serializer: Serializer) {
    if (this.publicKey instanceof Ed25519PublicKey) {
      serializer.serializeU32AsUleb128(SignatureScheme.Ed25519);
    } else if (this.publicKey instanceof Secp256k1PublicKey) {
      serializer.serializeU32AsUleb128(SignatureScheme.Secp256k1);
    } else {
      throw new Error("Unknown key type");
    }
    this.publicKey.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): WrappedPublicKey {
    const scheme = deserializer.deserializeUleb128AsU32();
    switch (scheme) {
      case SignatureScheme.Ed25519:
        return new WrappedPublicKey(Ed25519PublicKey.deserialize(deserializer));
      case SignatureScheme.Secp256k1:
        return new WrappedPublicKey(Secp256k1PublicKey.deserialize(deserializer));
      default:
        throw new Error(`Unknown signature scheme ${scheme}`);
    }
  }
}
