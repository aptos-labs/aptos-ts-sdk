// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, Hex } from "../../core/index.js";
import { HexInput, MoveAbility } from "../../types/index.js";
import { Identifier } from "../instances/identifier.js";
import {
  StructTag,
  TypeTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagGeneric,
  TypeTagI128,
  TypeTagI16,
  TypeTagI256,
  TypeTagI32,
  TypeTagI64,
  TypeTagI8,
  TypeTagReference,
  TypeTagSigner,
  TypeTagStruct,
  TypeTagU128,
  TypeTagU16,
  TypeTagU256,
  TypeTagU32,
  TypeTagU64,
  TypeTagU8,
  TypeTagVector,
} from "../typeTag/index.js";
import type { ScriptABI } from "../types.js";

const MOVE_MAGIC = [0xa1, 0x1c, 0xeb, 0x0b] as const;
const APTOS_BYTECODE_VERSION_MASK = 0x0a000000;
const MIN_BYTECODE_VERSION = 1;
const MAX_BYTECODE_VERSION = 10;

const TABLE_INDEX_MAX = 65535;
const TABLE_COUNT_MAX = 255;
const TYPE_PARAMETER_COUNT_MAX = 255;
const TYPE_PARAMETER_INDEX_MAX = 65536;
const SIGNATURE_SIZE_MAX = 255;
const SIGNATURE_TOKEN_DEPTH_MAX = 256;
const ABILITY_SET_MAX = 15;

// biome-ignore lint/suspicious/noConstEnum: Mirrors the bytecode format constants without emitting runtime objects.
const enum TableType {
  ModuleHandles = 0x1,
  StructHandles = 0x2,
  FunctionHandles = 0x3,
  FunctionInstantiations = 0x4,
  Signatures = 0x5,
  ConstantPool = 0x6,
  Identifiers = 0x7,
  AddressIdentifiers = 0x8,
  StructDefinitions = 0xa,
  StructDefinitionInstantiations = 0xb,
  FunctionDefinitions = 0xc,
  FieldHandles = 0xd,
  FieldInstantiations = 0xe,
  FriendDeclarations = 0xf,
  Metadata = 0x10,
  VariantFieldHandles = 0x11,
  VariantFieldInstantiations = 0x12,
  StructVariantHandles = 0x13,
  StructVariantInstantiations = 0x14,
}

// biome-ignore lint/suspicious/noConstEnum: Mirrors the bytecode format constants without emitting runtime objects.
const enum SerializedType {
  Bool = 0x1,
  U8 = 0x2,
  U64 = 0x3,
  U128 = 0x4,
  Address = 0x5,
  Reference = 0x6,
  MutableReference = 0x7,
  Struct = 0x8,
  TypeParameter = 0x9,
  Vector = 0xa,
  StructInstantiation = 0xb,
  Signer = 0xc,
  U16 = 0xd,
  U32 = 0xe,
  U256 = 0xf,
  Function = 0x10,
  I8 = 0x11,
  I16 = 0x12,
  I32 = 0x13,
  I64 = 0x14,
  I128 = 0x15,
  I256 = 0x16,
}

type TableHeader = {
  kind: TableType;
  offset: number;
  byteLength: number;
};

type ModuleHandle = {
  address: number;
  name: number;
};

type StructHandle = {
  module: number;
  name: number;
  typeParameterCount: number;
};

type SignatureToken =
  | { kind: "bool" }
  | { kind: "u8" }
  | { kind: "u16" }
  | { kind: "u32" }
  | { kind: "u64" }
  | { kind: "u128" }
  | { kind: "u256" }
  | { kind: "i8" }
  | { kind: "i16" }
  | { kind: "i32" }
  | { kind: "i64" }
  | { kind: "i128" }
  | { kind: "i256" }
  | { kind: "address" }
  | { kind: "signer" }
  | { kind: "vector"; value: SignatureToken }
  | { kind: "struct"; index: number; typeArguments: SignatureToken[] }
  | { kind: "reference"; mutable: boolean; value: SignatureToken }
  | { kind: "typeParameter"; index: number }
  | { kind: "function"; arguments: SignatureToken[]; results: SignatureToken[] };

function invalidScript(reason: string): never {
  throw new Error(`Invalid script bytecode: ${reason}`);
}

class ScriptBytecodeReader {
  private cursor: number;

  constructor(
    private readonly bytes: Uint8Array,
    private readonly start = 0,
    private readonly end = bytes.length,
  ) {
    this.cursor = start;
  }

  get position(): number {
    return this.cursor - this.start;
  }

  get remaining(): number {
    return this.end - this.cursor;
  }

  readU8(label: string): number {
    if (this.remaining < 1) {
      invalidScript(`unexpected end of input while reading ${label}`);
    }
    const value = this.bytes[this.cursor];
    this.cursor += 1;
    return value;
  }

  readU32(label: string): number {
    const bytes = this.readBytes(4, label);
    return bytes[0] + bytes[1] * 256 + bytes[2] * 256 ** 2 + bytes[3] * 256 ** 3;
  }

  readUleb128(label: string, max: number): number {
    let value = 0;
    for (let byteIndex = 0; byteIndex < 5; byteIndex += 1) {
      const byte = this.readU8(label);
      const group = byte % 128;
      value += group * 128 ** byteIndex;

      if (byte < 128) {
        if (byteIndex > 0 && group === 0) {
          invalidScript(`non-canonical ULEB128 encoding for ${label}`);
        }
        if (value > max) {
          invalidScript(`${label} ${value} exceeds maximum ${max}`);
        }
        return value;
      }
    }
    invalidScript(`ULEB128 encoding for ${label} continues after five bytes`);
  }

  readBytes(length: number, label: string): Uint8Array {
    if (!Number.isSafeInteger(length) || length < 0 || length > this.remaining) {
      invalidScript(`unexpected end of input while reading ${label}`);
    }
    const value = this.bytes.subarray(this.cursor, this.cursor + length);
    this.cursor += length;
    return value;
  }

  subReader(offset: number, length: number, label: string): ScriptBytecodeReader {
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(length) ||
      offset < 0 ||
      length < 0 ||
      offset > this.remaining ||
      length > this.remaining - offset
    ) {
      invalidScript(`${label} is outside the available byte range`);
    }
    const subStart = this.cursor + offset;
    return new ScriptBytecodeReader(this.bytes, subStart, subStart + length);
  }
}

function parseTableType(value: number): TableType {
  switch (value) {
    case TableType.ModuleHandles:
    case TableType.StructHandles:
    case TableType.FunctionHandles:
    case TableType.FunctionInstantiations:
    case TableType.Signatures:
    case TableType.ConstantPool:
    case TableType.Identifiers:
    case TableType.AddressIdentifiers:
    case TableType.Metadata:
      return value;
    case TableType.StructDefinitions:
    case TableType.StructDefinitionInstantiations:
    case TableType.FunctionDefinitions:
    case TableType.FieldHandles:
    case TableType.FieldInstantiations:
    case TableType.FriendDeclarations:
    case TableType.VariantFieldHandles:
    case TableType.VariantFieldInstantiations:
    case TableType.StructVariantHandles:
    case TableType.StructVariantInstantiations:
      return invalidScript(`table type ${value} is not valid in a script`);
    default:
      return invalidScript(`unknown table type ${value}`);
  }
}

function parseTableHeaders(reader: ScriptBytecodeReader): { headers: TableHeader[]; contentLength: number } {
  const tableCount = reader.readUleb128("table count", TABLE_COUNT_MAX);
  const headers: TableHeader[] = [];
  const kinds = new Set<TableType>();

  for (let index = 0; index < tableCount; index += 1) {
    const kind = parseTableType(reader.readU8(`table ${index} kind`));
    if (kinds.has(kind)) {
      invalidScript(`duplicate table type ${kind}`);
    }
    kinds.add(kind);
    headers.push({
      kind,
      offset: reader.readUleb128(`table ${index} offset`, 0xffffffff),
      byteLength: reader.readUleb128(`table ${index} byte length`, 0xffffffff),
    });
  }

  headers.sort((left, right) => left.offset - right.offset);
  let contentLength = 0;
  for (const header of headers) {
    if (header.offset !== contentLength || header.byteLength === 0) {
      invalidScript("table ranges must be contiguous, non-empty, and begin at offset zero");
    }
    contentLength += header.byteLength;
    if (!Number.isSafeInteger(contentLength) || contentLength > reader.remaining) {
      invalidScript("table ranges exceed the available bytecode");
    }
  }

  return { headers, contentLength };
}

function tableReader(
  tableContents: ScriptBytecodeReader,
  headers: TableHeader[],
  kind: TableType,
): ScriptBytecodeReader | undefined {
  const header = headers.find((candidate) => candidate.kind === kind);
  return header === undefined
    ? undefined
    : tableContents.subReader(header.offset, header.byteLength, `table type ${kind}`);
}

function parseEntries<T>(reader: ScriptBytecodeReader | undefined, parse: (entry: ScriptBytecodeReader) => T): T[] {
  if (reader === undefined) {
    return [];
  }
  const entries: T[] = [];
  while (reader.remaining > 0) {
    entries.push(parse(reader));
  }
  return entries;
}

function parseIdentifiers(reader: ScriptBytecodeReader | undefined): string[] {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return parseEntries(reader, (entry) => {
    const length = entry.readUleb128("identifier length", TABLE_INDEX_MAX);
    const bytes = entry.readBytes(length, "identifier");
    try {
      return decoder.decode(bytes);
    } catch {
      invalidScript("identifier is not valid UTF-8");
    }
  });
}

function parseAddresses(reader: ScriptBytecodeReader | undefined): Uint8Array[] {
  return parseEntries(reader, (entry) => entry.readBytes(AccountAddress.LENGTH, "address identifier"));
}

function parseModuleHandles(reader: ScriptBytecodeReader | undefined): ModuleHandle[] {
  return parseEntries(reader, (entry) => ({
    address: entry.readUleb128("module handle address index", TABLE_INDEX_MAX),
    name: entry.readUleb128("module handle name index", TABLE_INDEX_MAX),
  }));
}

function readVersionedAbilitySet(
  reader: ScriptBytecodeReader,
  version: number,
  position: "functionTypeParameter" | "structTypeParameter" | "structHandle",
): number {
  if (version >= 2) {
    return reader.readUleb128("ability set", ABILITY_SET_MAX);
  }

  const legacyValue = reader.readU8("legacy ability");
  if (position === "structHandle") {
    if (legacyValue === 1) return 4 | 8;
    if (legacyValue === 2) return 1 | 2 | 4;
    invalidScript(`unknown legacy struct ability ${legacyValue}`);
  }

  let abilities: number;
  switch (legacyValue) {
    case 1:
      abilities = 0;
      break;
    case 2:
      abilities = 1 | 2;
      break;
    case 3:
      abilities = 8;
      break;
    default:
      invalidScript(`unknown legacy type parameter ability ${legacyValue}`);
  }
  return position === "functionTypeParameter" ? abilities | 4 : abilities;
}

function parseStructHandles(reader: ScriptBytecodeReader | undefined, version: number): StructHandle[] {
  return parseEntries(reader, (entry) => {
    const module = entry.readUleb128("struct handle module index", TABLE_INDEX_MAX);
    const name = entry.readUleb128("struct handle name index", TABLE_INDEX_MAX);
    readVersionedAbilitySet(entry, version, "structHandle");
    const typeParameterCount = entry.readUleb128("struct type parameter count", TYPE_PARAMETER_COUNT_MAX);
    for (let index = 0; index < typeParameterCount; index += 1) {
      readVersionedAbilitySet(entry, version, "structTypeParameter");
      if (version >= 3) {
        entry.readUleb128(`struct type parameter ${index} phantom flag`, 1);
      }
    }
    return { module, name, typeParameterCount };
  });
}

function parseSignatureToken(reader: ScriptBytecodeReader, version: number, depth = 1): SignatureToken {
  if (depth > SIGNATURE_TOKEN_DEPTH_MAX) {
    invalidScript(`signature token nesting exceeds ${SIGNATURE_TOKEN_DEPTH_MAX}`);
  }

  const serializedType = reader.readU8("signature token");
  switch (serializedType) {
    case SerializedType.Bool:
      return { kind: "bool" };
    case SerializedType.U8:
      return { kind: "u8" };
    case SerializedType.U64:
      return { kind: "u64" };
    case SerializedType.U128:
      return { kind: "u128" };
    case SerializedType.Address:
      return { kind: "address" };
    case SerializedType.Reference:
    case SerializedType.MutableReference:
      return {
        kind: "reference",
        mutable: serializedType === SerializedType.MutableReference,
        value: parseSignatureToken(reader, version, depth + 1),
      };
    case SerializedType.Struct:
      return {
        kind: "struct",
        index: reader.readUleb128("struct handle index", TABLE_INDEX_MAX),
        typeArguments: [],
      };
    case SerializedType.TypeParameter:
      return {
        kind: "typeParameter",
        index: reader.readUleb128("type parameter index", TYPE_PARAMETER_INDEX_MAX),
      };
    case SerializedType.Vector:
      return { kind: "vector", value: parseSignatureToken(reader, version, depth + 1) };
    case SerializedType.StructInstantiation: {
      const index = reader.readUleb128("struct handle index", TABLE_INDEX_MAX);
      const count = reader.readUleb128("struct instantiation arity", TYPE_PARAMETER_COUNT_MAX);
      if (count === 0) {
        invalidScript("struct instantiation has zero type arguments");
      }
      const typeArguments = Array.from({ length: count }, () => parseSignatureToken(reader, version, depth + 1));
      return { kind: "struct", index, typeArguments };
    }
    case SerializedType.Signer:
      return { kind: "signer" };
    case SerializedType.U16:
    case SerializedType.U32:
    case SerializedType.U256:
      if (version < 6) {
        invalidScript(`integer signature token ${serializedType} is not supported in version ${version}`);
      }
      if (serializedType === SerializedType.U16) return { kind: "u16" };
      if (serializedType === SerializedType.U32) return { kind: "u32" };
      return { kind: "u256" };
    case SerializedType.Function: {
      if (version < 8) {
        invalidScript(`function signature tokens are not supported in version ${version}`);
      }
      readVersionedAbilitySet(reader, version, "structTypeParameter");
      const argumentCount = reader.readUleb128("function argument count", TYPE_PARAMETER_COUNT_MAX);
      const resultCount = reader.readUleb128("function result count", TYPE_PARAMETER_COUNT_MAX);
      const arguments_ = Array.from({ length: argumentCount }, () => parseSignatureToken(reader, version, depth + 1));
      const results = Array.from({ length: resultCount }, () => parseSignatureToken(reader, version, depth + 1));
      return { kind: "function", arguments: arguments_, results };
    }
    case SerializedType.I8:
    case SerializedType.I16:
    case SerializedType.I32:
    case SerializedType.I64:
    case SerializedType.I128:
    case SerializedType.I256:
      if (version < 9) {
        invalidScript(`signed integer signature token ${serializedType} is not supported in version ${version}`);
      }
      switch (serializedType) {
        case SerializedType.I8:
          return { kind: "i8" };
        case SerializedType.I16:
          return { kind: "i16" };
        case SerializedType.I32:
          return { kind: "i32" };
        case SerializedType.I64:
          return { kind: "i64" };
        case SerializedType.I128:
          return { kind: "i128" };
        default:
          return { kind: "i256" };
      }
    default:
      invalidScript(`unknown signature token ${serializedType}`);
  }
}

function parseSignatures(reader: ScriptBytecodeReader | undefined, version: number): SignatureToken[][] {
  return parseEntries(reader, (entry) => {
    const count = entry.readUleb128("signature length", SIGNATURE_SIZE_MAX);
    return Array.from({ length: count }, () => parseSignatureToken(entry, version));
  });
}

function decodeAbilities(bits: number): MoveAbility[] {
  const abilities: MoveAbility[] = [];
  if ((bits & 1) !== 0) abilities.push(MoveAbility.COPY);
  if ((bits & 2) !== 0) abilities.push(MoveAbility.DROP);
  if ((bits & 4) !== 0) abilities.push(MoveAbility.STORE);
  if ((bits & 8) !== 0) abilities.push(MoveAbility.KEY);
  return abilities;
}

function indexed<T>(values: T[], index: number, label: string): T {
  const value = values[index];
  if (value === undefined) {
    invalidScript(`${label} index ${index} does not exist`);
  }
  return value;
}

function resolveSignatureToken(
  token: SignatureToken,
  typeParameterCount: number,
  structHandles: StructHandle[],
  moduleHandles: ModuleHandle[],
  identifiers: string[],
  addresses: Uint8Array[],
): TypeTag {
  switch (token.kind) {
    case "bool":
      return new TypeTagBool();
    case "u8":
      return new TypeTagU8();
    case "u16":
      return new TypeTagU16();
    case "u32":
      return new TypeTagU32();
    case "u64":
      return new TypeTagU64();
    case "u128":
      return new TypeTagU128();
    case "u256":
      return new TypeTagU256();
    case "i8":
      return new TypeTagI8();
    case "i16":
      return new TypeTagI16();
    case "i32":
      return new TypeTagI32();
    case "i64":
      return new TypeTagI64();
    case "i128":
      return new TypeTagI128();
    case "i256":
      return new TypeTagI256();
    case "address":
      return new TypeTagAddress();
    case "signer":
      return new TypeTagSigner();
    case "vector":
      return new TypeTagVector(
        resolveSignatureToken(token.value, typeParameterCount, structHandles, moduleHandles, identifiers, addresses),
      );
    case "reference":
      return new TypeTagReference(
        resolveSignatureToken(token.value, typeParameterCount, structHandles, moduleHandles, identifiers, addresses),
      );
    case "typeParameter":
      if (token.index >= typeParameterCount) {
        invalidScript(`type parameter index ${token.index} does not exist`);
      }
      return new TypeTagGeneric(token.index);
    case "struct": {
      const structHandle = indexed(structHandles, token.index, "struct handle");
      if (token.typeArguments.length !== structHandle.typeParameterCount) {
        invalidScript(
          `struct handle index ${token.index} expects ${structHandle.typeParameterCount} type arguments, received ${token.typeArguments.length}`,
        );
      }
      const moduleHandle = indexed(moduleHandles, structHandle.module, "module handle");
      const address = indexed(addresses, moduleHandle.address, "address");
      const moduleName = indexed(identifiers, moduleHandle.name, "identifier");
      const structName = indexed(identifiers, structHandle.name, "identifier");
      const typeArguments = token.typeArguments.map((argument) =>
        resolveSignatureToken(argument, typeParameterCount, structHandles, moduleHandles, identifiers, addresses),
      );
      return new TypeTagStruct(
        new StructTag(
          new AccountAddress(address),
          new Identifier(moduleName),
          new Identifier(structName),
          typeArguments,
        ),
      );
    }
    case "function":
      return invalidScript("function signature tokens cannot be represented as TypeTag values");
    default:
      return invalidScript("unknown signature token");
  }
}

function isSignerToken(token: SignatureToken): boolean {
  return token.kind === "signer" || (token.kind === "reference" && token.value.kind === "signer");
}

/**
 * Extracts a transaction script's type parameters and parameter types from compiled Move bytecode.
 *
 * @param bytecode - Compiled Move script bytecode.
 * @returns The script ABI needed to prepare caller-supplied arguments.
 */
export function parseScriptAbi(bytecode: HexInput): ScriptABI {
  let bytes: Uint8Array;
  try {
    bytes = Hex.hexInputToUint8Array(bytecode);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    invalidScript(`invalid hex input: ${reason}`);
  }

  const reader = new ScriptBytecodeReader(bytes);
  const magic = reader.readBytes(MOVE_MAGIC.length, "magic");
  if (!MOVE_MAGIC.every((value, index) => magic[index] === value)) {
    invalidScript("incorrect magic bytes");
  }

  const encodedVersion = reader.readU32("bytecode version");
  const version = encodedVersion & ~APTOS_BYTECODE_VERSION_MASK;
  if (version < MIN_BYTECODE_VERSION || version > MAX_BYTECODE_VERSION) {
    invalidScript(`bytecode version ${version} is not supported`);
  }

  const { headers, contentLength } = parseTableHeaders(reader);
  const tableContents = reader.subReader(0, contentLength, "table contents");
  reader.readBytes(contentLength, "table contents");

  const identifiers = parseIdentifiers(tableReader(tableContents, headers, TableType.Identifiers));
  const addresses = parseAddresses(tableReader(tableContents, headers, TableType.AddressIdentifiers));
  const moduleHandles = parseModuleHandles(tableReader(tableContents, headers, TableType.ModuleHandles));
  const structHandles = parseStructHandles(tableReader(tableContents, headers, TableType.StructHandles), version);
  const signatures = parseSignatures(tableReader(tableContents, headers, TableType.Signatures), version);

  const typeParameterCount = reader.readUleb128("script type parameter count", TYPE_PARAMETER_COUNT_MAX);
  const typeParameters = Array.from({ length: typeParameterCount }, () => ({
    constraints: decodeAbilities(readVersionedAbilitySet(reader, version, "functionTypeParameter")),
  }));
  const parameterSignatureIndex = reader.readUleb128("parameter signature index", TABLE_INDEX_MAX);
  const parameterTokens = indexed(signatures, parameterSignatureIndex, "parameter signature");

  let signers = 0;
  while (signers < parameterTokens.length && isSignerToken(parameterTokens[signers])) {
    signers += 1;
  }
  const parameters = parameterTokens
    .slice(signers)
    .map((token) =>
      resolveSignatureToken(token, typeParameterCount, structHandles, moduleHandles, identifiers, addresses),
    );

  return { typeParameters, parameters, signers };
}
