import type { AccountAuthenticator } from "../transactions/authenticator/account";
import { HexInput, SigningScheme } from "../types";
import type { AccountAddress } from "../core/accountAddress";
import { AccountPublicKey, Signature, VerifySignatureArgs } from "../core/crypto";
import { AnyRawTransaction } from "../transactions/types";

/**
 * Interface for a version of Account where the actions are async
 *
 * Async actions can be useful in cases when signing a transaction requires making an API call
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
  abstract signWithAuthenticator(message: HexInput): Promise<AccountAuthenticator>;

  /**
   * Sign a transaction using the available signing capabilities.
   * @param transaction the raw transaction
   * @return the AccountAuthenticator containing the signature of the transaction, together with the account's public key
   */
  abstract signTransactionWithAuthenticator(transaction: AnyRawTransaction): Promise<AccountAuthenticator>;

  /**
   * Sign the given message using the available signing capabilities.
   * @param message in HexInput format
   * @returns Signature
   */
  abstract sign(message: HexInput): Promise<Signature>;

  /**
   * Sign the given transaction using the available signing capabilities.
   * @param transaction the transaction to be signed
   * @returns Signature
   */
  abstract signTransaction(transaction: AnyRawTransaction): Promise<Signature>;

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
