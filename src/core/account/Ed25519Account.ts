import { AccountAuthenticatorEd25519 } from "../../transactions/authenticator/account";
import { HexInput, SigningScheme } from "../../types";
import { AccountAddress, AccountAddressInput } from "../accountAddress";
import { Ed25519PrivateKey, Ed25519PublicKey, Ed25519Signature } from "../crypto";
import type { Account } from "./Account";

export interface Ed25519SignerConstructorArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
}

export interface Ed25519SignerFromDerivationPathArgs {
  path: string;
  mnemonic: string;
}

export interface VerifyEd25519SignatureArgs {
  message: HexInput;
  signature: Ed25519Signature;
}

/**
 * Signer implementation for the Ed25519 authentication scheme.
 * This extends an {@link Ed25519Account} by adding signing capabilities through an {@link Ed25519PrivateKey}.
 *
 * Note: Generating a signer instance does not create the account on-chain.
 */
export class Ed25519Account implements Account {
  /**
   * Private key associated with the account
   */
  readonly privateKey: Ed25519PrivateKey;

  readonly publicKey: Ed25519PublicKey;

  readonly accountAddress: AccountAddress;

  readonly signingScheme = SigningScheme.Ed25519;

  // region Constructors

  constructor(args: Ed25519SignerConstructorArgs) {
    const { privateKey, address } = args;
    this.privateKey = privateKey;
    this.publicKey = privateKey.publicKey();
    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();
  }

  /**
   * Derives a signer from a randomly generated private key
   */
  static generate() {
    const privateKey = Ed25519PrivateKey.generate();
    return new Ed25519Account({ privateKey });
  }

  /**
   * Derives an account with bip44 path and mnemonics
   *
   * @param args.path the BIP44 derive hardened path e.g. m/44'/637'/0'/0'/0'
   * Detailed description: {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki}
   * @param args.mnemonic the mnemonic seed phrase of the account
   */
  static fromDerivationPath(args: Ed25519SignerFromDerivationPathArgs) {
    const { path, mnemonic } = args;
    const privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
    return new Ed25519Account({ privateKey });
  }

  // endregion

  // region Account

  verifySignature(args: VerifyEd25519SignatureArgs): boolean {
    return this.publicKey.verifySignature(args);
  }

  signWithAuthenticator(message: HexInput) {
    const signature = this.privateKey.sign(message);
    return new AccountAuthenticatorEd25519(this.publicKey, signature);
  }

  sign(message: HexInput) {
    return this.signWithAuthenticator(message).signature;
  }

  // endregion
}
