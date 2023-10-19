// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  StructTag,
  TypeTagStruct,
  TypeTagU8,
  AccountAddress,
  TypeTagU16,
  TypeTagU32,
  TypeTagU128,
  TypeTagU64,
  TypeTagU256,
  TypeTagBool,
  TypeTagAddress,
  TypeTagVector,
  stringStructTag,
  objectStructTag,
  optionStructTag,
  TypeTag,
} from "../../src";
import { Identifier } from "../../src/transactions/instances";
import { parseTypeTag } from "../../src/transactions/typeTag/typeTagParser";

const MODULE_NAME = new Identifier("tag");
const STRUCT_NAME = new Identifier("Tag");

const structTagType = (typeTags?: Array<TypeTag>) =>
  new TypeTagStruct(new StructTag(AccountAddress.ONE, MODULE_NAME, STRUCT_NAME, typeTags ?? []));

describe("TypeTagParser", () => {
  test("invalid types", () => {
    // Missing 8
    expect(() => parseTypeTag("8")).toThrow();

    // Addr isn't a type
    expect(() => parseTypeTag("addr")).toThrow();

    // No references
    expect(() => parseTypeTag("&address")).toThrow();

    // Standalone generic
    expect(() => parseTypeTag("T1")).toThrow();

    // Not enough colons
    expect(() => parseTypeTag("0x1:tag::Tag")).toThrow();
    expect(() => parseTypeTag("0x1::tag:Tag")).toThrow();

    // Invalid inner type
    expect(() => parseTypeTag("0x1::tag::Tag<8>")).toThrow();

    // Invalid address
    expect(() => parseTypeTag("1::tag::Tag")).toThrow();
    expect(() => parseTypeTag("1::tag::Tag<u8>")).toThrow();

    // Invalid spacing around type arguments
    expect(() => parseTypeTag("0x1::tag::Tag <u8>")).toThrow();

    // Invalid type argument combinations
    expect(() => parseTypeTag("0x1::tag::Tag<<u8>")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<<u8 u8>")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<u8>>")).toThrow();

    // Comma separated arguments not in type arguments
    expect(() => parseTypeTag("u8, u8")).toThrow();
    expect(() => parseTypeTag("u8,u8")).toThrow();
    expect(() => parseTypeTag("u8 ,u8")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<u8>,0x1::tag::Tag")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<u8>, 0x1::tag::Tag")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<u8> ,0x1::tag::Tag")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<u8> , 0x1::tag::Tag")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<u8><u8>")).toThrow();

    // Invalid type tags without arguments
    expect(() => parseTypeTag("0x1::tag::Tag<>")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<,>")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<u8,>")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag< , >")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<u8, >")).toThrow();
  });

  test("standard types", () => {
    expect(parseTypeTag("u8")).toEqual(new TypeTagU8());
    expect(parseTypeTag("u16")).toEqual(new TypeTagU16());
    expect(parseTypeTag("u32")).toEqual(new TypeTagU32());
    expect(parseTypeTag("u64")).toEqual(new TypeTagU64());
    expect(parseTypeTag("u128")).toEqual(new TypeTagU128());
    expect(parseTypeTag("u256")).toEqual(new TypeTagU256());
    expect(parseTypeTag("bool")).toEqual(new TypeTagBool());
    expect(parseTypeTag("address")).toEqual(new TypeTagAddress());
  });

  test("vector", () => {
    expect(parseTypeTag("vector<u8>")).toEqual(new TypeTagVector(new TypeTagU8()));
    expect(parseTypeTag("vector<u16>")).toEqual(new TypeTagVector(new TypeTagU16()));
    expect(parseTypeTag("vector<u32>")).toEqual(new TypeTagVector(new TypeTagU32()));
    expect(parseTypeTag("vector<u64>")).toEqual(new TypeTagVector(new TypeTagU64()));
    expect(parseTypeTag("vector<u128>")).toEqual(new TypeTagVector(new TypeTagU128()));
    expect(parseTypeTag("vector<u256>")).toEqual(new TypeTagVector(new TypeTagU256()));
    expect(parseTypeTag("vector<bool>")).toEqual(new TypeTagVector(new TypeTagBool()));
    expect(parseTypeTag("vector<address>")).toEqual(new TypeTagVector(new TypeTagAddress()));
    expect(parseTypeTag("vector<0x1::string::String>")).toEqual(
      new TypeTagVector(new TypeTagStruct(stringStructTag())),
    );
  });

  test("nested vector", () => {
    expect(parseTypeTag("vector<vector<u8>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU8())));
    expect(parseTypeTag("vector<vector<u16>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU16())));
    expect(parseTypeTag("vector<vector<u32>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU32())));
    expect(parseTypeTag("vector<vector<u64>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU64())));
    expect(parseTypeTag("vector<vector<u128>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU128())));
    expect(parseTypeTag("vector<vector<u256>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU256())));
    expect(parseTypeTag("vector<vector<bool>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagBool())));
    expect(parseTypeTag("vector<vector<address>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagAddress())));
    expect(parseTypeTag("vector<vector<0x1::string::String>>")).toEqual(
      new TypeTagVector(new TypeTagVector(new TypeTagStruct(stringStructTag()))),
    );
  });

  test("string", () => {
    expect(parseTypeTag("0x1::string::String")).toEqual(new TypeTagStruct(stringStructTag()));
  });

  test("object", () => {
    expect(parseTypeTag("0x1::object::Object<0x1::tag::Tag>")).toEqual(
      new TypeTagStruct(objectStructTag(structTagType())),
    );
    expect(parseTypeTag("0x1::object::Object<0x1::tag::Tag<u8>>")).toEqual(
      new TypeTagStruct(objectStructTag(structTagType([new TypeTagU8()]))),
    );
  });

  test("option", () => {
    expect(parseTypeTag("0x1::option::Option<0x1::tag::Tag>")).toEqual(
      new TypeTagStruct(optionStructTag(structTagType())),
    );
    expect(parseTypeTag("0x1::option::Option<0x1::tag::Tag<u8>>")).toEqual(
      new TypeTagStruct(optionStructTag(structTagType([new TypeTagU8()]))),
    );
  });

  test("0x1::tag::Tag", () => {
    expect(parseTypeTag("0x1::tag::Tag")).toEqual(structTagType());
  });

  test("0x1::tag::Tag<u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8>")).toEqual(structTagType([new TypeTagU8()]));
  });

  test("0x1::tag::Tag<u8,u64>", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8,u64>")).toEqual(structTagType([new TypeTagU8(), new TypeTagU64()]));
  });

  test("0x1::tag::Tag<u8,  u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8,  u8>")).toEqual(structTagType([new TypeTagU8(), new TypeTagU8()]));
  });

  test("0x1::tag::Tag<  u8,u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<  u8,u8>")).toEqual(structTagType([new TypeTagU8(), new TypeTagU8()]));
  });

  test("0x1::tag::Tag<u8,u8  >", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8,u8  >")).toEqual(structTagType([new TypeTagU8(), new TypeTagU8()]));
  });

  test("0x1::tag::Tag<0x1::tag::Tag<u8>>", () => {
    expect(parseTypeTag("0x1::tag::Tag<0x1::tag::Tag<u8>>")).toEqual(structTagType([structTagType([new TypeTagU8()])]));
  });

  test("0x1::tag::Tag<0x1::tag::Tag<u8, u8>>", () => {
    expect(parseTypeTag("0x1::tag::Tag<0x1::tag::Tag<u8, u8>>")).toEqual(
      structTagType([structTagType([new TypeTagU8(), new TypeTagU8()])]),
    );
  });

  test("0x1::tag::Tag<u8, 0x1::tag::Tag<u8>>", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8, 0x1::tag::Tag<u8>>")).toEqual(
      structTagType([new TypeTagU8(), structTagType([new TypeTagU8()])]),
    );
  });

  test("0x1::tag::Tag<0x1::tag::Tag<u8>, u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<0x1::tag::Tag<u8>, u8>")).toEqual(
      structTagType([structTagType([new TypeTagU8()]), new TypeTagU8()]),
    );
  });

  test("0x1::tag::Tag<0x1::tag::Tag<0x1::tag::Tag<u8>>, u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<0x1::tag::Tag<0x1::tag::Tag<u8>>, u8>")).toEqual(
      structTagType([structTagType([structTagType([new TypeTagU8()])]), new TypeTagU8()]),
    );
  });

  /* These are debatable on whether they are valid or not */
  test.skip("edge case invalid types", () => {
    // TODO: Do we care about this one?

    expect(() => parseTypeTag("0x1::tag::Tag< , u8>")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<,u8>")).toThrow();
  });

  /* These need to be supported for ABI parsing */
  test.skip("struct with generic", () => {
    expect(parseTypeTag("0x1::tag::Tag<T1>")).toEqual(structTagType());
  });
});
