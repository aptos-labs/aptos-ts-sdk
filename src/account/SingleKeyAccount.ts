import { AccountAuthenticatorSingleKey } from "../transactions/authenticator/account";
import { type HexInput, SigningScheme, SigningSchemeInput } from "../types";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { AnyPublicKey, AnySignature, Ed25519PrivateKey, PrivateKey, Secp256k1PrivateKey } from "../core/crypto";
import type { Account } from "./Account";
import { generateSigningMessageForTransaction } from "../transactions/transactionBuilder/signingMessage";
import { AnyRawTransaction } from "../transactions/types";

/**
 * Arguments required to create a single key signer.
 *
 * @param privateKey - The private key used for signing.
 * @param address - Optional account address associated with the signer.
 */
export interface SingleKeySignerConstructorArgs {
  privateKey: PrivateKey;
  address?: AccountAddressInput;
}

/**
 * Arguments for generating a single key signer.
 *
 * @param scheme - The signing scheme to be used.
 */
export interface SingleKeySignerGenerateArgs {
  scheme?: SigningSchemeInput;
}

/**
 * The arguments for generating a single key signer from a specified derivation path.
 */
export type SingleKeySignerFromDerivationPathArgs = SingleKeySignerGenerateArgs & {
  path: string;
  mnemonic: string;
};

/**
 * Arguments required to verify a single key signature for a given message.
 *
 * @param message - The message to be verified, represented in hexadecimal format.
 * @param signature - The signature that corresponds to the message.
 */
export interface VerifySingleKeySignatureArgs {
  message: HexInput;
  signature: AnySignature;
}

/**
 * Signer implementation for the SingleKey authentication scheme.
 * This class extends a SingleKeyAccount by adding signing capabilities through a valid private key.
 * Currently, the only supported signature schemes are Ed25519 and Secp256k1.
 *
 * Note: Generating a signer instance does not create the account on-chain.
 */
export class SingleKeyAccount implements Account {
  /**
   * Private key associated with the account
   */
  readonly privateKey: PrivateKey;

  readonly publicKey: AnyPublicKey;

  readonly accountAddress: AccountAddress;

  readonly signingScheme = SigningScheme.SingleKey;

  /**
   * Creates an instance of the SingleKeySigner using the provided private key and address.
   * This allows for signing transactions and messages with the specified private key.
   *
   * @param args - The constructor arguments for initializing the SingleKeySigner.
   * @param args.privateKey - The private key used for signing.
   * @param args.address - The optional account address; if not provided, it will derive the address from the public key.
   */
  constructor(args: SingleKeySignerConstructorArgs) {
    const { privateKey, address } = args;
    this.privateKey = privateKey;
    this.publicKey = new AnyPublicKey(privateKey.publicKey());
    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();
  }

  /**
   * Derives an account from a randomly generated private key based on the specified signing scheme.
   * The default generation scheme is Ed25519, but it can also support Secp256k1Ecdsa.
   *
   * @param args - The arguments for generating the account.
   * @param args.scheme - The signing scheme to use for generating the private key. Defaults to SigningSchemeInput.Ed25519.
   * @returns An account with the generated private key based on the specified signing scheme.
   * @throws Error if an unsupported signature scheme is provided.
   */
  static generate(args: SingleKeySignerGenerateArgs = {}) {
    const { scheme = SigningSchemeInput.Ed25519 } = args;
    let privateKey: PrivateKey;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        privateKey = Ed25519PrivateKey.generate();
        break;
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.generate();
        break;
      default:
        throw new Error(`Unsupported signature scheme ${scheme}`);
    }
    return new SingleKeyAccount({ privateKey });
  }

  /**
   * Derives an account using a specified BIP44 path and mnemonic seed phrase, defaulting to the Ed25519 signature scheme.
   * This function allows you to create a single key account based on the provided derivation path and mnemonic.
   *
   * @param args - The arguments for deriving the account.
   * @param args.scheme - The signature scheme to derive the private key with. Defaults to Ed25519.
   * @param args.path - The BIP44 derive hardened path (e.g. m/44'/637'/0'/0'/0') for Ed25519, or non-hardened path
   * (e.g. m/44'/637'/0'/0/0) for secp256k1.
   * Detailed description: {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki}
   * @param args.mnemonic - The mnemonic seed phrase of the account.
   */
  static fromDerivationPath(args: SingleKeySignerFromDerivationPathArgs) {
    const { scheme = SigningSchemeInput.Ed25519, path, mnemonic } = args;
    let privateKey: PrivateKey;
    switch (scheme) {
      case SigningSchemeInput.Ed25519:
        privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      case SigningSchemeInput.Secp256k1Ecdsa:
        privateKey = Secp256k1PrivateKey.fromDerivationPath(path, mnemonic);
        break;
      default:
        throw new Error(`Unsupported signature scheme ${scheme}`);
    }
    return new SingleKeyAccount({ privateKey });
  }

  /**
   * Verify the given message and signature with the public key.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.message - The raw message data in HexInput format.
   * @param args.signature - The signed message signature.
   * @returns A boolean indicating whether the signature is valid.
   */
  verifySignature(args: VerifySingleKeySignatureArgs): boolean {
    return this.publicKey.verifySignature(args);
  }

  /**
   * Sign a message using the account's private key and return an AccountAuthenticator containing the signature along with the
   * account's public key.
   * @param message - The signing message, represented as binary input in hexadecimal format.
   * @returns An instance of AccountAuthenticatorSingleKey containing the signature and the public key.
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(this.publicKey, this.sign(message));
  }

  /**
   * Sign a transaction using the account's private key.
   * This function returns an AccountAuthenticator that contains the signature of the transaction along with the account's public key.
   * @param transaction - The raw transaction to be signed.
   * @returns An AccountAuthenticatorSingleKey containing the signature of the transaction and the account's public key.
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorSingleKey {
    return new AccountAuthenticatorSingleKey(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Sign the given message using the account's private key.
   * @param message - The message to be signed in HexInput format.
   * @returns A new AnySignature containing the signature of the message.
   */
  sign(message: HexInput): AnySignature {
    return new AnySignature(this.privateKey.sign(message));
  }

  /**
   * Sign the given transaction using the account's private key.
   * This function generates a signing message for the transaction and then signs it.
   *
   * @param transaction - The transaction to be signed.
   * @returns Signature - The resulting signature for the signed transaction.
   */
  signTransaction(transaction: AnyRawTransaction): AnySignature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }

  // endregion
}
