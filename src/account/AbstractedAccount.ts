import { sha3_256 } from "@noble/hashes/sha3.js";
import { AccountAddress } from "../core/index.js";
import { Hex } from "../core/hex.js";
import { AbstractPublicKey, AbstractSignature } from "../core/crypto/abstraction.js";
import { SigningScheme, HexInput } from "../types/index.js";
import { Account } from "./Account.js";
import { AnyRawTransaction } from "../transactions/types.js";
import {
  generateSigningMessage,
  generateSigningMessageForTransaction,
} from "../transactions/transactionBuilder/signingMessage.js";
import { AccountAbstractionMessage, AccountAuthenticatorAbstraction } from "../transactions/authenticator/account.js";
import { Ed25519Account } from "./Ed25519Account.js";
import { Serializer } from "../bcs/serializer.js";
import { isValidFunctionInfo } from "../utils/helpers.js";
import { ACCOUNT_ABSTRACTION_SIGNING_DATA_SALT } from "../utils/const.js";

type AbstractedAccountConstructorArgs = {
  /**
   * The account address of the account.
   */
  accountAddress: AccountAddress;
  /**
   * The signer function signs transactions and returns the `authenticator` bytes in the `AbstractionAuthData`.
   *
   * @param digest - The SHA256 hash of the transaction signing message
   * @returns The `authenticator` bytes that can be used to verify the signature.
   */
  signer: (digest: HexInput) => Uint8Array;
  /**
   * The authentication function that will be used to verify the signature.
   *
   * @example
   * ```ts
   * const authenticationFunction = `${accountAddress}::permissioned_delegation::authenticate`;
   * ```
   */
  authenticationFunction: string;
};

export class AbstractedAccount extends Account {
  public readonly publicKey: AbstractPublicKey;

  readonly accountAddress: AccountAddress;

  readonly authenticationFunction: string;

  readonly signingScheme = SigningScheme.SingleKey;

  constructor({ signer, accountAddress, authenticationFunction }: AbstractedAccountConstructorArgs) {
    super();

    if (!isValidFunctionInfo(authenticationFunction)) {
      throw new Error(`Invalid authentication function ${authenticationFunction} passed into AbstractedAccount`);
    }

    this.authenticationFunction = authenticationFunction;
    this.accountAddress = accountAddress;
    this.publicKey = new AbstractPublicKey(this.accountAddress);
    this.sign = (digest: HexInput) => new AbstractSignature(signer(digest));
  }

  /**
   * Creates an `AbstractedAccount` from an `Ed25519Account` that has a permissioned signer function and
   * using the `0x1::permissioned_delegation::authenticate` function to verify the signature.
   *
   * @param signer - The `Ed25519Account` that can be used to sign permissioned transactions.
   * @returns The `AbstractedAccount`
   */
  public static fromPermissionedSigner({
    signer,
    accountAddress,
  }: {
    signer: Ed25519Account;
    accountAddress?: AccountAddress;
  }) {
    return new AbstractedAccount({
      signer: (digest: HexInput) => {
        const serializer = new Serializer();
        signer.publicKey.serialize(serializer);
        signer.sign(digest).serialize(serializer);
        return serializer.toUint8Array();
      },
      accountAddress: accountAddress ?? signer.accountAddress,
      authenticationFunction: "0x1::permissioned_delegation::authenticate",
    });
  }

  public static generateAccountAbstractionMessage(message: HexInput, functionInfo: string): HexInput {
    const accountAbstractionMessage = new AccountAbstractionMessage(message, functionInfo);
    return generateSigningMessage(accountAbstractionMessage.bcsToBytes(), ACCOUNT_ABSTRACTION_SIGNING_DATA_SALT);
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorAbstraction {
    const messageBytes = Hex.fromHexInput(message).toUint8Array();
    return new AccountAuthenticatorAbstraction(
      this.authenticationFunction,
      sha3_256(messageBytes),
      this.sign(sha3_256(messageBytes)).toUint8Array(),
    );
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorAbstraction {
    const message = AbstractedAccount.generateAccountAbstractionMessage(
      generateSigningMessageForTransaction(transaction),
      this.authenticationFunction,
    );
    return this.signWithAuthenticator(message);
  }

  sign: (message: HexInput) => AbstractSignature;

  signTransaction(transaction: AnyRawTransaction): AbstractSignature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }

  /**
   * Update the signer function for the account. This can be done after asynchronous operations are complete
   * to update the context of the signer function.
   *
   * @param signer - The new signer function to use for the account.
   */
  public setSigner(signer: (digest: HexInput) => HexInput): void {
    this.sign = (digest: HexInput) => new AbstractSignature(signer(digest));
  }
}
