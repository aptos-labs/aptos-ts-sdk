import { HexInput } from "../../types";
import { AccountAddress } from "../accountAddress";
import { AnySignature, Ed25519PublicKey, Ed25519Signature } from "../crypto";

export interface LegacyEd25519AccountConstructorArgs {
  publicKey: Ed25519PublicKey;
  address?: AccountAddress | HexInput;
}

export class LegacyEd25519Account {
  public readonly publicKey: Ed25519PublicKey;

  public readonly accountAddress: AccountAddress;

  constructor({ publicKey, address }: LegacyEd25519AccountConstructorArgs) {
    this.publicKey = publicKey;

    if (address instanceof AccountAddress) {
      this.accountAddress = address;
    } else if (address !== undefined) {
      this.accountAddress = AccountAddress.from(address);
    } else {
      this.accountAddress = this.publicKey.authKey().derivedAddress();
    }
  }

  /**
   * Verify the given message and signature with the public key.
   *
   * @param args.message raw message data in HexInput format
   * @param args.signature signed message Signature
   * @returns
   */
  verifySignature(args: { message: HexInput; signature: Ed25519Signature }): boolean {
    return this.publicKey.verifySignature(args);
  }
}
