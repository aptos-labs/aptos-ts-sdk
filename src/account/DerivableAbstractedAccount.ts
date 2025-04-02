import { sha3_256 } from "@noble/hashes/sha3";
import { Serializer } from "../bcs/serializer";
import { AccountAddress } from "../core/accountAddress";
import { AccountAuthenticatorAbstraction } from "../transactions/authenticator/account";
import { HexInput } from "../types";
import { isValidFunctionInfo } from "../utils/helpers";
import { AbstractedAccount } from "./AbstractedAccount";

type DerivableAbstractedAccountArgs = {
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

  /**
   * The abstract public key that is used to identify the account.
   * Depends on the use cases, most of the time it is the public key of the source wallet
   */
  abstractPublicKey: Uint8Array;
};

export class DerivableAbstractedAccount extends AbstractedAccount {
  /**
   * The abstract public key that is used to identify the account.
   * Depends on the use cases, most of the time it is the public key of the source wallet
   */
  readonly abstractPublicKey: Uint8Array;

  /**
   * The domain separator used to calculate the DAA account address.
   */
  static readonly ADDRESS_DOMAIN_SEPERATOR: number = 5;

  constructor({ signer, authenticationFunction, abstractPublicKey }: DerivableAbstractedAccountArgs) {
    const daaAccountAddress = new AccountAddress(
      DerivableAbstractedAccount.computeAccountAddress(authenticationFunction, abstractPublicKey),
    );
    super({
      accountAddress: daaAccountAddress,
      signer,
      authenticationFunction,
    });
    this.abstractPublicKey = abstractPublicKey;
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
      throw new Error(`Invalid authentication function ${functionInfo} passed into DerivableAbstractedAccount`);
    }
    const [moduleAddress, moduleName, functionName] = functionInfo.split("::");

    const hash = sha3_256.create();
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
    hash.update(new Uint8Array([DerivableAbstractedAccount.ADDRESS_DOMAIN_SEPERATOR]));

    return hash.digest();
  }

  signWithAuthenticator(message: HexInput): AccountAuthenticatorAbstraction {
    return new AccountAuthenticatorAbstraction(
      this.authenticationFunction,
      sha3_256(message),
      this.sign(sha3_256(message)).value,
      this.abstractPublicKey,
    );
  }
}
