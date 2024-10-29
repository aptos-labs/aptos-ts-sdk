// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  EntryFunctionArgumentTypes,
  InputGenerateTransactionPayloadData,
  InputGenerateTransactionPayloadDataWithRemoteABI,
  InputScriptData,
  SimpleEntryFunctionArgumentTypes,
} from "../types";
import { Bool, FixedBytes, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../../bcs";
import { AccountAddress } from "../../core";
import { MoveFunction, MoveFunctionId } from "../../types";

/**
 * Determines if the provided argument is of type boolean.
 * This can help in validating input types before processing them further.
 *
 * @param arg - The argument to check, which can be of various types.
 * @returns A boolean indicating whether the argument is a boolean.
 */
export function isBool(arg: SimpleEntryFunctionArgumentTypes): arg is boolean {
  return typeof arg === "boolean";
}

/**
 * Checks if the provided argument is of type string.
 *
 * @param arg - The value to be checked for string type.
 * @returns A boolean indicating whether the argument is a string.
 */
export function isString(arg: any): arg is string {
  return typeof arg === "string";
}

/**
 * Determines if the provided argument is of type number.
 *
 * @param arg - The argument to check, which can be of various types.
 * @returns A boolean indicating whether the argument is a number.
 */
export function isNumber(arg: SimpleEntryFunctionArgumentTypes): arg is number {
  return typeof arg === "number";
}

/**
 * Converts a number or a string representation of a number into a number type.
 * This function is useful for ensuring that the input is in a consistent numeric format,
 * which can help prevent type mismatches in further processing.
 *
 * @param arg - The input value to be converted. This can be a number, a string representing a number, or any other type.
 * @returns Returns the converted number if the input is valid; otherwise, it returns undefined.
 */
export function convertNumber(arg: SimpleEntryFunctionArgumentTypes): number | undefined {
  if (isNumber(arg)) {
    return arg;
  }
  if (isString(arg) && arg !== "") {
    return Number.parseInt(arg, 10);
  }

  return undefined;
}

/**
 * Determines if the provided argument is a large number, which can be a number, bigint, or string representation of a number.
 *
 * @param arg - The argument to check, which can be of type number, bigint, or string.
 */
export function isLargeNumber(arg: SimpleEntryFunctionArgumentTypes): arg is number | bigint | string {
  return typeof arg === "number" || typeof arg === "bigint" || typeof arg === "string";
}

/**
 * Checks if the provided argument is empty, meaning it is either null or undefined.
 *
 * @param arg - The argument to check for emptiness.
 * @returns A boolean indicating whether the argument is empty.
 */
export function isEmptyOption(arg: SimpleEntryFunctionArgumentTypes): arg is null | undefined {
  return arg === null || arg === undefined;
}

/**
 * Determines if the provided argument is a valid encoded entry function argument type.
 * This function helps validate that the argument conforms to the expected types for entry function parameters.
 *
 * @param arg - The argument to check, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
 */
export function isEncodedEntryFunctionArgument(
  arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes,
): arg is EntryFunctionArgumentTypes {
  return (
    /**
     * Determines if the provided argument is an instance of the Bool class.
     *
     * @param arg - The argument to check, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     */
    isBcsBool(arg) ||
    /**
     * Determines if the provided argument is an instance of U8.
     * This function helps validate the type of the argument passed to ensure it is a U8 type.
     *
     * @param arg - The argument to be checked, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     */
    isBcsU8(arg) ||
    /**
     * Determines if the provided argument is an instance of U16.
     *
     * @param arg - The argument to check, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     */
    isBcsU16(arg) ||
    /**
     * Determines if the provided argument is an instance of U32.
     *
     * @param arg - The argument to check, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     * @returns A boolean indicating whether the argument is a U32 instance.
     */
    isBcsU32(arg) ||
    /**
     * Determine if the provided argument is an instance of U64.
     * This function helps validate that the argument conforms to the expected U64 type.
     *
     * @param arg - The argument to check, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     */
    isBcsU64(arg) ||
    /**
     * Determines if the provided argument is an instance of U128.
     * This function helps validate the type of the argument passed to ensure it is a U128 type.
     *
     * @param arg - The argument to be checked, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     */
    isBcsU128(arg) ||
    /**
     * Determines if the provided argument is an instance of U256.
     *
     * @param arg - The argument to check, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     * @returns A boolean indicating whether the argument is a U256 instance.
     */
    isBcsU256(arg) ||
    /**
     * Determines if the provided argument is an instance of AccountAddress.
     * This function helps validate whether a given input corresponds to a valid BCS address type.
     *
     * @param arg - The argument to check, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     */
    isBcsAddress(arg) ||
    /**
     * Determine if the provided argument is an instance of MoveString.
     *
     * @param arg - The argument to check, which can be of types EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     */
    isBcsString(arg) ||
    /**
     * Determine if the provided argument is an instance of FixedBytes.
     * This function helps to validate the type of the argument being passed.
     *
     * @param arg - The argument to check, which can be of type EntryFunctionArgumentTypes or SimpleEntryFunctionArgumentTypes.
     */
    isBcsFixedBytes(arg) ||
    arg instanceof MoveVector ||
    arg instanceof MoveOption
  );
}

export function isBcsBool(arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes): arg is Bool {
  return arg instanceof Bool;
}

export function isBcsAddress(
  arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes,
): arg is AccountAddress {
  return arg instanceof AccountAddress;
}

export function isBcsString(arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes): arg is MoveString {
  return arg instanceof MoveString;
}

export function isBcsFixedBytes(arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes): arg is FixedBytes {
  return arg instanceof FixedBytes;
}

export function isBcsU8(arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes): arg is U8 {
  return arg instanceof U8;
}

export function isBcsU16(arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes): arg is U16 {
  return arg instanceof U16;
}

export function isBcsU32(arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes): arg is U32 {
  return arg instanceof U32;
}

export function isBcsU64(arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes): arg is U64 {
  return arg instanceof U64;
}

export function isBcsU128(arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes): arg is U128 {
  return arg instanceof U128;
}

export function isBcsU256(arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes): arg is U256 {
  return arg instanceof U256;
}

/**
 * Determines if the provided argument contains script data input by checking for the presence of bytecode.
 *
 * @param arg - The input data to be checked, which can either be a payload with remote ABI or a standard payload.
 * @param arg.bytecode - The bytecode of the script, present if the input is script data.
 * @param arg.function - The function associated with the transaction, which is relevant for standard payloads.
 * @param arg.args - The arguments for the function, applicable in the context of standard payloads.
 */
export function isScriptDataInput(
  arg: InputGenerateTransactionPayloadDataWithRemoteABI | InputGenerateTransactionPayloadData,
): arg is InputScriptData {
  return "bytecode" in arg;
}

/**
 * Throws an error indicating a type mismatch for a specified argument position.
 * This function helps in debugging by providing clear feedback on expected types.
 *
 * @param expectedType - The type that was expected for the argument.
 * @param position - The position of the argument that caused the type mismatch.
 */
export function throwTypeMismatch(expectedType: string, position: number) {
  throw new Error(`Type mismatch for argument ${position}, expected '${expectedType}'`);
}

/**
 * Finds the index of the first non-signer argument in the function ABI parameters.
 *
 * A function is often defined with a `signer` or `&signer` arguments at the start, which are filled in
 * by signatures and not by the caller. This function helps identify the position of the first argument that
 * can be provided by the caller, allowing for easier handling of function parameters.
 *
 * @param functionAbi - The ABI of the function to analyze.
 * @returns The index of the first non-signer argument, or the length of the parameters array if none are found.
 */
export function findFirstNonSignerArg(functionAbi: MoveFunction): number {
  const index = functionAbi.params.findIndex((param) => param !== "signer" && param !== "&signer");
  if (index < 0) {
    return functionAbi.params.length;
  }
  return index;
}

/**
 * Splits a function identifier into its constituent parts: module address, module name, and function name.
 * This function helps in validating and extracting details from a function identifier string.
 *
 * @param functionArg - The function identifier string in the format "moduleAddress::moduleName::functionName".
 * @returns An object containing the module address, module name, and function name.
 * @throws Error if the function identifier does not contain exactly three parts.
 */
export function getFunctionParts(functionArg: MoveFunctionId) {
  const funcNameParts = functionArg.split("::");
  if (funcNameParts.length !== 3) {
    throw new Error(`Invalid function ${functionArg}`);
  }
  const moduleAddress = funcNameParts[0];
  const moduleName = funcNameParts[1];
  const functionName = funcNameParts[2];
  return { moduleAddress, moduleName, functionName };
}
