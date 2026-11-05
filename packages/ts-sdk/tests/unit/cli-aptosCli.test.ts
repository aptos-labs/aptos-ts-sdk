// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  APTOS_CLI_NOT_INSTALLED_ERROR,
  assertAptosCliAvailable,
  findAptosCliPackageDir,
  isAptosCliAvailable,
} from "../../src/cli/aptosCli.js";

describe("aptosCli optional peer detection", () => {
  let root: string;
  let nodeModules: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "aptos-cli-peer-"));
    nodeModules = join(root, "node_modules");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("finds @aptos-labs/aptos-cli when present on a search path", () => {
    const cliDir = join(nodeModules, "@aptos-labs", "aptos-cli");
    mkdirSync(cliDir, { recursive: true });
    writeFileSync(join(cliDir, "package.json"), JSON.stringify({ name: "@aptos-labs/aptos-cli" }));

    expect(findAptosCliPackageDir([nodeModules])).toBe(cliDir);
    expect(isAptosCliAvailable([nodeModules])).toBe(true);
    expect(() => assertAptosCliAvailable([nodeModules])).not.toThrow();
  });

  it("reports the CLI as missing when no search path contains it", () => {
    mkdirSync(nodeModules, { recursive: true });

    expect(findAptosCliPackageDir([nodeModules])).toBeUndefined();
    expect(isAptosCliAvailable([nodeModules])).toBe(false);
    expect(isAptosCliAvailable([])).toBe(false);
  });

  it("throws a clear, actionable error when the CLI is missing", () => {
    expect(() => assertAptosCliAvailable([nodeModules])).toThrow(APTOS_CLI_NOT_INSTALLED_ERROR);
    expect(() => assertAptosCliAvailable([nodeModules])).toThrow(/@aptos-labs\/aptos-cli/);
    expect(() => assertAptosCliAvailable([nodeModules])).toThrow(/npm install --save-dev @aptos-labs\/aptos-cli/);
    expect(() => assertAptosCliAvailable([nodeModules])).toThrow(/deprecated "aptos" package/);
  });

  it("ignores a directory that has no package.json", () => {
    mkdirSync(join(nodeModules, "@aptos-labs", "aptos-cli"), { recursive: true });

    expect(isAptosCliAvailable([nodeModules])).toBe(false);
  });

  it("detects the CLI installed for this repo (devDependency)", () => {
    // The SDK keeps @aptos-labs/aptos-cli as a devDependency so its own
    // tests and examples can use the /cli subpath.
    expect(isAptosCliAvailable()).toBe(true);
  });
});
