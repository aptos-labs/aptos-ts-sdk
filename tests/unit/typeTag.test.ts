// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  StructTag,
  TypeTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagSigner,
  TypeTagStruct,
  TypeTagU128,
  TypeTagU16,
  TypeTagU256,
  TypeTagU32,
  TypeTagU64,
  TypeTagU8,
  TypeTagI8,
  TypeTagI16,
  TypeTagI32,
  TypeTagI64,
  TypeTagI128,
  TypeTagI256,
  TypeTagVector,
  Deserializer,
  Serializer,
  parseTypeTag,
} from "../../src";

const expectedTypeTag = {
  string: "0x1::some_module::SomeResource",
  address: "0x1",
  module_name: "some_module",
  name: "SomeResource",
};

describe("Deserialize TypeTags", () => {
  test("deserializes a TypeTagBool correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagBool();
    expect(tag.isPrimitive()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagBool);
  });

  test("deserializes a TypeTagU8 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU8();
    expect(tag.isPrimitive()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU8);
  });

  test("deserializes a TypeTagU16 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU16();
    expect(tag.isPrimitive()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU16);
  });

  test("deserializes a TypeTagU32 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU32();
    expect(tag.isPrimitive()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU32);
  });

  test("deserializes a TypeTagU64 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU64();
    expect(tag.isPrimitive()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU64);
  });

  test("deserializes a TypeTagU128 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU128();
    expect(tag.isPrimitive()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU128);
  });

  test("deserializes a TypeTagU256 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU256();
    expect(tag.isPrimitive()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU256);
  });

  test("deserializes a TypeTagI8 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagI8();
    expect(tag.isPrimitive()).toBe(true);
    expect(tag.isI8()).toBe(true);
    expect(tag.toString()).toBe("i8");

    tag.serialize(serializer);

    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(deserialized).toBeInstanceOf(TypeTagI8);
    expect(deserialized.isI8()).toBe(true);
  });

  test("deserializes a TypeTagI16 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagI16();
    expect(tag.isPrimitive()).toBe(true);
    expect(tag.isI16()).toBe(true);
    expect(tag.toString()).toBe("i16");

    tag.serialize(serializer);

    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(deserialized).toBeInstanceOf(TypeTagI16);
    expect(deserialized.isI16()).toBe(true);
  });

  test("deserializes a TypeTagI32 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagI32();
    expect(tag.isPrimitive()).toBe(true);
    expect(tag.isI32()).toBe(true);
    expect(tag.toString()).toBe("i32");

    tag.serialize(serializer);

    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(deserialized).toBeInstanceOf(TypeTagI32);
    expect(deserialized.isI32()).toBe(true);
  });

  test("deserializes a TypeTagI64 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagI64();
    expect(tag.isPrimitive()).toBe(true);
    expect(tag.isI64()).toBe(true);
    expect(tag.toString()).toBe("i64");

    tag.serialize(serializer);

    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(deserialized).toBeInstanceOf(TypeTagI64);
    expect(deserialized.isI64()).toBe(true);
  });

  test("deserializes a TypeTagI128 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagI128();
    expect(tag.isPrimitive()).toBe(true);
    expect(tag.isI128()).toBe(true);
    expect(tag.toString()).toBe("i128");

    tag.serialize(serializer);

    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(deserialized).toBeInstanceOf(TypeTagI128);
    expect(deserialized.isI128()).toBe(true);
  });

  test("deserializes a TypeTagI256 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagI256();
    expect(tag.isPrimitive()).toBe(true);
    expect(tag.isI256()).toBe(true);
    expect(tag.toString()).toBe("i256");

    tag.serialize(serializer);

    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(deserialized).toBeInstanceOf(TypeTagI256);
    expect(deserialized.isI256()).toBe(true);
  });

  test("deserializes a TypeTagAddress correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagAddress();
    expect(tag.isPrimitive()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagAddress);
  });

  test("deserializes a TypeTagSigner correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagSigner();

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagSigner);
  });

  test("deserializes a TypeTagVector correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagVector(new TypeTagU32());
    expect(tag.isPrimitive()).toBe(false);

    tag.serialize(serializer);
    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array()));
    if (!deserialized.isVector()) {
      throw new Error("Expected deserialized value to be a TypeTagVector");
    }
    expect(deserialized.value).toBeInstanceOf(TypeTagU32);
  });

  test("deserializes a TypeTagStruct correctly", () => {
    const serializer = new Serializer();
    const tag = parseTypeTag(expectedTypeTag.string);
    expect(tag.isPrimitive()).toBe(false);

    tag.serialize(serializer);
    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array()));
    if (!deserialized.isStruct()) {
      throw new Error("Expected deserialized value to be a TypeTagStruct");
    }
    expect(deserialized).toBeInstanceOf(TypeTagStruct);
    expect(deserialized.value).toBeInstanceOf(StructTag);
    expect(deserialized.value.address.toString()).toEqual(expectedTypeTag.address);
    expect(deserialized.value.moduleName.identifier).toEqual("some_module");
    expect(deserialized.value.name.identifier).toEqual("SomeResource");
    expect(deserialized.value.typeArgs.length).toEqual(0);
  });
});
