import type { AccountAuthenticator } from "../../transactions/authenticator/account";
import { HexInput, SigningSchemeInput } from "../../types";
import { Account } from "../account";
import type { AccountAddressInput } from "../accountAddress";
import { Ed25519PrivateKey } from "../crypto";
import { Ed25519Signer } from "./ed25519";
import { type PrivateKeyInput, SingleKeySigner } from "./singleKey";

interface CreateEd25519SignerFromPrivateKeyArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
  legacy?: true;
}

interface CreateEd25519SingleKeySignerFromPrivateKeyArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
  legacy: false;
}

interface CreateSingleKeySignerFromPrivateKeyArgs {
  privateKey: Exclude<PrivateKeyInput, Ed25519PrivateKey>;
  address?: AccountAddressInput;
  legacy?: false;
}

interface CreateSignerFromPrivateKeyArgs {
  privateKey: PrivateKeyInput;
  address?: AccountAddressInput;
  legacy?: boolean;
}

interface GenerateEd25519SignerArgs {
  scheme?: SigningSchemeInput.Ed25519;
  legacy?: true;
}

interface GenerateEd25519SingleKeySignerArgs {
  scheme?: SigningSchemeInput.Ed25519;
  legacy: false;
}

interface GenerateSingleKeySignerArgs {
  scheme: Exclude<SigningSchemeInput, SigningSchemeInput.Ed25519>;
  legacy?: false;
}

interface GenerateSignerArgs {
  scheme?: SigningSchemeInput;
  legacy?: boolean;
}

interface PrivateKeyFromDerivationPathArgs {
  path: string;
  mnemonic: string;
}

/**
 * Interface for a generic Aptos signer.
 * A signer is an Account extended with signing capabilities, usually by having access to a private key.
 *
 * The interface is defined as abstract class to provide a single entrypoint for signer generation,
 * either through `Signer.generate()` or `Signer.fromDerivationPath`.
 * Despite this being an abstract class, it should be treated as an interface and enforced using
 * the `implements` keyword.
 * Typically, a signer implementation will extend from its corresponding Account implementation
 * e.g. `Ed25519Signer` extends from `Ed25519Account`.
 *.
 * Note: Generating a signer instance does not create the account on-chain.
 */
export abstract class Signer extends Account {
  /**
   * Sign a message using the available signing capabilities.
   * @param message the signing message, as binary input
   * @return the AccountAuthenticator containing the signature, together with the account's public key
   */
  abstract sign(message: HexInput): AccountAuthenticator;

  /**
   * Creates a signer from the provided private key.
   *
   * @param args.privateKey a valid private key
   * @param args.address the signer's address. If not provided, it will be derived from the public key.
   * @param args.legacy Whether to use a legacy authentication scheme, when applicable
   */
  static fromPrivateKey(args: CreateEd25519SignerFromPrivateKeyArgs): Ed25519Signer;
  static fromPrivateKey(args: CreateEd25519SingleKeySignerFromPrivateKeyArgs): SingleKeySigner;
  static fromPrivateKey(args: CreateSingleKeySignerFromPrivateKeyArgs): SingleKeySigner;
  static fromPrivateKey(args: CreateSignerFromPrivateKeyArgs): Signer;
  static fromPrivateKey(args: CreateSignerFromPrivateKeyArgs) {
    const { privateKey, address, legacy = true } = args;
    if (privateKey instanceof Ed25519PrivateKey && legacy) {
      return new Ed25519Signer({
        privateKey,
        address,
      });
    }
    return new SingleKeySigner({ privateKey, address });
  }

  /**
   * Derives a signer from a randomly generated private key.
   * @param args.scheme The signature scheme to use, to generate the private key
   * @param args.legacy Whether to use a legacy authentication scheme, when applicable
   * @returns A signer compatible with the provided signature scheme
   */
  static generate(args?: GenerateEd25519SignerArgs): Ed25519Signer;
  static generate(args: GenerateEd25519SingleKeySignerArgs): SingleKeySigner;
  static generate(args: GenerateSingleKeySignerArgs): SingleKeySigner;
  static generate(args: GenerateSignerArgs): Signer;
  static generate(args: GenerateSignerArgs = {}) {
    const { scheme = SigningSchemeInput.Ed25519, legacy = true } = args;
    if (scheme === SigningSchemeInput.Ed25519 && legacy) {
      return Ed25519Signer.generate();
    }
    return SingleKeySigner.generate({ scheme });
  }

  /**
   * Derives an account with bip44 path and mnemonics
   *
   * @param args.scheme The signature scheme to derive the private key with
   * @param args.path the BIP44 derive hardened path (e.g. m/44'/637'/0'/0'/0') for Ed25519,
   * or non-hardened path (e.g. m/44'/637'/0'/0/0) for secp256k1
   * Detailed description: {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki}
   * @param args.mnemonic the mnemonic seed phrase of the account
   */
  static fromDerivationPath(args: GenerateEd25519SignerArgs & PrivateKeyFromDerivationPathArgs): Ed25519Signer;
  static fromDerivationPath(
    args: GenerateEd25519SingleKeySignerArgs & PrivateKeyFromDerivationPathArgs,
  ): SingleKeySigner;
  static fromDerivationPath(args: GenerateSingleKeySignerArgs & PrivateKeyFromDerivationPathArgs): SingleKeySigner;
  static fromDerivationPath(args: GenerateSignerArgs & PrivateKeyFromDerivationPathArgs): Signer;
  static fromDerivationPath(args: GenerateSignerArgs & PrivateKeyFromDerivationPathArgs) {
    const { scheme = SigningSchemeInput.Ed25519, mnemonic, path, legacy = true } = args;
    if (scheme === SigningSchemeInput.Ed25519 && legacy) {
      return Ed25519Signer.fromDerivationPath({ mnemonic, path });
    }
    return SingleKeySigner.fromDerivationPath({ scheme, mnemonic, path });
  }
}
