import { MoveFunction } from "../../types";
import {
  parseTypeTag,
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
  TypeTagVector,
} from "../typeTag";
import { AptosConfig } from "../../api/aptosConfig";
import { EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes } from "../types";
import { Bool, FixedBytes, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../../bcs";
import { AccountAddress, Hex } from "../../core";
import { getModule } from "../../internal/account";

/**
 * Finds first non-signer arg.
 *
 * A function is often defined with a `signer` or `&signer` arguments at the start, which are filled in
 * by signatures, and not by the caller.
 * @param functionAbi
 */
export function findFirstNonSignerArg(functionAbi: MoveFunction): number {
  return functionAbi.params.findIndex((param) => param !== "signer" && param !== "&signer");
}

/**
 * Common logic for throwing when there are too many arguments
 * @param functionId
 * @param argumentIndex
 * @param numExpected
 */
export function ensureNotTooManyArguments(functionId: string, argumentIndex: number, numExpected: number) {
  if (argumentIndex >= numExpected) {
    throw new Error(`Too many arguments for '${functionId}', expected ${numExpected}`);
  }
}

/**
 * Convert type arguments to only type tags, allowing for string representations of type tags
 */
export function typeTagConversion(typeArguments?: Array<TypeTag | string>): Array<TypeTag> {
  return (
    typeArguments?.map((typeArg: string | TypeTag): TypeTag => {
      // Convert to TypeTag if it's a string representation
      if (typeof typeArg === "string") {
        return parseTypeTag(typeArg);
      }
      return typeArg;
    }) ?? []
  );
}

/**
 * Fetches the ABI for an entry function from the module
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
) {
  const module = await getModule({ aptosConfig, accountAddress: moduleAddress, moduleName });

  // TODO: Memoize? or is the module enough
  const functionAbi = module.abi?.exposed_functions.find((func) => func.name === functionName);

  // If there's no ABI, then the function is invalid
  if (!functionAbi) {
    throw new Error(`Could not find entry function ABI for '${moduleAddress}::${moduleName}::${functionName}'`);
  }

  // Non-entry functions also can't be used
  if (!functionAbi.is_entry) {
    throw new Error(`'${moduleAddress}::${moduleName}::${functionName}' is not an entry function`);
  }

  return functionAbi;
}

export function convertSimpleEntryFunctionType(
  functionAbi: MoveFunction,
  arg: SimpleEntryFunctionArgumentTypes,
  position: number,
  abiPosition: number,
): EntryFunctionArgumentTypes {
  const paramStr = functionAbi.params[abiPosition];
  const param = parseTypeTag(paramStr, { allowGenerics: true });
  if (param instanceof TypeTagBool && typeof arg === "boolean") {
    return new Bool(arg);
  }
  if (param instanceof TypeTagAddress && typeof arg === "string") {
    // TODO: support uint8array?
    return AccountAddress.fromString(arg);
  }
  // TODO: Do we accept bigint or string for these smaller numbers?
  if (param instanceof TypeTagU8 && typeof arg === "number") {
    return new U8(arg);
  }
  if (param instanceof TypeTagU16 && typeof arg === "number") {
    return new U16(arg);
  }
  if (param instanceof TypeTagU32 && typeof arg === "number") {
    return new U32(arg);
  }
  if (param instanceof TypeTagU64 && (typeof arg === "number" || typeof arg === "bigint" || typeof arg === "string")) {
    return new U64(BigInt(arg));
  }
  if (param instanceof TypeTagU128 && (typeof arg === "number" || typeof arg === "bigint" || typeof arg === "string")) {
    return new U128(BigInt(arg));
  }
  if (param instanceof TypeTagU256 && (typeof arg === "number" || typeof arg === "bigint" || typeof arg === "string")) {
    return new U256(BigInt(arg));
  }

  // TODO: Need recursive calls to handle this
  // TODO: Vector<u8> is a special case to accept hex!
  if (param instanceof TypeTagVector) {
    if (param.value instanceof TypeTagU8 && Array.isArray(arg)) {
      // TODO: Have to get value of inside array
      throw new Error("Not yet implemented");
      // return MoveVector.U8(arg);
    } else if (param.value instanceof TypeTagU8 && typeof arg === "string") {
      return MoveVector.U8(Hex.fromHexInput(arg).toUint8Array());
    } else {
      // We are going to assume that all in the array are uniform
      throw new Error("Not yet implemented");
    }
  }

  // Handle structs as they're more complex
  if (param instanceof TypeTagStruct) {
    // Unknown structs won't be parsed
    if (paramStr === "0x1::string::String" && typeof arg === "string") {
      return new MoveString(arg);
    }
    if (paramStr.startsWith("0x1::object::Object") && typeof arg === "string") {
      return AccountAddress.fromString(arg);
    }
    if (paramStr.startsWith("0x1::object::Option")) {
      if (arg === undefined) {
        // TODO: This is a bit of a hack, the real type can be used, but it doesn't matter much
        return new MoveOption<U8>(null);
      }
      // Get the proper parsed type
      throw new Error("Not yet implemented for option with value");
    }
  }
  throw new Error(`Type mismatch for argument ${position}, expected '${paramStr}'`);
}

export function checkType(
  functionAbi: MoveFunction,
  arg: EntryFunctionArgumentTypes,
  position: number,
  abiPosition: number,
) {
  const paramStr = functionAbi.params[abiPosition];
  const param = parseTypeTag(paramStr, { allowGenerics: true });
  if (param instanceof TypeTagBool && arg instanceof Bool) {
    return;
  }
  if (param instanceof TypeTagAddress && arg instanceof AccountAddress) {
    return;
  }
  if (param instanceof TypeTagU8 && arg instanceof U8) {
    return;
  }
  if (param instanceof TypeTagU16 && arg instanceof U16) {
    return;
  }
  if (param instanceof TypeTagU32 && arg instanceof U32) {
    return;
  }
  if (param instanceof TypeTagU64 && arg instanceof U64) {
    return;
  }
  if (param instanceof TypeTagU128 && arg instanceof U128) {
    return;
  }
  if (param instanceof TypeTagU256 && arg instanceof U256) {
    return;
  }
  if (param instanceof TypeTagVector && arg instanceof MoveVector) {
    // TODO: More introspection to verify the type
    return;
  }

  // Handle structs as they're more complex
  if (param instanceof TypeTagStruct) {
    // Unknown structs won't be parsed properly
    if (paramStr === "0x1::string::String" && arg instanceof MoveString) {
      return;
    }
    // TODO: Allow account address too?
    if (paramStr.startsWith("0x1::object::Object") && arg instanceof AccountAddress) {
      return;
    }
    if (paramStr.startsWith("0x1::option::Option") && arg instanceof MoveOption) {
      // TODO: more introspection for the type
      return;
    }
  }

  throw new Error(`Type mismatch for argument ${position}, expected '${paramStr}'`);
}

export function convertArgument(
  functionName: string,
  functionAbi: MoveFunction,
  arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes,
  abiIndex: number,
  argIndex: number,
  abiStartIndex: number,
) {
  // If the argument is bcs encoded, we can just use it directly
  if (
    arg instanceof Bool ||
    arg instanceof U8 ||
    arg instanceof U16 ||
    arg instanceof U32 ||
    arg instanceof U64 ||
    arg instanceof U128 ||
    arg instanceof U256 ||
    arg instanceof AccountAddress ||
    arg instanceof MoveVector ||
    arg instanceof MoveOption ||
    arg instanceof MoveString ||
    arg instanceof FixedBytes
  ) {
    // Check the type for BCS arguments
    ensureNotTooManyArguments(functionName, abiIndex - abiStartIndex, functionAbi.params.length - abiStartIndex);
    checkType(functionAbi, arg, argIndex, abiIndex);
    return arg;
  }

  // If it is not BCS encoded, we will need to convert it with the ABI
  ensureNotTooManyArguments(functionName, abiIndex - abiStartIndex, functionAbi.params.length - abiStartIndex);

  return convertSimpleEntryFunctionType(functionAbi, arg, argIndex, abiIndex);
}
