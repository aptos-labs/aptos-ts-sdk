import { AccountAddress, AccountAddressInput } from "../../core";
import {
  addDispatchableAuthenticationFunctionTransaction,
  removeDispatchableAuthenticationFunctionTransaction,
  removeDispatchableAuthenticatorTransaction,
} from "../../internal/abstraction";
import { view } from "../../internal/view";
import { InputGenerateTransactionOptions, TypeTagAddress } from "../../transactions";
import { MoveFunctionId } from "../../types";
import { getFunctionParts } from "../../utils/helpers";
import { AptosConfig } from "../aptosConfig";

export class AccountAbstraction {
  constructor(readonly config: AptosConfig) {}

  /**
   * Adds a dispatchable authentication function to the account.
   *
   * @example
   * ```ts
   * const txn = await aptos.abstraction.addDispatchableAuthenticationFunctionTransaction({
   *   accountAddress: alice.accountAddress,
   *   authenticationFunction: `${alice.accountAddress}::any_authenticator::authenticate`,
   * });
   *
   * const txn =  await aptos.signAndSubmitTransaction({ signer: alice, transaction});
   * await aptos.waitForTransaction({ transactionHash: txn.hash });
   * ```
   *
   * @param args.accountAddress - The account to add the authentication function to.
   * @param args.authenticationFunction - The authentication function info to add.
   * @param args.options - The options for the transaction.
   * @returns A transaction to add the authentication function to the account.
   */
  public async addDispatchableAuthenticationFunctionTransaction(args: {
    accountAddress: AccountAddressInput;
    authenticationFunction: string;
    options?: InputGenerateTransactionOptions;
  }) {
    const { accountAddress, authenticationFunction, options } = args;
    return addDispatchableAuthenticationFunctionTransaction({
      aptosConfig: this.config,
      authenticationFunction,
      sender: accountAddress,
      options,
    });
  }

  /**
   * Removes a dispatchable authentication function from the account.
   *
   * @example
   * ```ts
   * const txn = await aptos.abstraction.removeDispatchableAuthenticationFunctionTransaction({
   *   accountAddress: alice.accountAddress,
   *   authenticationFunction: `${alice.accountAddress}::any_authenticator::authenticate`,
   * });
   *
   * const txn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
   * await aptos.waitForTransaction({ transactionHash: txn.hash });
   * ```
   *
   * @param args.accountAddress - The account to remove the authentication function from.
   * @param args.authenticationFunction - The authentication function info to remove.
   * @param args.options - The options for the transaction.
   * @returns A transaction to remove the authentication function from the account.
   */
  public async removeDispatchableAuthenticationFunctionTransaction(args: {
    accountAddress: AccountAddressInput;
    authenticationFunction: string;
    options?: InputGenerateTransactionOptions;
  }) {
    const { accountAddress, authenticationFunction, options } = args;
    return removeDispatchableAuthenticationFunctionTransaction({
      aptosConfig: this.config,
      sender: accountAddress,
      authenticationFunction,
      options,
    });
  }

  /**
   * Removes a dispatchable authenticator from the account.
   *
   * @example
   * ```ts
   * const txn = await aptos.abstraction.removeDispatchableAuthenticatorTransaction({
   *   accountAddress: alice.accountAddress,
   * });
   *
   * const txn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
   * await aptos.waitForTransaction({ transactionHash: txn.hash });
   * ```
   *
   * @param args.accountAddress - The account to remove the authenticator from.
   * @param args.options - The options for the transaction.
   * @returns A transaction to remove the authenticator from the account.
   */
  public async removeDispatchableAuthenticatorTransaction(args: {
    accountAddress: AccountAddressInput;
    options?: InputGenerateTransactionOptions;
  }) {
    const { accountAddress, options } = args;
    return removeDispatchableAuthenticatorTransaction({ aptosConfig: this.config, sender: accountAddress, options });
  }

  /**
   * Gets the dispatchable authentication function for the account.
   *
   * @example
   * ```ts
   * const functionInfos = await aptos.abstraction.getDispatchableAuthenticationFunction({
   *   accountAddress: alice.accountAddress,
   * });
   *
   * if (functionInfos) {
   *   console.log(`Account ${alice.accountAddress.toString()} is using account abstraction!`);
   * } else {
   *   console.log(`Account ${alice.accountAddress.toString()} is not using account abstraction.`);
   * }
   * ```
   *
   * @param args.accountAddress - The account to get the dispatchable authentication function for.
   * @returns The dispatchable authentication function for the account.
   */
  public async getDispatchableAuthenticationFunction(args: { accountAddress: AccountAddressInput }) {
    const { accountAddress } = args;
    const [{ vec: functionInfoOption }] = await view<
      [{ vec: { function_name: string; module_name: string; module_address: string }[][] }]
    >({
      aptosConfig: this.config,
      payload: {
        function: "0x1::account_abstraction::dispatchable_authenticator",
        functionArguments: [AccountAddress.from(accountAddress)],
        abi: { typeParameters: [], parameters: [new TypeTagAddress()], returnTypes: [] },
      },
    });

    if (functionInfoOption.length === 0) return undefined;

    return functionInfoOption[0].map((functionInfo) => ({
      moduleAddress: AccountAddress.fromString(functionInfo.module_address),
      moduleName: functionInfo.module_name,
      functionName: functionInfo.function_name,
    }));
  }

  /**
   * Will return true if the account is abstracted, otherwise false.
   *
   * @example
   * ```ts
   * const isAccountAbstractionEnabled = await aptos.abstraction.isAccountAbstractionEnabled({
   *   accountAddress: alice.accountAddress,
   *   authenticationFunction: `${alice.accountAddress}::any_authenticator::authenticate`,
   * });
   * if (isAccountAbstractionEnabled) {
   *   console.log(`Account ${alice.accountAddress.toString()} is using account abstraction!`);
   * } else {
   *   console.log(`Account ${alice.accountAddress.toString()} is not using account abstraction.`);
   * }
   * ```
   *
   * @param args.accountAddress - The account to check.
   * @returns Whether the account is abstracted.
   */
  public isAccountAbstractionEnabled = async (args: {
    accountAddress: AccountAddressInput;
    authenticationFunction: string;
  }) => {
    const functionInfos = await this.getDispatchableAuthenticationFunction(args);
    const { moduleAddress, moduleName, functionName } = getFunctionParts(args.authenticationFunction as MoveFunctionId);
    return (
      functionInfos?.some(
        (functionInfo) =>
          AccountAddress.fromString(moduleAddress).equals(functionInfo.moduleAddress) &&
          moduleName === functionInfo.moduleName &&
          functionName === functionInfo.functionName,
      ) ?? false
    );
  };

  /**
   * Creates a transaction to enable account abstraction with the given authentication function.
   *
   * @example
   * ```ts
   * const txn = await aptos.abstraction.enableAccountAbstractionTransaction({
   *   accountAddress: alice.accountAddress,
   *   authenticationFunction: `{alice.accountAddress}::any_authenticator::authenticate`,
   * });
   *
   * const txn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
   * await aptos.waitForTransaction({ transactionHash: txn.hash });
   * ```
   *
   * @param args.accountAddress - The account to enable account abstraction for.
   * @param args.authenticationFunction - The authentication function info to use.
   * @param args.options - The options for the transaction.
   * @returns A transaction to enable account abstraction for the account.
   */
  public enableAccountAbstractionTransaction = this.addDispatchableAuthenticationFunctionTransaction;

  /**
   * Creates a transaction to disable account abstraction. If an authentication function is provided, it will specify to
   * remove the authentication function.
   *
   * @example
   * ```ts
   * const txn = await aptos.abstraction.disableAccountAbstractionTransaction({
   *   accountAddress: alice.accountAddress,
   *   authenticationFunction: `${alice.accountAddress}::any_authenticator::authenticate`,
   * });
   *
   * const txn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
   * await aptos.waitForTransaction({ transactionHash: txn.hash });
   * ```
   *
   * @param args.accountAddress - The account to disable account abstraction for.
   * @param args.authenticationFunction - The authentication function info to remove.
   * @param args.options - The options for the transaction.
   * @returns A transaction to disable account abstraction for the account.
   */
  public disableAccountAbstractionTransaction = async (args: {
    accountAddress: AccountAddressInput;
    authenticationFunction?: string;
    options?: InputGenerateTransactionOptions;
  }) => {
    const { accountAddress, authenticationFunction, options } = args;
    if (authenticationFunction) {
      return this.removeDispatchableAuthenticationFunctionTransaction({
        accountAddress,
        authenticationFunction,
        options,
      });
    }
    return this.removeDispatchableAuthenticatorTransaction({ accountAddress, options });
  };
}
