import { Deserializer } from "../bcs/deserializer.js";
import type { Serializer } from "../bcs/serializer.js";
import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519.js";
import { PublicKey, type VerifySignatureArgs } from "./public-key.js";
import { Signature } from "./signature.js";
import { EphemeralPublicKeyVariant, EphemeralSignatureVariant } from "./types.js";

export class EphemeralPublicKey extends PublicKey {
  public readonly publicKey: PublicKey;
  public readonly variant: EphemeralPublicKeyVariant;

  constructor(publicKey: PublicKey) {
    super();
    if (publicKey instanceof Ed25519PublicKey) {
      this.publicKey = publicKey;
      this.variant = EphemeralPublicKeyVariant.Ed25519;
    } else {
      throw new Error(`Unsupported key for EphemeralPublicKey - ${publicKey.constructor.name}`);
    }
  }

  verifySignature(args: VerifySignatureArgs): boolean {
    const { message, signature } = args;
    if (signature instanceof EphemeralSignature) {
      return this.publicKey.verifySignature({ message, signature: signature.signature });
    }
    return this.publicKey.verifySignature({ message, signature });
  }

  serialize(serializer: Serializer): void {
    if (this.publicKey instanceof Ed25519PublicKey) {
      serializer.serializeU32AsUleb128(EphemeralPublicKeyVariant.Ed25519);
      this.publicKey.serialize(serializer);
    } else {
      throw new Error("Unknown public key type");
    }
  }

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

export class EphemeralSignature extends Signature {
  public readonly signature: Signature;

  constructor(signature: Signature) {
    super();
    if (signature instanceof Ed25519Signature) {
      this.signature = signature;
    } else {
      throw new Error(`Unsupported signature for EphemeralSignature - ${signature.constructor.name}`);
    }
  }

  static fromHex(hexInput: HexInput): EphemeralSignature {
    const data = Hex.fromHexInput(hexInput);
    const deserializer = new Deserializer(data.toUint8Array());
    return EphemeralSignature.deserialize(deserializer);
  }

  serialize(serializer: Serializer): void {
    if (this.signature instanceof Ed25519Signature) {
      serializer.serializeU32AsUleb128(EphemeralSignatureVariant.Ed25519);
      this.signature.serialize(serializer);
    } else {
      throw new Error("Unknown signature type");
    }
  }

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
