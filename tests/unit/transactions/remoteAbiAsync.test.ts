// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

// Covers the async branch of `src/transactions/transactionBuilder/remoteAbi.ts`:
// `checkOrConvertArgumentWithABI` / `parseArgAsync` (mirrors the sync path), the
// ABI-fetching helpers (`fetchModuleAbi`, `fetchFunctionAbi`,
// `fetchEntryFunctionAbi`, `fetchViewFunctionAbi`, `fetchMoveFunctionAbi`,
// `fetchModuleAbiWithStructs`), the `convertArgument` / `convertArgumentWithABI`
// wrappers, `standardizeTypeTags`, and the `checkType` branches reached when a
// BCS-encoded argument is passed through.
//
// Every test asserts a concrete value/instance/error message; HTTP-touching
// tests assert the outgoing request path AND the parsed result (mockClient
// rule). The pure-conversion cases mirror the existing synchronous
// `remoteAbi.test.ts` so the duplicated async code path is exercised with the
// same fixtures.

import { beforeEach, describe, expect, it } from "vitest";
import {
  AccountAddress,
  Bool,
  FixedBytes,
  I128,
  I16,
  I256,
  I32,
  I64,
  I8,
  MoveOption,
  MoveString,
  MoveVector,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  TypeTagU8,
  TypeTagVector,
  TypeTagU256,
  parseTypeTag,
  checkOrConvertArgument,
  checkOrConvertArgumentWithABI,
  convertArgument,
  convertArgumentWithABI,
  fetchModuleAbi,
  fetchFunctionAbi,
  fetchEntryFunctionAbi,
  fetchViewFunctionAbi,
  fetchMoveFunctionAbi,
  fetchModuleAbiWithStructs,
  standardizeTypeTags,
} from "../../../src/index.js";
import type { FunctionABI } from "../../../src/transactions/types.js";
import type { MoveFunction, MoveModule, MoveStruct } from "../../../src/types/index.js";
import { clearMemoizeCache } from "../../../src/utils/memoize.js";
import { createMockClient, expectRequest } from "../../helpers/mockClient.js";

const MAX_U8 = 255;
const MAX_U64 = 18_446_744_073_709_551_615n;

function makeFunction(overrides: Partial<MoveFunction> = {}): MoveFunction {
  return {
    name: "do_thing",
    visibility: "public" as MoveFunction["visibility"],
    is_entry: true,
    is_view: false,
    generic_type_params: [],
    params: [],
    return: [],
    ...overrides,
  };
}

function makeStruct(overrides: Partial<MoveStruct> = {}): MoveStruct {
  return {
    name: "MyStruct",
    is_native: false,
    is_event: false,
    is_enum: false,
    abilities: [],
    generic_type_params: [],
    fields: [],
    ...overrides,
  };
}

function makeModule(overrides: Partial<MoveModule> = {}): MoveModule {
  return {
    address: "0x4",
    name: "my_module",
    friends: [],
    exposed_functions: [],
    structs: [],
    ...overrides,
  };
}

// A throwaway config — only used as the (unused) `aptosConfig` arg on the
// non-struct async conversion paths, which never reach the network.
const noNetworkConfig = createMockClient().config;

async function convertAsync(arg: any, type: string, generics: any[] = []) {
  return checkOrConvertArgumentWithABI(arg, parseTypeTag(type, { allowGenerics: true }), 0, generics, noNetworkConfig);
}

describe("remoteAbi async conversion (checkOrConvertArgumentWithABI / parseArgAsync)", () => {
  it("converts primitive simple arguments", async () => {
    expect(await convertAsync("0x1", "address")).toEqual(AccountAddress.ONE);
    expect(await convertAsync(true, "bool")).toEqual(new Bool(true));
    expect(await convertAsync("true", "bool")).toEqual(new Bool(true));
    expect(await convertAsync("false", "bool")).toEqual(new Bool(false));
    expect(await convertAsync(MAX_U8, "u8")).toEqual(new U8(MAX_U8));
    expect(await convertAsync(7, "u16")).toEqual(new U16(7));
    expect(await convertAsync(7, "u32")).toEqual(new U32(7));
    expect(await convertAsync(MAX_U64, "u64")).toEqual(new U64(MAX_U64));
    expect(await convertAsync("7", "u128")).toEqual(new U128(7n));
    expect(await convertAsync(7n, "u256")).toEqual(new U256(7n));
  });

  it("converts signed integer simple arguments", async () => {
    expect(await convertAsync(-5, "i8")).toEqual(new I8(-5));
    expect(await convertAsync(-5, "i16")).toEqual(new I16(-5));
    expect(await convertAsync(-5, "i32")).toEqual(new I32(-5));
    expect(await convertAsync(-5, "i64")).toEqual(new I64(-5n));
    expect(await convertAsync(-5, "i128")).toEqual(new I128(-5n));
    expect(await convertAsync(-5, "i256")).toEqual(new I256(-5n));
    expect(await convertAsync("-5", "i8")).toEqual(new I8(-5));
  });

  it("converts an address passed as a wallet-standard Uint8Array wrapper", async () => {
    const wrapper = { data: AccountAddress.ONE.toUint8Array() };
    expect(await convertAsync(wrapper, "address")).toEqual(AccountAddress.ONE);
    // 0x1::object::Object also accepts the wrapper
    expect(await convertAsync(wrapper, "0x1::object::Object<0x1::string::String>")).toEqual(AccountAddress.ONE);
  });

  it("converts vectors, including the vector<u8> string/Uint8Array/ArrayBuffer special cases", async () => {
    expect(await convertAsync(["0x1", "0x2"], "vector<address>")).toEqual(
      new MoveVector([AccountAddress.ONE, AccountAddress.TWO]),
    );
    expect(await convertAsync([0, 255], "vector<u8>")).toEqual(MoveVector.U8([0, 255]));
    expect(await convertAsync(new Uint8Array([1, 2]), "vector<u8>")).toEqual(MoveVector.U8([1, 2]));
    expect(await convertAsync(new Uint8Array([1, 2]).buffer, "vector<u8>")).toEqual(MoveVector.U8([1, 2]));
    expect((await convertAsync("Hello", "vector<u8>")).bcsToBytes()).toEqual(new MoveString("Hello").bcsToBytes());
    // JSON-string vector for non-u8 inner types
    expect(await convertAsync("[1, 2]", "vector<u128>")).toEqual(new MoveVector([new U128(1n), new U128(2n)]));
  });

  it("converts strings, options (filled + empty for every inner type), and objects", async () => {
    expect(await convertAsync("Hello", "0x1::string::String")).toEqual(new MoveString("Hello"));
    expect(await convertAsync(255, "0x1::option::Option<u8>")).toEqual(new MoveOption(new U8(255)));
    expect(await convertAsync(null, "0x1::option::Option<bool>")).toEqual(new MoveOption<Bool>(null));
    expect(await convertAsync(undefined, "0x1::option::Option<address>")).toEqual(new MoveOption<AccountAddress>(null));
    for (const t of ["u8", "u16", "u32", "u64", "u128", "u256", "i8", "i16", "i32", "i64", "i128", "i256"]) {
      const result = await convertAsync(null, `0x1::option::Option<${t}>`);
      expect(result).toBeInstanceOf(MoveOption);
      expect(result.value).toBeUndefined();
    }
    // Unknown inner type falls through to the MoveString placeholder
    expect(await convertAsync(null, "0x1::option::Option<0x1::string::String>")).toEqual(new MoveOption(null));
    expect(await convertAsync("0x1", "0x1::object::Object<0x1::string::String>")).toEqual(AccountAddress.ONE);
  });

  it("resolves generics by substituting the concrete type", async () => {
    expect(
      await checkOrConvertArgumentWithABI(
        255,
        parseTypeTag("T0", { allowGenerics: true }),
        0,
        [new TypeTagU8()],
        noNetworkConfig,
      ),
    ).toEqual(new U8(255));
    expect(
      await checkOrConvertArgumentWithABI(
        AccountAddress.ONE,
        parseTypeTag("0x1::object::Object<T0>", { allowGenerics: true }),
        0,
        [new TypeTagVector(new TypeTagU256())],
        noNetworkConfig,
      ),
    ).toEqual(AccountAddress.ONE);
  });

  it("throws on an out-of-range generic index", async () => {
    await expect(
      checkOrConvertArgumentWithABI(
        1,
        parseTypeTag("T5", { allowGenerics: true }),
        3,
        [new TypeTagU8()],
        noNetworkConfig,
      ),
    ).rejects.toThrow("Generic argument T5 is invalid for argument 3");
  });

  it("auto-wraps a pre-encoded inner value when the param is Option", async () => {
    expect(await convertAsync(new U8(255), "0x1::option::Option<u8>")).toEqual(new MoveOption(new U8(255)));
    expect(await convertAsync([AccountAddress.ONE], "vector<0x1::option::Option<address>>")).toEqual(
      new MoveVector([new MoveOption(AccountAddress.ONE)]),
    );
  });

  it("handles DelegationKey / RateLimiter framework enums (Uint8Array => FixedBytes)", async () => {
    const bytes = new Uint8Array([9, 9, 9]);
    const delegationKey = "0x1::permissioned_delegation::DelegationKey";
    const rateLimiter = "0x1::rate_limiter::RateLimiter";
    expect(await convertAsync(bytes, delegationKey)).toEqual(new FixedBytes(bytes));
    expect(await convertAsync(bytes, rateLimiter)).toEqual(new FixedBytes(bytes));
    await expect(convertAsync("not-bytes", delegationKey)).rejects.toThrow("Type mismatch for argument 0");
  });

  it("rejects invalid simple inputs with type-mismatch errors", async () => {
    await expect(convertAsync(false, "address")).rejects.toThrow("Type mismatch for argument 0");
    await expect(convertAsync(0, "bool")).rejects.toThrow("Type mismatch for argument 0");
    await expect(convertAsync(false, "u8")).rejects.toThrow("number | string");
    await expect(convertAsync(false, "u64")).rejects.toThrow("bigint | number | string");
    await expect(convertAsync(false, "i8")).rejects.toThrow("number | string");
    await expect(convertAsync(false, "i64")).rejects.toThrow("bigint | number | string");
    await expect(convertAsync(false, "0x1::string::String")).rejects.toThrow("Type mismatch for argument 0");
    await expect(convertAsync(false, "vector<u8>")).rejects.toThrow("Type mismatch for argument 0");
    await expect(convertAsync(false, "0x4::account::Account")).rejects.toThrow("Unsupported struct input type");
    await expect(convertAsync(false, "signer")).rejects.toThrow("Type mismatch for argument 0");
  });

  it("allows unknown structs as FixedBytes when allowUnknownStructs is set", async () => {
    const raw = new Uint8Array([1, 2, 3]);
    const result = await checkOrConvertArgumentWithABI(
      raw,
      parseTypeTag("0x4::custom::Thing"),
      0,
      [],
      noNetworkConfig,
      undefined,
      { allowUnknownStructs: true },
    );
    expect(result).toEqual(new FixedBytes(raw));
  });

  it("treats fieldless structs in the moduleAbi as enums (FixedBytes)", async () => {
    const moduleAbi = makeModule({ structs: [makeStruct({ name: "Empty", fields: [] })] });
    const raw = new Uint8Array([7, 7]);
    const result = await checkOrConvertArgumentWithABI(
      raw,
      parseTypeTag("0x4::my_module::Empty"),
      0,
      [],
      noNetworkConfig,
      moduleAbi,
    );
    expect(result).toEqual(new FixedBytes(raw));
  });
});

describe("remoteAbi checkType (BCS-encoded args routed through the async path)", () => {
  const cases: Array<[string, any]> = [
    ["bool", new Bool(true)],
    ["address", AccountAddress.ONE],
    ["u8", new U8(1)],
    ["u16", new U16(1)],
    ["u32", new U32(1)],
    ["u64", new U64(1n)],
    ["u128", new U128(1n)],
    ["u256", new U256(1n)],
    ["i8", new I8(1)],
    ["i16", new I16(1)],
    ["i32", new I32(1)],
    ["i64", new I64(1n)],
    ["i128", new I128(1n)],
    ["i256", new I256(1n)],
  ];

  it.each(cases)("accepts a matching BCS arg for %s", async (type, arg) => {
    expect(await convertAsync(arg, type)).toBe(arg);
  });

  it.each(cases)("rejects a Bool BCS arg for non-bool %s", async (type, arg) => {
    if (type === "bool") return;
    await expect(convertAsync(new Bool(true), type)).rejects.toThrow("Type mismatch for argument 0");
  });

  it("checks vector inner element types and rejects non-vectors", async () => {
    expect(await convertAsync(MoveVector.U8([1, 2]), "vector<u8>")).toEqual(MoveVector.U8([1, 2]));
    // empty vector short-circuits the inner check
    expect(await convertAsync(new MoveVector<U8>([]), "vector<u8>")).toEqual(new MoveVector<U8>([]));
    await expect(convertAsync(new U8(1), "vector<u8>")).rejects.toThrow("MoveVector");
    await expect(convertAsync(MoveVector.U8([1]), "vector<bool>")).rejects.toThrow("Type mismatch for argument 0");
  });

  it("checks struct args (String/Object/Option) and rejects mismatches", async () => {
    expect(await convertAsync(new MoveString("hi"), "0x1::string::String")).toEqual(new MoveString("hi"));
    await expect(convertAsync(new U8(1), "0x1::string::String")).rejects.toThrow("MoveString");
    expect(await convertAsync(AccountAddress.ONE, "0x1::object::Object<u8>")).toEqual(AccountAddress.ONE);
    await expect(convertAsync(new U8(1), "0x1::object::Object<u8>")).rejects.toThrow("AccountAddress");
    expect(await convertAsync(new MoveOption(new U8(1)), "0x1::option::Option<u8>")).toEqual(new MoveOption(new U8(1)));
    expect(await convertAsync(new MoveOption<U8>(), "0x1::option::Option<u8>")).toEqual(new MoveOption<U8>());
    await expect(convertAsync(new U8(1), "0x1::option::Option<u8>")).resolves.toEqual(new MoveOption(new U8(1)));
  });

  it("accepts pre-encoded FixedBytes for a custom struct param", async () => {
    const fixed = new FixedBytes(new Uint8Array([1, 2, 3]));
    expect(await convertAsync(fixed, "0x4::thing::Custom")).toBe(fixed);
  });
});

describe("remoteAbi convertArgument / convertArgumentWithABI wrappers", () => {
  it("convertArgument resolves a param from a FunctionABI", () => {
    const abi: FunctionABI = { typeParameters: [], parameters: [parseTypeTag("u64")] };
    expect(convertArgument("f", abi, 5, 0, [])).toEqual(new U64(5n));
  });

  it("convertArgument throws when the position exceeds the FunctionABI parameters", () => {
    const abi: FunctionABI = { typeParameters: [], parameters: [parseTypeTag("u64")] };
    expect(() => convertArgument("f", abi, 5, 1, [])).toThrow("Too many arguments for 'f', expected 1");
  });

  it("convertArgument resolves a param from a MoveModule by function name", () => {
    const module = makeModule({ exposed_functions: [makeFunction({ name: "f", params: ["u8"] })] });
    expect(convertArgument("f", module, 200, 0, [])).toEqual(new U8(200));
  });

  it("convertArgument throws when the function is missing from the MoveModule", () => {
    const module = makeModule({ exposed_functions: [makeFunction({ name: "other", params: ["u8"] })] });
    expect(() => convertArgument("missing", module, 1, 0, [])).toThrow(
      "Could not find function ABI for '0x4::my_module::missing'",
    );
  });

  it("convertArgument throws when the position exceeds the MoveModule function params", () => {
    const module = makeModule({ exposed_functions: [makeFunction({ name: "f", params: ["u8"] })] });
    expect(() => convertArgument("f", module, 1, 3, [])).toThrow("Too many arguments for 'f', expected 1");
  });

  it("convertArgumentWithABI resolves from a FunctionABI and a MoveModule", async () => {
    const abi: FunctionABI = { typeParameters: [], parameters: [parseTypeTag("u64")] };
    expect(await convertArgumentWithABI("f", abi, 9, 0, [], noNetworkConfig)).toEqual(new U64(9n));

    const module = makeModule({ exposed_functions: [makeFunction({ name: "f", params: ["bool"] })] });
    expect(await convertArgumentWithABI("f", module, true, 0, [], noNetworkConfig)).toEqual(new Bool(true));
  });

  it("convertArgumentWithABI propagates the missing-function and too-many-args errors", async () => {
    const abi: FunctionABI = { typeParameters: [], parameters: [parseTypeTag("u64")] };
    await expect(convertArgumentWithABI("f", abi, 9, 2, [], noNetworkConfig)).rejects.toThrow(
      "Too many arguments for 'f', expected 1",
    );
    const module = makeModule({ exposed_functions: [makeFunction({ name: "other" })] });
    await expect(convertArgumentWithABI("missing", module, 1, 0, [], noNetworkConfig)).rejects.toThrow(
      "Could not find function ABI for '0x4::my_module::missing'",
    );
  });
});

describe("standardizeTypeTags", () => {
  it("returns [] for undefined and parses string tags but passes TypeTag objects through", () => {
    expect(standardizeTypeTags(undefined)).toEqual([]);
    const tag = new TypeTagU8();
    const result = standardizeTypeTags(["u64", tag]);
    expect(result[0]).toEqual(parseTypeTag("u64"));
    expect(result[1]).toBe(tag);
  });
});

describe("remoteAbi ABI fetchers (mocked fullnode)", () => {
  beforeEach(() => {
    clearMemoizeCache();
  });

  const ADDR = "0x7";

  function moduleResponseFor(module: MoveModule) {
    return { status: 200, statusText: "OK", data: { bytecode: "0x00", abi: module } };
  }

  it("fetchModuleAbi requests the module endpoint and returns the abi", async () => {
    const mock = createMockClient();
    const module = makeModule({ address: ADDR, name: "mod_a" });
    mock.setDefault(moduleResponseFor(module));

    const abi = await fetchModuleAbi(ADDR, "mod_a", mock.config);
    expect(abi).toEqual(module);
    expectRequest(mock.requests[0], {
      method: "GET",
      urlIncludes: `/accounts/${ADDR}/module/mod_a`,
      originMethod: "getModule",
    });
  });

  it("fetchFunctionAbi finds the requested function or returns undefined", async () => {
    const mock = createMockClient();
    const fn = makeFunction({ name: "target", params: ["u8"] });
    mock.setDefault(moduleResponseFor(makeModule({ address: ADDR, name: "mod_b", exposed_functions: [fn] })));

    expect(await fetchFunctionAbi(ADDR, "mod_b", "target", mock.config)).toEqual(fn);
    expect(await fetchFunctionAbi(ADDR, "mod_b", "nope", mock.config)).toBeUndefined();
  });

  it("fetchEntryFunctionAbi strips signer args and validates is_entry", async () => {
    const mock = createMockClient();
    const fn = makeFunction({
      name: "entry_fn",
      is_entry: true,
      params: ["&signer", "u64", "0x1::string::String"],
      generic_type_params: [{ constraints: [] }],
    });
    mock.setDefault(moduleResponseFor(makeModule({ address: ADDR, name: "mod_c", exposed_functions: [fn] })));

    const abi = await fetchEntryFunctionAbi(ADDR, "mod_c", "entry_fn", mock.config);
    expect(abi.signers).toBe(1);
    expect(abi.typeParameters).toEqual([{ constraints: [] }]);
    expect(abi.parameters).toEqual([parseTypeTag("u64"), parseTypeTag("0x1::string::String")]);
  });

  it("fetchEntryFunctionAbi throws when the function is not found or not an entry function", async () => {
    const mock = createMockClient();
    const notEntry = makeFunction({ name: "viewer", is_entry: false });
    mock.setDefault(moduleResponseFor(makeModule({ address: ADDR, name: "mod_d", exposed_functions: [notEntry] })));

    await expect(fetchEntryFunctionAbi(ADDR, "mod_d", "missing", mock.config)).rejects.toThrow(
      "Could not find entry function ABI",
    );
    await expect(fetchEntryFunctionAbi(ADDR, "mod_d", "viewer", mock.config)).rejects.toThrow(
      "is not an entry function",
    );
  });

  it("fetchViewFunctionAbi returns parameters + return types and validates is_view", async () => {
    const mock = createMockClient();
    const view = makeFunction({
      name: "get_thing",
      is_entry: false,
      is_view: true,
      params: ["address"],
      return: ["u64", "bool"],
    });
    const notView = makeFunction({ name: "do_thing", is_view: false });
    mock.setDefault(
      moduleResponseFor(makeModule({ address: ADDR, name: "mod_e", exposed_functions: [view, notView] })),
    );

    const abi = await fetchViewFunctionAbi(ADDR, "mod_e", "get_thing", mock.config);
    expect(abi.parameters).toEqual([parseTypeTag("address")]);
    expect(abi.returnTypes).toEqual([parseTypeTag("u64"), parseTypeTag("bool")]);

    await expect(fetchViewFunctionAbi(ADDR, "mod_e", "missing", mock.config)).rejects.toThrow(
      "Could not find view function ABI",
    );
    await expect(fetchViewFunctionAbi(ADDR, "mod_e", "do_thing", mock.config)).rejects.toThrow(
      "is not an view function",
    );
  });

  it("fetchMoveFunctionAbi maps every param into a TypeTag", async () => {
    const mock = createMockClient();
    const fn = makeFunction({ name: "legacy", params: ["u8", "vector<address>"] });
    mock.setDefault(moduleResponseFor(makeModule({ address: ADDR, name: "mod_f", exposed_functions: [fn] })));

    const abi = await fetchMoveFunctionAbi(ADDR, "mod_f", "legacy", mock.config);
    expect(abi.parameters).toEqual([parseTypeTag("u8"), parseTypeTag("vector<address>")]);

    await expect(fetchMoveFunctionAbi(ADDR, "mod_f", "missing", mock.config)).rejects.toThrow(
      "Could not find function ABI",
    );
  });

  it("fetchModuleAbiWithStructs gathers referenced non-framework struct modules", async () => {
    const mock = createMockClient();
    const mainModule = makeModule({
      address: ADDR,
      name: "main",
      structs: [
        makeStruct({
          name: "Holder",
          fields: [
            { name: "a", type: "0x1::string::String" }, // 0x1::* is skipped
            { name: "b", type: "0x9::dep::Inner" }, // external dep -> fetched
          ],
        }),
      ],
      exposed_functions: [makeFunction({ name: "f", params: ["0x9::dep::Inner"], return: [] })],
    });
    const depModule = makeModule({ address: "0x9", name: "dep", structs: [makeStruct({ name: "Inner" })] });

    mock.setResponder((req) => {
      if (req.url.includes("/accounts/0x9/module/dep")) {
        return moduleResponseFor(depModule);
      }
      return moduleResponseFor(mainModule);
    });

    const bundle = await fetchModuleAbiWithStructs(ADDR, "main", mock.config);
    expect(bundle.module).toEqual(mainModule);
    expect(bundle.referencedStructModules.get("0x9::dep")).toEqual(depModule);
    expect(bundle.referencedStructModules.has("0x1::string")).toBe(false);
  });

  it("fetchModuleAbiWithStructs throws when the main module has no ABI", async () => {
    const mock = createMockClient();
    mock.setDefault({ status: 200, statusText: "OK", data: { bytecode: "0x00" } });
    await expect(fetchModuleAbiWithStructs("0xa", "ghost", mock.config)).rejects.toThrow(
      "Module not found: 0xa::ghost",
    );
  });
});

describe("remoteAbi sync/async parity smoke", () => {
  it("produces identical bytes through the sync and async paths for a vector<u64>", async () => {
    const sync = checkOrConvertArgument([1n, 2n, MAX_U64], parseTypeTag("vector<u64>"), 0, []);
    const async = await convertAsync([1n, 2n, MAX_U64], "vector<u64>");
    expect(async.bcsToBytes()).toEqual(sync.bcsToBytes());
  });
});
