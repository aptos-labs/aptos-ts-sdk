// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Fills the remaining branches in `remoteAbi.ts`:
//   - the synchronous struct branches (DelegationKey/RateLimiter, empty Option
//     reconstruction for every inner primitive type, fieldless-struct
//     FixedBytes, allowUnknownStructs) via `checkOrConvertArgument`,
//   - the async numeric type-mismatch rejections for every width, and
//   - the struct/enum async encoding path that fetches a module ABI and
//     delegates to StructEnumArgumentParser (success for struct + enum, and the
//     "Failed to encode" error wrapper).

import { beforeEach, describe, expect, it } from "vitest";
import {
  AccountAddress,
  Bool,
  FixedBytes,
  MoveOption,
  MoveStructArgument,
  MoveEnumArgument,
  U8,
  checkOrConvertArgument,
  checkOrConvertArgumentWithABI,
  parseTypeTag,
} from "../../../src/index.js";
import type { MoveModule, MoveStruct } from "../../../src/types/index.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { createMockClient } from "../../helpers/mockClient.js";

function syncConvert(arg: any, type: string, moduleAbi?: MoveModule, options?: { allowUnknownStructs?: boolean }) {
  return checkOrConvertArgument(arg, parseTypeTag(type, { allowGenerics: true }), 0, [], moduleAbi, options);
}

describe("remoteAbi parseArgSync struct branches", () => {
  it("encodes DelegationKey / RateLimiter Uint8Array as FixedBytes and rejects non-bytes", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(syncConvert(bytes, "0x1::permissioned_delegation::DelegationKey")).toEqual(new FixedBytes(bytes));
    expect(syncConvert(bytes, "0x1::rate_limiter::RateLimiter")).toEqual(new FixedBytes(bytes));
    expect(() => syncConvert("nope", "0x1::permissioned_delegation::DelegationKey")).toThrow("Type mismatch");
  });

  it("reconstructs an empty Option for every inner primitive type", () => {
    const innerTypes = [
      "bool",
      "address",
      "u8",
      "u16",
      "u32",
      "u64",
      "u128",
      "u256",
      "i8",
      "i16",
      "i32",
      "i64",
      "i128",
      "i256",
    ];
    for (const t of innerTypes) {
      const result = syncConvert(null, `0x1::option::Option<${t}>`);
      expect(result).toBeInstanceOf(MoveOption);
      expect((result as MoveOption<any>).value).toBeUndefined();
    }
    // Unknown inner type falls back to the MoveString placeholder
    expect(syncConvert(undefined, "0x1::option::Option<0x1::string::String>")).toEqual(new MoveOption(null));
  });

  it("treats a fieldless struct from the ABI as an enum (FixedBytes)", () => {
    const moduleAbi: MoveModule = {
      address: "0x4",
      name: "m",
      friends: [],
      exposed_functions: [],
      structs: [
        {
          name: "Empty",
          is_native: false,
          is_event: false,
          is_enum: false,
          abilities: [],
          generic_type_params: [],
          fields: [],
        } as MoveStruct,
      ],
    };
    const raw = new Uint8Array([8, 8]);
    expect(syncConvert(raw, "0x4::m::Empty", moduleAbi)).toEqual(new FixedBytes(raw));
  });

  it("allows unknown structs as FixedBytes only when the option is set", () => {
    const raw = new Uint8Array([5, 6, 7]);
    expect(syncConvert(raw, "0x4::custom::Thing", undefined, { allowUnknownStructs: true })).toEqual(
      new FixedBytes(raw),
    );
    expect(() => syncConvert(raw, "0x4::custom::Thing")).toThrow("Unsupported struct input type");
  });

  it("rejects struct/enum object args on the sync path (must use the async path)", () => {
    expect(() => syncConvert({ x: 1 }, "0x4::custom::Thing")).toThrow("Struct/enum arguments require async conversion");
  });
});

describe("remoteAbi parseArgAsync numeric rejections", () => {
  const config = createMockClient().config;
  const reject = (type: string) => checkOrConvertArgumentWithABI(false as any, parseTypeTag(type), 0, [], config);

  it.each([
    "u8",
    "u16",
    "u32",
    "u64",
    "u128",
    "u256",
    "i8",
    "i16",
    "i32",
    "i64",
    "i128",
    "i256",
  ])("rejects a boolean for %s", async (type) => {
    await expect(reject(type)).rejects.toThrow("Type mismatch for argument 0");
  });

  it("rejects a non-string/non-wrapper for an object param", async () => {
    await expect(reject("0x1::object::Object<u8>")).rejects.toThrow("string | AccountAddress");
  });
});

describe("remoteAbi parseArgAsync struct/enum network encoding", () => {
  const STRUCT_MODULE: MoveModule = {
    address: "0x5",
    name: "shapes",
    friends: [],
    exposed_functions: [],
    structs: [
      {
        name: "Point",
        is_native: false,
        is_event: false,
        is_enum: false,
        abilities: [],
        generic_type_params: [],
        fields: [
          { name: "x", type: "u64" },
          { name: "y", type: "u64" },
        ],
      },
      {
        name: "Color",
        is_native: false,
        is_event: false,
        is_enum: true,
        abilities: [],
        generic_type_params: [],
        fields: [
          { name: "Red", type: "u8" },
          { name: "Green", type: "u8" },
        ],
      },
    ] as MoveStruct[],
  };

  beforeEach(() => {
    clearMemoizeCache();
  });

  function mockWithModule() {
    const mock = createMockClient();
    mock.setDefault({ status: 200, statusText: "OK", data: { bytecode: "0x00", abi: STRUCT_MODULE } });
    return mock;
  }

  it("encodes a custom struct object by fetching its ABI", async () => {
    const mock = mockWithModule();
    const result = await checkOrConvertArgumentWithABI(
      { x: "1", y: "2" },
      parseTypeTag("0x5::shapes::Point"),
      0,
      [],
      mock.config,
    );
    expect(result).toBeInstanceOf(MoveStructArgument);
    expect(result.bcsToBytes().length).toBeGreaterThan(0);
  });

  it("encodes a custom enum variant by fetching its ABI", async () => {
    const mock = mockWithModule();
    const result = await checkOrConvertArgumentWithABI(
      { Red: {} },
      parseTypeTag("0x5::shapes::Color"),
      0,
      [],
      mock.config,
    );
    expect(result).toBeInstanceOf(MoveEnumArgument);
  });

  it("wraps parser failures with the position + type in the message", async () => {
    const mock = mockWithModule();
    await expect(
      checkOrConvertArgumentWithABI({ x: "1" }, parseTypeTag("0x5::shapes::Point"), 3, [], mock.config),
    ).rejects.toThrow(/Failed to encode struct\/enum argument at position 3/);
  });

  it("smoke: a Bool BCS arg passes checkType when the struct param is Option-wrapped", async () => {
    const result = await checkOrConvertArgumentWithABI(
      new Bool(true),
      parseTypeTag("0x1::option::Option<bool>"),
      0,
      [],
      createMockClient().config,
    );
    expect(result).toEqual(new MoveOption(new Bool(true)));
  });

  it("smoke: an empty Option<u8> through the async path stays empty", async () => {
    const result = await checkOrConvertArgumentWithABI(
      null,
      parseTypeTag("0x1::option::Option<u8>"),
      0,
      [],
      createMockClient().config,
    );
    expect(result).toEqual(new MoveOption<U8>(null));
    expect(AccountAddress.ONE).toBeDefined();
  });
});
