// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E tests for signed integer transaction arguments.
 *
 * Note: Full entry function e2e tests for signed integers would require a Move module
 * that accepts signed integer arguments. The existing tx_args_module does not include
 * signed integer parameters. These tests focus on verifying the SDK correctly handles
 * signed integers in transaction building and serialization.
 */

import {
  Account,
  Deserializer,
  Ed25519PrivateKey,
  I8,
  I16,
  I32,
  I64,
  I128,
  I256,
  MoveVector,
  MoveOption,
  Serializer,
  Script,
  generateRawTransaction,
  TransactionPayload,
  TransactionPayloadScript,
} from "../../../src";
import { getAptosClient } from "../helper";
import { fundAccounts, PUBLISHER_ACCOUNT_PK } from "./helper";

jest.setTimeout(10000);

describe("signed integer transaction arguments", () => {
  const senderAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(PUBLISHER_ACCOUNT_PK),
    legacy: false,
  });

  describe("signed integer BCS serialization in transaction context", () => {
    it("serializes and deserializes I8 correctly", () => {
      const values = [-128, -1, 0, 1, 127];
      for (const v of values) {
        const i8 = new I8(v);
        const serializer = new Serializer();
        i8.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserialized = I8.deserialize(deserializer);
        expect(deserialized.value).toBe(v);
      }
    });

    it("serializes and deserializes I16 correctly", () => {
      const values = [-32768, -1, 0, 1, 32767];
      for (const v of values) {
        const i16 = new I16(v);
        const serializer = new Serializer();
        i16.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserialized = I16.deserialize(deserializer);
        expect(deserialized.value).toBe(v);
      }
    });

    it("serializes and deserializes I32 correctly", () => {
      const values = [-2147483648, -1, 0, 1, 2147483647];
      for (const v of values) {
        const i32 = new I32(v);
        const serializer = new Serializer();
        i32.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserialized = I32.deserialize(deserializer);
        expect(deserialized.value).toBe(v);
      }
    });

    it("serializes and deserializes I64 correctly", () => {
      const values = [-9223372036854775808n, -1n, 0n, 1n, 9223372036854775807n];
      for (const v of values) {
        const i64 = new I64(v);
        const serializer = new Serializer();
        i64.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserialized = I64.deserialize(deserializer);
        expect(deserialized.value).toBe(v);
      }
    });

    it("serializes and deserializes I128 correctly", () => {
      const values = [-170141183460469231731687303715884105728n, -1n, 0n, 1n, 170141183460469231731687303715884105727n];
      for (const v of values) {
        const i128 = new I128(v);
        const serializer = new Serializer();
        i128.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserialized = I128.deserialize(deserializer);
        expect(deserialized.value).toBe(v);
      }
    });

    it("serializes and deserializes I256 correctly", () => {
      const minI256 = -57896044618658097711785492504343953926634992332820282019728792003956564819968n;
      const maxI256 = 57896044618658097711785492504343953926634992332820282019728792003956564819967n;
      const values = [minI256, -1n, 0n, 1n, maxI256];
      for (const v of values) {
        const i256 = new I256(v);
        const serializer = new Serializer();
        i256.serialize(serializer);
        const deserializer = new Deserializer(serializer.toUint8Array());
        const deserialized = I256.deserialize(deserializer);
        expect(deserialized.value).toBe(v);
      }
    });
  });

  describe("MoveVector with signed integers in transaction context", () => {
    it("creates and serializes vector of I8", () => {
      const vec = MoveVector.I8([-128, -1, 0, 1, 127]);
      expect(vec.values.length).toBe(5);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const deserializer = new Deserializer(serializer.toUint8Array());
      const deserialized = MoveVector.deserialize(deserializer, I8);
      expect(deserialized.values.map((v) => v.value)).toEqual([-128, -1, 0, 1, 127]);
    });

    it("creates and serializes vector of I64", () => {
      const vec = MoveVector.I64([-9223372036854775808n, 0n, 9223372036854775807n]);
      expect(vec.values.length).toBe(3);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const deserializer = new Deserializer(serializer.toUint8Array());
      const deserialized = MoveVector.deserialize(deserializer, I64);
      expect(deserialized.values.map((v) => v.value)).toEqual([-9223372036854775808n, 0n, 9223372036854775807n]);
    });

    it("creates and serializes vector of I256", () => {
      const minI256 = -57896044618658097711785492504343953926634992332820282019728792003956564819968n;
      const maxI256 = 57896044618658097711785492504343953926634992332820282019728792003956564819967n;
      const vec = MoveVector.I256([minI256, 0n, maxI256]);
      expect(vec.values.length).toBe(3);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const deserializer = new Deserializer(serializer.toUint8Array());
      const deserialized = MoveVector.deserialize(deserializer, I256);
      expect(deserialized.values.map((v) => v.value)).toEqual([minI256, 0n, maxI256]);
    });
  });

  describe("MoveOption with signed integers in transaction context", () => {
    it("creates and serializes option with I8", () => {
      const optSome = MoveOption.I8(-5);
      expect(optSome.isSome()).toBe(true);
      expect(optSome.unwrap().value).toBe(-5);

      const optNone = MoveOption.I8();
      expect(optNone.isSome()).toBe(false);

      const serializer = new Serializer();
      optSome.serialize(serializer);
      const deserializer = new Deserializer(serializer.toUint8Array());
      const deserialized = MoveOption.deserialize(deserializer, I8);
      expect(deserialized.isSome()).toBe(true);
      expect(deserialized.unwrap().value).toBe(-5);
    });

    it("creates and serializes option with I64", () => {
      const optSome = MoveOption.I64(-9223372036854775808n);
      expect(optSome.isSome()).toBe(true);
      expect(optSome.unwrap().value).toBe(-9223372036854775808n);

      const serializer = new Serializer();
      optSome.serialize(serializer);
      const deserializer = new Deserializer(serializer.toUint8Array());
      const deserialized = MoveOption.deserialize(deserializer, I64);
      expect(deserialized.isSome()).toBe(true);
      expect(deserialized.unwrap().value).toBe(-9223372036854775808n);
    });
  });

  describe("serializeForScriptFunction with signed integers", () => {
    it("serializes I8 for script function with correct variant", () => {
      const i8 = new I8(-5);
      const serializer = new Serializer();
      i8.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 10 for I8
      expect(bytes[0]).toBe(10);
    });

    it("serializes I16 for script function with correct variant", () => {
      const i16 = new I16(-1000);
      const serializer = new Serializer();
      i16.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 11 for I16
      expect(bytes[0]).toBe(11);
    });

    it("serializes I32 for script function with correct variant", () => {
      const i32 = new I32(-100000);
      const serializer = new Serializer();
      i32.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 12 for I32
      expect(bytes[0]).toBe(12);
    });

    it("serializes I64 for script function with correct variant", () => {
      const i64 = new I64(-1000000n);
      const serializer = new Serializer();
      i64.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 13 for I64
      expect(bytes[0]).toBe(13);
    });

    it("serializes I128 for script function with correct variant", () => {
      const i128 = new I128(-1000000n);
      const serializer = new Serializer();
      i128.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 14 for I128
      expect(bytes[0]).toBe(14);
    });

    it("serializes I256 for script function with correct variant", () => {
      const i256 = new I256(-1000000n);
      const serializer = new Serializer();
      i256.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 15 for I256
      expect(bytes[0]).toBe(15);
    });
  });

  describe("Script payload with signed integer arguments", () => {
    it("creates and serializes a Script with signed integer arguments", () => {
      // Create a minimal script bytecode (empty script that does nothing)
      const minimalBytecode = new Uint8Array([]);

      const scriptArgs = [
        new I8(-128),
        new I16(-32768),
        new I32(-2147483648),
        new I64(-9223372036854775808n),
        new I128(-170141183460469231731687303715884105728n),
        new I256(-57896044618658097711785492504343953926634992332820282019728792003956564819968n),
      ];

      const script = new Script(minimalBytecode, [], scriptArgs);

      const serializer = new Serializer();
      script.serialize(serializer);
      const bytes = serializer.toUint8Array();

      // Deserialize and verify
      const deserializer = new Deserializer(bytes);
      const deserializedScript = Script.deserialize(deserializer);

      expect(deserializedScript.args.length).toBe(6);

      // Verify each argument was deserialized correctly
      expect((deserializedScript.args[0] as I8).value).toBe(-128);
      expect((deserializedScript.args[1] as I16).value).toBe(-32768);
      expect((deserializedScript.args[2] as I32).value).toBe(-2147483648);
      expect((deserializedScript.args[3] as I64).value).toBe(-9223372036854775808n);
      expect((deserializedScript.args[4] as I128).value).toBe(-170141183460469231731687303715884105728n);
      expect((deserializedScript.args[5] as I256).value).toBe(
        -57896044618658097711785492504343953926634992332820282019728792003956564819968n,
      );
    });

    it("creates and serializes a Script with positive signed integer arguments", () => {
      const minimalBytecode = new Uint8Array([]);

      const scriptArgs = [
        new I8(127),
        new I16(32767),
        new I32(2147483647),
        new I64(9223372036854775807n),
        new I128(170141183460469231731687303715884105727n),
        new I256(57896044618658097711785492504343953926634992332820282019728792003956564819967n),
      ];

      const script = new Script(minimalBytecode, [], scriptArgs);

      const serializer = new Serializer();
      script.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserializedScript = Script.deserialize(deserializer);

      expect(deserializedScript.args.length).toBe(6);
      expect((deserializedScript.args[0] as I8).value).toBe(127);
      expect((deserializedScript.args[1] as I16).value).toBe(32767);
      expect((deserializedScript.args[2] as I32).value).toBe(2147483647);
      expect((deserializedScript.args[3] as I64).value).toBe(9223372036854775807n);
      expect((deserializedScript.args[4] as I128).value).toBe(170141183460469231731687303715884105727n);
      expect((deserializedScript.args[5] as I256).value).toBe(
        57896044618658097711785492504343953926634992332820282019728792003956564819967n,
      );
    });

    it("round-trips TransactionPayloadScript with signed integers", () => {
      const minimalBytecode = new Uint8Array([]);
      const script = new Script(minimalBytecode, [], [new I64(-12345n), new I128(67890n)]);
      const payload = new TransactionPayloadScript(script);

      const serializer = new Serializer();
      payload.serialize(serializer);
      const bytes = serializer.toUint8Array();

      // Use TransactionPayload.deserialize which handles the variant prefix
      const deserializer = new Deserializer(bytes);
      const deserializedPayload = TransactionPayload.deserialize(deserializer) as TransactionPayloadScript;

      expect(deserializedPayload.script.args.length).toBe(2);
      expect((deserializedPayload.script.args[0] as I64).value).toBe(-12345n);
      expect((deserializedPayload.script.args[1] as I128).value).toBe(67890n);
    });
  });

  describe("serializeForEntryFunction with signed integers", () => {
    it("serializes signed integers for entry function", () => {
      const testCases = [
        { value: new I8(-5), expectedLength: 1 },
        { value: new I16(-1000), expectedLength: 2 },
        { value: new I32(-100000), expectedLength: 4 },
        { value: new I64(-1000000n), expectedLength: 8 },
        { value: new I128(-1000000n), expectedLength: 16 },
        { value: new I256(-1000000n), expectedLength: 32 },
      ];

      for (const { value, expectedLength } of testCases) {
        const serializer = new Serializer();
        value.serializeForEntryFunction(serializer);
        const bytes = serializer.toUint8Array();
        // Entry function args are length-prefixed with ULEB128
        // The first byte(s) is the length, followed by the actual value
        expect(bytes.length).toBeGreaterThan(expectedLength);
      }
    });
  });

  describe("transaction building with signed integers (requires local node)", () => {
    it("can build a raw transaction that includes signed integer script args", async () => {
      const { aptos, config } = getAptosClient();

      // Fund accounts first
      await fundAccounts(aptos, [senderAccount]);

      const minimalBytecode = new Uint8Array([0xa1, 0x1c, 0xeb, 0x0b]); // Minimal valid bytecode header
      const script = new Script(minimalBytecode, [], [new I64(-1n)]);
      const payload = new TransactionPayloadScript(script);

      // Generate a raw transaction with the script payload
      const rawTxn = await generateRawTransaction({
        aptosConfig: config,
        sender: senderAccount.accountAddress,
        payload,
      });

      // Verify the transaction was built successfully
      expect(rawTxn).toBeDefined();
      expect(rawTxn.sender).toEqual(senderAccount.accountAddress);

      // Serialize and verify it can be deserialized
      const serializer = new Serializer();
      rawTxn.serialize(serializer);
      const bytes = serializer.toUint8Array();
      expect(bytes.length).toBeGreaterThan(0);
    });
  });
});
