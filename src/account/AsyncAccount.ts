import type { AccountAuthenticator } from "../transactions/authenticator/account";
import { HexInput, SigningScheme } from "../types";
import type { AccountAddress } from "../core/accountAddress";
import { AccountPublicKey, Signature, VerifySignatureArgs } from "../core/crypto";
import { AnyRawTransaction } from "../transactions/types";

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
export abstract class AsyncAccount {
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
   * Sign a message using the available signing capabilities.
   * @param message the signing message, as binary input
   * @return the AccountAuthenticator containing the signature, together with the account's public key
   */
  abstract signWithAuthenticator(message: HexInput): AccountAuthenticator | Promise<AccountAuthenticator>;

  /**
   * Sign a transaction using the available signing capabilities.
   * @param transaction the raw transaction
   * @return the AccountAuthenticator containing the signature of the transaction, together with the account's public key
   */
  abstract signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticator | Promise<AccountAuthenticator>;

  /**
   * Sign the given message using the available signing capabilities.
   * @param message in HexInput format
   * @returns Signature
   */
  abstract sign(message: HexInput): Signature | Promise<Signature>;

  /**
   * Sign the given transaction using the available signing capabilities.
   * @param transaction the transaction to be signed
   * @returns Signature
   */
  abstract signTransaction(transaction: AnyRawTransaction): Signature | Promise<Signature>;

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
