import type { AccountAuthenticator } from "../transactions/authenticator/account";
import { HexInput, SigningScheme, SigningSchemeInput } from "../types";
import type { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { AuthenticationKey } from "../core/authenticationKey";
import { AccountPublicKey, Ed25519PrivateKey, PrivateKey, Signature, VerifySignatureArgs } from "../core/crypto";
import { Ed25519Account } from "./Ed25519Account";
import { SingleKeyAccount } from "./SingleKeyAccount";
import { AnyRawTransaction } from "../transactions/types";

/**
 * Arguments for creating an `Ed25519Account` from an `Ed25519PrivateKey`.
 * This is the default input type when passing an `Ed25519PrivateKey`.
 * In order to use the SingleKey authentication scheme, `legacy` needs to be explicitly set to false.
 */
export interface CreateEd25519AccountFromPrivateKeyArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
  legacy?: true;
}

/**
 * Arguments for creating an `SingleKeyAccount` from an `Ed25519PrivateKey`.
 * The `legacy` argument needs to be explicitly set to false in order to
 * use the `SingleKey` authentication scheme.
 */
export interface CreateEd25519SingleKeyAccountFromPrivateKeyArgs {
  privateKey: Ed25519PrivateKey;
  address?: AccountAddressInput;
  legacy: false;
}

/**
 * Arguments for creating an `SingleKeyAccount` from any supported private key
 * that is not an `Ed25519PrivateKey`.
 * The `legacy` argument defaults to false and cannot be explicitly set to true.
 */
export interface CreateSingleKeyAccountFromPrivateKeyArgs {
  privateKey: Exclude<PrivateKey, Ed25519PrivateKey>;
  address?: AccountAddressInput;
  legacy?: false;
}

/**
 * Arguments for creating an opaque `Account` from any supported private key.
 * This is used when the private key type is not known at compilation time.
 */
export interface CreateAccountFromPrivateKeyArgs {
  privateKey: PrivateKey;
  address?: AccountAddressInput;
  legacy?: boolean;
}

/**
 * Arguments for generating an `Ed25519Account`.
 * This is the input type used by default.
 */
export interface GenerateEd25519AccountArgs {
  scheme?: SigningSchemeInput.Ed25519;
  legacy?: true;
}

/**
 * Arguments for generating an `SingleKeyAccount` with ah underlying `Ed25519PrivateKey`.
 * The `legacy` argument needs to be explicitly set to false,
 * otherwise an `Ed25519Account` will be returned instead.
 */
export interface GenerateEd25519SingleKeyAccountArgs {
  scheme?: SigningSchemeInput.Ed25519;
  legacy: false;
}

/**
 * Arguments for generating an `SingleKeyAccount` with any supported private key
 * that is not an `Ed25519PrivateKey`.
 * The `legacy` argument defaults to false and cannot be explicitly set to true.
 */
export interface GenerateSingleKeyAccountArgs {
  scheme: Exclude<SigningSchemeInput, SigningSchemeInput.Ed25519>;
  legacy?: false;
}

/**
 * Arguments for generating an opaque `Account`.
 * This is used when the input signature scheme is not known at compilation time.
 */
export interface GenerateAccountArgs {
  scheme?: SigningSchemeInput;
  legacy?: boolean;
}

/**
 * Arguments for deriving a private key from a mnemonic phrase and a BIP44 path.
 */
export interface PrivateKeyFromDerivationPathArgs {
  path: string;
  mnemonic: string;
}

/**
 * Interface for a generic Aptos account.
 *
 * The interface is defined as abstract class to provide a single entrypoint for account generation,
 * either through `Account.generate()` or `Account.fromDerivationPath`.
 * Despite this being an abstract class, it should be treated as an interface and enforced using
 * the `implements` keyword.
 *
 * Note: Generating an account instance does not create the account on-chain.
 */
export abstract class Account {
  /**
   * Public key associated with the account
   */
  abstract readonly publicKey: AccountPublicKey;

  /**
   * Account address associated with the account
   */
  abstract readonly accountAddress: AccountAddress;

  /**
   * Signing scheme used to sign transactions
   */
  abstract signingScheme: SigningScheme;

  /**
   * Derives an account from a randomly generated private key.
   * @param args.scheme The signature scheme to use, to generate the private key
   * @param args.legacy Whether to use a legacy authentication scheme, when applicable
   * @returns An account compatible with the provided signature scheme
   */
  static generate(args?: GenerateEd25519AccountArgs): Ed25519Account;
  static generate(args: GenerateEd25519SingleKeyAccountArgs): SingleKeyAccount;
  static generate(args: GenerateSingleKeyAccountArgs): SingleKeyAccount;
  static generate(args: GenerateAccountArgs): Account;

/**
 * Generates a new account based on the specified signing scheme and legacy option.
 * This function allows you to create accounts with different signing schemes, providing flexibility for various use cases.
 * 
 * @param args - The arguments for generating the account.
 * @param args.scheme - The signing scheme to use for the account. Defaults to `SigningSchemeInput.Ed25519`.
 * @param args.legacy - Indicates whether to use the legacy account generation method. Defaults to `true`.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, SigningSchemeInput } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Generate a new account using the default signing scheme
 *   const account = aptos.account.generate();
 * 
 *   console.log("Generated account:", account);
 * }
 * runExample().catch(console.error);
 * ```
 */
  static generate(args: GenerateAccountArgs = {}) {
    const { scheme = SigningSchemeInput.Ed25519, legacy = true } = args;
    if (scheme === SigningSchemeInput.Ed25519 && legacy) {
      return Ed25519Account.generate();
    }
    return SingleKeyAccount.generate({ scheme });
  }

  /**
   * Creates an account from the provided private key.
   *
   * @param args.privateKey a valid private key
   * @param args.address the account's address. If not provided, it will be derived from the public key.
   * @param args.legacy Whether to use a legacy authentication scheme, when applicable
   */
  static fromPrivateKey(args: CreateEd25519AccountFromPrivateKeyArgs): Ed25519Account;
  static fromPrivateKey(args: CreateEd25519SingleKeyAccountFromPrivateKeyArgs): SingleKeyAccount;
  static fromPrivateKey(args: CreateSingleKeyAccountFromPrivateKeyArgs): SingleKeyAccount;
  static fromPrivateKey(args: CreateAccountFromPrivateKeyArgs): Account;

/**
 * Creates an account from a given private key and address, optionally supporting legacy Ed25519 accounts.
 * This function helps in initializing accounts for users who have existing private keys.
 * 
 * @param args - The arguments required to create the account.
 * @param args.privateKey - The private key used to create the account. This can be an instance of Ed25519PrivateKey.
 * @param args.address - The address associated with the account. 
 * @param args.legacy - A boolean indicating whether to create a legacy Ed25519 account. Defaults to true.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Create an account from a private key
 *   const privateKey = Ed25519PrivateKey.fromString("0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"); // replace with a real private key
 *   const address = "0x1"; // replace with a real address
 * 
 *   const newAccount = Account.fromPrivateKey({ privateKey, address, legacy: true });
 * 
 *   console.log("New account created:", newAccount);
 * }
 * runExample().catch(console.error);
 * ```
 */

  static fromPrivateKey(args: CreateAccountFromPrivateKeyArgs) {
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
 * Instantiates an account using a private key and a specified account address.
 * This is primarily used to create an `Account` that has had its authentication key rotated.
 * 
 * @param args - The arguments for creating the account.
 * @param args.privateKey - The underlying private key for the account.
 * @param args.address - The account address the `Account` will sign for.
 * @param args.legacy - Optional. If set to false, the keypair generated is a Unified keypair. Defaults to generating a Legacy Ed25519 keypair.
 * 
 * @returns Account
 * 
 * @deprecated use `fromPrivateKey` instead.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const privateKey = "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"; // replace with a real private key
 *   const address = "0x1"; // replace with a real account address
 * 
 *   // Instantiate the account from the private key and address
 *   const account = await aptos.fromPrivateKeyAndAddress({ privateKey, address });
 * 
 *   console.log(account);
 * }
 * runExample().catch(console.error);
 * ```
 */


  static fromPrivateKeyAndAddress(args: CreateAccountFromPrivateKeyArgs) {
    return this.fromPrivateKey(args);
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
  static fromDerivationPath(args: GenerateEd25519AccountArgs & PrivateKeyFromDerivationPathArgs): Ed25519Account;
  static fromDerivationPath(
    args: GenerateEd25519SingleKeyAccountArgs & PrivateKeyFromDerivationPathArgs,
  ): SingleKeyAccount;
  static fromDerivationPath(args: GenerateSingleKeyAccountArgs & PrivateKeyFromDerivationPathArgs): SingleKeyAccount;
  static fromDerivationPath(args: GenerateAccountArgs & PrivateKeyFromDerivationPathArgs): Account;

/**
 * Generates an account from a specified derivation path using a mnemonic phrase.
 * This function allows you to create accounts based on a hierarchical deterministic (HD) wallet structure.
 * 
 * @param args - The arguments for generating the account.
 * @param args.scheme - The signing scheme to use. Defaults to Ed25519 if not specified.
 * @param args.mnemonic - The mnemonic phrase used to derive the account.
 * @param args.path - The derivation path to use for account generation.
 * @param args.legacy - A boolean indicating whether to use legacy behavior. Defaults to true.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * import { SigningSchemeInput } from "@aptos-labs/ts-sdk"; // Importing the signing scheme input
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const mnemonic = "test test test test test test test test test test test test"; // replace with a real mnemonic
 *   const path = "m/44'/637'/0'/0'/0'"; // replace with a real derivation path
 * 
 *   // Generating an account from the derivation path
 *   const account = aptos.account.fromDerivationPath({
 *     scheme: SigningSchemeInput.Ed25519,
 *     mnemonic,
 *     path,
 *   });
 * 
 *   console.log("Generated Account Address:", account.accountAddress);
 * }
 * runExample().catch(console.error);
 * ```
 */

  static fromDerivationPath(args: GenerateAccountArgs & PrivateKeyFromDerivationPathArgs) {
    const { scheme = SigningSchemeInput.Ed25519, mnemonic, path, legacy = true } = args;
    if (scheme === SigningSchemeInput.Ed25519 && legacy) {
      return Ed25519Account.fromDerivationPath({ mnemonic, path });
    }
    return SingleKeyAccount.fromDerivationPath({ scheme, mnemonic, path });
  }

  /**
   * @deprecated use `publicKey.authKey()` instead.
   * This key enables account owners to rotate their private key(s)
   * associated with the account without changing the address that hosts their account.
   * See here for more info: {@link https://aptos.dev/concepts/accounts#single-signer-authentication}
   *
   * @param args.publicKey PublicKey - public key of the account
   * @returns The authentication key for the associated account
   */
  static authKey(args: { publicKey: AccountPublicKey }): AuthenticationKey {
    const { publicKey } = args;
    return publicKey.authKey();
  }

  /**
   * Sign a message using the available signing capabilities.
   * @param message the signing message, as binary input
   * @return the AccountAuthenticator containing the signature, together with the account's public key
   */
  abstract signWithAuthenticator(message: HexInput): AccountAuthenticator;

  /**
   * Sign a transaction using the available signing capabilities.
   * @param transaction the raw transaction
   * @return the AccountAuthenticator containing the signature of the transaction, together with the account's public key
   */
  abstract signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticator;

  /**
   * Sign the given message using the available signing capabilities.
   * @param message in HexInput format
   * @returns Signature
   */
  abstract sign(message: HexInput): Signature;

  /**
   * Sign the given transaction using the available signing capabilities.
   * @param transaction the transaction to be signed
   * @returns Signature
   */
  abstract signTransaction(transaction: AnyRawTransaction): Signature;

  /**
   * Verify the given message and signature with the public key.
   * @param args.message raw message data in HexInput format
   * @param args.signature signed message Signature
   * @returns
   */
  verifySignature(args: VerifySignatureArgs): boolean {
    return this.publicKey.verifySignature(args);
  }
}