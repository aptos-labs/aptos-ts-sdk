import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "./account-address.js";

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
  Reference = 254,
  Generic = 255,
}

// ── Identifier (simple BCS string wrapper) ──

export class Identifier extends Serializable {
  public identifier: string;

  constructor(identifier: string) {
    super();
    this.identifier = identifier;
  }

  public serialize(serializer: Serializer): void {
    serializer.serializeStr(this.identifier);
  }

  static deserialize(deserializer: Deserializer): Identifier {
    const identifier = deserializer.deserializeStr();
    return new Identifier(identifier);
  }
}

// ── TypeTag hierarchy ──

export abstract class TypeTag extends Serializable {
  abstract serialize(serializer: Serializer): void;
  abstract toString(): string;

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

  isBool(): this is TypeTagBool {
    return this instanceof TypeTagBool;
  }
  isAddress(): this is TypeTagAddress {
    return this instanceof TypeTagAddress;
  }
  isGeneric(): this is TypeTagGeneric {
    return this instanceof TypeTagGeneric;
  }
  isSigner(): this is TypeTagSigner {
    return this instanceof TypeTagSigner;
  }
  isVector(): this is TypeTagVector {
    return this instanceof TypeTagVector;
  }
  isStruct(): this is TypeTagStruct {
    return this instanceof TypeTagStruct;
  }
  isU8(): this is TypeTagU8 {
    return this instanceof TypeTagU8;
  }
  isU16(): this is TypeTagU16 {
    return this instanceof TypeTagU16;
  }
  isU32(): this is TypeTagU32 {
    return this instanceof TypeTagU32;
  }
  isU64(): this is TypeTagU64 {
    return this instanceof TypeTagU64;
  }
  isU128(): this is TypeTagU128 {
    return this instanceof TypeTagU128;
  }
  isU256(): this is TypeTagU256 {
    return this instanceof TypeTagU256;
  }
  isI8(): this is TypeTagI8 {
    return this instanceof TypeTagI8;
  }
  isI16(): this is TypeTagI16 {
    return this instanceof TypeTagI16;
  }
  isI32(): this is TypeTagI32 {
    return this instanceof TypeTagI32;
  }
  isI64(): this is TypeTagI64 {
    return this instanceof TypeTagI64;
  }
  isI128(): this is TypeTagI128 {
    return this instanceof TypeTagI128;
  }
  isI256(): this is TypeTagI256 {
    return this instanceof TypeTagI256;
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
  static load(deserializer: Deserializer): TypeTagReference {
    const value = TypeTag.deserialize(deserializer);
    return new TypeTagReference(value);
  }
}

export class TypeTagGeneric extends TypeTag {
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

export class TypeTagVector extends TypeTag {
  constructor(public readonly value: TypeTag) {
    super();
  }
  toString(): `vector<${string}>` {
    return `vector<${this.value.toString()}>`;
  }
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

export class TypeTagStruct extends TypeTag {
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

  static load(deserializer: Deserializer): TypeTagStruct {
    const value = StructTag.deserialize(deserializer);
    return new TypeTagStruct(value);
  }

  isTypeTag(address: AccountAddress, moduleName: string, structName: string): boolean {
    return (
      this.value.moduleName.identifier === moduleName &&
      this.value.name.identifier === structName &&
      this.value.address.equals(address)
    );
  }

  isString(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "string", "String");
  }
  isOption(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "option", "Option");
  }
  isObject(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "object", "Object");
  }
  isDelegationKey(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "permissioned_delegation", "DelegationKey");
  }
  isRateLimiter(): boolean {
    return this.isTypeTag(AccountAddress.ONE, "rate_limiter", "RateLimiter");
  }
}

// ── StructTag ──

export class StructTag extends Serializable {
  public readonly address: AccountAddress;
  public readonly moduleName: Identifier;
  public readonly name: Identifier;
  public readonly typeArgs: Array<TypeTag>;

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

  static deserialize(deserializer: Deserializer): StructTag {
    const address = AccountAddress.deserialize(deserializer);
    const moduleName = Identifier.deserialize(deserializer);
    const name = Identifier.deserialize(deserializer);
    const typeArgs = deserializer.deserializeVector(TypeTag);
    return new StructTag(address, moduleName, name, typeArgs);
  }
}

// ── Factory helpers ──

export function aptosCoinStructTag(): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("aptos_coin"), new Identifier("AptosCoin"), []);
}

export function stringStructTag(): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("string"), new Identifier("String"), []);
}

export function optionStructTag(typeArg: TypeTag): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("option"), new Identifier("Option"), [typeArg]);
}

export function objectStructTag(typeArg: TypeTag): StructTag {
  return new StructTag(AccountAddress.ONE, new Identifier("object"), new Identifier("Object"), [typeArg]);
}
