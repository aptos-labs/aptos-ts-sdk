import { HexInput } from "../../../types";
import { AccountAddress } from "../../accountAddress";
import { LegacyAccountAuthenticatorEd25519 } from "../accountAuthenticator";
import { Ed25519PrivateKey, Ed25519PublicKey } from "../ed25519";
import type { BaseSigner } from "../interfaces";

export class LegacyEd25519Signer implements BaseSigner<LegacyAccountAuthenticatorEd25519> {
  public readonly privateKey: Ed25519PrivateKey;

  public readonly publicKey: Ed25519PublicKey;

  public readonly address: AccountAddress;

  constructor(privateKey: Ed25519PrivateKey, address?: AccountAddress | HexInput) {
    this.privateKey = privateKey;
    this.publicKey = this.privateKey.publicKey();

    if (address instanceof AccountAddress) {
      this.address = address;
    } else if (address !== undefined) {
      this.address = AccountAddress.fromHexInput(address);
    } else {
      this.address = this.publicKey.authKey().derivedAddress();
    }
  }

  static generate() {
    const privateKey = Ed25519PrivateKey.generate();
    return new LegacyEd25519Signer(privateKey);
  }

  sign(message: HexInput): LegacyAccountAuthenticatorEd25519 {
    const signature = this.privateKey.sign(message);
    return new LegacyAccountAuthenticatorEd25519(this.publicKey, signature);
  }
}
