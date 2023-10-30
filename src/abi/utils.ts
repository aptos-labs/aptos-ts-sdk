// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

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
