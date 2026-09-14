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
const ACCESS_SPECIFIER_COUNT_MAX = 64;
const ATTRIBUTE_COUNT_MAX = 16;
const BYTECODE_COUNT_MAX = 65535;

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

type FunctionHandle = {
  module: number;
  name: number;
  parameters: number;
  returns: number;
  typeParameterCount: number;
  accessReferences: AccessReference[];
};

type FunctionInstantiation = {
  handle: number;
  typeParameters: number;
};

type AccessReference =
  | { kind: "address"; index: number }
  | { kind: "module"; index: number }
  | { kind: "struct"; index: number }
  | { kind: "signature"; index: number }
  | { kind: "functionInstantiation"; index: number };

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

  readU16(label: string): number {
    const bytes = this.readBytes(2, label);
    return bytes[0] + bytes[1] * 256;
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

  readUleb128U64(label: string): void {
    for (let byteIndex = 0; byteIndex < 10; byteIndex += 1) {
      const byte = this.readU8(label);
      const group = byte % 128;
      if (byteIndex === 9 && group > 1) {
        invalidScript(`${label} exceeds maximum u64`);
      }
      if (byte < 128) {
        if (byteIndex > 0 && group === 0) {
          invalidScript(`non-canonical ULEB128 encoding for ${label}`);
        }
        return;
      }
    }
    invalidScript(`ULEB128 encoding for ${label} continues after ten bytes`);
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

function isMoveIdentifierCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  return (
    character === "_" ||
    character === "$" ||
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  );
}

/**
 * Mirrors Move's bytecode-level identifier rules, including the legacy script self name and
 * compiler-generated `<SELF>_N` names. `$` is reserved for compiler/runtime names and is only
 * encoded by Aptos bytecode version 9 or newer.
 */
function isValidMoveIdentifier(identifier: string, version: number): boolean {
  if (identifier === " ") return true;
  if (identifier.startsWith("<SELF>_")) {
    const suffix = identifier.slice(7);
    return suffix.length > 0 && Array.from(suffix).every((character) => character >= "0" && character <= "9");
  }
  if (identifier.length === 0 || (version < 9 && identifier.includes("$"))) return false;

  const characters = Array.from(identifier);
  const first = characters[0];
  const firstCode = first.charCodeAt(0);
  const startsWithLetter = (firstCode >= 65 && firstCode <= 90) || (firstCode >= 97 && firstCode <= 122);
  if (!startsWithLetter && first !== "_" && first !== "$") return false;
  if ((first === "_" || first === "$") && characters.length === 1) return false;
  return characters.slice(1).every(isMoveIdentifierCharacter);
}

function parseIdentifiers(reader: ScriptBytecodeReader | undefined, version: number): string[] {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return parseEntries(reader, (entry) => {
    const length = entry.readUleb128("identifier length", TABLE_INDEX_MAX);
    const bytes = entry.readBytes(length, "identifier");
    if (bytes.some((byte) => byte > 0x7f)) {
      invalidScript("identifier bytes must be ASCII");
    }
    let identifier: string;
    try {
      identifier = decoder.decode(bytes);
    } catch {
      invalidScript("identifier is not valid UTF-8");
    }
    if (!isValidMoveIdentifier(identifier, version)) {
      if (version < 9 && identifier.includes("$")) {
        invalidScript(`$ in identifiers is not supported in bytecode version ${version}`);
      }
      invalidScript(`invalid identifier '${identifier}'`);
    }
    return identifier;
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

function parseAccessSpecifiers(reader: ScriptBytecodeReader): AccessReference[] {
  const option = reader.readU8("access specifier option");
  if (option === 1) return [];
  if (option !== 2) {
    invalidScript(`unknown access specifier option ${option}`);
  }

  const references: AccessReference[] = [];
  const count = reader.readUleb128("access specifier count", ACCESS_SPECIFIER_COUNT_MAX);
  for (let index = 0; index < count; index += 1) {
    const kind = reader.readU8(`access specifier ${index} kind`);
    if (kind !== 1 && kind !== 2) {
      invalidScript(`unknown access specifier kind ${kind}`);
    }
    const negated = reader.readU8(`access specifier ${index} negated flag`);
    if (negated !== 1 && negated !== 2) {
      invalidScript(`unknown access specifier boolean ${negated}`);
    }

    const resource = reader.readU8(`access specifier ${index} resource`);
    switch (resource) {
      case 1:
        break;
      case 2:
        references.push({
          kind: "address",
          index: reader.readUleb128("access specifier address index", TABLE_INDEX_MAX),
        });
        break;
      case 3:
        references.push({
          kind: "module",
          index: reader.readUleb128("access specifier module index", TABLE_INDEX_MAX),
        });
        break;
      case 4:
        references.push({
          kind: "struct",
          index: reader.readUleb128("access specifier struct index", TABLE_INDEX_MAX),
        });
        break;
      case 5:
        references.push({
          kind: "struct",
          index: reader.readUleb128("access specifier struct index", TABLE_INDEX_MAX),
        });
        references.push({
          kind: "signature",
          index: reader.readUleb128("access specifier signature index", TABLE_INDEX_MAX),
        });
        break;
      default:
        invalidScript(`unknown access specifier resource ${resource}`);
    }

    const address = reader.readU8(`access specifier ${index} address`);
    switch (address) {
      case 1:
        break;
      case 2:
        references.push({
          kind: "address",
          index: reader.readUleb128("access specifier literal address index", TABLE_INDEX_MAX),
        });
        break;
      case 3: {
        reader.readUleb128("access specifier parameter index", 255);
        const functionOption = reader.readU8("access specifier function option");
        if (functionOption === 2) {
          references.push({
            kind: "functionInstantiation",
            index: reader.readUleb128("access specifier function instantiation index", TABLE_INDEX_MAX),
          });
        } else if (functionOption !== 1) {
          invalidScript(`unknown access specifier function option ${functionOption}`);
        }
        break;
      }
      default:
        invalidScript(`unknown access specifier address ${address}`);
    }
  }
  return references;
}

function parseFunctionAttributes(reader: ScriptBytecodeReader, version: number): void {
  if (version < 8) return;
  const count = reader.readUleb128("function attribute count", ATTRIBUTE_COUNT_MAX);
  for (let index = 0; index < count; index += 1) {
    const attribute = reader.readU8(`function attribute ${index}`);
    if (attribute < 1 || attribute > 9) {
      invalidScript(`unknown function attribute ${attribute}`);
    }
    if (attribute >= 3 && version < 10) {
      invalidScript(`function attribute ${attribute} is not supported in version ${version}`);
    }
    if (attribute === 4 || (attribute >= 6 && attribute <= 9)) {
      reader.readU16(`function attribute ${index} operand`);
    }
  }
}

function parseFunctionHandles(reader: ScriptBytecodeReader | undefined, version: number): FunctionHandle[] {
  return parseEntries(reader, (entry) => {
    const module = entry.readUleb128("function handle module index", TABLE_INDEX_MAX);
    const name = entry.readUleb128("function handle name index", TABLE_INDEX_MAX);
    const parameters = entry.readUleb128("function handle parameter signature index", TABLE_INDEX_MAX);
    const returns = entry.readUleb128("function handle return signature index", TABLE_INDEX_MAX);
    const typeParameterCount = entry.readUleb128("function type parameter count", TYPE_PARAMETER_COUNT_MAX);
    for (let index = 0; index < typeParameterCount; index += 1) {
      readVersionedAbilitySet(entry, version, "functionTypeParameter");
    }
    const accessReferences = version >= 7 ? parseAccessSpecifiers(entry) : [];
    parseFunctionAttributes(entry, version);
    return { module, name, parameters, returns, typeParameterCount, accessReferences };
  });
}

function parseFunctionInstantiations(reader: ScriptBytecodeReader | undefined): FunctionInstantiation[] {
  return parseEntries(reader, (entry) => ({
    handle: entry.readUleb128("function instantiation handle index", TABLE_INDEX_MAX),
    typeParameters: entry.readUleb128("function instantiation signature index", TABLE_INDEX_MAX),
  }));
}

function parseConstants(reader: ScriptBytecodeReader | undefined, version: number): SignatureToken[] {
  return parseEntries(reader, (entry) => {
    const type = parseSignatureToken(entry, version);
    const byteLength = entry.readUleb128("constant byte length", TABLE_INDEX_MAX);
    entry.readBytes(byteLength, "constant bytes");
    return type;
  });
}

function parseMetadata(reader: ScriptBytecodeReader | undefined, version: number): void {
  if (reader !== undefined && version < 5) {
    invalidScript(`metadata tables are not supported in bytecode version ${version}`);
  }
  parseEntries(reader, (entry) => {
    const keyLength = entry.readUleb128("metadata key length", 1023);
    entry.readBytes(keyLength, "metadata key");
    const valueLength = entry.readUleb128("metadata value length", TABLE_INDEX_MAX);
    entry.readBytes(valueLength, "metadata value");
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

function validateSignatureToken(
  token: SignatureToken,
  structHandles: StructHandle[],
  moduleHandles: ModuleHandle[],
  identifiers: string[],
  addresses: Uint8Array[],
  typeParameterCount?: number,
): void {
  switch (token.kind) {
    case "vector":
    case "reference":
      validateSignatureToken(token.value, structHandles, moduleHandles, identifiers, addresses, typeParameterCount);
      return;
    case "struct": {
      const structHandle = indexed(structHandles, token.index, "struct handle");
      if (token.typeArguments.length !== structHandle.typeParameterCount) {
        invalidScript(
          `struct handle index ${token.index} expects ${structHandle.typeParameterCount} type arguments, received ${token.typeArguments.length}`,
        );
      }
      const moduleHandle = indexed(moduleHandles, structHandle.module, "module handle");
      indexed(addresses, moduleHandle.address, "address");
      indexed(identifiers, moduleHandle.name, "identifier");
      indexed(identifiers, structHandle.name, "identifier");
      for (const argument of token.typeArguments) {
        validateSignatureToken(argument, structHandles, moduleHandles, identifiers, addresses, typeParameterCount);
      }
      return;
    }
    case "typeParameter":
      if (typeParameterCount !== undefined && token.index >= typeParameterCount) {
        invalidScript(`type parameter index ${token.index} does not exist`);
      }
      return;
    case "function":
      for (const argument of token.arguments) {
        validateSignatureToken(argument, structHandles, moduleHandles, identifiers, addresses, typeParameterCount);
      }
      for (const result of token.results) {
        validateSignatureToken(result, structHandles, moduleHandles, identifiers, addresses, typeParameterCount);
      }
      return;
    default:
      return;
  }
}

function validateSignature(
  signature: SignatureToken[],
  structHandles: StructHandle[],
  moduleHandles: ModuleHandle[],
  identifiers: string[],
  addresses: Uint8Array[],
  typeParameterCount?: number,
): void {
  for (const token of signature) {
    validateSignatureToken(token, structHandles, moduleHandles, identifiers, addresses, typeParameterCount);
  }
}

function validateAccessReferences(
  references: AccessReference[],
  addresses: Uint8Array[],
  moduleHandles: ModuleHandle[],
  structHandles: StructHandle[],
  signatures: SignatureToken[][],
  functionInstantiations: FunctionInstantiation[],
): void {
  for (const reference of references) {
    switch (reference.kind) {
      case "address":
        indexed(addresses, reference.index, "access specifier address");
        break;
      case "module":
        indexed(moduleHandles, reference.index, "access specifier module handle");
        break;
      case "struct":
        indexed(structHandles, reference.index, "access specifier struct handle");
        break;
      case "signature":
        indexed(signatures, reference.index, "access specifier signature");
        break;
      case "functionInstantiation":
        indexed(functionInstantiations, reference.index, "access specifier function instantiation");
        break;
      default:
        invalidScript("unknown access specifier reference");
    }
  }
}

function requireOpcodeVersion(opcode: number, version: number): void {
  let minimum = 1;
  if (opcode >= 0x40 && opcode <= 0x47) minimum = 4;
  else if (opcode >= 0x48 && opcode <= 0x4d) minimum = 6;
  else if (opcode >= 0x4e && opcode <= 0x57) minimum = 7;
  else if (opcode >= 0x58 && opcode <= 0x5a) minimum = 8;
  else if (opcode >= 0x5b && opcode <= 0x67) minimum = 9;
  else if (opcode === 0x68) minimum = 10;
  if (version < minimum) {
    invalidScript(`opcode ${opcode} is not supported in bytecode version ${version}`);
  }
}

/**
 * Structurally consumes one instruction from bytecode versions 1-10.
 *
 * This is deliberately not a semantic bytecode verifier: it recognizes every instruction encoding
 * and validates signature operands needed for ABI-safe parsing, but leaves stack, branch, local,
 * and module-only table semantics to the Move verifier.
 */
function parseInstruction(
  reader: ScriptBytecodeReader,
  version: number,
  signatures: SignatureToken[][],
  instructionIndex: number,
): void {
  const opcode = reader.readU8(`instruction ${instructionIndex} opcode`);
  if (opcode < 1 || opcode > 0x68) {
    invalidScript(`unknown opcode ${opcode}`);
  }
  requireOpcodeVersion(opcode, version);

  if (opcode === 0x31 || opcode === 0x5b) {
    reader.readBytes(1, `instruction ${instructionIndex} operand`);
    return;
  }
  if (opcode === 0x48 || opcode === 0x5c) {
    reader.readBytes(2, `instruction ${instructionIndex} operand`);
    return;
  }
  if (opcode === 0x49 || opcode === 0x5d) {
    reader.readBytes(4, `instruction ${instructionIndex} operand`);
    return;
  }
  if (opcode === 0x06 || opcode === 0x5e) {
    reader.readBytes(8, `instruction ${instructionIndex} operand`);
    return;
  }
  if (opcode === 0x32 || opcode === 0x5f) {
    reader.readBytes(16, `instruction ${instructionIndex} operand`);
    return;
  }
  if (opcode === 0x4a || opcode === 0x60) {
    reader.readBytes(32, `instruction ${instructionIndex} operand`);
    return;
  }
  if (opcode === 0x40 || opcode === 0x46) {
    const signature = reader.readUleb128(`instruction ${instructionIndex} signature index`, TABLE_INDEX_MAX);
    indexed(signatures, signature, "instruction signature");
    reader.readBytes(8, `instruction ${instructionIndex} vector count`);
    return;
  }
  if (opcode === 0x58 || opcode === 0x59) {
    reader.readUleb128(`instruction ${instructionIndex} function index`, TABLE_INDEX_MAX);
    reader.readUleb128U64(`instruction ${instructionIndex} closure mask`);
    return;
  }
  if (opcode >= 0x0a && opcode <= 0x0e) {
    reader.readUleb128(`instruction ${instructionIndex} local index`, 255);
    return;
  }

  const hasIndexOperand =
    (opcode >= 0x03 && opcode <= 0x05) ||
    opcode === 0x07 ||
    (opcode >= 0x0f && opcode <= 0x13) ||
    (opcode >= 0x29 && opcode <= 0x2d) ||
    (opcode >= 0x36 && opcode <= 0x3f) ||
    (opcode >= 0x41 && opcode <= 0x45) ||
    opcode === 0x47 ||
    (opcode >= 0x4e && opcode <= 0x57) ||
    opcode === 0x5a;
  if (hasIndexOperand) {
    const index = reader.readUleb128(`instruction ${instructionIndex} index`, TABLE_INDEX_MAX);
    if ((opcode >= 0x41 && opcode <= 0x47) || opcode === 0x5a) {
      indexed(signatures, index, "instruction signature");
    }
  }
}

function parseCodeUnit(reader: ScriptBytecodeReader, version: number, signatures: SignatureToken[][]): number {
  const locals = reader.readUleb128("code unit locals signature index", TABLE_INDEX_MAX);
  indexed(signatures, locals, "code unit locals signature");
  const instructionCount = reader.readUleb128("instruction count", BYTECODE_COUNT_MAX);
  for (let index = 0; index < instructionCount; index += 1) {
    parseInstruction(reader, version, signatures, index);
  }
  return locals;
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

  const identifiers = parseIdentifiers(tableReader(tableContents, headers, TableType.Identifiers), version);
  const addresses = parseAddresses(tableReader(tableContents, headers, TableType.AddressIdentifiers));
  const moduleHandles = parseModuleHandles(tableReader(tableContents, headers, TableType.ModuleHandles));
  const structHandles = parseStructHandles(tableReader(tableContents, headers, TableType.StructHandles), version);
  const signatures = parseSignatures(tableReader(tableContents, headers, TableType.Signatures), version);
  const functionHandles = parseFunctionHandles(tableReader(tableContents, headers, TableType.FunctionHandles), version);
  const functionInstantiations = parseFunctionInstantiations(
    tableReader(tableContents, headers, TableType.FunctionInstantiations),
  );
  const constantTypes = parseConstants(tableReader(tableContents, headers, TableType.ConstantPool), version);
  parseMetadata(tableReader(tableContents, headers, TableType.Metadata), version);

  for (const moduleHandle of moduleHandles) {
    indexed(addresses, moduleHandle.address, "module handle address");
    indexed(identifiers, moduleHandle.name, "module handle identifier");
  }
  for (const structHandle of structHandles) {
    indexed(moduleHandles, structHandle.module, "struct handle module");
    indexed(identifiers, structHandle.name, "struct handle identifier");
  }
  for (const signature of signatures) {
    validateSignature(signature, structHandles, moduleHandles, identifiers, addresses);
  }
  for (const type of constantTypes) {
    validateSignatureToken(type, structHandles, moduleHandles, identifiers, addresses);
  }
  for (const functionHandle of functionHandles) {
    indexed(moduleHandles, functionHandle.module, "function handle module");
    indexed(identifiers, functionHandle.name, "function handle identifier");
    validateSignature(
      indexed(signatures, functionHandle.parameters, "function handle parameter signature"),
      structHandles,
      moduleHandles,
      identifiers,
      addresses,
      functionHandle.typeParameterCount,
    );
    validateSignature(
      indexed(signatures, functionHandle.returns, "function handle return signature"),
      structHandles,
      moduleHandles,
      identifiers,
      addresses,
      functionHandle.typeParameterCount,
    );
    validateAccessReferences(
      functionHandle.accessReferences,
      addresses,
      moduleHandles,
      structHandles,
      signatures,
      functionInstantiations,
    );
  }
  for (const instantiation of functionInstantiations) {
    indexed(functionHandles, instantiation.handle, "function instantiation handle");
    indexed(signatures, instantiation.typeParameters, "function instantiation signature");
  }

  const typeParameterCount = reader.readUleb128("script type parameter count", TYPE_PARAMETER_COUNT_MAX);
  const typeParameters = Array.from({ length: typeParameterCount }, () => ({
    constraints: decodeAbilities(readVersionedAbilitySet(reader, version, "functionTypeParameter")),
  }));
  const parameterSignatureIndex = reader.readUleb128("parameter signature index", TABLE_INDEX_MAX);
  const parameterTokens = indexed(signatures, parameterSignatureIndex, "parameter signature");
  const accessReferences = version >= 8 ? parseAccessSpecifiers(reader) : [];
  const localsSignatureIndex = parseCodeUnit(reader, version, signatures);
  if (reader.remaining !== 0) {
    invalidScript(`${reader.remaining} trailing byte(s) after the code unit`);
  }

  validateAccessReferences(
    accessReferences,
    addresses,
    moduleHandles,
    structHandles,
    signatures,
    functionInstantiations,
  );
  validateSignature(parameterTokens, structHandles, moduleHandles, identifiers, addresses, typeParameterCount);
  validateSignature(
    indexed(signatures, localsSignatureIndex, "code unit locals signature"),
    structHandles,
    moduleHandles,
    identifiers,
    addresses,
    typeParameterCount,
  );
  for (const instantiation of functionInstantiations) {
    validateSignature(
      indexed(signatures, instantiation.typeParameters, "function instantiation signature"),
      structHandles,
      moduleHandles,
      identifiers,
      addresses,
      typeParameterCount,
    );
  }

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
