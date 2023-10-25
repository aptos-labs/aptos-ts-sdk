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
  TypeTagVector,
  Deserializer,
  Serializer,
} from "../../src";
import { parseTypeTag } from "../../src/transactions/typeTag/parser";

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

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagBool);
  });

  test("deserializes a TypeTagU8 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU8();

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU8);
  });

  test("deserializes a TypeTagU16 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU16();

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU16);
  });

  test("deserializes a TypeTagU32 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU32();

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU32);
  });

  test("deserializes a TypeTagU64 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU64();

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU64);
  });

  test("deserializes a TypeTagU128 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU128();

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU128);
  });

  test("deserializes a TypeTagU256 correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagU256();

    tag.serialize(serializer);

    expect(TypeTag.deserialize(new Deserializer(serializer.toUint8Array()))).toBeInstanceOf(TypeTagU256);
  });

  test("deserializes a TypeTagAddress correctly", () => {
    const serializer = new Serializer();
    const tag = new TypeTagAddress();

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

    tag.serialize(serializer);
    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array())) as TypeTagVector;
    expect(deserialized).toBeInstanceOf(TypeTagVector);
    expect(deserialized.value).toBeInstanceOf(TypeTagU32);
  });

  test("deserializes a TypeTagStruct correctly", () => {
    const serializer = new Serializer();
    const tag = parseTypeTag(expectedTypeTag.string);

    tag.serialize(serializer);
    const deserialized = TypeTag.deserialize(new Deserializer(serializer.toUint8Array())) as TypeTagStruct;
    expect(deserialized).toBeInstanceOf(TypeTagStruct);
    expect(deserialized.value).toBeInstanceOf(StructTag);
    expect(deserialized.value.address.toString()).toEqual(expectedTypeTag.address);
    expect(deserialized.value.module_name.identifier).toEqual("some_module");
    expect(deserialized.value.name.identifier).toEqual("SomeResource");
    expect(deserialized.value.type_args.length).toEqual(0);
  });
});
