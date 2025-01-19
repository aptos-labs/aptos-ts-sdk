import { sha3_256 } from "@noble/hashes/sha3";
import { AccountAddress, AccountPublicKey } from "../core";
import { AbstractPublicKey, AbstractSignature } from "../core/crypto/abstraction";
import { SigningScheme, HexInput } from "../types";
import { Account } from "./Account";
import { AnyRawTransaction } from "../transactions/types";
import { generateSigningMessageForTransaction } from "../transactions/transactionBuilder/signingMessage";
import { AccountAuthenticatorAbstraction } from "../transactions/authenticator/account";
import { isValidFunctionInfo } from "../transactions/transactionBuilder/helpers";
import { Ed25519Account } from "./Ed25519Account";
import { Serializer } from "../bcs/serializer";

type AbstractedAccountConstructorArgs = {
  accountAddress: AccountAddress;
  signer: (digest: HexInput) => HexInput;
  authenticationFunction: string;
};

export class AbstractedAccount extends Account {
  public readonly publicKey: AccountPublicKey;

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

  public static fromPermissionedSigner({ signer }: { signer: Ed25519Account }) {
    return new AbstractedAccount({
      signer: (digest: HexInput) => {
        const serializer = new Serializer();
        signer.publicKey.serialize(serializer);
        signer.sign(digest).serialize(serializer);
        return serializer.toUint8Array();
      },
      accountAddress: signer.accountAddress,
      authenticationFunction: `${signer.accountAddress}::permissioned_delegation::authenticate`,
    });
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorAbstraction {
    return new AccountAuthenticatorAbstraction(
      this.authenticationFunction,
      sha3_256(message),
      this.sign(sha3_256(message)).toUint8Array(),
    );
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorAbstraction {
    return this.signWithAuthenticator(generateSigningMessageForTransaction(transaction));
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
