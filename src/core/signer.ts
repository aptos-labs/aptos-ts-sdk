import { HexInput, SigningSchemeInput } from "../types";
import { Account } from "./account";
import type { AccountAddress } from "./accountAddress";
import { AnyPublicKey, AnySignature, Ed25519PrivateKey, PrivateKey, Secp256k1PrivateKey } from "./crypto";

export interface SignerConstructorArgs {
  privateKey: PrivateKey;
  address?: AccountAddress | HexInput;
}

export interface GenerateSignerArgs {
  scheme: SigningSchemeInput;
}

export class Signer extends Account {
  /**
   * Private key associated with the account
   */
  public readonly privateKey: PrivateKey;

  constructor({ privateKey, address }: SignerConstructorArgs) {
    const publicKey = new AnyPublicKey(privateKey.publicKey());
    super({ publicKey, address });
    this.privateKey = privateKey;
  }

  /**
   * Derives an account with random private key and address.
   * Default generation is using a Ed25519 key
   * @returns Account with the given signing scheme
   */
  static generate(args?: GenerateSignerArgs) {
    const scheme = args?.scheme ?? SigningSchemeInput.Ed25519;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        return new Signer({ privateKey: Ed25519PrivateKey.generate() });
      case SigningSchemeInput.Secp256k1Ecdsa:
        return new Signer({ privateKey: Secp256k1PrivateKey.generate() });
      default:
        throw new Error(`Unsupported scheme ${scheme}`);
    }
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
   * @returns Account
   */
  static fromDerivationPath(args: { scheme: SigningSchemeInput; path: string; mnemonic: string }): Account {
    const { path, mnemonic, scheme } = args;
    let privateKey: PrivateKey;
    switch (scheme) {
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      case SigningSchemeInput.Ed25519:
        privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      default:
        throw new Error(`Unsupported scheme ${scheme}`);
    }
    return new Signer({ privateKey });
  }

  sign(message: HexInput): AnySignature {
    return new AnySignature(this.privateKey.sign(message));
  }
}
