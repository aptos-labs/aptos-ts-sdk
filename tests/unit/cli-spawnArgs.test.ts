// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { assertSafeCliArg, assertSafeCliArgs } from "../../src/cli/spawnArgs.js";

describe("assertSafeCliArg", () => {
  it("accepts typical CLI argument shapes", () => {
    const safe = [
      "--assume-yes",
      "--gas-unit-price=10",
      "--named-addresses",
      "alice=0x123,bob=0x456",
      "/abs/path/to/package",
      "C:\\Program\\Files\\package",
      "0xdeadbeef",
      "node",
      "run-localnet",
      "",
    ];
    for (const arg of safe) {
      expect(() => assertSafeCliArg(arg)).not.toThrow();
    }
  });

  it.each([
    ["ampersand", "foo & calc.exe"],
    ["pipe", "foo | nc"],
    ["semicolon", "foo;rm"],
    ["backtick", "foo`whoami`"],
    ["dollar paren", "foo$(whoami)"],
    ["redirect out", "foo > out"],
    ["redirect in", "foo < in"],
    ["newline", "foo\nbar"],
    ["caret cmd escape", "foo^echo"],
    ["double quote", 'foo"bar'],
    ["single quote", "foo'bar"],
    ["bang history", "foo!cmd"],
    ["glob star", "foo*"],
    ["glob question", "foo?"],
  ])("rejects shell metacharacter (%s)", (_label, arg) => {
    expect(() => assertSafeCliArg(arg)).toThrow(/shell/);
  });

  it("rejects non-string inputs", () => {
    expect(() => assertSafeCliArg(undefined as unknown as string)).toThrow(/must be a string/);
    expect(() => assertSafeCliArg(123 as unknown as string)).toThrow(/must be a string/);
  });
});

describe("assertSafeCliArgs", () => {
  it("accepts an array of safe args", () => {
    expect(() => assertSafeCliArgs(["aptos", "node", "run-localnet", "--assume-yes"])).not.toThrow();
  });

  it("rejects when any element is unsafe", () => {
    expect(() => assertSafeCliArgs(["aptos", "node", "& calc.exe"])).toThrow(/shell/);
  });
});
