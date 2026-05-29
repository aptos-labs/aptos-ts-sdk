// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Covers `src/transactions/transactionBuilder/structEnumParser.ts`. The parser
// normally fetches module ABIs over the network; here we use `preloadModules`
// to inject hand-built ABIs so the encoding logic is exercised fully offline.
// The single network-touching branch (`fetchModule` error wrapping) is driven
// with a mocked client that rejects.
//
// Assertions check the exact BCS bytes produced (compared against
// independently-constructed BCS values) plus the specific error messages on
// every validation branch.

import { describe, expect, it } from "vitest";
import {
  AccountAddress,
  Bool,
  Serializer,
  MoveString,
  MoveOption,
  U8,
  U64,
  StructEnumArgumentParser,
  MoveStructArgument,
  MoveEnumArgument,
  parseTypeTag,
  TypeTagStruct,
  TypeTagU64,
} from "../../../src/index.js";
import type { MoveModuleBytecode, MoveStruct } from "../../../src/types/index.js";
import { createMockClient } from "../../helpers/mockClient.js";

const MODULE_ADDR = "0x5";
const MODULE_NAME = "shapes";
const MODULE_ID = `${MODULE_ADDR}::${MODULE_NAME}`;

function struct(
  name: string,
  fields: Array<{ name: string; type: string }>,
  extra: Partial<MoveStruct> = {},
): MoveStruct {
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

function buildModule(): MoveModuleBytecode {
  return {
    bytecode: "0x00",
    abi: {
      address: MODULE_ADDR,
      name: MODULE_NAME,
      friends: [],
      exposed_functions: [],
      structs: [
        struct("Point", [
          { name: "x", type: "u64" },
          { name: "y", type: "u64" },
        ]),
        // Generic struct Box<T0> { value: T0 }
        struct("Box", [{ name: "value", type: "T0" }], { generic_type_params: [{ constraints: [] }] }),
        // Struct exercising String, vector, Option, Object, address, bool, u8, vector<u8>
        struct("Mixed", [
          { name: "s", type: "0x1::string::String" },
          { name: "v", type: "vector<u64>" },
          { name: "o", type: "0x1::option::Option<u64>" },
          { name: "obj", type: "0x1::object::Object<0x1::string::String>" },
          { name: "a", type: "address" },
          { name: "b", type: "bool" },
          { name: "n", type: "u8" },
          { name: "bytes", type: "vector<u8>" },
        ]),
        struct("OutOfBounds", [{ name: "value", type: "T5" }], { generic_type_params: [{ constraints: [] }] }),
        struct("NativeThing", [], { is_native: true }),
        // Enums (variants are encoded in the `fields` array)
        struct(
          "Color",
          [
            { name: "Red", type: "u8" },
            { name: "Green", type: "u8" },
            { name: "Blue", type: "u8" },
          ],
          { is_enum: true },
        ),
        struct("MaybeNum", [{ name: "Just", type: "u64" }], { is_enum: true }),
        struct("PairHolder", [{ name: "Pair", type: "u64" }], { is_enum: true }),
        struct("WrappedString", [{ name: "inner", type: "0x1::string::String" }]),
      ],
    },
  };
}

function makeParser(): StructEnumArgumentParser {
  const parser = new StructEnumArgumentParser(createMockClient().config);
  parser.preloadModules(new Map([[MODULE_ID, buildModule()]]));
  return parser;
}

function tag(typeStr: string): TypeTagStruct {
  return parseTypeTag(typeStr, { allowGenerics: true }) as TypeTagStruct;
}

describe("StructEnumArgumentParser - structs", () => {
  it("encodes a simple struct field-by-field in declaration order", async () => {
    const parser = makeParser();
    const result = await parser.encodeStructArgument(tag(`${MODULE_ID}::Point`), { x: "10", y: "20" });
    expect(result).toBeInstanceOf(MoveStructArgument);

    const expected = new Serializer();
    expected.serializeFixedBytes(new U64(10n).bcsToBytes());
    expected.serializeFixedBytes(new U64(20n).bcsToBytes());
    expect(result.bcsToBytes()).toEqual(expected.toUint8Array());
  });

  it("substitutes generic type parameters from the instantiated struct tag", async () => {
    const parser = makeParser();
    const result = await parser.encodeStructArgument(tag(`${MODULE_ID}::Box<u64>`), { value: "42" });
    expect(result.bcsToBytes()).toEqual(new U64(42n).bcsToBytes());
  });

  it("encodes the mixed struct covering String/vector/Option/Object/address/bool/u8/vector<u8>", async () => {
    const parser = makeParser();
    const result = await parser.encodeStructArgument(tag(`${MODULE_ID}::Mixed`), {
      s: "hi",
      v: ["1", "2"],
      o: [7], // Option vector format -> Some(7)
      obj: "0x1",
      a: "0x2",
      b: true,
      n: 5,
      bytes: "AB",
    });

    const expected = new Serializer();
    expected.serializeFixedBytes(new MoveString("hi").bcsToBytes());
    // vector<u64> [1, 2]
    const v = new Serializer();
    v.serializeU32AsUleb128(2);
    v.serializeFixedBytes(new U64(1n).bcsToBytes());
    v.serializeFixedBytes(new U64(2n).bcsToBytes());
    expected.serializeFixedBytes(v.toUint8Array());
    // Option<u64> Some(7)
    expected.serializeFixedBytes(new MoveOption(new U64(7n)).bcsToBytes());
    // Object<...> -> address 0x1
    expected.serializeFixedBytes(AccountAddress.ONE.bcsToBytes());
    // address 0x2
    expected.serializeFixedBytes(AccountAddress.TWO.bcsToBytes());
    // bool true
    expected.serializeFixedBytes(new Bool(true).bcsToBytes());
    // u8 5
    expected.serializeFixedBytes(new U8(5).bcsToBytes());
    // vector<u8> from string "AB"
    const bytesSer = new Serializer();
    bytesSer.serializeBytes(new TextEncoder().encode("AB"));
    expected.serializeFixedBytes(bytesSer.toUint8Array());

    expect(result.bcsToBytes()).toEqual(expected.toUint8Array());
  });

  it("rejects non-object struct values", async () => {
    const parser = makeParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::Point`), 5 as any)).rejects.toThrow(
      "Expected object for struct argument, got number",
    );
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::Point`), [1, 2] as any)).rejects.toThrow(
      "Expected object for struct argument, got object",
    );
  });

  it("throws on a missing field", async () => {
    const parser = makeParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::Point`), { x: "1" })).rejects.toThrow(
      "Missing field 'y' for struct Point",
    );
  });

  it("throws when the struct is actually an enum, is native, or is not found", async () => {
    const parser = makeParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::Color`), { Red: {} })).rejects.toThrow(
      "is an enum. Use enum variant syntax",
    );
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::NativeThing`), {})).rejects.toThrow(
      "is a native struct and cannot be used as an argument",
    );
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::Ghost`), { x: 1 })).rejects.toThrow(
      "Struct Ghost not found in module",
    );
  });

  it("throws on out-of-bounds generic type parameter substitution", async () => {
    const parser = makeParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::OutOfBounds<u64>`), { value: "1" })).rejects.toThrow(
      "Generic type parameter T5 out of bounds",
    );
  });

  it("enforces the maximum nesting depth", async () => {
    const parser = makeParser();
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::Point`), { x: "1", y: "2" }, 8)).rejects.toThrow(
      "Struct nesting depth 8 exceeds maximum allowed depth of 7",
    );
  });
});

describe("StructEnumArgumentParser - enums", () => {
  it("encodes a fieldless enum variant as just its index", async () => {
    const parser = makeParser();
    const red = await parser.encodeEnumArgument(tag(`${MODULE_ID}::Color`), { Red: {} });
    const blue = await parser.encodeEnumArgument(tag(`${MODULE_ID}::Color`), { Blue: {} });
    expect(red).toBeInstanceOf(MoveEnumArgument);

    const expectRed = new Serializer();
    expectRed.serializeU32AsUleb128(0);
    expect(red.bcsToBytes()).toEqual(expectRed.toUint8Array());

    const expectBlue = new Serializer();
    expectBlue.serializeU32AsUleb128(2);
    expect(blue.bcsToBytes()).toEqual(expectBlue.toUint8Array());
  });

  it("encodes a single-object-field variant", async () => {
    const parser = makeParser();
    const result = await parser.encodeEnumArgument(tag(`${MODULE_ID}::MaybeNum`), { Just: { "0": "100" } });
    const expected = new Serializer();
    expected.serializeU32AsUleb128(0);
    expected.serializeFixedBytes(new U64(100n).bcsToBytes());
    expect(result.bcsToBytes()).toEqual(expected.toUint8Array());
  });

  it("encodes a single non-object value variant", async () => {
    const parser = makeParser();
    const result = await parser.encodeEnumArgument(tag(`${MODULE_ID}::MaybeNum`), { Just: "55" });
    const expected = new Serializer();
    expected.serializeU32AsUleb128(0);
    expected.serializeFixedBytes(new U64(55n).bcsToBytes());
    expect(result.bcsToBytes()).toEqual(expected.toUint8Array());
  });

  it("encodes a multi-field variant with sequential numeric keys", async () => {
    const parser = makeParser();
    const result = await parser.encodeEnumArgument(tag(`${MODULE_ID}::PairHolder`), { Pair: { "0": "1", "1": "2" } });
    const expected = new Serializer();
    expected.serializeU32AsUleb128(0);
    expected.serializeFixedBytes(new U64(1n).bcsToBytes());
    expected.serializeFixedBytes(new U64(2n).bcsToBytes());
    expect(result.bcsToBytes()).toEqual(expected.toUint8Array());
  });

  it("rejects multi-field variants with non-sequential keys", async () => {
    const parser = makeParser();
    await expect(
      parser.encodeEnumArgument(tag(`${MODULE_ID}::PairHolder`), { Pair: { "0": "1", "2": "2" } }),
    ).rejects.toThrow('Expected key "1" at position 1, got "2"');
  });

  it("rejects non-object enum values and multi-variant objects", async () => {
    const parser = makeParser();
    await expect(parser.encodeEnumArgument(tag(`${MODULE_ID}::Color`), 5 as any)).rejects.toThrow(
      "Expected object for enum argument, got number",
    );
    await expect(parser.encodeEnumArgument(tag(`${MODULE_ID}::Color`), { Red: {}, Blue: {} })).rejects.toThrow(
      "Enum value must have exactly one variant, got 2",
    );
  });

  it("throws on missing/unknown enum variants and non-enum types", async () => {
    const parser = makeParser();
    await expect(parser.encodeEnumArgument(tag(`${MODULE_ID}::Color`), { Purple: {} })).rejects.toThrow(
      "Variant 'Purple' not found in enum Color. Available variants: Red, Green, Blue",
    );
    await expect(parser.encodeEnumArgument(tag(`${MODULE_ID}::Point`), { x: {} })).rejects.toThrow(
      "is a struct, not an enum",
    );
    await expect(parser.encodeEnumArgument(tag(`${MODULE_ID}::Ghost`), { A: {} })).rejects.toThrow(
      "Enum Ghost not found in module",
    );
  });

  it("enforces the maximum nesting depth for enums", async () => {
    const parser = makeParser();
    await expect(parser.encodeEnumArgument(tag(`${MODULE_ID}::Color`), { Red: {} }, 8)).rejects.toThrow(
      "Enum nesting depth 8 exceeds maximum allowed depth of 7",
    );
  });
});

describe("StructEnumArgumentParser - Option special-casing", () => {
  it("encodes Option None and Some via the enum format", async () => {
    const parser = makeParser();
    const none = await parser.encodeEnumArgument(tag("0x1::option::Option<u64>"), { None: {} });
    expect(none.bcsToBytes()).toEqual(new MoveOption<U64>(null).bcsToBytes());

    const some = await parser.encodeEnumArgument(tag("0x1::option::Option<u64>"), { Some: { "0": "9" } });
    expect(some.bcsToBytes()).toEqual(new MoveOption(new U64(9n)).bcsToBytes());

    // Some with a direct (non-{0:...}) value
    const someDirect = await parser.encodeEnumArgument(tag("0x1::option::Option<u64>"), { Some: "9" });
    expect(someDirect.bcsToBytes()).toEqual(new MoveOption(new U64(9n)).bcsToBytes());
  });

  it("throws on an unknown Option variant and on a missing type parameter", async () => {
    const parser = makeParser();
    await expect(parser.encodeEnumArgument(tag("0x1::option::Option<u64>"), { Maybe: {} })).rejects.toThrow(
      "Unknown Option variant 'Maybe'. Expected 'None' or 'Some'",
    );
    await expect(parser.encodeEnumArgument(tag("0x1::option::Option"), { None: {} })).rejects.toThrow(
      "Option must have a type parameter",
    );
  });

  it("encodes Option through encodeStruct in both vector and enum formats", async () => {
    const parser = makeParser();
    // Mixed.o uses vector format above; here drive the enum format by nesting an
    // Option-typed field that receives an enum-format value.
    const result = await parser.encodeStructArgument(tag(`${MODULE_ID}::Mixed`), {
      s: "x",
      v: [],
      o: { Some: { "0": "3" } },
      obj: "0x1",
      a: "0x1",
      b: false,
      n: 0,
      bytes: [],
    });
    expect(result).toBeInstanceOf(MoveStructArgument);
    expect(result.bcsToBytes().length).toBeGreaterThan(0);
  });
});

describe("StructEnumArgumentParser - helpers", () => {
  it("isStructOrEnum distinguishes custom structs from primitives and builtins", () => {
    const parser = makeParser();
    expect(parser.isStructOrEnum(parseTypeTag("u64"))).toBe(false);
    expect(parser.isStructOrEnum(parseTypeTag("0x1::string::String"))).toBe(false);
    expect(parser.isStructOrEnum(parseTypeTag("0x1::option::Option<u64>"))).toBe(false);
    expect(parser.isStructOrEnum(parseTypeTag("0x1::object::Object<0x1::string::String>"))).toBe(false);
    expect(parser.isStructOrEnum(parseTypeTag(`${MODULE_ID}::Point`))).toBe(true);
  });

  it("parseTypeString parses with generics enabled", () => {
    const parser = makeParser();
    expect(parser.parseTypeString("u64")).toEqual(new TypeTagU64());
    expect(parser.parseTypeString(`${MODULE_ID}::Box<u64>`)).toBeInstanceOf(TypeTagStruct);
  });

  it("wraps fetch errors from the network when a module is not preloaded", async () => {
    const mock = createMockClient();
    mock.enqueueError(new Error("boom"));
    const parser = new StructEnumArgumentParser(mock.config);
    await expect(parser.encodeStructArgument(tag(`${MODULE_ID}::Point`), { x: "1", y: "2" })).rejects.toThrow(
      /Failed to fetch module 0x5::shapes/,
    );
  });
});

describe("MoveStructArgument / MoveEnumArgument serialization", () => {
  it("serializeForEntryFunction length-prefixes while bcsToBytes/serialize do not", () => {
    const raw = new Uint8Array([1, 2, 3, 4]);
    for (const Arg of [MoveStructArgument, MoveEnumArgument]) {
      const arg = new Arg(raw);
      expect(arg.bcsToBytes()).toEqual(raw);

      const plain = new Serializer();
      arg.serialize(plain);
      expect(plain.toUint8Array()).toEqual(raw);

      const entry = new Serializer();
      arg.serializeForEntryFunction(entry);
      const expected = new Serializer();
      expected.serializeU32AsUleb128(raw.length);
      expected.serializeFixedBytes(raw);
      expect(entry.toUint8Array()).toEqual(expected.toUint8Array());
    }
  });
});
