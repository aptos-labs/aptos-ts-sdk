import type { Deserializer, Serializer } from "../../../bcs";
import { HexInput } from "../../../types";
import type { PublicKey } from "../interfaces";
import { type AllowedSignatures, AnyPublicKey, AnySignature } from "../wrapped";
import { AccountAuthenticatorVariant } from "./variant";

export class AccountAuthenticatorSingleKey<
  TSignature extends AllowedSignatures = AllowedSignatures,
  TPublicKey extends PublicKey<TSignature> = PublicKey<TSignature>,
> {
  public readonly publicKey: AnyPublicKey<TSignature, TPublicKey>;

  public readonly signature: AnySignature<TSignature>;

  constructor(publicKey: AnyPublicKey<TSignature, TPublicKey>, signature: AnySignature<TSignature>) {
    this.publicKey = publicKey;
    this.signature = signature;
  }

  verify(message: HexInput): boolean {
    return this.publicKey.verifySignature(message, this.signature);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(AccountAuthenticatorVariant.SingleKey);
    this.publicKey.serialize(serializer);
    this.signature.serialize(serializer);
  }

  static load(deserializer: Deserializer): AccountAuthenticatorSingleKey {
    const publicKey = AnyPublicKey.deserialize(deserializer);
    const signature = AnySignature.deserialize(deserializer);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }
}
