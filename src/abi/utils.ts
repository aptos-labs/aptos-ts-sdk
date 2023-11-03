// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Bool, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../bcs";
import { AccountAddress, AccountAddressInput, Hex } from "../core";
import { AccountAuthenticator, TypeTag } from "../transactions";
import { HexInput, MoveModule, MoveModuleBytecode } from "../types";
import pako from "pako";
import { Aptos } from "../api";
import { BCSKinds } from "./types";

export function toPascalCase(input: string): string {
  return input
    .split("_")
    .map((s) => s[0].toUpperCase() + s.slice(1).toLowerCase())
    .join("");
}

export function toCamelCase(input: string): string {
  const pascalCase = toPascalCase(input);
  return pascalCase[0].toLowerCase() + pascalCase.slice(1);
}

export function sanitizeName(name: string): string {
  if (name === "Object") {
    return "Object$1";
  }
  if (name === "String") {
    return "String$1";
  }

  return name;
}

export function addressBytes(input: AccountAddressInput): Uint8Array {
  if (input instanceof AccountAddress) {
    return input.data;
  }
  return AccountAddress.from(input).data;
}

/**
 * Convert a module source code in gzipped hex string to plain text
 * @param source module source code in gzipped hex string
 * @returns original source code in plain text
 */
export function transformCode(source: string): string {
  return pako.ungzip(Hex.fromHexInput(source).toUint8Array(), { to: "string" });
}

export async function fetchModuleABIs(aptos: Aptos, accountAddress: AccountAddress) {
  const moduleABIs = await aptos.getAccountModules({
    accountAddress: accountAddress.toString(),
  });
  return moduleABIs;
}

export function isAbiDefined(obj: MoveModuleBytecode): obj is { bytecode: string; abi: MoveModule } {
  return obj.abi !== undefined;
}
// TODO: Add an optional field to let users map the types to clearer names, so
// they will see U8_number instead of `number` for example.
// We could even let em name the types themselves? Since it's ultimately just a type alias.
export const kindToSimpleTypeMap: { [key in BCSKinds]: string } = {
  Bool: "boolean",
  U8: "Uint8",
  U16: "Uint16",
  U32: "Uint32",
  U64: "Uint64",
  U128: "Uint128",
  U256: "Uint256",
  AccountAddress: "HexInput | AccountAddress",
  MoveString: "string",
  MoveVector: "Array",
  MoveOption: "OneOrNone", // OneOrNone<T>
  MoveObject: "HexInput | AccountAddress",
  AccountAuthenticator: "AccountAuthenticator",
};

export function kindArrayToString(kindArray: Array<BCSKinds>): string {
  if (kindArray.length === 0) {
    return "";
  }
  if (kindArray.length === 1) {
    return kindArray[0];
  }
  let kindString = kindArray[kindArray.length - 1];
  for (let i = kindArray.length - 2; i >= 0; i -= 1) {
    kindString = `${kindArray[i]}<${kindString}>`;
  }
  return kindString;
}
export function toBCSClassName(typeTag: TypeTag): Array<BCSKinds> {
  if (typeTag.isVector()) {
    return [MoveVector.kind, ...toBCSClassName(typeTag.value)];
  }
  if (typeTag.isStruct()) {
    if (typeTag.isString()) {
      return [MoveString.kind];
    }
    if (typeTag.isObject()) {
      // Objects can only have 1 TypeTag
      // when we return this, we will check if an AccountAddress kind is second to last,
      // because that means it's an Object<T>, then we'll remove the T and add a comment explaining
      // that T is of type: T
      // NOTE: This means a true Object<T> as an entry function argument will not work
      return ["MoveObject", ...toBCSClassName(typeTag.value.typeArgs[0])];
    }
    if (typeTag.isOption()) {
      // Options can only have 1 TypeTag
      return [MoveOption.kind, ...toBCSClassName(typeTag.value.typeArgs[0])];
    }
    // It must be a resource, otherwise the .move file would not compile
    return [typeTag.toString()];
  }
  // as any because typeguards aren't working correctly...
  if ((typeTag as any).isBool()) {
    return [Bool.kind];
  }
  if ((typeTag as any).isU8()) {
    return [U8.kind];
  }
  if ((typeTag as any).isU16()) {
    return [U16.kind];
  }
  if ((typeTag as any).isU32()) {
    return [U32.kind];
  }
  if ((typeTag as any).isU64()) {
    return [U64.kind];
  }
  if ((typeTag as any).isU128()) {
    return [U128.kind];
  }
  if ((typeTag as any).isU256()) {
    return [U256.kind];
  }
  if ((typeTag as any).isAddress()) {
    return [AccountAddress.kind];
  }

  if (typeTag.isReference()) {
    if (typeTag.value.isSigner()) {
      return [AccountAuthenticator.kind];
    }
    throw new Error(`Invalid reference argument: ${typeTag.toString()}`);
  }
  if (typeTag.isSigner()) {
    return [AccountAuthenticator.kind];
  }

  throw new Error(`Unknown TypeTag: ${typeTag}`);
}

export function numberToLetter(num: number): string {
  // Check if the number corresponds to the letters in the English alphabet
  if (num < 1 || num > 26) {
    throw new Error("Number out of range. Please provide a number between 1 and 26.");
  }

  // 64 is the ASCII code right before 'A'; therefore, adding the number gives the corresponding letter
  return String.fromCharCode(64 + num);
}
