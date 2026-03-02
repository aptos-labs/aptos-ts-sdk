import {
  SimpleTransaction,
  InputGenerateTransactionOptions,
  TypeTagAddress,
  TypeTagStruct,
  stringStructTag,
} from "../transactions";
import { AccountAddressInput } from "../core";
import { generateTransaction } from "./transactionSubmission";
import { MoveFunctionId } from "../types";
import { AptosConfig } from "../api/aptosConfig";
import { getFunctionParts } from "../utils/helpers";

export async function addAuthenticationFunctionTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  authenticationFunction: string;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, authenticationFunction, options } = args;
  const { moduleAddress, moduleName, functionName } = getFunctionParts(authenticationFunction as MoveFunctionId);
  return generateTransaction({
    aptosConfig,
    sender,
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

export async function removeAuthenticationFunctionTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  authenticationFunction: string;
  options?: InputGenerateTransactionOptions;
}) {
  const { aptosConfig, sender, authenticationFunction, options } = args;
  const { moduleAddress, moduleName, functionName } = getFunctionParts(authenticationFunction as MoveFunctionId);
  return generateTransaction({
    aptosConfig,
    sender,
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

export async function removeDispatchableAuthenticatorTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
}) {
  const { aptosConfig, sender, options } = args;
  return generateTransaction({
    aptosConfig,
    sender,
    data: {
      function: "0x1::account_abstraction::remove_authenticator",
      typeArguments: [],
      functionArguments: [],
      abi: { typeParameters: [], parameters: [] },
    },
    options,
  });
}
