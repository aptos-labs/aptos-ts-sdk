// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";
import { AccountAddress } from "../../core";
import { Identifier } from "../instances/identifier";
import { TypeTagVariants } from "../../types";

export abstract class TypeTag extends Serializable {
  abstract serialize(serializer: Serializer): void;

  static deserialize(deserializer: Deserializer): TypeTag {
    const index = deserializer.deserializeUleb128AsU32();
    switch (index) {
      case TypeTagVariants.Bool:
        return TypeTagBool.load(deserializer);
      case TypeTagVariants.U8:
        return TypeTagU8.load(deserializer);
      case TypeTagVariants.U64:
        return TypeTagU64.load(deserializer);
      case TypeTagVariants.U128:
        return TypeTagU128.load(deserializer);
      case TypeTagVariants.Address:
        return TypeTagAddress.load(deserializer);
      case TypeTagVariants.Signer:
        return TypeTagSigner.load(deserializer);
      case TypeTagVariants.Vector:
        return TypeTagVector.load(deserializer);
      case TypeTagVariants.Struct:
        return TypeTagStruct.load(deserializer);
      case TypeTagVariants.U16:
        return TypeTagU16.load(deserializer);
      case TypeTagVariants.U32:
        return TypeTagU32.load(deserializer);
      case TypeTagVariants.U256:
        return TypeTagU256.load(deserializer);
      case TypeTagVariants.Generic:
        // This is only used for ABI representation, and cannot actually be used as a type.
        return TypeTagGeneric.load(deserializer);
      default:
        throw new Error(`Unknown variant index for TypeTag: ${index}`);
    }
  }
}

export class TypeTagBool extends TypeTag {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Bool);
  }

  static load(_deserializer: Deserializer): TypeTagBool {
    return new TypeTagBool();
  }
}

export class TypeTagU8 extends TypeTag {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U8);
  }

  static load(_deserializer: Deserializer): TypeTagU8 {
    return new TypeTagU8();
  }
}

export class TypeTagU16 extends TypeTag {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U16);
  }

  static load(_deserializer: Deserializer): TypeTagU16 {
    return new TypeTagU16();
  }
}

export class TypeTagU32 extends TypeTag {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U32);
  }

  static load(_deserializer: Deserializer): TypeTagU32 {
    return new TypeTagU32();
  }
}

export class TypeTagU64 extends TypeTag {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U64);
  }

  static load(_deserializer: Deserializer): TypeTagU64 {
    return new TypeTagU64();
  }
}

export class TypeTagU128 extends TypeTag {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U128);
  }

  static load(_deserializer: Deserializer): TypeTagU128 {
    return new TypeTagU128();
  }
}

export class TypeTagU256 extends TypeTag {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U256);
  }

  static load(_deserializer: Deserializer): TypeTagU256 {
    return new TypeTagU256();
  }
}

export class TypeTagAddress extends TypeTag {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Address);
  }

  static load(_deserializer: Deserializer): TypeTagAddress {
    return new TypeTagAddress();
  }
}

export class TypeTagSigner extends TypeTag {
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Signer);
  }

  static load(_deserializer: Deserializer): TypeTagSigner {
    return new TypeTagSigner();
  }
}

/**
 * Generics are used for type parameters in entry functions.  However,
 * they are not actually serialized into a real type, so they cannot be
 * used as a type directly.
 */
export class TypeTagGeneric extends TypeTag {
  constructor(public readonly value: number) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Generic);
    serializer.serializeU32(this.value);
  }

  static load(deserializer: Deserializer): TypeTagGeneric {
    const value = deserializer.deserializeU32();
    return new TypeTagGeneric(value);
  }
}

export class TypeTagVector extends TypeTag {
  constructor(public readonly value: TypeTag) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Vector);
    this.value.serialize(serializer);
  }

  static load(deserializer: Deserializer): TypeTagVector {
    const value = TypeTag.deserialize(deserializer);
    return new TypeTagVector(value);
  }
}

export class TypeTagStruct extends TypeTag {
  constructor(public readonly value: StructTag) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Struct);
    this.value.serialize(serializer);
  }

  static load(deserializer: Deserializer): TypeTagStruct {
    const value = StructTag.deserialize(deserializer);
    return new TypeTagStruct(value);
  }

  /**
   * This function checks if the TypeTagStruct is a Move String TypeTag.
   * In Move, a string is represented as the String struct from string.move, deployed at `0x1`,
   * meaning it has the following properties:
   * - address: 0x1
   * - module_name: "string"
   * - name: "String"
   *
   * @returns true if the StructTag is a String type tag, false otherwise
   */
  isStringTypeTag(): boolean {
    return (
      this.value.module_name.identifier === "string" &&
      this.value.name.identifier === "String" &&
      this.value.address.toString() === AccountAddress.ONE.toString()
    );
  }
}

export class StructTag extends Serializable {
  public readonly address: AccountAddress;

  public readonly module_name: Identifier;

  public readonly name: Identifier;

  public readonly type_args: Array<TypeTag>;

  constructor(address: AccountAddress, module_name: Identifier, name: Identifier, type_args: Array<TypeTag>) {
    super();
    this.address = address;
    this.module_name = module_name;
    this.name = name;
    this.type_args = type_args;
  }

  serialize(serializer: Serializer): void {
    serializer.serialize(this.address);
    serializer.serialize(this.module_name);
    serializer.serialize(this.name);
    serializer.serializeVector(this.type_args);
  }

  static deserialize(deserializer: Deserializer): StructTag {
    const address = AccountAddress.deserialize(deserializer);
    const moduleName = Identifier.deserialize(deserializer);
    const name = Identifier.deserialize(deserializer);
    const typeArgs = deserializer.deserializeVector(TypeTag);
    return new StructTag(address, moduleName, name, typeArgs);
  }
}

export const stringStructTag = () =>
  new StructTag(AccountAddress.ONE, new Identifier("string"), new Identifier("String"), []);

export function optionStructTag(typeArg: TypeTag): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("option"), new Identifier("Option"), [typeArg]);
}

export function objectStructTag(typeArg: TypeTag): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("object"), new Identifier("Object"), [typeArg]);
}
