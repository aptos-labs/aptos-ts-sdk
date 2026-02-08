// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig, Network } from "../../src";
import {
  StructEnumArgumentParser,
  MoveStructArgument,
  MoveEnumArgument,
} from "../../src/transactions/transactionBuilder/structEnumParser";
import { TypeTagStruct } from "../../src/transactions/typeTag";
import { parseTypeTag } from "../../src/transactions/typeTag/parser";
import * as accountModule from "../../src/internal/account";
import { Serializer } from "../../src/bcs/serializer";

// Mock the getModule function
jest.mock("../../src/internal/account");

const getModule = accountModule.getModule as jest.MockedFunction<typeof accountModule.getModule>;

describe("StructEnumArgumentParser", () => {
  let config: AptosConfig;
  let parser: StructEnumArgumentParser;

  beforeEach(() => {
    config = new AptosConfig({ network: Network.DEVNET });
    parser = new StructEnumArgumentParser(config);
    jest.clearAllMocks();
  });

  describe("Struct Encoding", () => {
    it("encodes a simple struct with primitive fields", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Point",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [
                { name: "x", type: "u64" },
                { name: "y", type: "u64" },
              ],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Point") as TypeTagStruct;
      const value = { x: "10", y: "20" };

      const result = await parser.encodeStructArgument(structTag, value);

      expect(result).toBeInstanceOf(MoveStructArgument);
      const bytes = result.bcsToBytes();
      // u64 little-endian: 10 = [10,0,0,0,0,0,0,0], 20 = [20,0,0,0,0,0,0,0]
      expect(bytes).toEqual(new Uint8Array([10, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0]));
    });

    it("encodes nested structs", async () => {
      const mockModules = {
        "0x1::test": {
          abi: {
            structs: [
              {
                name: "Point",
                is_native: false,
                is_enum: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [
                  { name: "x", type: "u64" },
                  { name: "y", type: "u64" },
                ],
              },
              {
                name: "Line",
                is_native: false,
                is_enum: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [
                  { name: "start", type: "0x1::test::Point" },
                  { name: "end", type: "0x1::test::Point" },
                ],
              },
            ],
          },
        },
      };

      getModule.mockImplementation((args: any) => {
        const key = `${args.accountAddress}::${args.moduleName}`;
        return Promise.resolve(mockModules[key as keyof typeof mockModules] as any);
      });

      const structTag = parseTypeTag("0x1::test::Line") as TypeTagStruct;
      const value = {
        start: { x: "1", y: "2" },
        end: { x: "3", y: "4" },
      };

      const result = await parser.encodeStructArgument(structTag, value);

      expect(result).toBeInstanceOf(MoveStructArgument);
      const bytes = result.bcsToBytes();
      // Point{x:1, y:2} + Point{x:3, y:4}
      expect(bytes.length).toBe(32); // 4 u64s = 32 bytes
    });

    it("throws error for missing fields", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Point",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [
                { name: "x", type: "u64" },
                { name: "y", type: "u64" },
              ],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Point") as TypeTagStruct;
      const value = { x: "10" }; // Missing 'y' field

      await expect(parser.encodeStructArgument(structTag, value)).rejects.toThrow("Missing field 'y' for struct Point");
    });

    it("throws error for native structs", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "NativeStruct",
              is_native: true,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::NativeStruct") as TypeTagStruct;
      const value = {};

      await expect(parser.encodeStructArgument(structTag, value)).rejects.toThrow(
        "NativeStruct is a native struct and cannot be used as an argument",
      );
    });

    it("throws error when trying to encode enum as struct", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "MyEnum",
              is_native: false,
              is_enum: true,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [
                { name: "VariantA", type: "u64" },
                { name: "VariantB", type: "u64" },
              ],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::MyEnum") as TypeTagStruct;
      const value = { field: "100" };

      await expect(parser.encodeStructArgument(structTag, value)).rejects.toThrow(
        "MyEnum is an enum. Use enum variant syntax instead",
      );
    });
  });

  describe("Enum Encoding", () => {
    it("encodes enum variant with fields", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "MyEnum",
              is_native: false,
              is_enum: true,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [
                { name: "VariantA", type: "u64" },
                { name: "VariantB", type: "u64" },
              ],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::MyEnum") as TypeTagStruct;
      const value = { VariantA: { "0": "100" } };

      const result = await parser.encodeEnumArgument(structTag, value);

      expect(result).toBeInstanceOf(MoveEnumArgument);
      const bytes = result.bcsToBytes();
      // First byte is variant index (0 for VariantA), then u64 value
      expect(bytes[0]).toBe(0); // Variant index
      expect(bytes.length).toBeGreaterThan(1);
    });

    it("encodes Option::None", async () => {
      const structTag = parseTypeTag("0x1::option::Option<u64>") as TypeTagStruct;
      const value = { None: {} };

      const result = await parser.encodeEnumArgument(structTag, value);

      expect(result).toBeInstanceOf(MoveEnumArgument);
      const bytes = result.bcsToBytes();
      // Option::None is encoded as empty vector (length 0)
      expect(bytes).toEqual(new Uint8Array([0]));
    });

    it("encodes Option::Some", async () => {
      const structTag = parseTypeTag("0x1::option::Option<u64>") as TypeTagStruct;
      const value = { Some: { "0": "42" } };

      const result = await parser.encodeEnumArgument(structTag, value);

      expect(result).toBeInstanceOf(MoveEnumArgument);
      const bytes = result.bcsToBytes();
      // Option::Some is encoded as vector with 1 element
      expect(bytes[0]).toBe(1); // Vector length = 1
      expect(bytes.length).toBe(9); // 1 (length) + 8 (u64)
    });

    it("throws error for unknown variant", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "MyEnum",
              is_native: false,
              is_enum: true,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [
                { name: "VariantA", type: "u64" },
                { name: "VariantB", type: "u64" },
              ],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::MyEnum") as TypeTagStruct;
      const value = { VariantC: { "0": "100" } }; // Unknown variant

      await expect(parser.encodeEnumArgument(structTag, value)).rejects.toThrow(
        "Variant 'VariantC' not found in enum MyEnum",
      );
    });

    it("throws error when multiple variants provided", async () => {
      const structTag = parseTypeTag("0x1::test::MyEnum") as TypeTagStruct;
      const value = { VariantA: {}, VariantB: {} };

      await expect(parser.encodeEnumArgument(structTag, value)).rejects.toThrow(
        "Enum value must have exactly one variant",
      );
    });
  });

  describe("Generic Type Parameter Substitution", () => {
    it("substitutes T0 with concrete type", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Box",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [{ constraints: [] }],
              fields: [{ name: "value", type: "T0" }],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Box<u64>") as TypeTagStruct;
      const value = { value: "42" };

      const result = await parser.encodeStructArgument(structTag, value);

      expect(result).toBeInstanceOf(MoveStructArgument);
      const bytes = result.bcsToBytes();
      // Should encode as u64
      expect(bytes).toEqual(new Uint8Array([42, 0, 0, 0, 0, 0, 0, 0]));
    });

    it("substitutes generic in vector type", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Container",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [{ constraints: [] }],
              fields: [{ name: "items", type: "vector<T0>" }],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Container<u8>") as TypeTagStruct;
      const value = { items: [1, 2, 3] };

      const result = await parser.encodeStructArgument(structTag, value);

      expect(result).toBeInstanceOf(MoveStructArgument);
      const bytes = result.bcsToBytes();
      // Vector of 3 u8s: length(3) + values
      expect(bytes[0]).toBe(3); // Vector length
      expect(bytes.slice(1, 4)).toEqual(new Uint8Array([1, 2, 3]));
    });

    it("throws error for out of bounds generic parameter", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Box",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [{ constraints: [] }],
              fields: [{ name: "value", type: "T1" }], // T1 but only T0 available
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Box<u64>") as TypeTagStruct;
      const value = { value: "42" };

      await expect(parser.encodeStructArgument(structTag, value)).rejects.toThrow(
        "Generic type parameter T1 out of bounds",
      );
    });
  });

  describe("Depth Limit Enforcement", () => {
    it("throws error when nesting depth exceeds limit", async () => {
      // Create deeply nested struct definitions
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Level0",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "inner", type: "0x1::test::Level1" }],
            },
            {
              name: "Level1",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "inner", type: "0x1::test::Level2" }],
            },
            {
              name: "Level2",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "inner", type: "0x1::test::Level3" }],
            },
            {
              name: "Level3",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "inner", type: "0x1::test::Level4" }],
            },
            {
              name: "Level4",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "inner", type: "0x1::test::Level5" }],
            },
            {
              name: "Level5",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "inner", type: "0x1::test::Level6" }],
            },
            {
              name: "Level6",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "inner", type: "0x1::test::Level7" }],
            },
            {
              name: "Level7",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "value", type: "u64" }],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Level0") as TypeTagStruct;
      const value = {
        inner: {
          inner: {
            inner: {
              inner: {
                inner: {
                  inner: {
                    inner: {
                      value: "1",
                    },
                  },
                },
              },
            },
          },
        },
      };

      await expect(parser.encodeStructArgument(structTag, value)).rejects.toThrow(
        "nesting depth 8 exceeds maximum allowed depth of 7",
      );
    });
  });

  describe("Special Framework Types", () => {
    it("encodes String type", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Message",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "text", type: "0x1::string::String" }],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Message") as TypeTagStruct;
      const value = { text: "Hello" };

      const result = await parser.encodeStructArgument(structTag, value);

      expect(result).toBeInstanceOf(MoveStructArgument);
      // String is encoded as vector<u8>
      const bytes = result.bcsToBytes();
      expect(bytes.length).toBeGreaterThan(5); // Length prefix + "Hello"
    });

    it("encodes Object<T> type", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Holder",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [{ name: "obj", type: "0x1::object::Object<0x1::test::Resource>" }],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Holder") as TypeTagStruct;
      const value = { obj: "0x1" };

      const result = await parser.encodeStructArgument(structTag, value);

      expect(result).toBeInstanceOf(MoveStructArgument);
      // Object is encoded as address
      const bytes = result.bcsToBytes();
      expect(bytes.length).toBe(32); // Address = 32 bytes
    });
  });

  describe("Error Handling", () => {
    it("throws error for wrong value type", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Point",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [
                { name: "x", type: "u64" },
                { name: "y", type: "u64" },
              ],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Point") as TypeTagStruct;
      const value = "not an object"; // Wrong type

      await expect(parser.encodeStructArgument(structTag, value as any)).rejects.toThrow(
        "Expected object for struct argument",
      );
    });

    it("throws error for unknown struct", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "OtherStruct",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::UnknownStruct") as TypeTagStruct;
      const value = {};

      await expect(parser.encodeStructArgument(structTag, value)).rejects.toThrow(
        "Struct UnknownStruct not found in module",
      );
    });

    it("throws error for module fetch failure", async () => {
      getModule.mockRejectedValue(new Error("Network error"));

      const structTag = parseTypeTag("0x1::test::Point") as TypeTagStruct;
      const value = { x: "10", y: "20" };

      await expect(parser.encodeStructArgument(structTag, value)).rejects.toThrow("Failed to fetch module 0x1::test");
    });
  });

  describe("Module ABI Caching", () => {
    it("caches module ABI to avoid repeated fetches", async () => {
      const mockModule = {
        bytecode: "",
        abi: {
          address: "0x1",
          name: "test",
          friends: [],
          exposed_functions: [],
          structs: [
            {
              name: "Point",
              is_native: false,
              is_enum: false,
              is_event: false,
              abilities: ["copy", "drop"],
              generic_type_params: [],
              fields: [
                { name: "x", type: "u64" },
                { name: "y", type: "u64" },
              ],
            },
          ],
        },
      };
      getModule.mockResolvedValue(mockModule as any);

      const structTag = parseTypeTag("0x1::test::Point") as TypeTagStruct;
      const value1 = { x: "10", y: "20" };
      const value2 = { x: "30", y: "40" };

      // First call
      await parser.encodeStructArgument(structTag, value1);
      expect(getModule).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await parser.encodeStructArgument(structTag, value2);
      expect(getModule).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });

  describe("Serialization Methods", () => {
    describe("MoveStructArgument", () => {
      it("serializes struct with serialize() - no length prefix", async () => {
        const mockModule = {
          bytecode: "",
          abi: {
            address: "0x1",
            name: "test",
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: "Point",
                is_native: false,
                is_enum: false,
                is_event: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [
                  { name: "x", type: "u64" },
                  { name: "y", type: "u64" },
                ],
              },
            ],
          },
        };
        getModule.mockResolvedValue(mockModule as any);

        const structTag = parseTypeTag("0x1::test::Point") as TypeTagStruct;
        const value = { x: "10", y: "20" };

        const structArg = await parser.encodeStructArgument(structTag, value);

        // Test serialize() method
        const serializer = new Serializer();
        structArg.serialize(serializer);
        const bytes = serializer.toUint8Array();

        // Expected: Just raw struct bytes, NO length prefix
        // Two u64s: 10 and 20 in little-endian
        const expected = new Uint8Array([10, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0]);
        expect(bytes).toEqual(expected);
      });

      it("serializes struct with serializeForEntryFunction() - single length prefix", async () => {
        const mockModule = {
          bytecode: "",
          abi: {
            address: "0x1",
            name: "test",
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: "Point",
                is_native: false,
                is_enum: false,
                is_event: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [
                  { name: "x", type: "u64" },
                  { name: "y", type: "u64" },
                ],
              },
            ],
          },
        };
        getModule.mockResolvedValue(mockModule as any);

        const structTag = parseTypeTag("0x1::test::Point") as TypeTagStruct;
        const value = { x: "10", y: "20" };

        const structArg = await parser.encodeStructArgument(structTag, value);

        // Test serializeForEntryFunction() method
        const serializer = new Serializer();
        structArg.serializeForEntryFunction(serializer);
        const bytes = serializer.toUint8Array();

        // Expected: [length_prefix][raw_struct_bytes]
        // length_prefix = 16 (ULEB128 encoding of 16)
        // raw_struct_bytes = two u64s (16 bytes total)
        expect(bytes[0]).toBe(16); // Length prefix
        expect(bytes.length).toBe(17); // 1 byte length + 16 bytes data

        // Verify the struct data after the length prefix
        const structData = bytes.slice(1);
        const expected = new Uint8Array([10, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0]);
        expect(structData).toEqual(expected);
      });

      it("roundtrip: bcsToBytes() matches serialize()", async () => {
        const mockModule = {
          bytecode: "",
          abi: {
            address: "0x1",
            name: "test",
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: "Point",
                is_native: false,
                is_enum: false,
                is_event: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [
                  { name: "x", type: "u64" },
                  { name: "y", type: "u64" },
                ],
              },
            ],
          },
        };
        getModule.mockResolvedValue(mockModule as any);

        const structTag = parseTypeTag("0x1::test::Point") as TypeTagStruct;
        const value = { x: "42", y: "99" };

        const structArg = await parser.encodeStructArgument(structTag, value);

        // bcsToBytes() should return raw bytes
        const rawBytes = structArg.bcsToBytes();

        // serialize() should produce the same bytes
        const serializer = new Serializer();
        structArg.serialize(serializer);
        const serializedBytes = serializer.toUint8Array();

        expect(serializedBytes).toEqual(rawBytes);
      });
    });

    describe("MoveEnumArgument", () => {
      it("serializes enum with serialize() - no length prefix", async () => {
        const mockModule = {
          bytecode: "",
          abi: {
            address: "0x1",
            name: "test",
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: "MyEnum",
                is_native: false,
                is_enum: true,
                is_event: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [
                  { name: "VariantA", type: "u64" },
                  { name: "VariantB", type: "u64" },
                ],
              },
            ],
          },
        };
        getModule.mockResolvedValue(mockModule as any);

        const structTag = parseTypeTag("0x1::test::MyEnum") as TypeTagStruct;
        const value = { VariantA: { "0": "100" } };

        const enumArg = await parser.encodeEnumArgument(structTag, value);

        // Test serialize() method
        const serializer = new Serializer();
        enumArg.serialize(serializer);
        const bytes = serializer.toUint8Array();

        // Expected: [variant_index][field_value]
        // variant_index = 0 (ULEB128)
        // field_value = 100 as u64 little-endian
        expect(bytes[0]).toBe(0); // Variant index
        expect(bytes.length).toBe(9); // 1 byte variant + 8 bytes u64
        const fieldBytes = bytes.slice(1);
        expect(fieldBytes).toEqual(new Uint8Array([100, 0, 0, 0, 0, 0, 0, 0]));
      });

      it("serializes enum with serializeForEntryFunction() - single length prefix", async () => {
        const mockModule = {
          bytecode: "",
          abi: {
            address: "0x1",
            name: "test",
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: "MyEnum",
                is_native: false,
                is_enum: true,
                is_event: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [
                  { name: "VariantA", type: "u64" },
                  { name: "VariantB", type: "u64" },
                ],
              },
            ],
          },
        };
        getModule.mockResolvedValue(mockModule as any);

        const structTag = parseTypeTag("0x1::test::MyEnum") as TypeTagStruct;
        const value = { VariantA: { "0": "100" } };

        const enumArg = await parser.encodeEnumArgument(structTag, value);

        // Test serializeForEntryFunction() method
        const serializer = new Serializer();
        enumArg.serializeForEntryFunction(serializer);
        const bytes = serializer.toUint8Array();

        // Expected: [length_prefix][variant_index][field_value]
        // length_prefix = 9 (1 byte variant + 8 bytes field)
        // variant_index = 0
        // field_value = 100 as u64
        expect(bytes[0]).toBe(9); // Length prefix
        expect(bytes.length).toBe(10); // 1 byte length + 9 bytes data

        // Verify enum data after length prefix
        expect(bytes[1]).toBe(0); // Variant index
        const fieldBytes = bytes.slice(2);
        expect(fieldBytes).toEqual(new Uint8Array([100, 0, 0, 0, 0, 0, 0, 0]));
      });

      it("roundtrip: bcsToBytes() matches serialize()", async () => {
        const mockModule = {
          bytecode: "",
          abi: {
            address: "0x1",
            name: "test",
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: "MyEnum",
                is_native: false,
                is_enum: true,
                is_event: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [{ name: "Variant", type: "u64" }],
              },
            ],
          },
        };
        getModule.mockResolvedValue(mockModule as any);

        const structTag = parseTypeTag("0x1::test::MyEnum") as TypeTagStruct;
        const value = { Variant: { "0": "42" } };

        const enumArg = await parser.encodeEnumArgument(structTag, value);

        // bcsToBytes() should return raw bytes
        const rawBytes = enumArg.bcsToBytes();

        // serialize() should produce the same bytes
        const serializer = new Serializer();
        enumArg.serialize(serializer);
        const serializedBytes = serializer.toUint8Array();

        expect(serializedBytes).toEqual(rawBytes);
      });

      it("validates sequential numeric keys for multi-field variants", async () => {
        const mockModule = {
          bytecode: "",
          abi: {
            address: "0x1",
            name: "test",
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: "MyEnum",
                is_native: false,
                is_enum: true,
                is_event: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [{ name: "MultiField", type: "u64" }],
              },
            ],
          },
        };
        getModule.mockResolvedValue(mockModule as any);

        const structTag = parseTypeTag("0x1::test::MyEnum") as TypeTagStruct;

        // Invalid: non-sequential keys
        const invalidValue = { MultiField: { "0": "1", "2": "3" } }; // Missing "1"

        await expect(parser.encodeEnumArgument(structTag, invalidValue)).rejects.toThrow(
          'Expected key "1" at position 1',
        );
      });

      it("encodes multi-field variant with sequential numeric keys in correct order", async () => {
        const mockModule = {
          bytecode: "",
          abi: {
            address: "0x1",
            name: "test",
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: "MyEnum",
                is_native: false,
                is_enum: true,
                is_event: false,
                abilities: ["copy", "drop"],
                generic_type_params: [],
                fields: [{ name: "MultiField", type: "u64" }],
              },
            ],
          },
        };
        getModule.mockResolvedValue(mockModule as any);

        const structTag = parseTypeTag("0x1::test::MyEnum") as TypeTagStruct;

        // Valid: sequential keys 0, 1, 2
        const value = { MultiField: { "0": "10", "1": "20", "2": "30" } };

        const enumArg = await parser.encodeEnumArgument(structTag, value);
        const bytes = enumArg.bcsToBytes();

        // Should encode: variant_index + field0 + field1 + field2
        expect(bytes[0]).toBe(0); // Variant index
        // Verify fields are in correct order (10, 20, 30)
        const field0 = bytes.slice(1, 9);
        const field1 = bytes.slice(9, 17);
        const field2 = bytes.slice(17, 25);
        expect(field0).toEqual(new Uint8Array([10, 0, 0, 0, 0, 0, 0, 0]));
        expect(field1).toEqual(new Uint8Array([20, 0, 0, 0, 0, 0, 0, 0]));
        expect(field2).toEqual(new Uint8Array([30, 0, 0, 0, 0, 0, 0, 0]));
      });
    });
  });
});
