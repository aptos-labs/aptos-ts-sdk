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

/**
 * Represents a type tag in the serialization framework, serving as a base class for various specific type tags.
 * This class provides methods for serialization and deserialization of type tags, as well as type checking methods
 * to determine the specific type of the tag at runtime.
 *
 * @extends Serializable
 * @group Implementation
 * @category Transactions
 */
export abstract class TypeTag extends Serializable {
  abstract serialize(serializer: Serializer): void;

  /**
   * Deserializes a StructTag from the provided deserializer.
   * This function allows you to reconstruct a StructTag object from its serialized form.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Transactions
   */
  deserialize(deserializer: Deserializer): StructTag {
    const address = AccountAddress.deserialize(deserializer);
    const moduleName = Identifier.deserialize(deserializer);
    const name = Identifier.deserialize(deserializer);
    const typeArgs = deserializer.deserializeVector(TypeTag);
    return new StructTag(address, moduleName, name, typeArgs);
  }

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

  abstract toString(): string;

  /**
   * Determines if the current instance is of type TypeTagBool.
   *
   * @returns {boolean} True if the instance is a TypeTagBool, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isBool(): this is TypeTagBool {
    return this instanceof TypeTagBool;
  }

  /**
   * Determines if the current instance is of type TypeTagAddress.
   *
   * @returns {boolean} True if the instance is a TypeTagAddress, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isAddress(): this is TypeTagAddress {
    return this instanceof TypeTagAddress;
  }

  /**
   * Determines if the current instance is of type TypeTagGeneric.
   *
   * @returns {boolean} Returns true if the instance is a TypeTagGeneric, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isGeneric(): this is TypeTagGeneric {
    return this instanceof TypeTagGeneric;
  }

  /**
   * Determine if the current instance is a TypeTagSigner.
   *
   * @returns {boolean} Returns true if the instance is a TypeTagSigner, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isSigner(): this is TypeTagSigner {
    return this instanceof TypeTagSigner;
  }

  /**
   * Checks if the current instance is a vector type.
   * This can help determine the specific type of data structure being used.
   *
   * @returns {boolean} True if the instance is of type TypeTagVector, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isVector(): this is TypeTagVector {
    return this instanceof TypeTagVector;
  }

  /**
   * Determines if the current instance is a structure type.
   *
   * @returns {boolean} True if the instance is of type TypeTagStruct, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isStruct(): this is TypeTagStruct {
    return this instanceof TypeTagStruct;
  }

  /**
   * Determines if the current instance is of type `TypeTagU8`.
   *
   * @returns {boolean} Returns true if the instance is of type `TypeTagU8`, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isU8(): this is TypeTagU8 {
    return this instanceof TypeTagU8;
  }

  /**
   * Checks if the current instance is of type TypeTagU16.
   *
   * @returns {boolean} True if the instance is TypeTagU16, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isU16(): this is TypeTagU16 {
    return this instanceof TypeTagU16;
  }

  /**
   * Checks if the current instance is of type TypeTagU32.
   *
   * @returns {boolean} Returns true if the instance is TypeTagU32, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isU32(): this is TypeTagU32 {
    return this instanceof TypeTagU32;
  }

  /**
   * Checks if the current instance is of type TypeTagU64.
   *
   * @returns {boolean} True if the instance is a TypeTagU64, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isU64(): this is TypeTagU64 {
    return this instanceof TypeTagU64;
  }

  /**
   * Determines if the current instance is of the TypeTagU128 type.
   *
   * @returns {boolean} True if the instance is of TypeTagU128, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isU128(): this is TypeTagU128 {
    return this instanceof TypeTagU128;
  }

  /**
   * Checks if the current instance is of type TypeTagU256.
   *
   * @returns {boolean} Returns true if the instance is of type TypeTagU256, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isU256(): this is TypeTagU256 {
    return this instanceof TypeTagU256;
  }

  isPrimitive(): boolean {
    return (
      this instanceof TypeTagSigner ||
      this instanceof TypeTagAddress ||
      this instanceof TypeTagBool ||
      this instanceof TypeTagU8 ||
      this instanceof TypeTagU16 ||
      this instanceof TypeTagU32 ||
      this instanceof TypeTagU64 ||
      this instanceof TypeTagU128 ||
      this instanceof TypeTagU256
    );
  }
}

/**
 * Represents a boolean type tag in the type system.
 * This class extends the base TypeTag class and provides
 * methods for serialization and deserialization of the boolean
 * type tag.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagBool extends TypeTag {
  /**
   * Returns the string representation of the object.
   *
   * @returns {string} The string representation of the object.
   * @group Implementation
   * @category Transactions
   */
  toString(): string {
    return "bool";
  }

  /**
   * Serializes the current instance's properties into a provided serializer.
   * This function ensures that the address, module name, name, and type arguments are properly serialized.
   *
   * @param serializer - The serializer instance used to serialize the properties.
   * @group Implementation
   * @category Transactions
   */
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Bool);
  }

  /**
   * Deserializes a StructTag and returns a new TypeTagStruct instance.
   *
   * @param _deserializer - The deserializer used to read the StructTag data.
   * @group Implementation
   * @category Transactions
   */
  static load(_deserializer: Deserializer): TypeTagBool {
    return new TypeTagBool();
  }
}

/**
 * Represents a type tag for an 8-bit unsigned integer (u8).
 * This class extends the base TypeTag class and provides methods
 * for serialization and deserialization specific to the u8 type.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagU8 extends TypeTag {
  toString(): string {
    return "u8";
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U8);
  }

  static load(_deserializer: Deserializer): TypeTagU8 {
    return new TypeTagU8();
  }
}

/**
 * Represents a type tag for unsigned 16-bit integers (u16).
 * This class extends the base TypeTag class and provides methods for serialization and deserialization.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagU16 extends TypeTag {
  toString(): string {
    return "u16";
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U16);
  }

  static load(_deserializer: Deserializer): TypeTagU16 {
    return new TypeTagU16();
  }
}

/**
 * Represents a type tag for a 32-bit unsigned integer (u32).
 * This class extends the base TypeTag class and provides methods for serialization
 * and deserialization specific to the u32 type.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagU32 extends TypeTag {
  toString(): string {
    return "u32";
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U32);
  }

  static load(_deserializer: Deserializer): TypeTagU32 {
    return new TypeTagU32();
  }
}

/**
 * Represents a type tag for 64-bit unsigned integers (u64).
 * This class extends the base TypeTag class and provides methods for serialization and deserialization.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagU64 extends TypeTag {
  toString(): string {
    return "u64";
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U64);
  }

  static load(_deserializer: Deserializer): TypeTagU64 {
    return new TypeTagU64();
  }
}

/**
 * Represents a type tag for the u128 data type.
 * This class extends the base TypeTag class and provides methods for serialization and deserialization.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagU128 extends TypeTag {
  toString(): string {
    return "u128";
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U128);
  }

  static load(_deserializer: Deserializer): TypeTagU128 {
    return new TypeTagU128();
  }
}

/**
 * Represents a type tag for the U256 data type.
 * This class extends the base TypeTag class and provides methods for serialization and deserialization.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagU256 extends TypeTag {
  toString(): string {
    return "u256";
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.U256);
  }

  static load(_deserializer: Deserializer): TypeTagU256 {
    return new TypeTagU256();
  }
}

/**
 * Represents a type tag for an address in the system.
 * This class extends the TypeTag class and provides functionality
 * to serialize the address type and load it from a deserializer.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagAddress extends TypeTag {
  toString(): string {
    return "address";
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Address);
  }

  static load(_deserializer: Deserializer): TypeTagAddress {
    return new TypeTagAddress();
  }
}

/**
 * Represents a type tag for a signer in the system.
 * This class extends the base TypeTag and provides specific functionality
 * related to the signer type.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagSigner extends TypeTag {
  toString(): string {
    return "signer";
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Signer);
  }

  static load(_deserializer: Deserializer): TypeTagSigner {
    return new TypeTagSigner();
  }
}

/**
 * Represents a reference to a type tag in the type system.
 * This class extends the TypeTag class and provides functionality
 * to serialize and deserialize type tag references.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagReference extends TypeTag {
  toString(): `&${string}` {
    return `&${this.value.toString()}`;
  }

  /**
   * Initializes a new instance of the class with the specified parameters.
   *
   * @param value - The TypeTag to reference.
   * @group Implementation
   * @category Transactions
   */
  constructor(public readonly value: TypeTag) {
    super();
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Reference);
  }

  static load(deserializer: Deserializer): TypeTagReference {
    const value = TypeTag.deserialize(deserializer);
    return new TypeTagReference(value);
  }
}

/**
 * Represents a generic type tag used for type parameters in entry functions.
 * Generics are not serialized into a real type, so they cannot be used as a type directly.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagGeneric extends TypeTag {
  toString(): `T${number}` {
    return `T${this.value}`;
  }

  constructor(public readonly value: number) {
    super();
    if (value < 0) throw new Error("Generic type parameter index cannot be negative");
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

/**
 * Represents a vector type tag, which encapsulates a single type tag value.
 * This class extends the base TypeTag class and provides methods for serialization,
 * deserialization, and string representation of the vector type tag.
 *
 * @extends TypeTag
 * @group Implementation
 * @category Transactions
 */
export class TypeTagVector extends TypeTag {
  toString(): `vector<${string}>` {
    return `vector<${this.value.toString()}>`;
  }

  constructor(public readonly value: TypeTag) {
    super();
  }

  /**
   * Creates a new TypeTagVector instance with a TypeTagU8 type.
   *
   * @returns {TypeTagVector} A new TypeTagVector initialized with TypeTagU8.
   * @group Implementation
   * @category Transactions
   */
  static u8(): TypeTagVector {
    return new TypeTagVector(new TypeTagU8());
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

/**
 * Represents a structured type tag in the system, extending the base TypeTag class.
 * This class encapsulates information about a specific structure, including its address,
 * module name, and type arguments, and provides methods for serialization and type checking.
 *
 * @param value - The StructTag instance containing the details of the structured type.
 * @group Implementation
 * @category Transactions
 */
export class TypeTagStruct extends TypeTag {
  toString(): `0x${string}::${string}::${string}` {
    // Collect type args and add it if there are any
    let typePredicate = "";
    if (this.value.typeArgs.length > 0) {
      typePredicate = `<${this.value.typeArgs.map((typeArg) => typeArg.toString()).join(", ")}>`;
    }

    return `${this.value.address.toString()}::${this.value.moduleName.identifier}::${
      this.value.name.identifier
    }${typePredicate}`;
  }

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
   * Determines if the provided address, module name, and struct name match the current type tag.
   *
   * @param address - The account address to compare against the type tag.
   * @param moduleName - The name of the module to compare against the type tag.
   * @param structName - The name of the struct to compare against the type tag.
   * @returns True if the address, module name, and struct name match the type tag; otherwise, false.
   * @group Implementation
   * @category Transactions
   */
  isTypeTag(address: AccountAddress, moduleName: string, structName: string): boolean {
    return (
      this.value.moduleName.identifier === moduleName &&
      this.value.name.identifier === structName &&
      this.value.address.equals(address)
    );
  }

  /**
   * Checks if the provided value is of type string.
   * This function can help ensure that the data being processed is in the correct format before further operations.
   *
   * @returns {boolean} Returns true if the value is a string, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isString(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "string", "String");
  }

  /**
   * Checks if the specified account address is of type "option".
   *
   * @returns {boolean} Returns true if the account address is an option type, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isOption(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "option", "Option");
  }

  /**
   * Checks if the provided value is of type 'object'.
   * This function helps determine if a value can be treated as an object type in the context of the SDK.
   *
   * @returns {boolean} Returns true if the value is an object, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isObject(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "object", "Object");
  }

  /**
   * Checks if the provided value is a 'DelegationKey' for permissioned signers.
   *
   * @returns {boolean} Returns true if the value is a DelegationKey, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isDelegationKey(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "permissioned_delegation", "DelegationKey");
  }

  /**
   * Checks if the provided value is of type `RateLimiter`.
   *
   * @returns {boolean} Returns true if the value is a RateLimiter, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isRateLimiter(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "rate_limiter", "RateLimiter");
  }
}

/**
 * Represents a structured tag that includes an address, module name,
 * name, and type arguments. This class is used to define and manage
 * structured data types within the SDK.
 *
 * @property {AccountAddress} address - The address associated with the struct tag.
 * @property {Identifier} moduleName - The name of the module that contains the struct.
 * @property {Identifier} name - The name of the struct.
 * @property {Array<TypeTag>} typeArgs - An array of type arguments associated with the struct.
 * @group Implementation
 * @category Transactions
 */
export class StructTag extends Serializable {
  public readonly address: AccountAddress;

  public readonly moduleName: Identifier;

  public readonly name: Identifier;

  public readonly typeArgs: Array<TypeTag>;

  constructor(address: AccountAddress, module_name: Identifier, name: Identifier, type_args: Array<TypeTag>) {
    super();
    this.address = address;
    this.moduleName = module_name;
    this.name = name;
    this.typeArgs = type_args;
  }

  serialize(serializer: Serializer): void {
    serializer.serialize(this.address);
    serializer.serialize(this.moduleName);
    serializer.serialize(this.name);
    serializer.serializeVector(this.typeArgs);
  }

  static deserialize(deserializer: Deserializer): StructTag {
    const address = AccountAddress.deserialize(deserializer);
    const moduleName = Identifier.deserialize(deserializer);
    const name = Identifier.deserialize(deserializer);
    const typeArgs = deserializer.deserializeVector(TypeTag);
    return new StructTag(address, moduleName, name, typeArgs);
  }
}

/**
 * Retrieves the StructTag for the AptosCoin, which represents the Aptos Coin in the Aptos blockchain.
 *
 * @returns {StructTag} The StructTag for the AptosCoin.
 * @group Implementation
 * @category Transactions
 */
export function aptosCoinStructTag(): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("aptos_coin"), new Identifier("AptosCoin"), []);
}

/**
 * Returns a new StructTag representing a string type.
 *
 * @returns {StructTag} A StructTag for the string type.
 * @group Implementation
 * @category Transactions
 */
export function stringStructTag(): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("string"), new Identifier("String"), []);
}

/**
 * Creates a new StructTag for the Option type with the specified type argument.
 * This can help in defining a specific instance of an Option type in your application.
 *
 * @param typeArg - The type tag that specifies the type of the value contained in the Option.
 * @group Implementation
 * @category Transactions
 */
export function optionStructTag(typeArg: TypeTag): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("option"), new Identifier("Option"), [typeArg]);
}

/**
 * Creates a new StructTag for the Object type with the specified type argument.
 * This function helps in defining a structured representation of an Object with a specific type.
 *
 * @param typeArg - The type tag that specifies the type of the Object.
 * @group Implementation
 * @category Transactions
 */
export function objectStructTag(typeArg: TypeTag): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("object"), new Identifier("Object"), [typeArg]);
}
