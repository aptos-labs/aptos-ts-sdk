// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Deserializer, Serializer, I8, I16, I32, I64, I128, I256 } from "../../src";

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
});
