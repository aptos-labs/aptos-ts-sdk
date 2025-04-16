import type { AccountAuthenticator } from "../transactions/authenticator/account";
import { HexInput, SigningScheme, SigningSchemeInput } from "../types";
import type { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { AuthenticationKey } from "../core/authenticationKey";
import { AccountPublicKey, Ed25519PrivateKey, PrivateKeyInput, Signature, VerifySignatureArgs } from "../core/crypto";
import { Ed25519Account } from "./Ed25519Account";
import { SingleKeyAccount } from "./SingleKeyAccount";
import { AnyRawTransaction } from "../transactions/types";
import { AptosConfig } from "../api";

/**
 * Arguments for creating an `Ed25519Account` from an `Ed25519PrivateKey`.
 * To use the SingleKey authentication scheme, set `legacy` to false.
 *
 * @param privateKey - The private key used to create the account.
 * @param address - Optional address for the account.
 * @param legacy - Indicates whether to use legacy authentication (default is true).
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface CreateEd25519AccountFromPrivateKeyArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
  legacy?: true;
}

/**
 * Arguments for creating a `SingleKeyAccount` using an `Ed25519PrivateKey`.
 * The `legacy` property must be set to false to utilize the `SingleKey` authentication scheme.
 *
 * @param privateKey - The Ed25519 private key used for account creation.
 * @param address - Optional account address input.
 * @param legacy - Must be false to enable the `SingleKey` authentication scheme.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface CreateEd25519SingleKeyAccountFromPrivateKeyArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
  legacy: false;
}

/**
 * Arguments for creating a `SingleKeyAccount` from a supported private key, excluding `Ed25519PrivateKey`.
 * The `legacy` argument is always false and cannot be set to true.
 *
 * @param privateKey - The private key used to create the account.
 * @param address - Optional address input for the account.
 * @param legacy - Always false; cannot be explicitly set to true.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface CreateSingleKeyAccountFromPrivateKeyArgs {
  privateKey: PrivateKeyInput;
  address?: AccountAddressInput;
  legacy?: false;
}

/**
 * Arguments for creating an `Account` from a private key when the key type is unknown at compile time.
 *
 * @param privateKey - The private key used to create the account.
 * @param address - Optional address for the account.
 * @param legacy - Optional flag indicating if the account is a legacy account.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface CreateAccountFromPrivateKeyArgs {
  privateKey: PrivateKeyInput;
  address?: AccountAddressInput;
  legacy?: boolean;
}

/**
 * Arguments for generating an Ed25519 account, specifying the signing scheme and legacy option.
 *
 * @param scheme - The signing scheme to use for the account.
 * @param legacy - Indicates if the account should be created in legacy mode.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface GenerateEd25519AccountArgs {
  scheme?: SigningSchemeInput.Ed25519;
  legacy?: true;
}

/**
 * Arguments for generating a `SingleKeyAccount` with an underlying `Ed25519PrivateKey`.
 * The `legacy` argument must be set to false to ensure an `Ed25519SingleKeyAccount` is returned.
 *
 * @param scheme - Optional signing scheme input for the account.
 * @param legacy - Indicates whether to use legacy account generation.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface GenerateEd25519SingleKeyAccountArgs {
  scheme?: SigningSchemeInput.Ed25519;
  legacy: false;
}

/**
 * Arguments for generating a `SingleKeyAccount` using a supported private key other than `Ed25519PrivateKey`.
 * The `legacy` argument is optional and defaults to false, and cannot be set to true.
 *
 * @param scheme - The signing scheme to use for the account.
 * @param legacy - Indicates whether to use legacy account generation (defaults to false).
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface GenerateSingleKeyAccountArgs {
  scheme: Exclude<SigningSchemeInput, SigningSchemeInput.Ed25519>;
  legacy?: false;
}

/**
 * Arguments for generating an opaque `Account` when the input signature scheme is unknown at compile time.
 *
 * @param scheme - The signing scheme to use for account generation.
 * @param legacy - Indicates whether to use legacy account generation methods.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface GenerateAccountArgs {
  scheme?: SigningSchemeInput;
  legacy?: boolean;
}

/**
 * Arguments for deriving a private key using a mnemonic phrase and a specified BIP44 path.
 *
 * @param path - The BIP44 derivation path for the key.
 * @param mnemonic - The mnemonic phrase used for key generation.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export interface PrivateKeyFromDerivationPathArgs {
  path: string;
  mnemonic: string;
}

/**
 * Abstract class representing a generic Aptos account.
 *
 * This class serves as a single entry point for account generation, allowing accounts to be created
 * either through `Account.generate()` or `Account.fromDerivationPath`. Although it is defined as an
 * abstract class, it should be treated as an interface and enforced using the `implements` keyword.
 *
 * Note: Generating an account instance does not create the account on-chain.
 * @group Implementation
 * @category Account (On-Chain Model)
 */
export abstract class Account {
  /**
   * Public key associated with the account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  abstract readonly publicKey: AccountPublicKey;

  /**
   * Account address associated with the account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  abstract readonly accountAddress: AccountAddress;

  /**
   * Signing scheme used to sign transactions
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  abstract signingScheme: SigningScheme;

  /**
   * Generates a new account based on the specified signing scheme and legacy option.
   * This function allows you to create an account with either the Ed25519 signing scheme or a different scheme as specified.
   *
   * @param args - The arguments for generating the account.
   * @param args.scheme - The signing scheme to use for account generation. Defaults to Ed25519.
   * @param args.legacy - Indicates whether to use the legacy account generation method. Defaults to true.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static generate(args?: GenerateEd25519AccountArgs): Ed25519Account;
  static generate(args: GenerateEd25519SingleKeyAccountArgs): SingleKeyAccount;
  static generate(args: GenerateSingleKeyAccountArgs): SingleKeyAccount;
  static generate(args: GenerateAccountArgs): Account;
  static generate(args: GenerateAccountArgs = {}) {
    const { scheme = SigningSchemeInput.Ed25519, legacy = true } = args;
    if (scheme === SigningSchemeInput.Ed25519 && legacy) {
      return Ed25519Account.generate();
    }
    return SingleKeyAccount.generate({ scheme });
  }

  /**
   * Creates an account from a given private key and address.
   * This function allows you to instantiate an account based on the provided private key,
   * and it can differentiate between legacy and non-legacy accounts.
   *
   * @param args - The arguments for creating the account.
   * @param args.privateKey - The private key used to create the account.
   * @param args.address - The address associated with the account.
   * @param args.legacy - A boolean indicating whether to create a legacy account (default is true).
   * @returns An instance of either Ed25519Account or SingleKeyAccount based on the provided private key.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static fromPrivateKey(args: CreateEd25519AccountFromPrivateKeyArgs): Ed25519Account;
  static fromPrivateKey(args: CreateSingleKeyAccountFromPrivateKeyArgs): SingleKeyAccount;
  static fromPrivateKey(args: CreateAccountFromPrivateKeyArgs): SingleKeyAccount;
  static fromPrivateKey(args: CreateAccountFromPrivateKeyArgs): Ed25519Account | SingleKeyAccount {
    const { privateKey, address, legacy = true } = args;
    if (privateKey instanceof Ed25519PrivateKey && legacy) {
      return new Ed25519Account({
        privateKey,
        address,
      });
    }
    return new SingleKeyAccount({ privateKey, address });
  }

  /**
   * @deprecated use `fromPrivateKey` instead.
   * Instantiates an account using a private key and a specified account address. This is primarily used to instantiate an
   * `Account` that has had its authentication key rotated.
   *
   * @param args - The arguments required to create an account from a private key.
   * @param args.privateKey - The underlying private key for the account.
   * @param args.address - The account address the `Account` will sign for.
   * @param args.legacy - Optional. If set to false, the keypair generated is a Unified keypair. Defaults to generating a Legacy
   * Ed25519 keypair.
   *
   * @returns Account
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static fromPrivateKeyAndAddress(args: CreateAccountFromPrivateKeyArgs) {
    return this.fromPrivateKey(args);
  }

  /**
   * Generates an account from a specified derivation path and mnemonic.
   * This function allows you to create an account using different signing schemes based on the provided arguments.
   *
   * @param args - The arguments for generating the account.
   * @param args.scheme - The signing scheme to use for account generation. Defaults to Ed25519.
   * @param args.mnemonic - The mnemonic phrase used to derive the account.
   * @param args.path - The derivation path used to generate the account.
   * @param args.legacy - A boolean indicating whether to use the legacy account generation method. Defaults to true.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static fromDerivationPath(args: GenerateEd25519AccountArgs & PrivateKeyFromDerivationPathArgs): Ed25519Account;
  static fromDerivationPath(
    args: GenerateEd25519SingleKeyAccountArgs & PrivateKeyFromDerivationPathArgs,
  ): SingleKeyAccount;
  static fromDerivationPath(args: GenerateSingleKeyAccountArgs & PrivateKeyFromDerivationPathArgs): SingleKeyAccount;
  static fromDerivationPath(args: GenerateAccountArgs & PrivateKeyFromDerivationPathArgs): Account;
  static fromDerivationPath(args: GenerateAccountArgs & PrivateKeyFromDerivationPathArgs) {
    const { scheme = SigningSchemeInput.Ed25519, mnemonic, path, legacy = true } = args;
    if (scheme === SigningSchemeInput.Ed25519 && legacy) {
      return Ed25519Account.fromDerivationPath({ mnemonic, path });
    }
    return SingleKeyAccount.fromDerivationPath({ scheme, mnemonic, path });
  }

  /**
   * Retrieve the authentication key for the associated account using the provided public key.
   * This key enables account owners to rotate their private key(s) associated with the account without changing the address that
   * hosts their account.
   * See here for more info: {@link https://aptos.dev/concepts/accounts#single-signer-authentication}
   *
   * @param args - The arguments for retrieving the authentication key.
   * @param args.publicKey - The public key of the account.
   * @returns The authentication key for the associated account.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  static authKey(args: { publicKey: AccountPublicKey }): AuthenticationKey {
    const { publicKey } = args;
    return publicKey.authKey();
  }

  /**
   * Sign a message using the available signing capabilities.
   * @param message the signing message, as binary input
   * @return the AccountAuthenticator containing the signature, together with the account's public key
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  abstract signWithAuthenticator(message: HexInput): AccountAuthenticator;

  /**
   * Sign a transaction using the available signing capabilities.
   * @param transaction the raw transaction
   * @return the AccountAuthenticator containing the signature of the transaction, together with the account's public key
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  abstract signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticator;

  /**
   * Sign the given message using the available signing capabilities.
   * @param message in HexInput format
   * @returns Signature
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  abstract sign(message: HexInput): Signature;

  /**
   * Sign the given transaction using the available signing capabilities.
   * @param transaction the transaction to be signed
   * @returns Signature
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  abstract signTransaction(transaction: AnyRawTransaction): Signature;

  /**
   * Verify the given message and signature with the public key.
   * This function helps ensure the integrity and authenticity of a message by validating its signature.
   *
   * @param args - The arguments for verifying the signature.
   * @param args.message - The raw message data in HexInput format.
   * @param args.signature - The signed message signature.
   * @returns A boolean indicating whether the signature is valid.
   * @group Implementation
   * @category Account (On-Chain Model)
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    return this.publicKey.verifySignature(args);
  }

  /**
   * Verify the given message and signature with the public key. It fetches any on chain state if needed for verification.
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
    return this.publicKey.verifySignatureAsync(args);
  }
}
