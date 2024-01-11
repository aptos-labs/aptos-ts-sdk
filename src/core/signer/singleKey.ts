import { AccountAuthenticatorSingleKey } from "../../transactions/authenticator/account";
import { type HexInput, SigningSchemeInput } from "../../types";
import { SingleKeyAccount } from "../account";
import type { AccountAddressInput } from "../accountAddress";
import { AnyPublicKey, AnySignature, Ed25519PrivateKey, Secp256k1PrivateKey } from "../crypto";
import type { Signer } from "./signer";

export type PrivateKeyInput = Ed25519PrivateKey | Secp256k1PrivateKey;

export interface SingleKeySignerConstructorArgs {
  privateKey: PrivateKeyInput;
  address?: AccountAddressInput;
}

export interface GenerateSingleKeySignerArgs {
  scheme?: SigningSchemeInput;
}

export type SingleKeySignerFromDerivationPathArgs = GenerateSingleKeySignerArgs & {
  path: string;
  mnemonic: string;
};

export class SingleKeySigner extends SingleKeyAccount implements Signer {
  /**
   * Private key associated with the account
   */
  public readonly privateKey: PrivateKeyInput;

  // region Constructors

  constructor(args: SingleKeySignerConstructorArgs) {
    const { privateKey, address } = args;
    const publicKey = AnyPublicKey.fromPublicKey(privateKey.publicKey());
    super({ publicKey, address });
    this.privateKey = privateKey;
  }

  /**
   * Derives an account with random private key and address.
   * Default generation is using a Ed25519 key
   * @returns Account with the given signing scheme
   */
  static generate(args: GenerateSingleKeySignerArgs = {}) {
    const { scheme = SigningSchemeInput.Ed25519 } = args;
    let privateKey: PrivateKeyInput;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        privateKey = Ed25519PrivateKey.generate();
        break;
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.generate();
        break;
      default:
        throw new Error(`Unsupported scheme ${scheme}`);
    }
    return new SingleKeySigner({ privateKey });
  }

  static fromDerivationPath(args: SingleKeySignerFromDerivationPathArgs) {
    const { scheme = SigningSchemeInput.Ed25519, path, mnemonic } = args;
    let privateKey: PrivateKeyInput;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      default:
        throw new Error(`Unsupported scheme ${scheme}`);
    }
    return new SingleKeySigner({ privateKey });
  }

  // endregion

  // region Signer

  sign(message: HexInput) {
    const innerSignature = this.privateKey.sign(message);
    const signature = AnySignature.fromSignature(innerSignature);
    return new AccountAuthenticatorSingleKey(this.publicKey, signature);
  }

  // endregion
}
