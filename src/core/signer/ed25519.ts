import { AccountAuthenticatorEd25519 } from "../../transactions/authenticator/account";
import type { HexInput } from "../../types";
import { Ed25519Account } from "../account";
import { AccountAddressInput } from "../accountAddress";
import { Ed25519PrivateKey } from "../crypto";
import type { Signer } from "./signer";

export interface Ed25519SignerConstructorArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
}

export interface Ed25519SignerFromDerivationPathArgs {
  path: string;
  mnemonic: string;
}

export class Ed25519Signer extends Ed25519Account implements Signer {
  /**
   * Private key associated with the account
   */
  public readonly privateKey: Ed25519PrivateKey;

  // region Constructors

  constructor(args: Ed25519SignerConstructorArgs) {
    const { privateKey, address } = args;
    const publicKey = privateKey.publicKey();
    super({ publicKey, address });
    this.privateKey = privateKey;
  }

  /**
   * Derives an account with random private key and address.
   * Default generation is using a Ed25519 key
   * @returns Account with the given signing scheme
   */
  static generate() {
    const privateKey = Ed25519PrivateKey.generate();
    return new Ed25519Signer({ privateKey });
  }

  /**
   * Derives an account with bip44 path and mnemonics,
   *
   * @param args.scheme The signing scheme to derive with
   * @param args.path the BIP44 derive hardened path (e.g. m/44'/637'/0'/0'/0') for Ed25519,
   * or non-hardened path (e.g. m/44'/637'/0'/0/0) for secp256k1
   * Detailed description: {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki}
   * @param args.mnemonic the mnemonic seed phrase of the account
   * to generating a Legacy Ed25519 keypair
   *
   * @returns Ed25519Signer
   */
  static fromDerivationPath(args: Ed25519SignerFromDerivationPathArgs) {
    const { path, mnemonic } = args;
    const privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
    return new Ed25519Signer({ privateKey });
  }

  // endregion

  // region Signer

  sign(message: HexInput) {
    const signature = this.privateKey.sign(message);
    return new AccountAuthenticatorEd25519(this.publicKey, signature);
  }

  // endregion
}
