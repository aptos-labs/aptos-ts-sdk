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
import { Bool, FixedBytes, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../../bcs";
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
import { MoveFunction, MoveModule } from "../../types";

const TEXT_ENCODER = new TextEncoder();

/**
 * Convert type arguments to only type tags, allowing for string representations of type tags.
 *
 * @param typeArguments - An optional array of type arguments that may include string representations.
 * @returns An array of TypeTag objects derived from the provided type arguments.
 * @group Implementation
 * @category Transactions
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
 * Fetches the ABI of a specified module from the on-chain module ABI.
 *
 * @param moduleAddress - The address of the module from which to fetch the ABI.
 * @param moduleName - The name of the module containing the ABI.
 * @param aptosConfig - The configuration settings for Aptos.
 * @group Implementation
 * @category Transactions
 */
export async function fetchModuleAbi(
  moduleAddress: string,
  moduleName: string,
  aptosConfig: AptosConfig,
): Promise<MoveModule | undefined> {
  const moduleBytecode = await getModule({ aptosConfig, accountAddress: moduleAddress, moduleName });
  return moduleBytecode.abi;
}

/**
 * Fetches the ABI of a specified function from the on-chain module ABI. This function allows you to access the details of a
 * specific function within a module.
 *
 * @param moduleAddress - The address of the module from which to fetch the function ABI.
 * @param moduleName - The name of the module containing the function.
 * @param functionName - The name of the function whose ABI is to be fetched.
 * @param aptosConfig - The configuration settings for Aptos.
 * @group Implementation
 * @category Transactions
 */
export async function fetchFunctionAbi(
  moduleAddress: string,
  moduleName: string,
  functionName: string,
  aptosConfig: AptosConfig,
): Promise<MoveFunction | undefined> {
  const moduleAbi = await fetchModuleAbi(moduleAddress, moduleName, aptosConfig);
  if (!moduleAbi) throw new Error(`Could not find module ABI for '${moduleAddress}::${moduleName}'`);
  return moduleAbi.exposed_functions.find((func) => func.name === functionName);
}

/**
 * @deprecated Use `fetchFunctionAbi` instead and manually parse the type tags.
 */
export async function fetchMoveFunctionAbi(
  moduleAddress: string,
  moduleName: string,
  functionName: string,
  aptosConfig: AptosConfig,
): Promise<FunctionABI> {
  const functionAbi = await fetchFunctionAbi(moduleAddress, moduleName, functionName, aptosConfig);
  if (!functionAbi) {
    throw new Error(`Could not find function ABI for '${moduleAddress}::${moduleName}::${functionName}'`);
  }
  const params: TypeTag[] = [];
  for (let i = 0; i < functionAbi.params.length; i += 1) {
    params.push(parseTypeTag(functionAbi.params[i], { allowGenerics: true }));
  }

  return {
    typeParameters: functionAbi.generic_type_params,
    parameters: params,
  };
}

/**
 * Fetches the ABI for an entry function from the specified module address.
 * This function validates if the ABI corresponds to an entry function and retrieves its parameters.
 *
 * @param moduleAddress - The address of the module containing the entry function.
 * @param moduleName - The name of the module containing the entry function.
 * @param functionName - The name of the entry function to fetch the ABI for.
 * @param aptosConfig - The configuration settings for Aptos.
 * @returns An object containing the number of signers, type parameters, and function parameters.
 * @throws Error if the ABI cannot be found or if the function is not an entry function.
 * @group Implementation
 * @category Transactions
 */
export async function fetchEntryFunctionAbi(
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
 * Fetches the ABI for a view function from the specified module address.
 * This function ensures that the ABI is valid and retrieves the type parameters, parameters, and return types for the view function.
 *
 * @param moduleAddress - The address of the module containing the view function.
 * @param moduleName - The name of the module containing the view function.
 * @param functionName - The name of the view function for which to fetch the ABI.
 * @param aptosConfig - The configuration settings for Aptos.
 * @returns An object containing the type parameters, parameters, and return types of the view function.
 * @throws Error if the ABI cannot be found or if the function is not a view function.
 * @group Implementation
 * @category Transactions
 */
export async function fetchViewFunctionAbi(
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
 * Converts a non-BCS encoded argument into BCS encoded, if necessary.
 * This function checks the provided argument against the expected parameter type and converts it accordingly.
 *
 * @param functionName - The name of the function for which the argument is being converted.
 * @param functionAbiOrModuleAbi - The ABI (Application Binary Interface) of the function, which defines its parameters.
 * @param arg - The argument to be converted, which can be of various types.
 * @param position - The index of the argument in the function's parameter list.
 * @param genericTypeParams - An array of type tags for any generic type parameters.
 * @param options - Options for the conversion process.
 * @param options.allowUnknownStructs - If true, unknown structs will be allowed and converted to a `FixedBytes`.
 * @group Implementation
 * @category Transactions
 */
export function convertArgument(
  functionName: string,
  functionAbiOrModuleAbi: MoveModule | FunctionABI,
  arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes,
  position: number,
  genericTypeParams: Array<TypeTag>,
  options?: { allowUnknownStructs?: boolean },
) {
  let param: TypeTag;

  if ("exposed_functions" in functionAbiOrModuleAbi) {
    const functionAbi = functionAbiOrModuleAbi.exposed_functions.find((func) => func.name === functionName);
    if (!functionAbi) {
      throw new Error(
        `Could not find function ABI for '${functionAbiOrModuleAbi.address}::${functionAbiOrModuleAbi.name}::${functionName}'`,
      );
    }

    if (position >= functionAbi.params.length) {
      throw new Error(`Too many arguments for '${functionName}', expected ${functionAbi.params.length}`);
    }

    param = parseTypeTag(functionAbi.params[position], { allowGenerics: true });
  } else {
    if (position >= functionAbiOrModuleAbi.parameters.length) {
      throw new Error(`Too many arguments for '${functionName}', expected ${functionAbiOrModuleAbi.parameters.length}`);
    }

    param = functionAbiOrModuleAbi.parameters[position];
  }

  return checkOrConvertArgument(
    arg,
    param,
    position,
    genericTypeParams,
    "exposed_functions" in functionAbiOrModuleAbi ? functionAbiOrModuleAbi : undefined,
    options,
  );
}

/**
 * Checks if the provided argument is BCS encoded and converts it if necessary, ensuring type compatibility with the ABI.
 * This function helps in validating and converting arguments for entry functions based on their expected types.
 *
 * @param arg - The argument to check or convert, which can be either a simple or entry function argument type.
 * @param param - The expected type tag for the argument.
 * @param position - The position of the argument in the function call.
 * @param genericTypeParams - An array of generic type parameters that may be used for conversion.
 * @group Implementation
 * @category Transactions
 */
export function checkOrConvertArgument(
  arg: SimpleEntryFunctionArgumentTypes | EntryFunctionArgumentTypes,
  param: TypeTag,
  position: number,
  genericTypeParams: Array<TypeTag>,
  moduleAbi?: MoveModule,
  options?: { allowUnknownStructs?: boolean },
) {
  // If the argument is bcs encoded, we can just use it directly
  if (isEncodedEntryFunctionArgument(arg)) {
    // Ensure the type matches the ABI

    /**
     * Checks the type of the provided argument against the expected type.
     * This function helps validate that the argument conforms to the specified type requirements.
     *
     * @param typeArgs - The expected type arguments.
     * @param arg - The argument to be checked.
     * @param position - The position of the argument in the context of the check.
     * @param moduleAbi - The ABI of the module containing the function, used for type checking.
     *                    This will typically have information about structs, enums, and other types.
     * @group Implementation
     * @category Transactions
     */
    checkType(param, arg, position);
    return arg;
  }

  // If it is not BCS encoded, we will need to convert it with the ABI
  return parseArg(arg, param, position, genericTypeParams, moduleAbi, options);
}

/**
 * Parses a non-BCS encoded argument into a BCS encoded argument recursively.
 * This function helps convert various types of input arguments into their corresponding BCS encoded formats based on the
 * specified parameter type.
 *
 * @param arg - The argument to be parsed, which can be of various types.
 * @param param - The type tag that defines the expected type of the argument.
 * @param position - The position of the argument in the function call, used for error reporting.
 * @param genericTypeParams - An array of type tags for generic type parameters, used when the parameter type is generic.
 * @param moduleAbi - The ABI of the module containing the function, used for type checking.
 *                    This will typically have information about structs, enums, and other types.
 * @param options - Options for the conversion process.
 * @param options.allowUnknownStructs - If true, unknown structs will be allowed and converted to a `FixedBytes`.
 * @group Implementation
 * @category Transactions
 */
function parseArg(
  arg: SimpleEntryFunctionArgumentTypes,
  param: TypeTag,
  position: number,
  genericTypeParams: Array<TypeTag>,
  moduleAbi?: MoveModule,
  options?: { allowUnknownStructs?: boolean },
): EntryFunctionArgumentTypes {
  if (param.isBool()) {
    if (isBool(arg)) {
      return new Bool(arg);
    }
    if (isString(arg)) {
      if (arg === "true") return new Bool(true);
      if (arg === "false") return new Bool(false);
    }

    /**
     * Throws a type mismatch error for the specified move option.
     *
     * @param moveOption - The name of the move option that caused the type mismatch.
     * @param position - The position where the error occurred.
     * @group Implementation
     * @category Transactions
     */
    throwTypeMismatch("boolean", position);
  }
  if (param.isAddress()) {
    if (isString(arg)) {
      return AccountAddress.fromString(arg);
    }
    // Support for Uint8Array coming from external sources
    // Usually, dapps will be getting the account address as a Uint8Array from the wallet (following
    // the wallet standard).
    if (arg && typeof arg === "object" && "data" in arg && arg.data instanceof Uint8Array) {
      return new AccountAddress(arg.data);
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

  // Generic needs to use the subtype
  if (param.isGeneric()) {
    const genericIndex = param.value;
    if (genericIndex < 0 || genericIndex >= genericTypeParams.length) {
      throw new Error(`Generic argument ${param.toString()} is invalid for argument ${position}`);
    }

    return checkOrConvertArgument(arg, genericTypeParams[genericIndex], position, genericTypeParams, moduleAbi);
  }

  // We have to special case some vectors for Vector<u8>
  if (param.isVector()) {
    // Check special case for Vector<u8>
    if (param.value.isU8()) {
      // We don't allow vector<u8>, but we convert strings to UTF8 Uint8Array
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

    if (isString(arg)) {
      // In a web env, arguments are passing as strings
      if (arg.startsWith("[")) {
        return checkOrConvertArgument(JSON.parse(arg), param, position, genericTypeParams);
      }
    }

    // TODO: Support Uint16Array, Uint32Array, BigUint64Array?

    if (Array.isArray(arg)) {
      return new MoveVector(
        arg.map((item) => checkOrConvertArgument(item, param.value, position, genericTypeParams, moduleAbi)),
      );
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
      // Support for Uint8Array coming from external sources
      if (arg && typeof arg === "object" && "data" in arg && arg.data instanceof Uint8Array) {
        return new AccountAddress(arg.data);
      }
      throwTypeMismatch("string | AccountAddress", position);
    }
    // Handle known enum types from Aptos framework
    if (param.isDelegationKey() || param.isRateLimiter()) {
      if (arg instanceof Uint8Array) {
        return new FixedBytes(arg);
      }
      throwTypeMismatch("Uint8Array", position);
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

      return new MoveOption(
        checkOrConvertArgument(arg, param.value.typeArgs[0], position, genericTypeParams, moduleAbi),
      );
    }

    // We are assuming that fieldless structs are enums, and therefore we cannot typecheck any further due
    // to limited information from the ABI. This does not work for structs on other modules.
    const structDefinition = moduleAbi?.structs.find((s) => s.name === param.value.name.identifier);
    if (structDefinition?.fields.length === 0 && arg instanceof Uint8Array) {
      return new FixedBytes(arg);
    }

    if (arg instanceof Uint8Array && options?.allowUnknownStructs) {
      // eslint-disable-next-line no-console
      console.warn(
        // eslint-disable-next-line max-len
        `Unsupported struct input type for argument ${position}. Continuing since 'allowUnknownStructs' is enabled.`,
      );
      return new FixedBytes(arg);
    }

    throw new Error(`Unsupported struct input type for argument ${position}, type '${param.toString()}'`);
  }

  throw new Error(`Type mismatch for argument ${position}, type '${param.toString()}'`);
}

/**
 * Checks that the type of the BCS encoded argument matches the ABI
 * @param param
 * @param arg
 * @param position
 * @group Implementation
 * @category Transactions
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
