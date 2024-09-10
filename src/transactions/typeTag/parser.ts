// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  StructTag,
  TypeTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagGeneric,
  TypeTagReference,
  TypeTagSigner,
  TypeTagStruct,
  TypeTagU128,
  TypeTagU16,
  TypeTagU256,
  TypeTagU32,
  TypeTagU64,
  TypeTagU8,
  TypeTagVector,
} from ".";
import { AccountAddress } from "../../core";
import { Identifier } from "../instances/identifier";

/**
 * Determines if the provided string is a valid Move identifier, which can only contain alphanumeric characters and underscores.
 * 
 * @param str - The string to validate as a Move identifier.
 * 
 * @example
 * ```typescript
 * import { Aptos } from "@aptos-labs/ts-sdk";
 * 
 * async function runExample() {
 *   const identifier = "valid_identifier123"; // Example of a valid identifier
 * 
 *   // Check if the identifier is valid
 *   const isValid = Aptos.isValidIdentifier(identifier);
 * 
 *   console.log(`Is the identifier valid? ${isValid}`); // Outputs: Is the identifier valid? true
 * }
 * runExample().catch(console.error);
 * ```
 */


function isValidIdentifier(str: string) {
  return !!str.match(/^[_a-zA-Z0-9]+$/);
}

/**
 * Determines if the provided character is a whitespace character.
 * This function is useful for validating input and ensuring that only non-whitespace characters are processed.
 * 
 * @param char - The character to check.
 * @returns A boolean indicating whether the character is a whitespace character.
 * 
 * @example
 * ```typescript
 * import { isValidWhitespaceCharacter } from "@aptos-labs/ts-sdk";
 * 
 * async function runExample() {
 *   // Check if a character is a whitespace character
 *   const result = isValidWhitespaceCharacter(" ");
 * 
 *   console.log(result); // Should log: true
 * }
 * runExample().catch(console.error);
 * ```
 */


function isValidWhitespaceCharacter(char: string) {
  return !!char.match(/\s/);
}

/**
 * Determines if the provided string represents a generic type from the ABI, which follows the format T0, T1, etc.
 * 
 * @param str - The string to evaluate as a potential generic type.
 * @returns A boolean indicating whether the string matches the generic type format.
 * 
 * @example
 * ```typescript
 * import { Aptos } from "@aptos-labs/ts-sdk";
 * 
 * async function runExample() {
 *   const genericType = "T1"; // Example of a generic type
 *   const isGenericType = isGeneric(genericType); // Check if it's a generic type
 *   console.log(isGenericType); // Should log: true
 * 
 *   const nonGenericType = "String"; // Example of a non-generic type
 *   const isNotGenericType = isGeneric(nonGenericType); // Check if it's a generic type
 *   console.log(isNotGenericType); // Should log: false
 * }
 * runExample().catch(console.error);
 * ```
 */


function isGeneric(str: string) {
  return !!str.match(/^T[0-9]+$/);
}

/**
 * Determines if the provided string represents a reference type, which starts with an ampersand (&).
 * 
 * @param str - The string to evaluate.
 * @returns A boolean indicating whether the string is a reference type.
 * 
 * @example
 * ```typescript
 * import { isRef } from "@aptos-labs/ts-sdk";
 * 
 * async function runExample() {
 *   // Check if the string is a reference type
 *   const result = isRef("&myReference");
 * 
 *   console.log(result); // Should log true
 * }
 * runExample().catch(console.error);
 * ```
 */


function isRef(str: string) {
  return !!str.match(/^&.+$/);
}

/**
 * Determines if the provided string represents a primitive type.
 * This function can help validate types when working with data structures.
 * 
 * @param str - The string to check for being a primitive type.
 * @returns A boolean indicating whether the string is a primitive type.
 * 
 * @example
 * ```typescript
 * import { Aptos } from "@aptos-labs/ts-sdk";
 * 
 * async function runExample() {
 *   const isPrimitiveType = Aptos.isPrimitive("address"); // Check if "address" is a primitive type
 *   console.log(isPrimitiveType); // Should log: true
 * }
 * runExample().catch(console.error);
 * ```
 */


function isPrimitive(str: string) {
  switch (str) {
    case "signer":
    case "address":
    case "bool":
    case "u8":
    case "u16":
    case "u32":
    case "u64":
    case "u128":
    case "u256":
      return true;
    default:
      return false;
  }
}

/**
 * Consumes all whitespace in a string starting from a specified position and returns the new position.
 * This function is useful for parsing strings where whitespace needs to be ignored.
 * 
 * @param tagStr - The string to process for whitespace consumption.
 * @param pos - The starting position in the string from which to begin consuming whitespace.
 * @returns The new position in the string after consuming whitespace.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *     const tagStr = "   Hello, World!  ";
 *     const startPos = 0; // Starting position to consume whitespace
 *     
 *     // Consuming whitespace from the string
 *     const newPos = consumeWhitespace(tagStr, startPos);
 *     
 *     console.log(`New position after consuming whitespace: ${newPos}`); // Outputs the new position
 * }
 * runExample().catch(console.error);
 * ```
 */


function consumeWhitespace(tagStr: string, pos: number) {
  let i = pos;
  for (; i < tagStr.length; i += 1) {
    const innerChar = tagStr[i];

    if (!isValidWhitespaceCharacter(innerChar)) {
      // If it's not colons, and it's an invalid character, we will stop here
      break;
    }
  }
  return i;
}

/**
 * State for TypeTag parsing.  This is pushed onto a stack to keep track of what is the current state
 */
type TypeTagState = {
  savedExpectedTypes: number;
  savedStr: string;
  savedTypes: Array<TypeTag>;
};

export enum TypeTagParserErrorType {
  InvalidTypeTag = "unknown type",
  UnexpectedGenericType = "unexpected generic type",
  UnexpectedTypeArgumentClose = "unexpected '>'",
  UnexpectedWhitespaceCharacter = "unexpected whitespace character",
  UnexpectedComma = "unexpected ','",
  TypeArgumentCountMismatch = "type argument count doesn't match expected amount",
  MissingTypeArgumentClose = "no matching '>' for '<'",
  MissingTypeArgument = "no type argument before ','",
  UnexpectedPrimitiveTypeArguments = "primitive types not expected to have type arguments",
  UnexpectedVectorTypeArgumentCount = "vector type expected to have exactly one type argument",
  UnexpectedStructFormat = "unexpected struct format, must be of the form 0xaddress::module_name::struct_name",
  InvalidModuleNameCharacter = "module name must only contain alphanumeric or '_' characters",
  InvalidStructNameCharacter = "struct name must only contain alphanumeric or '_' characters",
  InvalidAddress = "struct address must be valid",
}

export class TypeTagParserError extends Error {
  constructor(typeTagStr: string, invalidReason: TypeTagParserErrorType) {
    super(`Failed to parse typeTag '${typeTagStr}', ${invalidReason}`);
  }
}

/**
 * All types are made of a few parts they're either:
 * 1. A simple type e.g. u8
 * 2. A standalone struct e.g. 0x1::account::Account
 * 3. A nested struct e.g. 0x1::coin::Coin<0x1234::coin::MyCoin>
 *
 * There are a few more special cases that need to be handled, however.
 * 1. Multiple generics e.g 0x1::pair::Pair<u8, u16>
 * 2. Spacing in the generics e.g. 0x1::pair::Pair< u8 , u16>
 * 3. Nested generics of different depths e.g. 0x1::pair::Pair<0x1::coin::Coin<0x1234::coin::MyCoin>, u8>
 * 4. Generics for types in ABIs are filled in with placeholders e.g T1, T2, T3
 */
export

/**
 * Parses a type tag string into a structured representation of its types.
 * This function is useful for interpreting type tags that may include generics or nested types.
 * 
 * @param typeStr - The string representation of the type tag to parse.
 * @param options - Optional parameters for parsing behavior.
 * @param options.allowGenerics - A boolean indicating whether to allow generic types in the parsing (default is false).
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Parse a type tag string with generics
 *   const typeTag = parseTypeTag("0x1::coin::Coin<u8>", { allowGenerics: true });
 *   console.log(typeTag);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function parseTypeTag(typeStr: string, options?: { allowGenerics?: boolean }) {
  const allowGenerics = options?.allowGenerics ?? false;

  const saved: Array<TypeTagState> = [];
  // This represents the internal types for a type tag e.g. '0x1::coin::Coin<innerTypes>'
  let innerTypes: Array<TypeTag> = [];
  // This represents the current parsed types in a comma list e.g. 'u8, u8'
  let curTypes: Array<TypeTag> = [];
  // This represents the current character index
  let cur: number = 0;
  // This represents the current working string as a type or struct name
  let currentStr: string = "";
  let expectedTypes: number = 1;

  // Iterate through each character, and handle the border conditions
  while (cur < typeStr.length) {
    const char = typeStr[cur];

    if (char === "<") {
      // Start of a type argument, push current state onto a stack
      saved.push({
        savedExpectedTypes: expectedTypes,
        savedStr: currentStr,
        savedTypes: curTypes,
      });

      // Clear current state
      currentStr = "";
      curTypes = [];
      expectedTypes = 1;
    } else if (char === ">") {
      // Process last type, if there is no type string, then don't parse it
      if (currentStr !== "") {
        const newType = parseTypeTagInner(currentStr, innerTypes, allowGenerics);
        curTypes.push(newType);
      }

      // Pop off stack outer type, if there's nothing left, there were too many '>'
      const savedPop = saved.pop();
      if (savedPop === undefined) {
        throw new TypeTagParserError(typeStr, TypeTagParserErrorType.UnexpectedTypeArgumentClose);
      }

      // If the expected types don't match the number of commas, then we also fail
      if (expectedTypes !== curTypes.length) {
        throw new TypeTagParserError(typeStr, TypeTagParserErrorType.TypeArgumentCountMismatch);
      }

      // Add in the new created type, shifting the current types to the inner types
      const { savedStr, savedTypes, savedExpectedTypes } = savedPop;
      innerTypes = curTypes;
      curTypes = savedTypes;
      currentStr = savedStr;
      expectedTypes = savedExpectedTypes;
    } else if (char === ",") {
      // Comma means we need to start parsing a new tag, push the previous one to the curTypes

      // No top level commas (not in a type <> are allowed)
      if (saved.length === 0) {
        throw new TypeTagParserError(typeStr, TypeTagParserErrorType.UnexpectedComma);
      }
      // If there was no actual value before the comma, then it's missing a type argument
      if (currentStr.length === 0) {
        throw new TypeTagParserError(typeStr, TypeTagParserErrorType.MissingTypeArgument);
      }

      // Process characters before as a type
      const newType = parseTypeTagInner(currentStr, innerTypes, allowGenerics);

      // parse type tag and push it on the types
      innerTypes = [];
      curTypes.push(newType);
      currentStr = "";
      expectedTypes += 1;
    } else if (isValidWhitespaceCharacter(char)) {
      // This means we should save what we have and everything else should skip until the next
      let parsedTypeTag = false;
      if (currentStr.length !== 0) {
        const newType = parseTypeTagInner(currentStr, innerTypes, allowGenerics);

        // parse type tag and push it on the types
        innerTypes = [];
        curTypes.push(newType);
        currentStr = "";
        parsedTypeTag = true;
      }

      // Skip ahead on any more whitespace
      cur = consumeWhitespace(typeStr, cur);

      // The next space MUST be a comma, or a closing > if there was something parsed before
      // e.g. `u8 u8` is invalid but `u8, u8` is valid
      const nextChar = typeStr[cur];
      if (cur < typeStr.length && parsedTypeTag && nextChar !== "," && nextChar !== ">") {
        throw new TypeTagParserError(typeStr, TypeTagParserErrorType.UnexpectedWhitespaceCharacter);
      }

      // eslint-disable-next-line no-continue
      continue;
    } else {
      // Any other characters just append to the current string
      currentStr += char;
    }

    cur += 1;
  }

  // This prevents a missing '>' on type arguments
  if (saved.length > 0) {
    throw new TypeTagParserError(typeStr, TypeTagParserErrorType.MissingTypeArgumentClose);
  }

  // This prevents 'u8, u8' as an input
  switch (curTypes.length) {
    case 0:
      return parseTypeTagInner(currentStr, innerTypes, allowGenerics);
    case 1:
      if (currentStr === "") {
        return curTypes[0];
      }
      throw new TypeTagParserError(typeStr, TypeTagParserErrorType.UnexpectedComma);
    default:
      throw new TypeTagParserError(typeStr, TypeTagParserErrorType.UnexpectedWhitespaceCharacter);
  }
}

/**
 * Parses a type tag with internal types associated
 * @param str
 * @param types
 * @param allowGenerics allow generic in parsing of the type tag
 */
function parseTypeTagInner(str: string, types: Array<TypeTag>, allowGenerics: boolean): TypeTag {
  const trimmedStr = str.trim();
  const lowerCaseTrimmed = trimmedStr.toLowerCase();
  if (isPrimitive(lowerCaseTrimmed)) {
    if (types.length > 0) {
      throw new TypeTagParserError(str, TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments);
    }
  }

  switch (trimmedStr.toLowerCase()) {
    case "signer":
      return new TypeTagSigner();
    case "bool":
      return new TypeTagBool();
    case "address":
      return new TypeTagAddress();
    case "u8":
      return new TypeTagU8();
    case "u16":
      return new TypeTagU16();
    case "u32":
      return new TypeTagU32();
    case "u64":
      return new TypeTagU64();
    case "u128":
      return new TypeTagU128();
    case "u256":
      return new TypeTagU256();
    case "vector":
      if (types.length !== 1) {
        throw new TypeTagParserError(str, TypeTagParserErrorType.UnexpectedVectorTypeArgumentCount);
      }
      return new TypeTagVector(types[0]);
    default:
      // Reference will have to handle the inner type
      if (isRef(trimmedStr)) {
        const actualType = trimmedStr.substring(1);
        return new TypeTagReference(parseTypeTagInner(actualType, types, allowGenerics));
      }

      // Generics are always expected to be T0 or T1
      if (isGeneric(trimmedStr)) {
        if (allowGenerics) {
          return new TypeTagGeneric(Number(trimmedStr.split("T")[1]));
        }
        throw new TypeTagParserError(str, TypeTagParserErrorType.UnexpectedGenericType);
      }

      // If the value doesn't contain a colon, then we'll assume it isn't trying to be a struct
      if (!trimmedStr.match(/:/)) {
        throw new TypeTagParserError(str, TypeTagParserErrorType.InvalidTypeTag);
      }

      // Parse for a struct tag
      // eslint-disable-next-line no-case-declarations
      const structParts = trimmedStr.split("::");
      if (structParts.length !== 3) {
        throw new TypeTagParserError(str, TypeTagParserErrorType.UnexpectedStructFormat);
      }

      // Validate struct address
      // eslint-disable-next-line no-case-declarations
      let address: AccountAddress;
      try {
        address = AccountAddress.fromString(structParts[0]);
      } catch (error: any) {
        throw new TypeTagParserError(str, TypeTagParserErrorType.InvalidAddress);
      }

      // Validate identifier characters
      if (!isValidIdentifier(structParts[1])) {
        throw new TypeTagParserError(str, TypeTagParserErrorType.InvalidModuleNameCharacter);
      }
      if (!isValidIdentifier(structParts[2])) {
        throw new TypeTagParserError(str, TypeTagParserErrorType.InvalidStructNameCharacter);
      }

      return new TypeTagStruct(
        new StructTag(address, new Identifier(structParts[1]), new Identifier(structParts[2]), types),
      );
  }
}