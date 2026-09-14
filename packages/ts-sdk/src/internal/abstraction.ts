import {
  SimpleTransaction,
  InputGenerateTransactionOptions,
  TypeTagAddress,
  TypeTagStruct,
  stringStructTag,
} from "../transactions/index.js";
import { AccountAddressInput } from "../core/index.js";
import { generateTransaction } from "./transactionSubmission.js";
import { MoveFunctionId } from "../types/index.js";
import { AptosConfig } from "../api/aptosConfig.js";
import { getFunctionParts } from "../utils/helpers.js";

/**
 * Builds a transaction that adds a dispatchable authentication function to an account.
 *
 * @param args - The arguments for adding the authentication function.
 * @param args.aptosConfig - The Aptos configuration to use.
 * @param args.sender - The account to add the authentication function to.
 * @param args.authenticationFunction - The authentication function to add.
 * @param args.withFeePayer - Whether to build a fee-payer transaction.
 * @param args.options - Optional transaction generation options.
 * @group Implementation
 */
export async function addAuthenticationFunctionTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  authenticationFunction: MoveFunctionId;
  withFeePayer?: boolean;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, authenticationFunction, withFeePayer, options } = args;
  const { moduleAddress, moduleName, functionName } = getFunctionParts(authenticationFunction);
  return generateTransaction({
    aptosConfig,
    sender,
    withFeePayer,
    data: {
      function: "0x1::account_abstraction::add_authentication_function",
      typeArguments: [],
      functionArguments: [moduleAddress, moduleName, functionName],
      abi: {
        typeParameters: [],
        parameters: [new TypeTagAddress(), new TypeTagStruct(stringStructTag()), new TypeTagStruct(stringStructTag())],
      },
    },
    options,
  });
}

/**
 * Builds a transaction that removes a dispatchable authentication function from an account.
 *
 * @param args - The arguments for removing the authentication function.
 * @param args.aptosConfig - The Aptos configuration to use.
 * @param args.sender - The account to remove the authentication function from.
 * @param args.authenticationFunction - The authentication function to remove.
 * @param args.withFeePayer - Whether to build a fee-payer transaction.
 * @param args.options - Optional transaction generation options.
 * @group Implementation
 */
export async function removeAuthenticationFunctionTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  authenticationFunction: MoveFunctionId;
  withFeePayer?: boolean;
  options?: InputGenerateTransactionOptions;
}) {
  const { aptosConfig, sender, authenticationFunction, withFeePayer, options } = args;
  const { moduleAddress, moduleName, functionName } = getFunctionParts(authenticationFunction);
  return generateTransaction({
    aptosConfig,
    sender,
    withFeePayer,
    data: {
      function: "0x1::account_abstraction::remove_authentication_function",
      typeArguments: [],
      functionArguments: [moduleAddress, moduleName, functionName],
      abi: {
        typeParameters: [],
        parameters: [new TypeTagAddress(), new TypeTagStruct(stringStructTag()), new TypeTagStruct(stringStructTag())],
      },
    },
    options,
  });
}

/**
 * Builds a transaction that removes the dispatchable authenticator from an account.
 *
 * @param args - The arguments for removing the authenticator.
 * @param args.aptosConfig - The Aptos configuration to use.
 * @param args.sender - The account to remove the authenticator from.
 * @param args.withFeePayer - Whether to build a fee-payer transaction.
 * @param args.options - Optional transaction generation options.
 * @group Implementation
 */
export async function removeDispatchableAuthenticatorTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  withFeePayer?: boolean;
  options?: InputGenerateTransactionOptions;
}) {
  const { aptosConfig, sender, withFeePayer, options } = args;
  return generateTransaction({
    aptosConfig,
    sender,
    withFeePayer,
    data: {
      function: "0x1::account_abstraction::remove_authenticator",
      typeArguments: [],
      functionArguments: [],
      abi: { typeParameters: [], parameters: [] },
    },
    options,
  });
}
