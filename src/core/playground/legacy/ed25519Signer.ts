import { HexInput } from "../../../types";
import { AccountAddress } from "../../accountAddress";
import { LegacyAccountAuthenticatorEd25519 } from "../accountAuthenticator";
import { Ed25519PrivateKey } from "../ed25519";
import type { BaseSigner } from "../interfaces";
import { LegacyEd25519Account } from "./ed25519Account";

export class LegacyEd25519Signer extends LegacyEd25519Account implements BaseSigner<LegacyAccountAuthenticatorEd25519> {
  public readonly privateKey: Ed25519PrivateKey;

  constructor(privateKey: Ed25519PrivateKey, address?: AccountAddress | HexInput) {
    const publicKey = privateKey.publicKey();
    super({ publicKey, address });
    this.privateKey = privateKey;
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
