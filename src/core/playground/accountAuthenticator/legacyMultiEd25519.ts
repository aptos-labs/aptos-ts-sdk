import type { Deserializer, Serializer } from "../../../bcs";
import { HexInput } from "../../../types";
import type { Serializable } from "../interfaces";
import { LegacyMultiEd25519PublicKey, LegacyMultiEd25519Signature } from "../legacy/multiEd25519";
import { AccountAuthenticatorVariant } from "./variant";

export class LegacyAccountAuthenticatorMultiEd25519 implements Serializable {
  constructor(
    public readonly publicKey: LegacyMultiEd25519PublicKey,
    public readonly signature: LegacyMultiEd25519Signature,
  ) {}

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
