// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Exercises the remaining `StructEnumArgumentParser` branches not hit by
// `structEnumParser-encode.test.ts`: every primitive type in
// `encodeValueByType`, the `parseNumber` / `parseNumberBigInt` error paths,
// vector / Option encoding edge cases, the unsupported-type guard, and the
// enum-vs-struct detection inside `encodeStruct`. All offline via preloadModules.

import { describe, expect, it } from "vitest";
import {
  Serializer,
  U8,
  U16,
  U32,
  U64,
  U128,
  U256,
  I8,
  I16,
  I32,
  I64,
  I128,
  I256,
  StructEnumArgumentParser,
  parseTypeTag,
  TypeTagStruct,
} from "../../../src/index.js";
import type { MoveModuleBytecode, MoveStruct } from "../../../src/types/index.js";
import { createMockClient } from "../../helpers/mockClient.js";

const MODULE_ADDR = "0x5";
const MODULE_NAME = "shapes";
const MODULE_ID = `${MODULE_ADDR}::${MODULE_NAME}`;

function s(name: string, fields: Array<{ name: string; type: string }>, extra: Partial<MoveStruct> = {}): MoveStruct {
  return {
    name,
    is_native: false,
    is_event: false,
    is_enum: false,
    abilities: [],
    generic_type_params: [],
    fields,
    ...extra,
  };
}

function buildParser(): StructEnumArgumentParser {
  const moduleBytecode: MoveModuleBytecode = {
    bytecode: "0x00",
    abi: {
      address: MODULE_ADDR,
      name: MODULE_NAME,
      friends: [],
      exposed_functions: [],
      structs: [
        s("Nums", [
          { name: "n8", type: "u8" },
          { name: "n16", type: "u16" },
          { name: "n32", type: "u32" },
          { name: "n64", type: "u64" },
          { name: "n128", type: "u128" },
          { name: "n256", type: "u256" },
          { name: "s8", type: "i8" },
          { name: "s16", type: "i16" },
          { name: "s32", type: "i32" },
          { name: "s64", type: "i64" },
          { name: "s128", type: "i128" },
          { name: "s256", type: "i256" },
        ]),
        s("SignerHolder", [{ name: "sig", type: "signer" }]),
        s("VecHolder", [{ name: "v", type: "vector<u64>" }]),
        s("OptHolder", [{ name: "o", type: "0x1::option::Option<u64>" }]),
        s("BareOptHolder", [{ name: "o", type: "0x1::option::Option" }]),
        s(
          "Color",
          [
            { name: "Red", type: "u8" },
            { name: "Green", type: "u8" },
          ],
          { is_enum: true },
        ),
        s("ColorHolder", [{ name: "c", type: "0x5::shapes::Color" }]),
        s("WrappedString", [{ name: "inner", type: "0x1::string::String" }]),
        s("U8Field", [{ name: "n", type: "u8" }]),
        s("U64Field", [{ name: "n", type: "u64" }]),
      ],
    },
  };
  const parser = new StructEnumArgumentParser(createMockClient().config);
  parser.preloadModules(new Map([[MODULE_ID, moduleBytecode]]));
  return parser;
}

const tag = (typeStr: string) => parseTypeTag(typeStr, { allowGenerics: true }) as TypeTagStruct;

describe("StructEnumArgumentParser encodeValueByType primitives", () => {
  it("encodes every Move primitive width", async () => {
    const parser = buildParser();
    const result = await parser.encodeStructArgument(tag(`${MODULE_ID}::Nums`), {
      n8: 1,
      n16: 2,
      n32: 3,
      n64: "4",
      n128: "5",
      n256: 6,
      s8: -1,
      s16: -2,
      s32: -3,
      s64: "-4",
      s128: -5,
      s256: -6,
    });

    const expected = new Serializer();
    expected.serializeFixedBytes(new U8(1).bcsToBytes());
    expected.serializeFixedBytes(new U16(2).bcsToBytes());
    expected.serializeFixedBytes(new U32(3).bcsToBytes());
    expected.serializeFixedBytes(new U64(4n).bcsToBytes());
    expected.serializeFixedBytes(new U128(5n).bcsToBytes());
    expected.serializeFixedBytes(new U256(6n).bcsToBytes());
    expected.serializeFixedBytes(new I8(-1).bcsToBytes());
    expected.serializeFixedBytes(new I16(-2).bcsToBytes());
    expected.serializeFixedBytes(new I32(-3).bcsToBytes());
    expected.serializeFixedBytes(new I64(-4n).bcsToBytes());
    expected.serializeFixedBytes(new I128(-5n).bcsToBytes());
    expected.serializeFixedBytes(new I256(-6n).bcsToBytes());
    expect(result.bcsToBytes()).toEqual(expected.toUint8Array());
  });

  it("throws on an unsupported field type (signer)", async () => {
    const parser = buildParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::SignerHolder`), { sig: "x" })).rejects.toThrow(
      "Unsupported type: signer",
    );
  });
});

describe("StructEnumArgumentParser parseNumber / parseNumberBigInt errors", () => {
  it("rejects NaN strings and wrong types for small ints", async () => {
    const parser = buildParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::U8Field`), { n: "abc" })).rejects.toThrow(
      "Invalid u8 value: abc",
    );
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::U8Field`), { n: true })).rejects.toThrow(
      "Expected number or string for u8",
    );
  });

  it("rejects invalid strings and wrong types for bigint ints", async () => {
    const parser = buildParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::U64Field`), { n: "1x2" })).rejects.toThrow(
      "Invalid u64 value: 1x2",
    );
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::U64Field`), { n: true })).rejects.toThrow(
      "Expected number, bigint, or string for u64",
    );
  });
});

describe("StructEnumArgumentParser vector + option encoding", () => {
  it("rejects a non-array value for a vector field", async () => {
    const parser = buildParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::VecHolder`), { v: 5 })).rejects.toThrow(
      "Expected array for vector type, got number",
    );
  });

  it("encodes Option in vector format (None and Some)", async () => {
    const parser = buildParser();
    const none = await parser.encodeStructArgument(tag(`${MODULE_ID}::OptHolder`), { o: [] });
    const some = await parser.encodeStructArgument(tag(`${MODULE_ID}::OptHolder`), { o: [9] });
    // None serializes shorter than Some.
    expect(none.bcsToBytes().length).toBeLessThan(some.bcsToBytes().length);
  });

  it("encodes Option in enum format and rejects invalid Option shapes", async () => {
    const parser = buildParser();
    const enumFmt = await parser.encodeStructArgument(tag(`${MODULE_ID}::OptHolder`), { o: { Some: { "0": "3" } } });
    expect(enumFmt.bcsToBytes().length).toBeGreaterThan(0);

    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::OptHolder`), { o: [1, 2] })).rejects.toThrow(
      "Option as vector must have 0 or 1 elements, got 2",
    );
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::OptHolder`), { o: 5 })).rejects.toThrow(
      "Invalid Option format",
    );
  });

  it("throws when an Option type lacks its type parameter", async () => {
    const parser = buildParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::BareOptHolder`), { o: [1] })).rejects.toThrow(
      "Option must have a type parameter",
    );
  });
});

describe("StructEnumArgumentParser encodeStruct enum-vs-struct detection", () => {
  it("detects a nested enum field and encodes it as a variant", async () => {
    const parser = buildParser();
    const result = await parser.encodeStructArgument(tag(`${MODULE_ID}::ColorHolder`), { c: { Green: {} } });
    expect(result.bcsToBytes().length).toBeGreaterThan(0);
  });

  it("falls back to struct encoding for a single-field non-enum struct", async () => {
    const parser = buildParser();
    const result = await parser.encodeStructArgument(tag(`${MODULE_ID}::WrappedString`), { inner: "hello" });
    expect(result.bcsToBytes().length).toBeGreaterThan(0);
  });
});
