// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddress,
  Serializer,
  Deserializer,
  Bool,
  MoveVector,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  I8,
  I16,
  I32,
  I64,
  I128,
  I256,
  TransactionArgument,
  ScriptFunctionArgument,
  deserializeFromScriptArgument,
  Serialized,
  MoveString,
} from "../../src";

describe("Tests for the script transaction argument class", () => {
  let serializer: Serializer;
  let scriptU8Bytes: Uint8Array;
  let scriptU16Bytes: Uint8Array;
  let scriptU32Bytes: Uint8Array;
  let scriptU64Bytes: Uint8Array;
  let scriptU128Bytes: Uint8Array;
  let scriptU256Bytes: Uint8Array;
  let scriptI8Bytes: Uint8Array;
  let scriptI16Bytes: Uint8Array;
  let scriptI32Bytes: Uint8Array;
  let scriptI64Bytes: Uint8Array;
  let scriptI128Bytes: Uint8Array;
  let scriptI256Bytes: Uint8Array;
  let scriptBoolBytes: Uint8Array;
  let scriptAddressBytes: Uint8Array;
  let scriptVectorU8Bytes: Uint8Array;
  let scriptVectorStringBytes: Uint8Array;
  let scriptSerializedBytes: Uint8Array;

  beforeEach(() => {
    serializer = new Serializer();
    scriptU8Bytes = new Uint8Array([0, 1]);
    scriptU16Bytes = new Uint8Array([6, 2, 0]);
    scriptU32Bytes = new Uint8Array([7, 3, 0, 0, 0]);
    scriptU64Bytes = new Uint8Array([1, 4, 0, 0, 0, 0, 0, 0, 0]);
    scriptU128Bytes = new Uint8Array([2, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    scriptU256Bytes = new Uint8Array([
      8, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    // Signed integers: variant prefix followed by two's complement representation
    // I8 variant = 10, value = -5 -> 0xFB (251 in unsigned)
    scriptI8Bytes = new Uint8Array([10, 251]);
    // I16 variant = 11, value = -1000 -> 0xFC18 in little-endian: [0x18, 0xFC]
    scriptI16Bytes = new Uint8Array([11, 0x18, 0xfc]);
    // I32 variant = 12, value = -100000 -> 0xFFFE7960 in little-endian
    scriptI32Bytes = new Uint8Array([12, 0x60, 0x79, 0xfe, 0xff]);
    // I64 variant = 13, value = -1000000 in little-endian
    scriptI64Bytes = new Uint8Array([13, 0xc0, 0xbd, 0xf0, 0xff, 0xff, 0xff, 0xff, 0xff]);
    // I128 variant = 14, value = -1000000 in little-endian (16 bytes)
    scriptI128Bytes = new Uint8Array([
      14, 0xc0, 0xbd, 0xf0, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    ]);
    // I256 variant = 15, value = -1000000 in little-endian (32 bytes)
    scriptI256Bytes = new Uint8Array([
      15, 0xc0, 0xbd, 0xf0, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    ]);
    scriptBoolBytes = new Uint8Array([5, 0]);
    scriptAddressBytes = new Uint8Array([3, ...AccountAddress.FOUR.data]);
    scriptVectorU8Bytes = new Uint8Array([4, 5, 1, 2, 3, 4, 5]);
    scriptVectorStringBytes = new Uint8Array([9, 5, 2, 1, 49, 1, 50]);
    scriptSerializedBytes = new Uint8Array([9, 2, 1, 2]);
  });

  it("should serialize all types of ScriptTransactionArguments correctly", () => {
    const validateBytes = (input: ScriptFunctionArgument, expectedOutput: Uint8Array) => {
      const scriptSerializer = new Serializer();
      input.serializeForScriptFunction(scriptSerializer);
      const serializedBytes = scriptSerializer.toUint8Array();
      expect(serializedBytes).toEqual(expectedOutput);
    };
    validateBytes(new U8(1), scriptU8Bytes);
    validateBytes(new U16(2), scriptU16Bytes);
    validateBytes(new U32(3), scriptU32Bytes);
    validateBytes(new U64(4), scriptU64Bytes);
    validateBytes(new U128(5), scriptU128Bytes);
    validateBytes(new U256(6), scriptU256Bytes);
    validateBytes(new I8(-5), scriptI8Bytes);
    validateBytes(new I16(-1000), scriptI16Bytes);
    validateBytes(new I32(-100000), scriptI32Bytes);
    validateBytes(new I64(-1000000n), scriptI64Bytes);
    validateBytes(new I128(-1000000n), scriptI128Bytes);
    validateBytes(new I256(-1000000n), scriptI256Bytes);
    validateBytes(new Bool(false), scriptBoolBytes);
    validateBytes(AccountAddress.FOUR, scriptAddressBytes);
    validateBytes(MoveVector.U8([1, 2, 3, 4, 5]), scriptVectorU8Bytes);
    validateBytes(MoveVector.MoveString(["1", "2"]), scriptVectorStringBytes);
    validateBytes(new Serialized("0x0102"), scriptSerializedBytes);
  });

  const deserializeAsScriptArg = <T extends TransactionArgument>(input: ScriptFunctionArgument): T => {
    serializer = new Serializer();
    input.serializeForScriptFunction(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    return deserializeFromScriptArgument(deserializer) as T;
  };

  it("should deserialize all types of ScriptTransactionArguments correctly", () => {
    const scriptArgU8 = deserializeAsScriptArg<U8>(new U8(1));
    const scriptArgU16 = deserializeAsScriptArg<U16>(new U16(2));
    const scriptArgU32 = deserializeAsScriptArg<U32>(new U32(3));
    const scriptArgU64 = deserializeAsScriptArg<U64>(new U64(4));
    const scriptArgU128 = deserializeAsScriptArg<U128>(new U128(5));
    const scriptArgU256 = deserializeAsScriptArg<U256>(new U256(6));
    const scriptArgI8 = deserializeAsScriptArg<I8>(new I8(-5));
    const scriptArgI16 = deserializeAsScriptArg<I16>(new I16(-1000));
    const scriptArgI32 = deserializeAsScriptArg<I32>(new I32(-100000));
    const scriptArgI64 = deserializeAsScriptArg<I64>(new I64(-1000000n));
    const scriptArgI128 = deserializeAsScriptArg<I128>(new I128(-1000000n));
    const scriptArgI256 = deserializeAsScriptArg<I256>(new I256(-1000000n));
    const scriptArgBool = deserializeAsScriptArg<Bool>(new Bool(false));
    const scriptArgAddress = deserializeAsScriptArg<AccountAddress>(AccountAddress.FOUR);
    const scriptArgU8Vector = deserializeAsScriptArg<MoveVector<U8>>(MoveVector.U8([1, 2, 3, 4, 5]));
    const scriptArgStringVector = deserializeAsScriptArg<Serialized>(MoveVector.MoveString(["1", "2"])).toMoveVector(
      MoveString,
    );
    const scriptArgSerialized = deserializeAsScriptArg<Serialized>(new Serialized("0x0102"));

    expect(scriptArgU8.value).toEqual(1);
    expect(scriptArgU16.value).toEqual(2);
    expect(scriptArgU32.value).toEqual(3);
    expect(scriptArgU64.value).toEqual(4n);
    expect(scriptArgU128.value).toEqual(5n);
    expect(scriptArgU256.value).toEqual(6n);
    expect(scriptArgI8.value).toEqual(-5);
    expect(scriptArgI16.value).toEqual(-1000);
    expect(scriptArgI32.value).toEqual(-100000);
    expect(scriptArgI64.value).toEqual(-1000000n);
    expect(scriptArgI128.value).toEqual(-1000000n);
    expect(scriptArgI256.value).toEqual(-1000000n);
    expect(scriptArgBool.value).toEqual(false);
    expect(scriptArgAddress.data).toEqual(AccountAddress.FOUR.data);
    expect(scriptArgU8Vector.values.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
    expect(scriptArgStringVector.values.map((v) => v.value)).toEqual(["1", "2"]);
    expect(scriptArgSerialized.value).toEqual(new Uint8Array([1, 2]));
  });

  it("should convert all Move primitives to script transaction arguments correctly", () => {
    expect(deserializeAsScriptArg(new U8(1)) instanceof U8).toBe(true);
    expect(deserializeAsScriptArg(new U16(2)) instanceof U16).toBe(true);
    expect(deserializeAsScriptArg(new U32(3)) instanceof U32).toBe(true);
    expect(deserializeAsScriptArg(new U64(4)) instanceof U64).toBe(true);
    expect(deserializeAsScriptArg(new U128(5)) instanceof U128).toBe(true);
    expect(deserializeAsScriptArg(new U256(6)) instanceof U256).toBe(true);
    expect(deserializeAsScriptArg(new I8(-5)) instanceof I8).toBe(true);
    expect(deserializeAsScriptArg(new I16(-1000)) instanceof I16).toBe(true);
    expect(deserializeAsScriptArg(new I32(-100000)) instanceof I32).toBe(true);
    expect(deserializeAsScriptArg(new I64(-1000000n)) instanceof I64).toBe(true);
    expect(deserializeAsScriptArg(new I128(-1000000n)) instanceof I128).toBe(true);
    expect(deserializeAsScriptArg(new I256(-1000000n)) instanceof I256).toBe(true);
    expect(deserializeAsScriptArg(new Bool(false)) instanceof Bool).toBe(true);
    expect(deserializeAsScriptArg(AccountAddress.FOUR) instanceof AccountAddress).toBe(true);
    expect(deserializeAsScriptArg(MoveVector.U8([1, 2, 3, 4, 5])) instanceof MoveVector).toBe(true);
    const deserializedVectorU8 = deserializeAsScriptArg<MoveVector<U8>>(MoveVector.U8([1, 2, 3, 4, 5]));
    expect(deserializedVectorU8.values.every((v) => v instanceof U8)).toBe(true);
    expect(deserializeAsScriptArg(new Serialized("0x0102")) instanceof Serialized).toBe(true);
  });
});
