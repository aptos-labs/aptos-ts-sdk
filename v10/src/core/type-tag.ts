import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "./account-address.js";

/** BCS variant indices for each Move type tag kind, used during serialization and deserialization. */
export enum TypeTagVariants {
  Bool = 0,
  U8 = 1,
  U64 = 2,
  U128 = 3,
  Address = 4,
  Signer = 5,
  Vector = 6,
  Struct = 7,
  U16 = 8,
  U32 = 9,
  U256 = 10,
  I8 = 11,
  I16 = 12,
  I32 = 13,
  I64 = 14,
  I128 = 15,
  I256 = 16,
  /** A reference type tag (used internally, not valid in transaction arguments). */
  Reference = 254,
  /** A generic type parameter placeholder (e.g., T0, T1). */
  Generic = 255,
}

const MAX_TYPE_TAG_NESTING = 128;

// ── Identifier (simple BCS string wrapper) ──

/**
 * A BCS-serializable wrapper around a string, used for Move module and struct names.
 */
export class Identifier extends Serializable {
  /** The raw identifier string. */
  public identifier: string;

  /**
   * @param identifier - The identifier string (e.g., a module name or struct name).
   */
  constructor(identifier: string) {
    super();
    this.identifier = identifier;
  }

  public serialize(serializer: Serializer): void {
    serializer.serializeStr(this.identifier);
  }

  /**
   * Deserializes an Identifier from BCS bytes.
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new Identifier instance.
   */
  static deserialize(deserializer: Deserializer): Identifier {
    const identifier = deserializer.deserializeStr();
    return new Identifier(identifier);
  }
}

// ── TypeTag hierarchy ──

/**
 * Abstract base class for all Move type tags.
 *
 * Type tags represent Move types (bool, u8, address, vector, struct, etc.)
 * and are used in transaction building to specify type arguments.
 */
export abstract class TypeTag extends Serializable {
  abstract serialize(serializer: Serializer): void;
  /** Returns the Move string representation of this type tag (e.g., `"bool"`, `"vector<u8>"`). */
  abstract toString(): string;

  /**
   * Deserializes a TypeTag from BCS bytes by reading the variant index and dispatching.
   * @param deserializer - The BCS deserializer to read from.
   * @param depth - Current recursion depth (guards against stack overflow from malicious payloads).
   * @returns The deserialized TypeTag subclass instance.
   */
  static deserialize(deserializer: Deserializer, depth = 0): TypeTag {
    if (depth > MAX_TYPE_TAG_NESTING) {
      throw new Error(`TypeTag deserialization exceeded maximum nesting depth of ${MAX_TYPE_TAG_NESTING}`);
    }
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
        return TypeTagVector.load(deserializer, depth + 1);
      case TypeTagVariants.Struct:
        return TypeTagStruct.load(deserializer, depth + 1);
      case TypeTagVariants.U16:
        return TypeTagU16.load(deserializer);
      case TypeTagVariants.U32:
        return TypeTagU32.load(deserializer);
      case TypeTagVariants.U256:
        return TypeTagU256.load(deserializer);
      case TypeTagVariants.I8:
        return TypeTagI8.load(deserializer);
      case TypeTagVariants.I16:
        return TypeTagI16.load(deserializer);
      case TypeTagVariants.I32:
        return TypeTagI32.load(deserializer);
      case TypeTagVariants.I64:
        return TypeTagI64.load(deserializer);
      case TypeTagVariants.I128:
        return TypeTagI128.load(deserializer);
      case TypeTagVariants.I256:
        return TypeTagI256.load(deserializer);
      case TypeTagVariants.Generic:
        return TypeTagGeneric.load(deserializer);
      default:
        throw new Error(`Unknown variant index for TypeTag: ${index}`);
    }
  }

  /** Type guard: narrows to {@link TypeTagBool}. */
  isBool(): this is TypeTagBool {
    return this instanceof TypeTagBool;
  }
  /** Type guard: narrows to {@link TypeTagAddress}. */
  isAddress(): this is TypeTagAddress {
    return this instanceof TypeTagAddress;
  }
  /** Type guard: narrows to {@link TypeTagGeneric}. */
  isGeneric(): this is TypeTagGeneric {
    return this instanceof TypeTagGeneric;
  }
  /** Type guard: narrows to {@link TypeTagSigner}. */
  isSigner(): this is TypeTagSigner {
    return this instanceof TypeTagSigner;
  }
  /** Type guard: narrows to {@link TypeTagVector}. */
  isVector(): this is TypeTagVector {
    return this instanceof TypeTagVector;
  }
  /** Type guard: narrows to {@link TypeTagStruct}. */
  isStruct(): this is TypeTagStruct {
    return this instanceof TypeTagStruct;
  }
  /** Type guard: narrows to {@link TypeTagU8}. */
  isU8(): this is TypeTagU8 {
    return this instanceof TypeTagU8;
  }
  /** Type guard: narrows to {@link TypeTagU16}. */
  isU16(): this is TypeTagU16 {
    return this instanceof TypeTagU16;
  }
  /** Type guard: narrows to {@link TypeTagU32}. */
  isU32(): this is TypeTagU32 {
    return this instanceof TypeTagU32;
  }
  /** Type guard: narrows to {@link TypeTagU64}. */
  isU64(): this is TypeTagU64 {
    return this instanceof TypeTagU64;
  }
  /** Type guard: narrows to {@link TypeTagU128}. */
  isU128(): this is TypeTagU128 {
    return this instanceof TypeTagU128;
  }
  /** Type guard: narrows to {@link TypeTagU256}. */
  isU256(): this is TypeTagU256 {
    return this instanceof TypeTagU256;
  }
  /** Type guard: narrows to {@link TypeTagI8}. */
  isI8(): this is TypeTagI8 {
    return this instanceof TypeTagI8;
  }
  /** Type guard: narrows to {@link TypeTagI16}. */
  isI16(): this is TypeTagI16 {
    return this instanceof TypeTagI16;
  }
  /** Type guard: narrows to {@link TypeTagI32}. */
  isI32(): this is TypeTagI32 {
    return this instanceof TypeTagI32;
  }
  /** Type guard: narrows to {@link TypeTagI64}. */
  isI64(): this is TypeTagI64 {
    return this instanceof TypeTagI64;
  }
  /** Type guard: narrows to {@link TypeTagI128}. */
  isI128(): this is TypeTagI128 {
    return this instanceof TypeTagI128;
  }
  /** Type guard: narrows to {@link TypeTagI256}. */
  isI256(): this is TypeTagI256 {
    return this instanceof TypeTagI256;
  }

  /** Returns true if this type tag represents a primitive Move type (numeric, bool, address, or signer). */
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
      this instanceof TypeTagU256 ||
      this instanceof TypeTagI8 ||
      this instanceof TypeTagI16 ||
      this instanceof TypeTagI32 ||
      this instanceof TypeTagI64 ||
      this instanceof TypeTagI128 ||
      this instanceof TypeTagI256
    );
  }
}

// ── Primitive TypeTags ──

/** Represents the Move `bool` type. */
export class TypeTagBool extends TypeTag {
  toString(): string {
    return "bool";
  }
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Bool);
  }
  static load(_deserializer: Deserializer): TypeTagBool {
    return new TypeTagBool();
  }
}

/** Represents the Move `u8` type. */
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

/** Represents the Move `i8` type. */
export class TypeTagI8 extends TypeTag {
  toString(): string {
    return "i8";
  }
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.I8);
  }
  static load(_deserializer: Deserializer): TypeTagI8 {
    return new TypeTagI8();
  }
}

/** Represents the Move `u16` type. */
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

/** Represents the Move `i16` type. */
export class TypeTagI16 extends TypeTag {
  toString(): string {
    return "i16";
  }
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.I16);
  }
  static load(_deserializer: Deserializer): TypeTagI16 {
    return new TypeTagI16();
  }
}

/** Represents the Move `u32` type. */
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

/** Represents the Move `i32` type. */
export class TypeTagI32 extends TypeTag {
  toString(): string {
    return "i32";
  }
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.I32);
  }
  static load(_deserializer: Deserializer): TypeTagI32 {
    return new TypeTagI32();
  }
}

/** Represents the Move `u64` type. */
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

/** Represents the Move `i64` type. */
export class TypeTagI64 extends TypeTag {
  toString(): string {
    return "i64";
  }
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.I64);
  }
  static load(_deserializer: Deserializer): TypeTagI64 {
    return new TypeTagI64();
  }
}

/** Represents the Move `u128` type. */
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

/** Represents the Move `i128` type. */
export class TypeTagI128 extends TypeTag {
  toString(): string {
    return "i128";
  }
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.I128);
  }
  static load(_deserializer: Deserializer): TypeTagI128 {
    return new TypeTagI128();
  }
}

/** Represents the Move `u256` type. */
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

/** Represents the Move `i256` type. */
export class TypeTagI256 extends TypeTag {
  toString(): string {
    return "i256";
  }
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.I256);
  }
  static load(_deserializer: Deserializer): TypeTagI256 {
    return new TypeTagI256();
  }
}

/** Represents the Move `address` type. */
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

/** Represents the Move `signer` type. */
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

/** Represents a Move reference type (`&T`). Used internally; not valid in transaction arguments. */
export class TypeTagReference extends TypeTag {
  constructor(public readonly value: TypeTag) {
    super();
  }
  toString(): `&${string}` {
    return `&${this.value.toString()}`;
  }
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Reference);
  }
  static load(deserializer: Deserializer, depth = 0): TypeTagReference {
    const value = TypeTag.deserialize(deserializer, depth);
    return new TypeTagReference(value);
  }
}

/**
 * Represents a generic type parameter placeholder (e.g., T0, T1).
 * Used when building type tags for functions with generic type parameters.
 */
export class TypeTagGeneric extends TypeTag {
  /**
   * @param value - The zero-based index of the generic type parameter.
   * @throws If the index is negative.
   */
  constructor(public readonly value: number) {
    super();
    if (value < 0) throw new Error("Generic type parameter index cannot be negative");
  }
  toString(): `T${number}` {
    return `T${this.value}`;
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

// ── Composite TypeTags ──

/** Represents the Move `vector<T>` type, parameterized by an inner element type tag. */
export class TypeTagVector extends TypeTag {
  /**
   * @param value - The type tag of the vector's element type.
   */
  constructor(public readonly value: TypeTag) {
    super();
  }
  toString(): `vector<${string}>` {
    return `vector<${this.value.toString()}>`;
  }
  /** Convenience factory for `vector<u8>`, commonly used for byte strings. */
  static u8(): TypeTagVector {
    return new TypeTagVector(new TypeTagU8());
  }
  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Vector);
    this.value.serialize(serializer);
  }
  static load(deserializer: Deserializer, depth = 0): TypeTagVector {
    const value = TypeTag.deserialize(deserializer, depth);
    return new TypeTagVector(value);
  }
}

/**
 * Represents a Move struct type (e.g., `0x1::aptos_coin::AptosCoin`).
 * Wraps a {@link StructTag} that holds the address, module, name, and type arguments.
 */
export class TypeTagStruct extends TypeTag {
  /**
   * @param value - The StructTag describing the struct's fully qualified name and type arguments.
   */
  constructor(public readonly value: StructTag) {
    super();
  }

  toString(): `0x${string}::${string}::${string}` {
    let typePredicate = "";
    if (this.value.typeArgs.length > 0) {
      typePredicate = `<${this.value.typeArgs.map((typeArg) => typeArg.toString()).join(", ")}>`;
    }
    return `${this.value.address.toString()}::${this.value.moduleName.identifier}::${this.value.name.identifier}${typePredicate}`;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(TypeTagVariants.Struct);
    this.value.serialize(serializer);
  }

  static load(deserializer: Deserializer, depth = 0): TypeTagStruct {
    const value = StructTag.deserialize(deserializer, depth);
    return new TypeTagStruct(value);
  }

  /**
   * Checks whether this struct type tag matches the given address, module, and struct name.
   * @param address - The module's account address.
   * @param moduleName - The module name.
   * @param structName - The struct name.
   * @returns True if all three components match.
   */
  isTypeTag(address: AccountAddress, moduleName: string, structName: string): boolean {
    return (
      this.value.moduleName.identifier === moduleName &&
      this.value.name.identifier === structName &&
      this.value.address.equals(address)
    );
  }

  /** Returns true if this is the `0x1::string::String` type. */
  isString(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "string", "String");
  }
  /** Returns true if this is the `0x1::option::Option` type. */
  isOption(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "option", "Option");
  }
  /** Returns true if this is the `0x1::object::Object` type. */
  isObject(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "object", "Object");
  }
  /** Returns true if this is the `0x1::permissioned_delegation::DelegationKey` type. */
  isDelegationKey(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "permissioned_delegation", "DelegationKey");
  }
  /** Returns true if this is the `0x1::rate_limiter::RateLimiter` type. */
  isRateLimiter(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "rate_limiter", "RateLimiter");
  }
}

// ── StructTag ──

/**
 * Represents a fully qualified Move struct type: `address::module::StructName<TypeArgs>`.
 *
 * Used inside {@link TypeTagStruct} and for building struct type references
 * in transaction payloads.
 */
export class StructTag extends Serializable {
  /** The account address where the module is published. */
  public readonly address: AccountAddress;
  /** The module name containing the struct. */
  public readonly moduleName: Identifier;
  /** The struct name. */
  public readonly name: Identifier;
  /** The generic type arguments applied to the struct (empty if none). */
  public readonly typeArgs: Array<TypeTag>;

  /**
   * @param address - The account address of the module.
   * @param moduleName - The module name as an Identifier.
   * @param name - The struct name as an Identifier.
   * @param typeArgs - The type arguments applied to the struct.
   */
  constructor(address: AccountAddress, moduleName: Identifier, name: Identifier, typeArgs: Array<TypeTag>) {
    super();
    this.address = address;
    this.moduleName = moduleName;
    this.name = name;
    this.typeArgs = typeArgs;
  }

  serialize(serializer: Serializer): void {
    serializer.serialize(this.address);
    serializer.serialize(this.moduleName);
    serializer.serialize(this.name);
    serializer.serializeVector(this.typeArgs);
  }

  static deserialize(deserializer: Deserializer, depth = 0): StructTag {
    const address = AccountAddress.deserialize(deserializer);
    const moduleName = Identifier.deserialize(deserializer);
    const name = Identifier.deserialize(deserializer);
    const length = deserializer.deserializeUleb128AsU32();
    const typeArgs: TypeTag[] = [];
    for (let i = 0; i < length; i += 1) {
      typeArgs.push(TypeTag.deserialize(deserializer, depth));
    }
    return new StructTag(address, moduleName, name, typeArgs);
  }
}

// ── Factory helpers ──

/**
 * Creates a StructTag for `0x1::aptos_coin::AptosCoin`.
 * @returns The StructTag for the native Aptos coin.
 */
export function aptosCoinStructTag(): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("aptos_coin"), new Identifier("AptosCoin"), []);
}

/**
 * Creates a StructTag for `0x1::string::String`.
 * @returns The StructTag for the Move String type.
 */
export function stringStructTag(): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("string"), new Identifier("String"), []);
}

/**
 * Creates a StructTag for `0x1::option::Option<T>`.
 * @param typeArg - The type tag for the Option's inner type.
 * @returns The StructTag for Option parameterized by the given type.
 */
export function optionStructTag(typeArg: TypeTag): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("option"), new Identifier("Option"), [typeArg]);
}

/**
 * Creates a StructTag for `0x1::object::Object<T>`.
 * @param typeArg - The type tag for the Object's inner type.
 * @returns The StructTag for Object parameterized by the given type.
 */
export function objectStructTag(typeArg: TypeTag): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("object"), new Identifier("Object"), [typeArg]);
}
