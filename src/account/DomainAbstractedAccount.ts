import { sha3_256, sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { Serializer } from "../bcs/serializer";
import { AccountAddress, Signature } from "../core";
import {
  AccountAuthenticatorAbstraction,
  AnyRawTransaction,
  generateSigningMessageForTransaction,
} from "../transactions";
import { HexInput, SigningScheme } from "../types";
import { isValidFunctionInfo } from "../utils/helpers";
import { Account } from "./Account";
import { AbstractPublicKey, AbstractSignature } from "../core/crypto/abstraction";

type DomainAbstractedAccountArgs = {
  /**
   * The signer function signs transactions and returns the `authenticator` bytes in the `AbstractionAuthData`.
   *
   * @param digest - The SHA256 hash of the transaction signing message
   * @returns The `authenticator` bytes that can be used to verify the signature.
   */
  signer: (digest: HexInput) => HexInput;

  /**
   * The authentication function that will be used to verify the signature.
   *
   * @example
   * ```ts
   * const authenticationFunction = `${accountAddress}::permissioned_delegation::authenticate`;
   * ```
   */
  authenticationFunction: string;

  /**
   * The identity of the account.
   * Depends on the use cases, most of the time it is the public key of the source wallet
   */
  accountIdentity: Uint8Array;
};

export class DomainAbstractedAccount extends Account {
  /**
   * The identity of the account.
   * Depends on the use cases, most of the time it is the public key of the source wallet
   */
  readonly accountIdentity: Uint8Array;

  /**
   * The address of the account.
   * It is computed from the authentication function and the account identity
   */
  readonly accountAddress: AccountAddress;

  /**
   * The authentication function that will be used to verify the signature.
   *
   * @example
   * ```ts
   * const authenticationFunction = `${accountAddress}::permissioned_delegation::authenticate`;
   * ```
   */
  readonly authenticationFunction: string;

  /**
   * The domain separator used to calculate the DAA account address.
   */
  static readonly ADDRESS_DOMAIN_SEPERATOR: number = 5;

  /**
   * DAA does not have a Public Key, it is here because of the Account inheritance
   */
  readonly publicKey: AbstractPublicKey;
  /**
   * DAA does not have a Signing Scheme (it is based on the provided authentication and signer function),
   * it is here because of the Account inheritance
   */
  readonly signingScheme = SigningScheme.SingleKey;

  constructor({ signer, authenticationFunction, accountIdentity }: DomainAbstractedAccountArgs) {
    super();
    this.accountIdentity = accountIdentity;
    this.authenticationFunction = authenticationFunction;

    this.accountAddress = new AccountAddress(
      DomainAbstractedAccount.computeAccountAddress(authenticationFunction, accountIdentity),
    );
    this.sign = (digest: HexInput) => new AbstractSignature(signer(digest));

    this.publicKey = new AbstractPublicKey(this.accountAddress);
  }

  /**
   * Compute the account address of the DAA
   * The DAA account address is computed by hashing the function info and the account identity
   * and appending the domain separator (5)
   *
   * @param functionInfo - The authentication function
   * @param accountIdentifier - The account identity
   * @returns The account address
   */
  static computeAccountAddress(functionInfo: string, accountIdentifier: Uint8Array): Uint8Array {
    if (!isValidFunctionInfo(functionInfo)) {
      throw new Error(`Invalid authentication function ${functionInfo} passed into DomainAbstractedAccount`);
    }
    const [moduleAddress, moduleName, functionName] = functionInfo.split("::");

    const hash = sha3Hash.create();
    // Serialize and append the function info
    const serializer = new Serializer();
    AccountAddress.fromString(moduleAddress).serialize(serializer);
    serializer.serializeStr(moduleName);
    serializer.serializeStr(functionName);
    hash.update(serializer.toUint8Array());

    // Serialize and append the account identity
    const s2 = new Serializer();
    s2.serializeBytes(accountIdentifier);
    hash.update(s2.toUint8Array());

    // Append the domain separator
    hash.update(new Uint8Array([DomainAbstractedAccount.ADDRESS_DOMAIN_SEPERATOR]));

    return hash.digest();
  }

  sign: (message: HexInput) => AbstractSignature;

  signWithAuthenticator(message: HexInput): AccountAuthenticatorAbstraction {
    return new AccountAuthenticatorAbstraction(
      this.authenticationFunction,
      sha3_256(message),
      this.sign(sha3_256(message)).toUint8Array(),
      this.accountIdentity,
    );
  }

  signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticatorAbstraction {
    return this.signWithAuthenticator(generateSigningMessageForTransaction(transaction));
  }

  signTransaction(transaction: AnyRawTransaction): Signature {
    return this.sign(generateSigningMessageForTransaction(transaction));
  }
}
