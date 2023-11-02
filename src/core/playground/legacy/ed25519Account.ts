import { HexInput } from "../../../types";
import { AccountAddress } from "../../accountAddress";
import { Ed25519PublicKey, Ed25519Signature } from "../ed25519";

export interface LegacyEd25519AccountConstructorArgs {
  publicKey: Ed25519PublicKey;
  address?: AccountAddress | HexInput;
}

export class LegacyEd25519Account {
  public readonly publicKey: Ed25519PublicKey;

  public readonly address: AccountAddress;

  constructor({ publicKey, address }: LegacyEd25519AccountConstructorArgs) {
    this.publicKey = publicKey;

    if (address instanceof AccountAddress) {
      this.address = address;
    } else if (address !== undefined) {
      this.address = AccountAddress.fromHexInput(address);
    } else {
      this.address = this.publicKey.authKey().derivedAddress();
    }
  }

  verifySignature(message: HexInput, signature: Ed25519Signature): boolean {
    return this.publicKey.verifySignature(message, signature);
  }
}
