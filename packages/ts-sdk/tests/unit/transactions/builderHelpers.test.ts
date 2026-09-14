// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  isBool,
  isString,
  isNumber,
  convertNumber,
  isLargeNumber,
  isEmptyOption,
  isEncodedEntryFunctionArgument,
  isBcsBool,
  isBcsAddress,
  isBcsString,
  isBcsFixedBytes,
  isBcsU8,
  isBcsU16,
  isBcsU32,
  isBcsU64,
  isBcsU128,
  isBcsU256,
  isBcsI8,
  isBcsI16,
  isBcsI32,
  isBcsI64,
  isBcsI128,
  isBcsI256,
  isScriptDataInput,
  throwTypeMismatch,
  findFirstNonSignerArg,
} from "../../../src/transactions/transactionBuilder/helpers.js";
import {
  Bool,
  FixedBytes,
  I128,
  I16,
  I256,
  I32,
  I64,
  I8,
  MoveString,
  MoveVector,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
} from "../../../src/bcs/index.js";
import { AccountAddress } from "../../../src/core/index.js";
import type { MoveFunction } from "../../../src/types/index.js";

describe("transactionBuilder/helpers — primitive type guards", () => {
  describe("isBool / isString / isNumber", () => {
    it.each([
      [true, true],
      [false, true],
      [0, false],
      ["a", false],
      [null, false],
    ])("isBool(%s) = %s", (input, expected) => {
      expect(isBool(input as never)).toBe(expected);
    });

    it.each([
      ["hello", true],
      ["", true],
      [0, false],
      [true, false],
      [null, false],
    ])("isString(%s) = %s", (input, expected) => {
      expect(isString(input)).toBe(expected);
    });

    it.each([
      [0, true],
      [-1, true],
      [1.5, true],
      [Number.NaN, true /* NaN is still typeof number */],
      ["1", false],
      [1n, false],
      [true, false],
    ])("isNumber(%s) = %s", (input, expected) => {
      expect(isNumber(input as never)).toBe(expected);
    });
  });

  describe("convertNumber", () => {
    it("returns the same number for a number", () => {
      expect(convertNumber(42)).toBe(42);
    });

    it("parses a numeric string", () => {
      expect(convertNumber("99")).toBe(99);
    });

    it("returns undefined for an empty string (the explicit guard, not NaN)", () => {
      expect(convertNumber("")).toBeUndefined();
    });

    it("returns undefined for a bigint", () => {
      expect(convertNumber(1n)).toBeUndefined();
    });

    it("returns undefined for null/undefined/boolean", () => {
      expect(convertNumber(null as never)).toBeUndefined();
      expect(convertNumber(undefined as never)).toBeUndefined();
      expect(convertNumber(true as never)).toBeUndefined();
    });
  });

  describe("isLargeNumber", () => {
    it("accepts number, bigint, and string", () => {
      expect(isLargeNumber(1)).toBe(true);
      expect(isLargeNumber(1n)).toBe(true);
      expect(isLargeNumber("1")).toBe(true);
    });

    it("rejects everything else", () => {
      expect(isLargeNumber(true as never)).toBe(false);
      expect(isLargeNumber(null as never)).toBe(false);
      expect(isLargeNumber(undefined as never)).toBe(false);
    });
  });

  describe("isEmptyOption", () => {
    it("only true for null and undefined (not 0, '', false)", () => {
      expect(isEmptyOption(null as never)).toBe(true);
      expect(isEmptyOption(undefined as never)).toBe(true);
      expect(isEmptyOption(0 as never)).toBe(false);
      expect(isEmptyOption("" as never)).toBe(false);
      expect(isEmptyOption(false as never)).toBe(false);
    });
  });
});

describe("transactionBuilder/helpers — BCS class guards", () => {
  it.each<[string, unknown, (a: never) => boolean, boolean]>([
    ["Bool", new Bool(true), isBcsBool, true],
    ["AccountAddress", AccountAddress.ONE, isBcsAddress, true],
    ["MoveString", new MoveString("x"), isBcsString, true],
    ["FixedBytes", new FixedBytes(new Uint8Array(4)), isBcsFixedBytes, true],
    ["U8", new U8(1), isBcsU8, true],
    ["U16", new U16(1), isBcsU16, true],
    ["U32", new U32(1), isBcsU32, true],
    ["U64", new U64(1), isBcsU64, true],
    ["U128", new U128(1), isBcsU128, true],
    ["U256", new U256(1), isBcsU256, true],
    ["I8", new I8(1), isBcsI8, true],
    ["I16", new I16(1), isBcsI16, true],
    ["I32", new I32(1), isBcsI32, true],
    ["I64", new I64(1), isBcsI64, true],
    ["I128", new I128(1), isBcsI128, true],
    ["I256", new I256(1), isBcsI256, true],
  ])("%s instance matches its guard", (_label, instance, guard, expected) => {
    expect(guard(instance as never)).toBe(expected);
  });

  it("each guard rejects unrelated BCS instances (e.g., U16 is not a U8)", () => {
    const u16 = new U16(1);
    expect(isBcsU8(u16)).toBe(false);
    expect(isBcsBool(u16)).toBe(false);
    expect(isBcsAddress(u16)).toBe(false);
  });

  it("primitive bool/number/string are not BCS-encoded args", () => {
    expect(isBcsBool(true)).toBe(false);
    expect(isBcsU64(1)).toBe(false);
    expect(isBcsString("hello")).toBe(false);
  });
});

describe("transactionBuilder/helpers — isEncodedEntryFunctionArgument", () => {
  it("accepts every BCS variant", () => {
    expect(isEncodedEntryFunctionArgument(new Bool(true))).toBe(true);
    expect(isEncodedEntryFunctionArgument(new U64(1))).toBe(true);
    expect(isEncodedEntryFunctionArgument(AccountAddress.ONE)).toBe(true);
    expect(isEncodedEntryFunctionArgument(new MoveString("x"))).toBe(true);
    expect(isEncodedEntryFunctionArgument(new FixedBytes(new Uint8Array(2)))).toBe(true);
    expect(isEncodedEntryFunctionArgument(MoveVector.U8([1, 2, 3]))).toBe(true);
  });

  it("rejects primitive inputs (number, string, boolean)", () => {
    expect(isEncodedEntryFunctionArgument(1 as never)).toBe(false);
    expect(isEncodedEntryFunctionArgument("hello" as never)).toBe(false);
    expect(isEncodedEntryFunctionArgument(true as never)).toBe(false);
  });
});

describe("transactionBuilder/helpers — script vs entry-function dispatch", () => {
  it("isScriptDataInput: true when 'bytecode' key is present", () => {
    expect(isScriptDataInput({ bytecode: new Uint8Array([1]) } as never)).toBe(true);
  });

  it("isScriptDataInput: false for an entry-function payload", () => {
    expect(
      isScriptDataInput({
        function: "0x1::coin::transfer",
        functionArguments: [],
      } as never),
    ).toBe(false);
  });
});

describe("transactionBuilder/helpers — throwTypeMismatch", () => {
  it("includes the expected type and position in the message", () => {
    expect(() => throwTypeMismatch("u64", 3)).toThrow(/Type mismatch for argument 3, expected 'u64'/);
  });
});

describe("transactionBuilder/helpers — findFirstNonSignerArg", () => {
  function abi(params: string[]): MoveFunction {
    return {
      name: "f",
      visibility: "public",
      is_entry: true,
      is_view: false,
      generic_type_params: [],
      params,
      return: [],
    } as never;
  }

  it("returns the index of the first non-signer param", () => {
    expect(findFirstNonSignerArg(abi(["signer", "&signer", "u64", "address"]))).toBe(2);
  });

  it("returns params.length when every parameter is a signer reference", () => {
    expect(findFirstNonSignerArg(abi(["signer", "&signer", "signer"]))).toBe(3);
  });

  it("returns 0 when the first parameter is not a signer", () => {
    expect(findFirstNonSignerArg(abi(["u64", "&signer"]))).toBe(0);
  });

  it("returns 0 (params.length when empty) for an empty params array", () => {
    expect(findFirstNonSignerArg(abi([]))).toBe(0);
  });
});
