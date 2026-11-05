// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from "vitest";
import { APTOS_CLI_NOT_INSTALLED_ERROR } from "../../src/cli/aptosCli.js";
import { LocalNode } from "../../src/cli/localNode.js";
import { Move } from "../../src/cli/move.js";

vi.mock("../../src/cli/aptosCli.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/cli/aptosCli.js")>();
  return {
    ...original,
    assertAptosCliAvailable: () => {
      throw new Error(original.APTOS_CLI_NOT_INSTALLED_ERROR);
    },
  };
});

describe("LocalNode / Move without @aptos-labs/aptos-cli", () => {
  it("LocalNode.start() throws a clear error instead of spawning npx aptos", () => {
    const localNode = new LocalNode({ showStdout: false });
    expect(() => localNode.start()).toThrow(APTOS_CLI_NOT_INSTALLED_ERROR);
    expect(localNode.process).toBeNull();
  });

  it("Move commands reject with a clear error instead of spawning npx aptos", async () => {
    const move = new Move();
    await expect(move.init({})).rejects.toThrow(APTOS_CLI_NOT_INSTALLED_ERROR);
    await expect(move.compile({ packageDirectoryPath: "move/pkg", namedAddresses: {} })).rejects.toThrow(
      APTOS_CLI_NOT_INSTALLED_ERROR,
    );
  });
});
