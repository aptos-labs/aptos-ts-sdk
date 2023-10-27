// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { parseTypeTag } from "../typeTag/parser";
import { TypeTag, TypeTagStruct } from "../typeTag";
import { AptosConfig } from "../../api/aptosConfig";
import { EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes, EntryFunctionABI } from "../types";
import { Bool, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../../bcs";
import { AccountAddress, Hex } from "../../core";
import { getModule } from "../../internal/account";
import {
  findFirstNonSignerArg,
  isBcsAddress,
  isBcsBool,
  isBcsFixedBytes,
  isBcsString,
  isBcsU128,
  isBcsU16,
  isBcsU256,
  isBcsU32,
  isBcsU64,
  isBcsU8,
  isBool,
  isLargeNumber,
  isNull,
  isNumber,
  isString,
  throwTypeMismatch,
} from "./helpers";

/**
 * Convert type arguments to only type tags, allowing for string representations of type tags
 */
export function standardizeTypeTags(typeArguments?: Array<TypeTag | string>): Array<TypeTag> {
  return (
    typeArguments?.map((typeArg: string | TypeTag): TypeTag => {
      // Convert to TypeTag if it's a string representation
      if (isString(typeArg)) {
        return parseTypeTag(typeArg);
      }
      return typeArg;
    }) ?? []
  );
}

/**
 * Fetches the ABI for an entry function from the module
 *
 * @param moduleAddress
 * @param moduleName
 * @param functionName
 * @param aptosConfig
 */
export async function fetchEntryFunctionAbi(
  moduleAddress: string,
  moduleName: string,
  functionName: string,
  aptosConfig: AptosConfig,
): Promise<EntryFunctionABI> {
  // This fetch from the API is currently cached
  const module = await getModule({ aptosConfig, accountAddress: moduleAddress, moduleName });

  const functionAbi = module.abi?.exposed_functions.find((func) => func.name === functionName);

  // If there's no ABI, then the function is invalid
  if (!functionAbi) {
    throw new Error(`Could not find entry function ABI for '${moduleAddress}::${moduleName}::${functionName}'`);
  }

  // Non-entry functions also can't be used
  if (!functionAbi.is_entry) {
    throw new Error(`'${moduleAddress}::${moduleName}::${functionName}' is not an entry function`);
  }

  // Remove the signer arguments
  const first = findFirstNonSignerArg(functionAbi);
  const params = [];
  for (let i = first; i < functionAbi.params.length; i += 1) {
    params.push(parseTypeTag(functionAbi.params[i], { allowGenerics: true }));
  }

  return {
    typeParameters: functionAbi.generic_type_params,
    parameters: params,
  };
}

/**
 * Converts a non-BCS encoded argument into BCS encoded, if necessary
 * @param functionName
 * @param functionAbi
 * @param arg
 * @param position
 */
export function convertArgument(
  functionName: string,
  functionAbi: EntryFunctionABI,
  arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes,
  position: number,
  genericTypeParams: Array<TypeTag>,
) {
  // Ensure not too many arguments
  if (position >= functionAbi.parameters.length) {
    throw new Error(`Too many arguments for '${functionName}', expected ${functionAbi.parameters.length}`);
  }

  // If the argument is bcs encoded, we can just use it directly
  if (
    isBcsBool(arg) ||
    isBcsU8(arg) ||
    isBcsU16(arg) ||
    isBcsU32(arg) ||
    isBcsU64(arg) ||
    isBcsU128(arg) ||
    isBcsU256(arg) ||
    isBcsAddress(arg) ||
    isBcsString(arg) ||
    isBcsFixedBytes(arg) ||
    arg instanceof MoveVector ||
    arg instanceof MoveOption
  ) {
    // Ensure the type matches the ABI
    checkType(functionAbi, arg, position);
    return arg;
  }

  // If it is not BCS encoded, we will need to convert it with the ABI
  return parseArg(arg, functionAbi.parameters[position], position, genericTypeParams);
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
    throwTypeMismatch("boolean", position);
  }
  // TODO: support uint8array?
  if (param.isAddress()) {
    if (isString(arg)) {
      return AccountAddress.fromString(arg);
    }
    throwTypeMismatch("string", position);
  }
  if (param.isU8()) {
    if (isNumber(arg)) {
      return new U8(arg);
    }
    throwTypeMismatch("number", position);
  }
  if (param.isU16()) {
    if (isNumber(arg)) {
      return new U16(arg);
    }
    throwTypeMismatch("number", position);
  }
  if (param.isU32()) {
    if (isNumber(arg)) {
      return new U32(arg);
    }
    throwTypeMismatch("number", position);
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

    parseArg(arg, genericTypeParams[genericIndex], position, genericTypeParams);
  }

  // We have to special case some vectors for Vector<u8>
  if (param.isVector()) {
    // Check special case for Vector<u8>
    if (param.value.isU8() && isString(arg)) {
      // TODO: Improve message when hex is invalid
      return MoveVector.U8(Hex.fromHexInput(arg).toUint8Array());
    }

    if (Array.isArray(arg)) {
      return new MoveVector(arg.map((item) => parseArg(item, param.value, position, genericTypeParams)));
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
      throwTypeMismatch("string", position);
    }

    if (param.isOption()) {
      // Empty option must be handled specially
      if (isNull(arg)) {
        // Note: This is a placeholder U8 type, and does not match the actual type, as that can't be dynamically grabbed
        return new MoveOption<U8>(null);
      }

      return new MoveOption(parseArg(arg, param.value.type_args[0], position, genericTypeParams));
    }

    throw new Error(`Unsupported struct input type for argument ${position}, type '${param.toString()}'`);
  }

  throw new Error(`Type mismatch for argument ${position}, type '${param.toString()}'`);
}

/**
 * Checks that the type of an already BCS encoded argument matches the ABI
 * @param functionAbi
 * @param arg
 * @param position
 */
function checkType(functionAbi: EntryFunctionABI, arg: EntryFunctionArgumentTypes, position: number) {
  const param = functionAbi.parameters[position];
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
      // TODO: More introspection to verify the type
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
        // TODO: more introspection for the type
        return;
      }
      throwTypeMismatch("MoveOption", position);
    }
  }

  throw new Error(`Type mismatch for argument ${position}, expected '${param.toString()}'`);
}
