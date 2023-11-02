import { HexInput } from "../../types";
import { AccountAddress } from "../accountAddress";
import type { PublicKey } from "./interfaces";
import { AllowedSignatures, AnyPublicKey, AnySignature } from "./wrapped";

export interface AccountConstructorArgs<
  TSignature extends AllowedSignatures,
  TPublicKey extends PublicKey<TSignature> = PublicKey<TSignature>,
> {
  publicKey: AnyPublicKey<TSignature, TPublicKey>;
  address?: AccountAddress | HexInput;
}

export class Account<
  TSignature extends AllowedSignatures = AllowedSignatures,
  TPublicKey extends PublicKey<TSignature> = PublicKey<TSignature>,
> {
  public readonly publicKey: AnyPublicKey<TSignature, TPublicKey>;

  public readonly address: AccountAddress;

  constructor({ publicKey, address }: AccountConstructorArgs<TSignature, TPublicKey>) {
    this.publicKey = publicKey;

    if (address instanceof AccountAddress) {
      this.address = address;
    } else if (address !== undefined) {
      this.address = AccountAddress.fromHexInput(address);
    } else {
      this.address = this.publicKey.authKey().derivedAddress();
    }
  }

  verifySignature(message: HexInput, signature: AnySignature<TSignature>): boolean {
    return this.publicKey.verifySignature(message, signature);
  }
}
