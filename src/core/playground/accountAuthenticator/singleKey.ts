import type { Deserializer, Serializer } from "../../../bcs";
import { HexInput } from "../../../types";
import type { PublicKey } from "../interfaces";
import { type AllowedSignatures, WrappedPublicKey, WrappedSignature } from "../wrapped";
import { AccountAuthenticatorVariant } from "./variant";

export class AccountAuthenticatorSingleKey<
  TSignature extends AllowedSignatures = AllowedSignatures,
  TPublicKey extends PublicKey<TSignature> = PublicKey<TSignature>,
> {
  constructor(
    public readonly publicKey: WrappedPublicKey<TSignature, TPublicKey>,
    public readonly signature: WrappedSignature<TSignature>,
  ) {}

  verify(message: HexInput): boolean {
    return this.publicKey.verifySignature(message, this.signature);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.SingleKey);
    this.publicKey.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorSingleKey {
    const publicKey = WrappedPublicKey.deserialize(deserializer);
    const signature = WrappedSignature.deserialize(deserializer);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }
}
