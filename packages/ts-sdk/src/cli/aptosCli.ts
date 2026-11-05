// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

export const APTOS_CLI_PACKAGE = "@aptos-labs/aptos-cli";

export const APTOS_CLI_NOT_INSTALLED_ERROR =
  `The optional peer dependency "${APTOS_CLI_PACKAGE}" is required to use ` +
  `"@aptos-labs/ts-sdk/cli" (LocalNode and Move), but it could not be found. ` +
  `Install it with your package manager, e.g. "npm install --save-dev ${APTOS_CLI_PACKAGE}", ` +
  `"pnpm add -D ${APTOS_CLI_PACKAGE}", or "yarn add -D ${APTOS_CLI_PACKAGE}". ` +
  `Without it, "npx aptos" would resolve the unrelated, deprecated "aptos" package, ` +
  "which does not provide the Aptos CLI.";

/**
 * Returns the `node_modules` directories Node would search when resolving
 * `@aptos-labs/aptos-cli` from this module, without loading the package.
 *
 * A plain `require.resolve()` cannot be used for detection: the CLI package
 * ships an empty `exports` map, so resolving it fails even when installed.
 * Checking for its `package.json` on the resolution paths works across npm,
 * yarn, and pnpm layouts (including pnpm's peer-dependency layout, where the
 * CLI sits next to this package).
 */
export function aptosCliSearchPaths(): string[] {
  try {
    return createRequire(import.meta.url).resolve.paths(APTOS_CLI_PACKAGE) ?? [];
  } catch {
    return [];
  }
}

export function findAptosCliPackageDir(searchPaths: string[] = aptosCliSearchPaths()): string | undefined {
  for (const searchPath of searchPaths) {
    const candidate = join(searchPath, APTOS_CLI_PACKAGE);
    if (existsSync(join(candidate, "package.json"))) {
      return candidate;
    }
  }
  return undefined;
}

export function isAptosCliAvailable(searchPaths?: string[]): boolean {
  return findAptosCliPackageDir(searchPaths) !== undefined;
}

/**
 * Throws an actionable error when the optional `@aptos-labs/aptos-cli` peer
 * dependency is not installed, instead of letting `npx aptos` fetch the
 * unrelated deprecated `aptos` package and fail confusingly.
 */
export function assertAptosCliAvailable(searchPaths?: string[]): void {
  if (!isAptosCliAvailable(searchPaths)) {
    throw new Error(APTOS_CLI_NOT_INSTALLED_ERROR);
  }
}
