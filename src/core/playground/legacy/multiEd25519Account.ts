import { HexInput } from "../../../types";
import { AccountAddress } from "../../accountAddress";
import type { LegacyMultiEd25519PublicKey, LegacyMultiEd25519Signature } from "./multiEd25519";

export interface LegacyMultiEd25519AccountConstructorArgs {
  publicKey: LegacyMultiEd25519PublicKey;
  address?: AccountAddress | HexInput;
}

export class LegacyMultiEd25519Account {
  public readonly publicKey: LegacyMultiEd25519PublicKey;

  public readonly address: AccountAddress;

  constructor({ publicKey, address }: LegacyMultiEd25519AccountConstructorArgs) {
    this.publicKey = publicKey;

    if (address instanceof AccountAddress) {
      this.address = address;
    } else if (address !== undefined) {
      this.address = AccountAddress.fromHexInput(address);
    } else {
      this.address = this.publicKey.authKey().derivedAddress();
    }
  }

  verifySignature(message: HexInput, signature: LegacyMultiEd25519Signature): boolean {
    return this.publicKey.verifySignature({ message, signature });
  }
}
