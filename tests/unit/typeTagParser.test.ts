// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddress,
  objectStructTag,
  optionStructTag,
  parseTypeTag,
  stringStructTag,
  StructTag,
  TypeTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagGeneric,
  TypeTagSigner,
  TypeTagStruct,
  TypeTagU128,
  TypeTagU16,
  TypeTagU256,
  TypeTagU32,
  TypeTagU64,
  TypeTagU8,
  TypeTagVector,
  TypeTagParserError,
  TypeTagParserErrorType,
  TypeTagReference,
  aptosCoinStructTag,
  Identifier,
  APTOS_COIN,
} from "../../src";

const TAG_STRUCT_NAME = "0x1::tag::Tag";

const MODULE_NAME = new Identifier("tag");
const STRUCT_NAME = new Identifier("Tag");

const structTagType = (typeTags?: Array<TypeTag>) =>
  new TypeTagStruct(new StructTag(AccountAddress.ONE, MODULE_NAME, STRUCT_NAME, typeTags ?? []));

const typeTagParserError = (str: string, errorType: TypeTagParserErrorType, subStr?: string) => {
  expect(() => parseTypeTag(str)).toThrow(new TypeTagParserError(subStr ?? str, errorType));
};

/**
 * These types are primitives, and we ignore casing on them
 */
const primitives = [
  { str: "signer", type: new TypeTagSigner() },
  { str: "address", type: new TypeTagAddress() },
  { str: "bool", type: new TypeTagBool() },
  { str: "u8", type: new TypeTagU8() },
  { str: "u16", type: new TypeTagU16() },
  { str: "u32", type: new TypeTagU32() },
  { str: "u64", type: new TypeTagU64() },
  { str: "u128", type: new TypeTagU128() },
  { str: "u256", type: new TypeTagU256() },
];

/**
 * Known struct types without inner arguments
 */
const structTypes = [
  { str: "0x1::string::String", type: new TypeTagStruct(stringStructTag()) },
  { str: APTOS_COIN, type: new TypeTagStruct(aptosCoinStructTag()) },
  { str: "0x1::option::Option<u8>", type: new TypeTagStruct(optionStructTag(new TypeTagU8())) },
  { str: "0x1::object::Object<u8>", type: new TypeTagStruct(objectStructTag(new TypeTagU8())) },
  { str: TAG_STRUCT_NAME, type: structTagType() },
  { str: `${TAG_STRUCT_NAME}<u8>`, type: structTagType([new TypeTagU8()]) },
  { str: `${TAG_STRUCT_NAME}<u8, u8>`, type: structTagType([new TypeTagU8(), new TypeTagU8()]) },
  { str: `${TAG_STRUCT_NAME}<u64, u8>`, type: structTagType([new TypeTagU64(), new TypeTagU8()]) },
  {
    str: `${TAG_STRUCT_NAME}<${TAG_STRUCT_NAME}<u8>, u8>`,
    type: structTagType([structTagType([new TypeTagU8()]), new TypeTagU8()]),
  },
  {
    str: `${TAG_STRUCT_NAME}<u8, ${TAG_STRUCT_NAME}<u8>>`,
    type: structTagType([new TypeTagU8(), structTagType([new TypeTagU8()])]),
  },
];

/**
 * Some examples with generics
 */
const generics = [
  { str: "T0", type: new TypeTagGeneric(0) },
  { str: "T1", type: new TypeTagGeneric(1) },
  { str: "T1337", type: new TypeTagGeneric(1337) },
  { str: `${TAG_STRUCT_NAME}<T0>`, type: structTagType([new TypeTagGeneric(0)]) },
  { str: `${TAG_STRUCT_NAME}<T0, T1>`, type: structTagType([new TypeTagGeneric(0), new TypeTagGeneric(1)]) },
];

/**
 * These types have no inner types
 */
const combinedTypes = [...primitives, ...structTypes];
const combinedTypesWithGeneric = [...primitives, ...structTypes, ...generics];

describe("TypeTagParser", () => {
  test("invalid types", () => {
    // Missing 8
    typeTagParserError("8", TypeTagParserErrorType.InvalidTypeTag);

    // Addr isn't a type
    typeTagParserError("addr", TypeTagParserErrorType.InvalidTypeTag);

    // Standalone generic (with allow generics off)
    typeTagParserError("T1", TypeTagParserErrorType.UnexpectedGenericType);

    // Not enough colons
    typeTagParserError("0x1:tag::Tag", TypeTagParserErrorType.UnexpectedStructFormat);
    typeTagParserError("0x1::tag:Tag", TypeTagParserErrorType.UnexpectedStructFormat);

    // Invalid inner type
    typeTagParserError("0x1::tag::Tag<8>", TypeTagParserErrorType.InvalidTypeTag, "8");

    // Invalid address
    // TODO: We may want to consider a more friendly address message
    // TODO: Do we want to be specific on 0x input for address
    // expect(() => parseTypeTag("1::tag::Tag")).toThrow("Hex string must start with a leading 0x.");
    // expect(() => parseTypeTag("1::tag::Tag<u8>")).toThrow("Hex string must start with a leading 0x.");

    // Invalid spacing around type arguments
    typeTagParserError("0x1::tag::Tag <u8>", TypeTagParserErrorType.UnexpectedWhitespaceCharacter);

    // Invalid type argument combinations
    typeTagParserError("0x1::tag::Tag<<u8>", TypeTagParserErrorType.MissingTypeArgumentClose);
    typeTagParserError("0x1::tag::Tag<<u8 u8>", TypeTagParserErrorType.UnexpectedWhitespaceCharacter);
    typeTagParserError("0x1::tag::Tag<u8>>", TypeTagParserErrorType.UnexpectedTypeArgumentClose);

    // Comma separated arguments not in type arguments
    typeTagParserError("u8, u8", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("u8,u8", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("u8 ,u8", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("0x1::tag::Tag<u8>,0x1::tag::Tag", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("0x1::tag::Tag<u8>, 0x1::tag::Tag", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("0x1::tag::Tag<u8> ,0x1::tag::Tag", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("0x1::tag::Tag<u8> , 0x1::tag::Tag", TypeTagParserErrorType.UnexpectedComma);

    typeTagParserError("0x1::tag::Tag<u8<u8>>", TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments, "u8");

    // TODO: These errors are not clear
    typeTagParserError("0x1::tag::Tag<u8><u8>", TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments, "u8");
    typeTagParserError("0x1<u8>::tag::Tag<u8>", TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments, "u8");
    typeTagParserError("0x1::tag<u8>::Tag<u8>", TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments, "u8");

    // Invalid type tags without arguments
    // TODO: Message could be clearer
    typeTagParserError("0x1::tag::Tag<>", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag<,>", TypeTagParserErrorType.MissingTypeArgument);
    typeTagParserError("0x1::tag::Tag<, >", TypeTagParserErrorType.MissingTypeArgument);
    typeTagParserError("0x1::tag::Tag< ,>", TypeTagParserErrorType.MissingTypeArgument);
    typeTagParserError("0x1::tag::Tag< , >", TypeTagParserErrorType.MissingTypeArgument);
    typeTagParserError("0x1::tag::Tag<u8,>", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag<0x1::tag::Tag<>>>", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag<0x1::tag::Tag<u8,>>>", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag<0x1::tag::Tag<,u8>>>", TypeTagParserErrorType.MissingTypeArgument);
    typeTagParserError("0x1::tag::Tag<,u8>", TypeTagParserErrorType.MissingTypeArgument);
  });

  test("invalid struct types", () => {
    expect(() => parseTypeTag("notAnAddress::tag::Tag<u8>")).toThrow(TypeTagParserErrorType.InvalidAddress);
    expect(() => parseTypeTag("0x1::not-a-module::Tag<u8>")).toThrow(TypeTagParserErrorType.InvalidModuleNameCharacter);
    expect(() => parseTypeTag("0x1::tag::Not-A-Name<u8>")).toThrow(TypeTagParserErrorType.InvalidStructNameCharacter);
  });

  test("standard types", () => {
    for (let i = 0; i < combinedTypes.length; i += 1) {
      const combinedType = combinedTypes[i];
      expect(parseTypeTag(combinedType.str)).toEqual(combinedType.type);
      expect(parseTypeTag(` ${combinedType.str}`)).toEqual(combinedType.type);
      expect(parseTypeTag(`${combinedType.str} `)).toEqual(combinedType.type);
      expect(parseTypeTag(` ${combinedType.str} `)).toEqual(combinedType.type);
    }
  });

  test("capitalized primitive types", () => {
    for (let i = 0; i < primitives.length; i += 1) {
      const primitive = primitives[i];
      expect(parseTypeTag(primitive.str.toUpperCase())).toEqual(primitive.type);
    }
  });

  test("reference types", () => {
    for (let i = 0; i < combinedTypes.length; i += 1) {
      const combinedType = combinedTypes[i];
      expect(parseTypeTag(`&${combinedType.str}`)).toEqual(new TypeTagReference(combinedType.type));
    }
  });

  test("generic types with allow generics on", () => {
    for (let i = 0; i < combinedTypesWithGeneric.length; i += 1) {
      const combinedType = combinedTypesWithGeneric[i];
      expect(parseTypeTag(combinedType.str, { allowGenerics: true })).toEqual(combinedType.type);
      expect(parseTypeTag(`&${combinedType.str}`, { allowGenerics: true })).toEqual(
        new TypeTagReference(combinedType.type),
      );
      expect(parseTypeTag(`vector<${combinedType.str}>`, { allowGenerics: true })).toEqual(
        new TypeTagVector(combinedType.type),
      );
      expect(parseTypeTag(`0x1::tag::Tag<${combinedType.str}, ${combinedType.str}>`, { allowGenerics: true })).toEqual(
        structTagType([combinedType.type, combinedType.type]),
      );
    }
  });

  test("vector", () => {
    for (let i = 0; i < combinedTypes.length; i += 1) {
      const combinedType = combinedTypes[i];
      expect(parseTypeTag(`vector<${combinedType.str}>`)).toEqual(new TypeTagVector(combinedType.type));
      expect(parseTypeTag(`vector< ${combinedType.str}>`)).toEqual(new TypeTagVector(combinedType.type));
      expect(parseTypeTag(`vector<${combinedType.str} >`)).toEqual(new TypeTagVector(combinedType.type));
      expect(parseTypeTag(`vector< ${combinedType.str} >`)).toEqual(new TypeTagVector(combinedType.type));
    }
  });

  test("nested vector", () => {
    for (let i = 0; i < combinedTypes.length; i += 1) {
      const combinedType = combinedTypes[i];
      expect(parseTypeTag(`vector<vector<${combinedType.str}>>`)).toEqual(
        new TypeTagVector(new TypeTagVector(combinedType.type)),
      );
    }
  });

  test("object", () => {
    // TODO: Do we block primitives from object type?  Technically it isn't possible
    for (let i = 0; i < structTypes.length; i += 1) {
      const structType = structTypes[i];
      expect(parseTypeTag(`0x1::object::Object<${structType.str}>`)).toEqual(
        new TypeTagStruct(objectStructTag(structType.type)),
      );
    }
  });

  test("option", () => {
    for (let i = 0; i < combinedTypes.length; i += 1) {
      const combinedType = combinedTypes[i];
      expect(parseTypeTag(`0x1::option::Option<${combinedType.str}>`)).toEqual(
        new TypeTagStruct(optionStructTag(combinedType.type)),
      );
    }
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

  test("Invalid type args", () => {
    for (let i = 0; i < primitives.length; i += 1) {
      const primitiveType = primitives[i];
      expect(() => parseTypeTag(`${primitiveType.str}<u8>`)).toThrow(
        TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments,
      );
    }
    // TODO: This could be a better message
    expect(() => parseTypeTag("vector<>")).toThrow(TypeTagParserErrorType.TypeArgumentCountMismatch);
    expect(() => parseTypeTag("vector<u8, u8>")).toThrow(TypeTagParserErrorType.UnexpectedVectorTypeArgumentCount);
  });

  /* These are debatable on whether they are valid or not */
  test("edge case invalid types", () => {
    expect(() => parseTypeTag("0x1::tag::Tag< , u8>")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<,u8>")).toThrow();
  });
});
