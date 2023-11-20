import { HexInput } from "../../types";
import { AccountAddress } from "../accountAddress";
import { Ed25519PrivateKey, Ed25519Signature } from "../crypto";
import { LegacyEd25519Account } from "./ed25519Account";

export interface LegacyEd25519SignerConstructorArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddress | HexInput;
}

export class LegacyEd25519Signer extends LegacyEd25519Account {
  public readonly privateKey: Ed25519PrivateKey;

  constructor({ privateKey, address }: LegacyEd25519SignerConstructorArgs) {
    const publicKey = privateKey.publicKey();
    super({ publicKey, address });
    this.privateKey = privateKey;
  }

  static generate() {
    const privateKey = Ed25519PrivateKey.generate();
    return new LegacyEd25519Signer({ privateKey });
  }

  /**
   * Derives an account with bip44 path and mnemonics,
   *
   * @param args.path the BIP44 derive hardened path (e.g. m/44'/637'/0'/0'/0') for Ed25519,
   * or non-hardened path (e.g. m/44'/637'/0'/0/0) for secp256k1
   * Detailed description: {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki}
   * @param args.mnemonic the mnemonic seed phrase of the account
   * @returns LegacyEd25519Signer
   */
  static fromDerivationPath(args: { path: string; mnemonic: string }): LegacyEd25519Signer {
    const { path, mnemonic } = args;
    const privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
    return new LegacyEd25519Signer({ privateKey });
  }

  sign(message: HexInput): Ed25519Signature {
    return this.privateKey.sign(message);
  }
}
