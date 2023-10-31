import type { Deserializer, Serializer } from "../../../bcs";
import { HexInput } from "../../../types";
import { Ed25519PublicKey, Ed25519Signature } from "../ed25519";
import { AccountAuthenticatorVariant } from "./variant";

export class LegacyAccountAuthenticatorEd25519 {
  constructor(public readonly publicKey: Ed25519PublicKey, public readonly signature: Ed25519Signature) {}

  verify(message: HexInput): boolean {
    return this.publicKey.verifySignature(message, this.signature);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.LegacyEd25519);
    this.publicKey.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): LegacyAccountAuthenticatorEd25519 {
    const publicKey = Ed25519PublicKey.deserialize(deserializer);
    const signature = Ed25519Signature.deserialize(deserializer);
    return new LegacyAccountAuthenticatorEd25519(publicKey, signature);
  }
}
