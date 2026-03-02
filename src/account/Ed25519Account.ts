import { AccountAuthenticatorEd25519 } from "../transactions/authenticator/account";
import { HexInput, SigningScheme } from "../types";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { Ed25519PrivateKey, Ed25519PublicKey, Ed25519Signature, Signature } from "../core/crypto";
import type { Account } from "./Account";
import { AnyRawTransaction } from "../transactions/types";
import { generateSigningMessageForTransaction } from "../transactions/transactionBuilder/signingMessage";
import { AptosConfig } from "../api";

/**
 * Arguments required to create an instance of an Ed25519 signer.
 *
 * @param privateKey - The private key used for signing.
 * @param address - Optional account address associated with the signer.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface Ed25519SignerConstructorArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
}

/**
 * Arguments for creating an Ed25519 signer from a derivation path.
 *
 * @param path - The derivation path for the Ed25519 key.
 * @param mnemonic - The mnemonic phrase used to generate the key.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface Ed25519SignerFromDerivationPathArgs {
  path: string;
  mnemonic: string;
}

/**
 * Arguments required to verify an Ed25519 signature against a given message.
 *
 * @param message - The message to be verified, represented in hexadecimal format.
 * @param signature - The Ed25519 signature to validate.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface VerifyEd25519SignatureArgs {
  message: HexInput;
  signature: Ed25519Signature;
}

/**
 * Represents an Ed25519 account that provides signing capabilities through an Ed25519 private key.
 * This class allows for the creation of accounts, signing messages and transactions, and verifying signatures.
 *
 * Note: Generating an instance of this class does not create the account on-chain.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export class Ed25519Account implements Account {
  /**
   * Private key associated with the account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  readonly privateKey: Ed25519PrivateKey;

  readonly publicKey: Ed25519PublicKey;

  readonly accountAddress: AccountAddress;

  readonly signingScheme = SigningScheme.Ed25519;

  // region Constructors

  /**
   * Creates an instance of the Ed25519Signer with the specified parameters.
   * This constructor initializes the private key, public key, and account address for the signer.
   *
   * @param args - The constructor arguments for the Ed25519Signer.
   * @param args.privateKey - The private key used for signing.
   * @param args.address - The optional account address; if not provided, it will derive the address from the public key.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  constructor(args: Ed25519SignerConstructorArgs) {
    const { privateKey, address } = args;
    this.privateKey = privateKey;
    this.publicKey = privateKey.publicKey();
    this.accountAddress = address ? AccountAddress.from(address) : this.publicKey.authKey().derivedAddress();
  }

  /**
   * Generates a new Ed25519 account using a randomly generated private key.
   * This function is useful for creating a signer that can be used for cryptographic operations.
   *
   * @returns {Ed25519Account} The newly generated Ed25519 account.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static generate(): Ed25519Account {
    const privateKey = Ed25519PrivateKey.generate();
    return new Ed25519Account({ privateKey });
  }

  /**
   * Derives an Ed25519 account using a specified BIP44 path and mnemonic seed phrase.
   *
   * @param args - The arguments for deriving the account.
   * @param args.path - The BIP44 derive hardened path, e.g., m/44'/637'/0'/0'/0'.
   * Detailed description: {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki}
   * @param args.mnemonic - The mnemonic seed phrase of the account.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static fromDerivationPath(args: Ed25519SignerFromDerivationPathArgs) {
    const { path, mnemonic } = args;
    const privateKey = Ed25519PrivateKey.fromDerivationPath(path, mnemonic);
    return new Ed25519Account({ privateKey });
  }
  // endregion

  // region Account
  /**
   * Verify the given message and signature with the public key.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.message - Raw message data in HexInput format.
   * @param args.signature - Signed message signature.
   * @returns A boolean indicating whether the signature is valid.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  verifySignature(args: VerifyEd25519SignatureArgs): boolean {
    return this.publicKey.verifySignature(args);
  }

  /**
   * Verify the given message and signature with the public key.
   *
   * Ed25519 signatures do not depend on chain state, so this function is equivalent to the synchronous verifySignature method.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.aptosConfig - The configuration object for connecting to the Aptos network
   * @param args.message - Raw message data in HexInput format.
   * @param args.signature - Signed message signature.
   * @returns A boolean indicating whether the signature is valid.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  async verifySignatureAsync(args: {
    aptosConfig: AptosConfig;
    message: HexInput;
    signature: Signature;
  }): Promise<boolean> {
    return this.publicKey.verifySignatureAsync({
      ...args,
      signature: args.signature,
    });
  }

  /**
   * Sign a message using the account's Ed25519 private key.
   * This function returns an AccountAuthenticator containing the signature along with the account's public key.
   *
   * @param message - The signing message, represented as hexadecimal input.
   * @returns An AccountAuthenticator containing the signature and the account's public key.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  signWithAuthenticator(message: HexInput): AccountAuthenticatorEd25519 {
    return new AccountAuthenticatorEd25519(this.publicKey, this.privateKey.sign(message));
  }

  /**
   * Sign a transaction using the account's Ed25519 private key.
   * This function returns an AccountAuthenticator that contains the signature of the transaction along with the account's public key.
   *
   * @param transaction - The raw transaction to be signed.
   * @returns An AccountAuthenticator containing the signature and the public key.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorEd25519 {
    return new AccountAuthenticatorEd25519(this.publicKey, this.signTransaction(transaction));
  }

  /**
   * Sign the given message using the account's Ed25519 private key.
   * @param message - The message to be signed in HexInput format.
   * @returns Signature - The resulting signature of the signed message.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  sign(message: HexInput): Ed25519Signature {
    return this.privateKey.sign(message);
  }

  /**
   * Sign the given transaction using the available signing capabilities.
   * This function helps ensure that the transaction is properly authenticated before submission.
   *
   * @param transaction - The transaction to be signed.
   * @returns Signature - The resulting signature for the transaction.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  signTransaction(transaction: AnyRawTransaction): Ed25519Signature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }

  // endregion
}
