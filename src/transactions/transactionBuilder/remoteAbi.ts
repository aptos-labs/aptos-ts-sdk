// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { parseTypeTag } from "../typeTag/parser";
import {
  TypeTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagStruct,
  TypeTagU128,
  TypeTagU16,
  TypeTagU256,
  TypeTagU32,
  TypeTagU64,
  TypeTagU8,
} from "../typeTag";
import { AptosConfig } from "../../api/aptosConfig";
import {
  EntryFunctionArgumentTypes,
  SimpleEntryFunctionArgumentTypes,
  EntryFunctionABI,
  ViewFunctionABI,
  FunctionABI,
  TypeArgument,
} from "../types";
import { Bool, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../../bcs";
import { AccountAddress } from "../../core";
import { getModule } from "../../internal/account";
import {
  findFirstNonSignerArg,
  isBcsAddress,
  isBcsBool,
  isBcsString,
  isBcsU128,
  isBcsU16,
  isBcsU256,
  isBcsU32,
  isBcsU64,
  isBcsU8,
  isBool,
  isEncodedEntryFunctionArgument,
  isLargeNumber,
  isEmptyOption,
  isString,
  throwTypeMismatch,
  convertNumber,
} from "./helpers";
import { MoveFunction } from "../../types";

const TEXT_ENCODER = new TextEncoder();

/**
 * Convert type arguments to only type tags, allowing for string representations of type tags
 */
export function standardizeTypeTags(typeArguments?: Array<TypeArgument>): Array<TypeTag> {
  return (
    typeArguments?.map((typeArg: TypeArgument): TypeTag => {
      // Convert to TypeTag if it's a string representation
      if (isString(typeArg)) {
        return parseTypeTag(typeArg);
      }
      return typeArg;
    }) ?? []
  );
}

/**
 * Fetches a function ABI from the on-chain module ABI.  It doesn't validate whether it's a view or entry function.
 * @param moduleAddress
 * @param moduleName
 * @param functionName
 * @param aptosConfig
 */
export async

/**
 * Fetches the ABI of a specified function from a given module.
 * This allows you to retrieve detailed information about a specific function's interface.
 * 
 * @param moduleAddress - The address of the module containing the function.
 * @param moduleName - The name of the module where the function is defined.
 * @param functionName - The name of the function whose ABI you want to fetch.
 * @param aptosConfig - The configuration settings for connecting to the Aptos network.
 * @returns The ABI of the specified function, or undefined if not found.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching the ABI of a specific function
 *   const functionAbi = await aptos.fetchFunctionAbi(
 *     "0x1", // replace with a real module address
 *     "MyModule", // replace with a real module name
 *     "myFunction", // replace with a real function name
 *     config
 *   );
 * 
 *   console.log(functionAbi);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function fetchFunctionAbi(
  moduleAddress: string,
  moduleName: string,
  functionName: string,
  aptosConfig: AptosConfig,
): Promise<MoveFunction | undefined> {
  // This fetch from the API is currently cached
  const module = await getModule({ aptosConfig, accountAddress: moduleAddress, moduleName });

  if (module.abi) {
    return module.abi.exposed_functions.find((func) => func.name === functionName);
  }

  return undefined;
}

/**
 * Fetches the ABI for an entry function from the module
 *
 * @param moduleAddress
 * @param moduleName
 * @param functionName
 * @param aptosConfig
 */
export async

/**
 * Fetches the ABI for an entry function from a specified module.
 * This function helps you retrieve the function's parameters and type information for further interaction.
 * 
 * @param moduleAddress - The address of the module containing the function.
 * @param moduleName - The name of the module containing the function.
 * @param functionName - The name of the entry function to fetch.
 * @param aptosConfig - The configuration object for Aptos.
 * @returns An object containing the number of signers, type parameters, and parameters of the entry function.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching the ABI for an entry function
 *   const entryFunctionAbi = await aptos.fetchEntryFunctionAbi(
 *     "0x1", // replace with a real module address
 *     "coin", // replace with a real module name
 *     "mint", // replace with a real function name
 *     config
 *   );
 * 
 *   console.log(entryFunctionAbi);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function fetchEntryFunctionAbi(
  moduleAddress: string,
  moduleName: string,
  functionName: string,
  aptosConfig: AptosConfig,
): Promise<EntryFunctionABI> {
  const functionAbi = await fetchFunctionAbi(moduleAddress, moduleName, functionName, aptosConfig);

  // If there's no ABI, then the function is invalid
  if (!functionAbi) {
    throw new Error(`Could not find entry function ABI for '${moduleAddress}::${moduleName}::${functionName}'`);
  }

  // Non-entry functions also can't be used
  if (!functionAbi.is_entry) {
    throw new Error(`'${moduleAddress}::${moduleName}::${functionName}' is not an entry function`);
  }

  // Remove the signer arguments
  const numSigners = findFirstNonSignerArg(functionAbi);
  const params: TypeTag[] = [];
  for (let i = numSigners; i < functionAbi.params.length; i += 1) {
    params.push(parseTypeTag(functionAbi.params[i], { allowGenerics: true }));
  }

  return {
    signers: numSigners,
    typeParameters: functionAbi.generic_type_params,
    parameters: params,
  };
}

/**
 * Fetches the ABI for a view function from the module
 *
 * @param moduleAddress
 * @param moduleName
 * @param functionName
 * @param aptosConfig
 */
export async

/**
 * Fetches the ABI for a specified view function from a given module address.
 * This function allows you to retrieve the details of a view function's parameters and return types.
 * 
 * @param moduleAddress - The address of the module containing the view function.
 * @param moduleName - The name of the module containing the view function.
 * @param functionName - The name of the view function whose ABI is to be fetched.
 * @param aptosConfig - The configuration object for the Aptos client.
 * 
 * @returns An object containing the type parameters, parameters, and return types of the view function.
 * 
 * @throws Error if the function ABI cannot be found or if the function is not a view function.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fetching the ABI for a view function
 *   const abi = await aptos.fetchViewFunctionAbi("0x1", "MyModule", "myViewFunction", config);
 * 
 *   console.log(abi);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function fetchViewFunctionAbi(
  moduleAddress: string,
  moduleName: string,
  functionName: string,
  aptosConfig: AptosConfig,
): Promise<ViewFunctionABI> {
  const functionAbi = await fetchFunctionAbi(moduleAddress, moduleName, functionName, aptosConfig);

  // If there's no ABI, then the function is invalid
  if (!functionAbi) {
    throw new Error(`Could not find view function ABI for '${moduleAddress}::${moduleName}::${functionName}'`);
  }

  // Non-view functions can't be used
  if (!functionAbi.is_view) {
    throw new Error(`'${moduleAddress}::${moduleName}::${functionName}' is not an view function`);
  }

  // Type tag parameters for the function
  const params: TypeTag[] = [];
  for (let i = 0; i < functionAbi.params.length; i += 1) {
    params.push(parseTypeTag(functionAbi.params[i], { allowGenerics: true }));
  }

  // The return types of the view function
  const returnTypes: TypeTag[] = [];
  for (let i = 0; i < functionAbi.return.length; i += 1) {
    returnTypes.push(parseTypeTag(functionAbi.return[i], { allowGenerics: true }));
  }

  return {
    typeParameters: functionAbi.generic_type_params,
    parameters: params,
    returnTypes,
  };
}

/**
 * Converts a non-BCS encoded argument into BCS encoded, if necessary
 * @param functionName
 * @param functionAbi
 * @param arg
 * @param position
 * @param genericTypeParams
 */
export

/**
 * Converts an argument based on the provided function ABI and its position, ensuring type compatibility.
 * This function helps to validate and convert arguments before they are passed to a smart contract function.
 * 
 * @param functionName - The name of the function being called.
 * @param functionAbi - The ABI of the function, which includes parameter definitions.
 * @param arg - The argument to be converted, which can be of various types.
 * @param position - The position of the argument in the function's parameter list.
 * @param genericTypeParams - An array of generic type parameters for the function.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const functionName = "transfer";
 *   const functionAbi = {
 *     parameters: [
 *       { name: "recipient", type: "address" },
 *       { name: "amount", type: "u64" }
 *     ]
 *   };
 *   const arg = "0x1"; // replace with a real address
 *   const position = 0;
 *   const genericTypeParams = [];
 * 
 *   // This will convert the argument for the function call
 *   const convertedArg = aptos.convertArgument(functionName, functionAbi, arg, position, genericTypeParams);
 * 
 *   console.log(convertedArg);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function convertArgument(
  functionName: string,
  functionAbi: FunctionABI,
  arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes,
  position: number,
  genericTypeParams: Array<TypeTag>,
) {
  // Ensure not too many arguments
  if (position >= functionAbi.parameters.length) {
    throw new Error(`Too many arguments for '${functionName}', expected ${functionAbi.parameters.length}`);
  }

  const param = functionAbi.parameters[position];
  return checkOrConvertArgument(arg, param, position, genericTypeParams);
}

export

/**
 * Checks if the provided argument is BCS encoded and converts it if necessary, ensuring type compatibility with the ABI.
 * 
 * @param arg - The argument to check or convert, which can be either a simple or an entry function argument type.
 * @param param - The expected type tag for the argument.
 * @param position - The position of the argument in the function call.
 * @param genericTypeParams - An array of type tags for any generic type parameters.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const arg = "exampleArgument"; // replace with a real argument
 *   const param = "0x1::example_module::ExampleType"; // replace with a real type tag
 *   const position = 0; // the position of the argument
 *   const genericTypeParams = []; // specify any generic type parameters if needed
 * 
 *   // Check or convert the argument
 *   const result = await aptos.checkOrConvertArgument(arg, param, position, genericTypeParams);
 * 
 *   console.log(result); // Log the result to verify the operation
 * }
 * runExample().catch(console.error);
 * ```
 */
 function checkOrConvertArgument(
  arg: SimpleEntryFunctionArgumentTypes | EntryFunctionArgumentTypes,
  param: TypeTag,
  position: number,
  genericTypeParams: Array<TypeTag>,
) {
  // If the argument is bcs encoded, we can just use it directly
  if (isEncodedEntryFunctionArgument(arg)) {
    // Ensure the type matches the ABI
    checkType(param, arg, position);
    return arg;
  }

  // If it is not BCS encoded, we will need to convert it with the ABI
  return parseArg(arg, param, position, genericTypeParams);
}

/**
 * Parses a non-BCS encoded argument into a BCS encoded argument recursively
 * @param arg
 * @param param
 * @param position
 * @param genericTypeParams
 */
function parseArg(
  arg: SimpleEntryFunctionArgumentTypes,
  param: TypeTag,
  position: number,
  genericTypeParams: Array<TypeTag>,
): EntryFunctionArgumentTypes {
  if (param.isBool()) {
    if (isBool(arg)) {
      return new Bool(arg);
    }
    if (isString(arg)) {
      if (arg === "true") return new Bool(true);
      if (arg === "false") return new Bool(false);
    }
    throwTypeMismatch("boolean", position);
  }
  // TODO: support uint8array?
  if (param.isAddress()) {
    if (isString(arg)) {
      return AccountAddress.fromString(arg);
    }
    throwTypeMismatch("string | AccountAddress", position);
  }
  if (param.isU8()) {
    const num = convertNumber(arg);
    if (num !== undefined) {
      return new U8(num);
    }
    throwTypeMismatch("number | string", position);
  }
  if (param.isU16()) {
    const num = convertNumber(arg);
    if (num !== undefined) {
      return new U16(num);
    }
    throwTypeMismatch("number | string", position);
  }
  if (param.isU32()) {
    const num = convertNumber(arg);
    if (num !== undefined) {
      return new U32(num);
    }
    throwTypeMismatch("number | string", position);
  }
  if (param.isU64()) {
    if (isLargeNumber(arg)) {
      return new U64(BigInt(arg));
    }
    throwTypeMismatch("bigint | number | string", position);
  }
  if (param.isU128()) {
    if (isLargeNumber(arg)) {
      return new U128(BigInt(arg));
    }
    throwTypeMismatch("bigint | number | string", position);
  }
  if (param.isU256()) {
    if (isLargeNumber(arg)) {
      return new U256(BigInt(arg));
    }
    throwTypeMismatch("bigint | number | string", position);
  }

  // Generic needs to use the sub-type
  if (param.isGeneric()) {
    const genericIndex = param.value;
    if (genericIndex < 0 || genericIndex >= genericTypeParams.length) {
      throw new Error(`Generic argument ${param.toString()} is invalid for argument ${position}`);
    }

    return checkOrConvertArgument(arg, genericTypeParams[genericIndex], position, genericTypeParams);
  }

  // We have to special case some vectors for Vector<u8>
  if (param.isVector()) {
    // Check special case for Vector<u8>
    if (param.value.isU8()) {
      // We don't allow vector<u8>, but we convert strings to UTF8 uint8array
      // This is legacy behavior from the original SDK
      if (isString(arg)) {
        return MoveVector.U8(TEXT_ENCODER.encode(arg));
      }
      if (arg instanceof Uint8Array) {
        return MoveVector.U8(arg);
      }
      if (arg instanceof ArrayBuffer) {
        return MoveVector.U8(new Uint8Array(arg));
      }
    }

    // TODO: Support Uint16Array, Uint32Array, BigUint64Array?

    if (Array.isArray(arg)) {
      return new MoveVector(arg.map((item) => checkOrConvertArgument(item, param.value, position, genericTypeParams)));
    }

    throw new Error(`Type mismatch for argument ${position}, type '${param.toString()}'`);
  }

  // Handle structs as they're more complex
  if (param.isStruct()) {
    if (param.isString()) {
      if (isString(arg)) {
        return new MoveString(arg);
      }
      throwTypeMismatch("string", position);
    }
    if (param.isObject()) {
      // The inner type of Object doesn't matter, since it's just syntactic sugar
      if (isString(arg)) {
        return AccountAddress.fromString(arg);
      }
      throwTypeMismatch("string | AccountAddress", position);
    }

    if (param.isOption()) {
      if (isEmptyOption(arg)) {
        // Here we attempt to reconstruct the underlying type
        // Note, for some reason the `isBool` etc. does not work with the compiler
        const innerParam = param.value.typeArgs[0];
        if (innerParam instanceof TypeTagBool) {
          return new MoveOption<Bool>(null);
        }
        if (innerParam instanceof TypeTagAddress) {
          return new MoveOption<AccountAddress>(null);
        }
        if (innerParam instanceof TypeTagU8) {
          return new MoveOption<U8>(null);
        }
        if (innerParam instanceof TypeTagU16) {
          return new MoveOption<U16>(null);
        }
        if (innerParam instanceof TypeTagU32) {
          return new MoveOption<U32>(null);
        }
        if (innerParam instanceof TypeTagU64) {
          return new MoveOption<U64>(null);
        }
        if (innerParam instanceof TypeTagU128) {
          return new MoveOption<U128>(null);
        }
        if (innerParam instanceof TypeTagU256) {
          return new MoveOption<U256>(null);
        }

        // In all other cases, we will use a placeholder, it doesn't actually matter what the type is, but it will be obvious
        // Note: This is a placeholder U8 type, and does not match the actual type, as that can't be dynamically grabbed
        return new MoveOption<MoveString>(null);
      }

      return new MoveOption(checkOrConvertArgument(arg, param.value.typeArgs[0], position, genericTypeParams));
    }

    throw new Error(`Unsupported struct input type for argument ${position}, type '${param.toString()}'`);
  }

  throw new Error(`Type mismatch for argument ${position}, type '${param.toString()}'`);
}

/**
 * Checks that the type of an already BCS encoded argument matches the ABI.
 * This function ensures that the provided argument conforms to the expected type defined by the parameter.
 * 
 * @param param - The expected type as defined in the ABI.
 * @param arg - The actual argument that needs to be checked against the expected type.
 * @param position - The position of the argument in the function call for error reporting.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const param = ...; // Define the expected type
 *   const arg = ...; // Provide the actual argument to check
 *   const position = 1; // Specify the position of the argument
 * 
 *   // Check the type of the argument against the expected type
 *   checkType(param, arg, position);
 * 
 *   console.log("Type check passed.");
 * }
 * runExample().catch(console.error);
 * ```
 */


function checkType(param: TypeTag, arg: EntryFunctionArgumentTypes, position: number) {
  if (param.isBool()) {
    if (isBcsBool(arg)) {
      return;
    }
    throwTypeMismatch("Bool", position);
  }
  if (param.isAddress()) {
    if (isBcsAddress(arg)) {
      return;
    }
    throwTypeMismatch("AccountAddress", position);
  }
  if (param.isU8()) {
    if (isBcsU8(arg)) {
      return;
    }
    throwTypeMismatch("U8", position);
  }
  if (param.isU16()) {
    if (isBcsU16(arg)) {
      return;
    }
    throwTypeMismatch("U16", position);
  }
  if (param.isU32()) {
    if (isBcsU32(arg)) {
      return;
    }
    throwTypeMismatch("U32", position);
  }
  if (param.isU64()) {
    if (isBcsU64(arg)) {
      return;
    }
    throwTypeMismatch("U64", position);
  }
  if (param.isU128()) {
    if (isBcsU128(arg)) {
      return;
    }
    throwTypeMismatch("U128", position);
  }
  if (param.isU256()) {
    if (isBcsU256(arg)) {
      return;
    }
    throwTypeMismatch("U256", position);
  }
  if (param.isVector()) {
    if (arg instanceof MoveVector) {
      // If there's anything in it, check that the inner types match
      // Note that since it's typed, the first item should be the same as the rest
      if (arg.values.length > 0) {
        checkType(param.value, arg.values[0], position);
      }

      return;
    }
    throwTypeMismatch("MoveVector", position);
  }

  // Handle structs as they're more complex
  if (param instanceof TypeTagStruct) {
    if (param.isString()) {
      if (isBcsString(arg)) {
        return;
      }
      throwTypeMismatch("MoveString", position);
    }
    if (param.isObject()) {
      if (isBcsAddress(arg)) {
        return;
      }
      throwTypeMismatch("AccountAddress", position);
    }
    if (param.isOption()) {
      if (arg instanceof MoveOption) {
        // If there's a value, we can check the inner type (otherwise it doesn't really matter)
        if (arg.value !== undefined) {
          checkType(param.value.typeArgs[0], arg.value, position);
        }
        return;
      }
      throwTypeMismatch("MoveOption", position);
    }
  }

  throw new Error(`Type mismatch for argument ${position}, expected '${param.toString()}'`);
}