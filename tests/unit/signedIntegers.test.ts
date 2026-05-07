// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Deserializer, Serializer, I8, I16, I32, I64, I128, I256, MoveVector, MoveOption } from "../../src";

describe("Signed Integer Types", () => {
  describe("I8", () => {
    test("serializes and deserializes positive values correctly", () => {
      const value = new I8(127);
      expect(value.value).toBe(127);

      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I8.deserialize(deserializer);
      expect(deserialized.value).toBe(127);
    });

    test("serializes and deserializes negative values correctly", () => {
      const value = new I8(-128);
      expect(value.value).toBe(-128);

      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I8.deserialize(deserializer);
      expect(deserialized.value).toBe(-128);
    });

    test("serializes for entry function", () => {
      const value = new I8(-5);
      const serializer = new Serializer();
      value.serializeForEntryFunction(serializer);
      const bytes = serializer.toUint8Array();
      expect(bytes.length).toBeGreaterThan(0);
    });

    test("throws error for out of range values", () => {
      expect(() => new I8(128)).toThrow();
      expect(() => new I8(-129)).toThrow();
    });
  });

  describe("I16", () => {
    test("serializes and deserializes positive values correctly", () => {
      const value = new I16(32767);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I16.deserialize(deserializer);
      expect(deserialized.value).toBe(32767);
    });

    test("serializes and deserializes negative values correctly", () => {
      const value = new I16(-32768);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I16.deserialize(deserializer);
      expect(deserialized.value).toBe(-32768);
    });

    test("throws error for out of range values", () => {
      expect(() => new I16(32768)).toThrow();
      expect(() => new I16(-32769)).toThrow();
    });
  });

  describe("I32", () => {
    test("serializes and deserializes positive values correctly", () => {
      const value = new I32(2147483647);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I32.deserialize(deserializer);
      expect(deserialized.value).toBe(2147483647);
    });

    test("serializes and deserializes negative values correctly", () => {
      const value = new I32(-2147483648);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I32.deserialize(deserializer);
      expect(deserialized.value).toBe(-2147483648);
    });

    test("throws error for out of range values", () => {
      expect(() => new I32(2147483648)).toThrow();
      expect(() => new I32(-2147483649)).toThrow();
    });
  });

  describe("I64", () => {
    test("serializes and deserializes positive values correctly", () => {
      const value = new I64(9223372036854775807n);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I64.deserialize(deserializer);
      expect(deserialized.value).toBe(9223372036854775807n);
    });

    test("serializes and deserializes negative values correctly", () => {
      const value = new I64(-9223372036854775808n);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I64.deserialize(deserializer);
      expect(deserialized.value).toBe(-9223372036854775808n);
    });

    test("serializes small negative values correctly", () => {
      const value = new I64(-1);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I64.deserialize(deserializer);
      expect(deserialized.value).toBe(-1n);
    });
  });

  describe("I128", () => {
    test("serializes and deserializes positive values correctly", () => {
      const value = new I128(170141183460469231731687303715884105727n);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I128.deserialize(deserializer);
      expect(deserialized.value).toBe(170141183460469231731687303715884105727n);
    });

    test("serializes and deserializes negative values correctly", () => {
      const value = new I128(-170141183460469231731687303715884105728n);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I128.deserialize(deserializer);
      expect(deserialized.value).toBe(-170141183460469231731687303715884105728n);
    });
  });

  describe("I256", () => {
    test("serializes and deserializes positive values correctly", () => {
      const value = new I256(57896044618658097711785492504343953926634992332820282019728792003956564819967n);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I256.deserialize(deserializer);
      expect(deserialized.value).toBe(57896044618658097711785492504343953926634992332820282019728792003956564819967n);
    });

    test("serializes and deserializes negative values correctly", () => {
      const value = new I256(-57896044618658097711785492504343953926634992332820282019728792003956564819968n);
      const serializer = new Serializer();
      value.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = I256.deserialize(deserializer);
      expect(deserialized.value).toBe(-57896044618658097711785492504343953926634992332820282019728792003956564819968n);
    });
  });

  describe("MoveVector with Signed Integers", () => {
    test("MoveVector.I8 creates and serializes correctly", () => {
      const vec = MoveVector.I8([-128, -1, 0, 1, 127]);
      expect(vec.values.length).toBe(5);
      expect(vec.values[0].value).toBe(-128);
      expect(vec.values[4].value).toBe(127);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveVector.deserialize(deserializer, I8);
      expect(deserialized.values.map((v) => v.value)).toEqual([-128, -1, 0, 1, 127]);
    });

    test("MoveVector.I16 creates and serializes correctly", () => {
      const vec = MoveVector.I16([-32768, -1, 0, 1, 32767]);
      expect(vec.values.length).toBe(5);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveVector.deserialize(deserializer, I16);
      expect(deserialized.values.map((v) => v.value)).toEqual([-32768, -1, 0, 1, 32767]);
    });

    test("MoveVector.I32 creates and serializes correctly", () => {
      const vec = MoveVector.I32([-2147483648, -1, 0, 1, 2147483647]);
      expect(vec.values.length).toBe(5);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveVector.deserialize(deserializer, I32);
      expect(deserialized.values.map((v) => v.value)).toEqual([-2147483648, -1, 0, 1, 2147483647]);
    });

    test("MoveVector.I64 creates and serializes correctly", () => {
      const vec = MoveVector.I64([-9223372036854775808n, -1n, 0n, 1n, 9223372036854775807n]);
      expect(vec.values.length).toBe(5);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveVector.deserialize(deserializer, I64);
      expect(deserialized.values.map((v) => v.value)).toEqual([
        -9223372036854775808n,
        -1n,
        0n,
        1n,
        9223372036854775807n,
      ]);
    });

    test("MoveVector.I128 creates and serializes correctly", () => {
      const vec = MoveVector.I128([
        -170141183460469231731687303715884105728n,
        0n,
        170141183460469231731687303715884105727n,
      ]);
      expect(vec.values.length).toBe(3);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveVector.deserialize(deserializer, I128);
      expect(deserialized.values.map((v) => v.value)).toEqual([
        -170141183460469231731687303715884105728n,
        0n,
        170141183460469231731687303715884105727n,
      ]);
    });

    test("MoveVector.I256 creates and serializes correctly", () => {
      const minI256 = -57896044618658097711785492504343953926634992332820282019728792003956564819968n;
      const maxI256 = 57896044618658097711785492504343953926634992332820282019728792003956564819967n;
      const vec = MoveVector.I256([minI256, 0n, maxI256]);
      expect(vec.values.length).toBe(3);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveVector.deserialize(deserializer, I256);
      expect(deserialized.values.map((v) => v.value)).toEqual([minI256, 0n, maxI256]);
    });

    test("empty MoveVector with signed integers", () => {
      const vec = MoveVector.I8([]);
      expect(vec.values.length).toBe(0);

      const serializer = new Serializer();
      vec.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveVector.deserialize(deserializer, I8);
      expect(deserialized.values.length).toBe(0);
    });
  });

  describe("MoveOption with Signed Integers", () => {
    test("MoveOption.I8 with value", () => {
      const opt = MoveOption.I8(-5);
      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap().value).toBe(-5);

      const serializer = new Serializer();
      opt.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveOption.deserialize(deserializer, I8);
      expect(deserialized.isSome()).toBe(true);
      expect(deserialized.unwrap().value).toBe(-5);
    });

    test("MoveOption.I8 without value", () => {
      const opt = MoveOption.I8();
      expect(opt.isSome()).toBe(false);

      const optNull = MoveOption.I8(null);
      expect(optNull.isSome()).toBe(false);

      const optUndefined = MoveOption.I8(undefined);
      expect(optUndefined.isSome()).toBe(false);
    });

    test("MoveOption.I16 with value", () => {
      const opt = MoveOption.I16(-1000);
      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap().value).toBe(-1000);
    });

    test("MoveOption.I32 with value", () => {
      const opt = MoveOption.I32(-100000);
      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap().value).toBe(-100000);
    });

    test("MoveOption.I64 with value", () => {
      const opt = MoveOption.I64(-9223372036854775808n);
      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap().value).toBe(-9223372036854775808n);
    });

    test("MoveOption.I128 with value", () => {
      const opt = MoveOption.I128(-170141183460469231731687303715884105728n);
      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap().value).toBe(-170141183460469231731687303715884105728n);
    });

    test("MoveOption.I256 with value", () => {
      const minI256 = -57896044618658097711785492504343953926634992332820282019728792003956564819968n;
      const opt = MoveOption.I256(minI256);
      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap().value).toBe(minI256);
    });

    test("MoveOption with signed integers serializes and deserializes correctly", () => {
      const opt = MoveOption.I64(-12345n);

      const serializer = new Serializer();
      opt.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveOption.deserialize(deserializer, I64);
      expect(deserialized.isSome()).toBe(true);
      expect(deserialized.unwrap().value).toBe(-12345n);
    });

    test("Empty MoveOption with signed integers serializes and deserializes correctly", () => {
      const opt = MoveOption.I32();

      const serializer = new Serializer();
      opt.serialize(serializer);
      const bytes = serializer.toUint8Array();

      const deserializer = new Deserializer(bytes);
      const deserialized = MoveOption.deserialize(deserializer, I32);
      expect(deserialized.isSome()).toBe(false);
    });
  });

  describe("serializeForScriptFunction", () => {
    test("I8 serializes for script function with correct variant", () => {
      const value = new I8(-5);
      const serializer = new Serializer();
      value.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 10 for I8
      expect(bytes[0]).toBe(10);
    });

    test("I16 serializes for script function with correct variant", () => {
      const value = new I16(-1000);
      const serializer = new Serializer();
      value.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 11 for I16
      expect(bytes[0]).toBe(11);
    });

    test("I32 serializes for script function with correct variant", () => {
      const value = new I32(-100000);
      const serializer = new Serializer();
      value.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 12 for I32
      expect(bytes[0]).toBe(12);
    });

    test("I64 serializes for script function with correct variant", () => {
      const value = new I64(-1000000n);
      const serializer = new Serializer();
      value.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 13 for I64
      expect(bytes[0]).toBe(13);
    });

    test("I128 serializes for script function with correct variant", () => {
      const value = new I128(-1000000n);
      const serializer = new Serializer();
      value.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 14 for I128
      expect(bytes[0]).toBe(14);
    });

    test("I256 serializes for script function with correct variant", () => {
      const value = new I256(-1000000n);
      const serializer = new Serializer();
      value.serializeForScriptFunction(serializer);
      const bytes = serializer.toUint8Array();
      // Variant 15 for I256
      expect(bytes[0]).toBe(15);
    });
  });
});
