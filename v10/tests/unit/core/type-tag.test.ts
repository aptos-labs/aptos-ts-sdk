import { describe, expect, it } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer.js";
import { Serializer } from "../../../src/bcs/serializer.js";
import { AccountAddress } from "../../../src/core/account-address.js";
import {
  aptosCoinStructTag,
  Identifier,
  objectStructTag,
  optionStructTag,
  StructTag,
  stringStructTag,
  TypeTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagGeneric,
  TypeTagI8,
  TypeTagI16,
  TypeTagI32,
  TypeTagI64,
  TypeTagI128,
  TypeTagI256,
  TypeTagReference,
  TypeTagSigner,
  TypeTagStruct,
  TypeTagU8,
  TypeTagU16,
  TypeTagU32,
  TypeTagU64,
  TypeTagU128,
  TypeTagU256,
  TypeTagVector,
} from "../../../src/core/type-tag.js";

describe("Primitive TypeTags", () => {
  it("toString returns correct strings", () => {
    expect(new TypeTagBool().toString()).toBe("bool");
    expect(new TypeTagU8().toString()).toBe("u8");
    expect(new TypeTagU16().toString()).toBe("u16");
    expect(new TypeTagU32().toString()).toBe("u32");
    expect(new TypeTagU64().toString()).toBe("u64");
    expect(new TypeTagU128().toString()).toBe("u128");
    expect(new TypeTagU256().toString()).toBe("u256");
    expect(new TypeTagI8().toString()).toBe("i8");
    expect(new TypeTagI16().toString()).toBe("i16");
    expect(new TypeTagI32().toString()).toBe("i32");
    expect(new TypeTagI64().toString()).toBe("i64");
    expect(new TypeTagI128().toString()).toBe("i128");
    expect(new TypeTagI256().toString()).toBe("i256");
    expect(new TypeTagAddress().toString()).toBe("address");
    expect(new TypeTagSigner().toString()).toBe("signer");
  });

  it("serialize and deserialize all primitive types", () => {
    const tags: TypeTag[] = [
      new TypeTagBool(),
      new TypeTagU8(),
      new TypeTagU16(),
      new TypeTagU32(),
      new TypeTagU64(),
      new TypeTagU128(),
      new TypeTagU256(),
      new TypeTagI8(),
      new TypeTagI16(),
      new TypeTagI32(),
      new TypeTagI64(),
      new TypeTagI128(),
      new TypeTagI256(),
      new TypeTagAddress(),
      new TypeTagSigner(),
    ];

    for (const tag of tags) {
      const serializer = new Serializer();
      tag.serialize(serializer);
      const deserializer = new Deserializer(serializer.toUint8Array());
      const deserialized = TypeTag.deserialize(deserializer);
      expect(deserialized.toString()).toBe(tag.toString());
    }
  });
});

describe("TypeTag type guards", () => {
  it("isBool", () => {
    expect(new TypeTagBool().isBool()).toBe(true);
    expect(new TypeTagU8().isBool()).toBe(false);
  });

  it("isU8", () => {
    expect(new TypeTagU8().isU8()).toBe(true);
    expect(new TypeTagU16().isU8()).toBe(false);
  });

  it("isAddress", () => {
    expect(new TypeTagAddress().isAddress()).toBe(true);
    expect(new TypeTagBool().isAddress()).toBe(false);
  });

  it("isSigner", () => {
    expect(new TypeTagSigner().isSigner()).toBe(true);
    expect(new TypeTagAddress().isSigner()).toBe(false);
  });

  it("isVector", () => {
    expect(new TypeTagVector(new TypeTagU8()).isVector()).toBe(true);
    expect(new TypeTagU8().isVector()).toBe(false);
  });

  it("isStruct", () => {
    const structTag = new StructTag(AccountAddress.ONE, new Identifier("test"), new Identifier("Test"), []);
    expect(new TypeTagStruct(structTag).isStruct()).toBe(true);
    expect(new TypeTagU8().isStruct()).toBe(false);
  });

  it("isGeneric", () => {
    expect(new TypeTagGeneric(0).isGeneric()).toBe(true);
    expect(new TypeTagU8().isGeneric()).toBe(false);
  });

  it("isPrimitive for all primitives", () => {
    expect(new TypeTagBool().isPrimitive()).toBe(true);
    expect(new TypeTagU8().isPrimitive()).toBe(true);
    expect(new TypeTagAddress().isPrimitive()).toBe(true);
    expect(new TypeTagSigner().isPrimitive()).toBe(true);
    expect(new TypeTagI256().isPrimitive()).toBe(true);
  });

  it("isPrimitive is false for non-primitives", () => {
    expect(new TypeTagVector(new TypeTagU8()).isPrimitive()).toBe(false);
    expect(new TypeTagGeneric(0).isPrimitive()).toBe(false);
  });
});

describe("TypeTagVector", () => {
  it("toString returns vector<type>", () => {
    expect(new TypeTagVector(new TypeTagU8()).toString()).toBe("vector<u8>");
    expect(new TypeTagVector(new TypeTagBool()).toString()).toBe("vector<bool>");
  });

  it("u8() factory creates vector<u8>", () => {
    expect(TypeTagVector.u8().toString()).toBe("vector<u8>");
  });

  it("nested vectors work", () => {
    const nested = new TypeTagVector(new TypeTagVector(new TypeTagU8()));
    expect(nested.toString()).toBe("vector<vector<u8>>");
  });

  it("serializes and deserializes correctly", () => {
    const tag = new TypeTagVector(new TypeTagAddress());
    const serializer = new Serializer();
    tag.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = TypeTag.deserialize(deserializer);
    expect(deserialized.toString()).toBe("vector<address>");
  });
});

describe("TypeTagStruct", () => {
  it("toString returns full module path", () => {
    const structTag = new StructTag(AccountAddress.ONE, new Identifier("aptos_coin"), new Identifier("AptosCoin"), []);
    const typeTag = new TypeTagStruct(structTag);
    expect(typeTag.toString()).toBe("0x1::aptos_coin::AptosCoin");
  });

  it("toString includes type args", () => {
    const structTag = new StructTag(AccountAddress.ONE, new Identifier("option"), new Identifier("Option"), [
      new TypeTagU64(),
    ]);
    const typeTag = new TypeTagStruct(structTag);
    expect(typeTag.toString()).toBe("0x1::option::Option<u64>");
  });

  it("isString/isOption/isObject work correctly", () => {
    const strTag = new TypeTagStruct(stringStructTag());
    expect(strTag.isString()).toBe(true);
    expect(strTag.isOption()).toBe(false);

    const optTag = new TypeTagStruct(optionStructTag(new TypeTagU8()));
    expect(optTag.isOption()).toBe(true);
    expect(optTag.isString()).toBe(false);

    const objTag = new TypeTagStruct(objectStructTag(new TypeTagAddress()));
    expect(objTag.isObject()).toBe(true);
  });

  it("serializes and deserializes correctly", () => {
    const structTag = aptosCoinStructTag();
    const typeTag = new TypeTagStruct(structTag);
    const serializer = new Serializer();
    typeTag.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = TypeTag.deserialize(deserializer) as TypeTagStruct;
    expect(deserialized.toString()).toBe("0x1::aptos_coin::AptosCoin");
  });
});

describe("TypeTagGeneric", () => {
  it("toString returns T<index>", () => {
    expect(new TypeTagGeneric(0).toString()).toBe("T0");
    expect(new TypeTagGeneric(5).toString()).toBe("T5");
  });

  it("throws on negative index", () => {
    expect(() => new TypeTagGeneric(-1)).toThrow("cannot be negative");
  });

  it("serializes and deserializes correctly", () => {
    const tag = new TypeTagGeneric(3);
    const serializer = new Serializer();
    tag.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = TypeTag.deserialize(deserializer) as TypeTagGeneric;
    expect(deserialized.value).toBe(3);
  });
});

describe("TypeTagReference", () => {
  it("toString returns &type", () => {
    expect(new TypeTagReference(new TypeTagSigner()).toString()).toBe("&signer");
  });
});

describe("Identifier", () => {
  it("serializes and deserializes correctly", () => {
    const id = new Identifier("hello");
    const serializer = new Serializer();
    id.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = Identifier.deserialize(deserializer);
    expect(deserialized.identifier).toBe("hello");
  });
});

describe("StructTag", () => {
  it("serializes and deserializes correctly", () => {
    const tag = new StructTag(AccountAddress.ONE, new Identifier("coin"), new Identifier("Coin"), [new TypeTagBool()]);
    const serializer = new Serializer();
    tag.serialize(serializer);
    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserialized = StructTag.deserialize(deserializer);
    expect(deserialized.address.equals(AccountAddress.ONE)).toBe(true);
    expect(deserialized.moduleName.identifier).toBe("coin");
    expect(deserialized.name.identifier).toBe("Coin");
    expect(deserialized.typeArgs.length).toBe(1);
    expect(deserialized.typeArgs[0].toString()).toBe("bool");
  });
});

describe("Factory helpers", () => {
  it("aptosCoinStructTag", () => {
    const tag = aptosCoinStructTag();
    expect(tag.moduleName.identifier).toBe("aptos_coin");
    expect(tag.name.identifier).toBe("AptosCoin");
    expect(tag.address.equals(AccountAddress.ONE)).toBe(true);
  });

  it("stringStructTag", () => {
    const tag = stringStructTag();
    expect(tag.moduleName.identifier).toBe("string");
    expect(tag.name.identifier).toBe("String");
  });

  it("optionStructTag", () => {
    const tag = optionStructTag(new TypeTagU64());
    expect(tag.moduleName.identifier).toBe("option");
    expect(tag.name.identifier).toBe("Option");
    expect(tag.typeArgs.length).toBe(1);
  });

  it("objectStructTag", () => {
    const tag = objectStructTag(new TypeTagAddress());
    expect(tag.moduleName.identifier).toBe("object");
    expect(tag.name.identifier).toBe("Object");
  });
});
