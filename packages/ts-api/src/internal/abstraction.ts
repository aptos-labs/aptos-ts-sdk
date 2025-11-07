import {
  SimpleTransaction,
  InputGenerateTransactionOptions,
  TypeTagAddress,
  TypeTagStruct,
  stringStructTag,
} from "@aptos-labs/ts-transactions";
import { AccountAddressInput } from "@aptos-labs/ts-core";
import { generateTransaction } from "@aptos-labs/ts-transactions";
import { MoveFunctionId } from "@aptos-labs/ts-types";
import { AptosConfig } from "@aptos-labs/ts-client";
import { getFunctionParts } from "@aptos-labs/ts-core";

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
