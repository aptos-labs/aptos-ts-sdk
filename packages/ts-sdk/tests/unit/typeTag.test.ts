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
  TypeTagGeneric,
  TypeTagReference,
  Deserializer,
  Serializer,
  parseTypeTag,
} from "../../src/index.js";

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
    expect(tag.isBool()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagBool);
  });

  test("deserializes a TypeTagU8 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU8();
    expect(tag.isPrimitive()).toBe(true);
    expect(tag.isU8()).toBe(true);

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
    expect(tag.isU64()).toBe(true);

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
    expect(tag.isAddress()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagAddress);
  });

  test("deserializes a TypeTagSigner correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagSigner();
    expect(tag.isSigner()).toBe(true);

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagSigner);
  });

  test("deserializes TypeTagGeneric for ABI type parameters", () => {
    const serializer = new Serializer();
    const tag = new TypeTagGeneric(3);
    expect(tag.toString()).toBe("T3");
    expect(tag.isGeneric()).toBe(true);

    tag.serialize(serializer);
    const restored = TypeTag.deserialize(new Deserializer(serializer.toUint8Array()));
    expect(restored.isGeneric()).toBe(true);
    if (!restored.isGeneric()) throw new Error("expected generic");
    expect(restored.value).toBe(3);
  });

  test("rejects negative generic type parameter indices", () => {
    expect(() => new TypeTagGeneric(-1)).toThrow(/cannot be negative/);
  });

  test("loads TypeTagReference via static load", () => {
    const serializer = new Serializer();
    new TypeTagSigner().serialize(serializer);

    const restored = TypeTagReference.load(new Deserializer(serializer.toUint8Array()));
    expect(restored.value.isSigner()).toBe(true);
    expect(restored.toString()).toBe("&signer");
  });

  test("parses reference type tags from Move syntax", () => {
    const tag = parseTypeTag("&signer");
    expect(tag).toBeInstanceOf(TypeTagReference);
    const ref = tag as TypeTagReference;
    expect(ref.value.isSigner()).toBe(true);
    expect(ref.toString()).toBe("&signer");
  });

  test("TypeTagReference serialize writes the reference variant tag", () => {
    const ref = new TypeTagReference(new TypeTagSigner());
    const serializer = new Serializer();
    ref.serialize(serializer);
    expect(serializer.toUint8Array().length).toBeGreaterThan(0);
    expect(ref.toString()).toBe("&signer");
  });

  test("primitive type tags expose stable Move syntax via toString", () => {
    expect(new TypeTagBool().toString()).toBe("bool");
    expect(new TypeTagU128().toString()).toBe("u128");
    expect(new TypeTagAddress().toString()).toBe("address");
  });

  test("TypeTagStruct toString includes generic type arguments", () => {
    const parsed = parseTypeTag("0x1::some_module::SomeResource");
    if (!parsed.isStruct()) {
      throw new Error("Expected a struct type tag");
    }
    const tag = new TypeTagStruct(
      new StructTag(parsed.value.address, parsed.value.moduleName, parsed.value.name, [new TypeTagU8()]),
    );
    expect(tag.toString()).toBe("0x1::some_module::SomeResource<u8>");
  });

  test("throws when deserializing an unknown TypeTag variant index", () => {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(100);
    expect(() => TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toThrow(
      /Unknown variant index for TypeTag/,
    );
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
