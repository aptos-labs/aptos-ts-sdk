import type { Deserializer, Serializer } from "../../../bcs";
import { HexInput } from "../../../types";
import type { Ed25519Signature } from "../ed25519";
import type { Serializable } from "../interfaces";
import { LegacyMultiEd25519PublicKey, LegacyMultiEd25519Signature } from "../legacy/multiEd25519";
import { LegacyAccountAuthenticatorEd25519 } from "./legacyEd25519";
import { AccountAuthenticatorVariant } from "./variant";

export class LegacyAccountAuthenticatorMultiEd25519 implements Serializable {
  public readonly publicKey: LegacyMultiEd25519PublicKey;

  public readonly signature: LegacyMultiEd25519Signature;

  constructor(publicKey: LegacyMultiEd25519PublicKey, signature: LegacyMultiEd25519Signature);
  constructor(publicKey: LegacyMultiEd25519PublicKey, authenticators: LegacyAccountAuthenticatorEd25519[]);
  constructor(
    publicKey: LegacyMultiEd25519PublicKey,
    signatureOrAuthenticators: LegacyMultiEd25519Signature | LegacyAccountAuthenticatorEd25519[],
  ) {
    this.publicKey = publicKey;
    if (signatureOrAuthenticators instanceof LegacyMultiEd25519Signature) {
      this.signature = signatureOrAuthenticators;
    } else {
      const authenticators = signatureOrAuthenticators;
      const signatures: Ed25519Signature[] = [];
      const bits: number[] = [];
      for (const authenticator of authenticators) {
        const index = publicKey.publicKeys.findIndex((key) => key.key.equals(authenticator.publicKey.key));
        if (index === -1) {
          throw new Error("Unexpected public key");
        }
        signatures.push(authenticator.signature);
        bits.push(index);
      }
      const bitmap = LegacyMultiEd25519Signature.createBitmap({ bits });
      this.signature = new LegacyMultiEd25519Signature({ signatures, bitmap });
    }
  }

  verify(message: HexInput): boolean {
    return this.publicKey.verifySignature({ message, signature: this.signature });
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.LegacyMultiEd25519);
    this.publicKey.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): LegacyAccountAuthenticatorMultiEd25519 {
    const publicKey = LegacyMultiEd25519PublicKey.deserialize(deserializer);
    const signature = LegacyMultiEd25519Signature.deserialize(deserializer);
    return new LegacyAccountAuthenticatorMultiEd25519(publicKey, signature);
  }
}
