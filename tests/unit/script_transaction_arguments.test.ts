// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, Serializer, Deserializer, Bool, U128, U16, U256, U32, U64, U8 } from "../../src";
import { MoveVector } from "../../src/bcs/serializable/move-structs";
import { ScriptFunctionArgument, deserializeFromScriptArgument } from "../../src/transactions/instances";

describe("Tests for the script transaction argument class", () => {
  let serializer: Serializer;
  let scriptU8Bytes: Uint8Array;
  let scriptU16Bytes: Uint8Array;
  let scriptU32Bytes: Uint8Array;
  let scriptU64Bytes: Uint8Array;
  let scriptU128Bytes: Uint8Array;
  let scriptU256Bytes: Uint8Array;
  let scriptBoolBytes: Uint8Array;
  let scriptAddressBytes: Uint8Array;
  let scriptVectorU8Bytes: Uint8Array;

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
    scriptBoolBytes = new Uint8Array([5, 0]);
    scriptAddressBytes = new Uint8Array([3, ...AccountAddress.FOUR.data]);
    scriptVectorU8Bytes = new Uint8Array([4, 5, 1, 2, 3, 4, 5]);
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
    validateBytes(new Bool(false), scriptBoolBytes);
    validateBytes(AccountAddress.FOUR, scriptAddressBytes);
    validateBytes(MoveVector.U8([1, 2, 3, 4, 5]), scriptVectorU8Bytes);
  });

  const deserializeAsScriptArg = (input: ScriptFunctionArgument) => {
    serializer = new Serializer();
    input.serializeForScriptFunction(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    return deserializeFromScriptArgument(deserializer);
  };

  it("should deserialize all types of ScriptTransactionArguments correctly", () => {
    const scriptArgU8 = deserializeAsScriptArg(new U8(1)) as U8;
    const scriptArgU16 = deserializeAsScriptArg(new U16(2)) as U16;
    const scriptArgU32 = deserializeAsScriptArg(new U32(3)) as U32;
    const scriptArgU64 = deserializeAsScriptArg(new U64(4)) as U64;
    const scriptArgU128 = deserializeAsScriptArg(new U128(5)) as U128;
    const scriptArgU256 = deserializeAsScriptArg(new U256(6)) as U256;
    const scriptArgBool = deserializeAsScriptArg(new Bool(false)) as Bool;
    const scriptArgAddress = deserializeAsScriptArg(AccountAddress.FOUR) as AccountAddress;
    const scriptArgU8Vector = deserializeAsScriptArg(MoveVector.U8([1, 2, 3, 4, 5])) as MoveVector<U8>;

    expect(scriptArgU8.value).toEqual(1);
    expect(scriptArgU16.value).toEqual(2);
    expect(scriptArgU32.value).toEqual(3);
    expect(scriptArgU64.value).toEqual(4n);
    expect(scriptArgU128.value).toEqual(5n);
    expect(scriptArgU256.value).toEqual(6n);
    expect(scriptArgBool.value).toEqual(false);
    expect(scriptArgAddress.data).toEqual(AccountAddress.FOUR.data);
    expect(scriptArgU8Vector.values.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it("should convert all Move primitives to script transaction arguments correctly", () => {
    expect(deserializeAsScriptArg(new U8(1)) instanceof U8).toBe(true);
    expect(deserializeAsScriptArg(new U16(2)) instanceof U16).toBe(true);
    expect(deserializeAsScriptArg(new U32(3)) instanceof U32).toBe(true);
    expect(deserializeAsScriptArg(new U64(4)) instanceof U64).toBe(true);
    expect(deserializeAsScriptArg(new U128(5)) instanceof U128).toBe(true);
    expect(deserializeAsScriptArg(new U256(6)) instanceof U256).toBe(true);
    expect(deserializeAsScriptArg(new Bool(false)) instanceof Bool).toBe(true);
    expect(deserializeAsScriptArg(new AccountAddress(AccountAddress.FOUR)) instanceof AccountAddress).toBe(true);
    expect(deserializeAsScriptArg(MoveVector.U8([1, 2, 3, 4, 5])) instanceof MoveVector).toBe(true);
    const deserializedVectorU8 = deserializeAsScriptArg(MoveVector.U8([1, 2, 3, 4, 5])) as MoveVector<U8>;
    expect(deserializedVectorU8.values.every((v) => v instanceof U8)).toBe(true);
  });
});
