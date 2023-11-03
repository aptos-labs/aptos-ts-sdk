// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, Hex } from "../core";
import { HexInput } from "../types";
import pako from "pako";

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

export function toAccountAddress(input: HexInput | AccountAddress): AccountAddress {
  if (input instanceof AccountAddress) {
    return input;
  }
  return AccountAddress.fromHexInputRelaxed(input);
}

/**
 * Convert a module source code in gzipped hex string to plain text
 * @param source module source code in gzipped hex string
 * @returns original source code in plain text
 */
export function transformCode(source: string): string {
  return pako.ungzip(Hex.fromHexInput(source).toUint8Array(), {to: "string"});
}
