// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Parser for public copy structs and enums as transaction arguments.
 *
 * This module enables the TypeScript SDK to accept public copy structs and enums
 * as transaction arguments in JSON format, automatically encoding them to BCS.
 *
 * Key features:
 * - Queries on-chain metadata for struct/enum definitions
 * - Parses JSON input matching Move struct/enum types
 * - Encodes arguments to BCS format
 * - Supports nested structs/enums with depth limits
 * - Handles Option<T> in both vector and enum formats
 *
 * @group Implementation
 * @category Transactions
 */

import { AccountAddress } from "../../core/accountAddress";
import { Serializer, Serializable } from "../../bcs/serializer";
import { EntryFunctionArgument } from "../instances/transactionArgument";
import {
  TypeTag,
  TypeTagBool,
  TypeTagU8,
  TypeTagU16,
  TypeTagU32,
  TypeTagU64,
  TypeTagU128,
  TypeTagU256,
  TypeTagI8,
  TypeTagI16,
  TypeTagI32,
  TypeTagI64,
  TypeTagI128,
  TypeTagI256,
  TypeTagAddress,
  TypeTagStruct,
  TypeTagVector,
  TypeTagGeneric,
  StructTag,
} from "../typeTag";
import { parseTypeTag } from "../typeTag/parser";
import { AptosConfig } from "../../api/aptosConfig";
import { getModule } from "../../internal/account";
import { MoveModuleBytecode } from "../../types";
import {
  Bool,
  U8,
  U16,
  U32,
  U64,
  U128,
  U256,
  I8,
  I16,
  I32,
  I64,
  I128,
  I256,
} from "../../bcs/serializable/movePrimitives";
import { MoveString, MoveOption } from "../../bcs/serializable/moveStructs";

/**
 * Maximum nesting depth for structs, enums, and vectors.
 * Prevents stack overflow and excessively complex arguments.
 * Matches the limit in the Rust CLI implementation.
 */
const MAX_NESTING_DEPTH = 7;

/**
 * Module path separator used in fully-qualified type names.
 * Matches MODULE_SEPARATOR constant from Rust implementation.
 */
const MODULE_SEPARATOR = "::";

/**
 * Represents a BCS-serializable struct argument.
 * Encodes struct fields in declaration order.
 */
export class MoveStructArgument extends Serializable implements EntryFunctionArgument {
  /**
   * The encoded BCS bytes for this struct.
   */
  private readonly bcsBytes: Uint8Array;

  /**
   * Creates a new struct argument from pre-encoded BCS bytes.
   *
   * @param bcsBytes - The BCS-encoded struct bytes
   */
  constructor(bcsBytes: Uint8Array) {
    super();
    this.bcsBytes = bcsBytes;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.bcsBytes);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    // For entry functions, we need to prefix with the byte length
    serializer.serializeU32AsUleb128(this.bcsBytes.length);
    serializer.serializeFixedBytes(this.bcsBytes);
  }

  bcsToBytes(): Uint8Array {
    // Return raw struct bytes without additional wrapping
    return this.bcsBytes;
  }
}

/**
 * Represents a BCS-serializable enum argument.
 * Encodes variant tag (ULEB128) followed by variant fields.
 */
export class MoveEnumArgument extends Serializable implements EntryFunctionArgument {
  /**
   * The encoded BCS bytes for this enum.
   */
  private readonly bcsBytes: Uint8Array;

  /**
   * Creates a new enum argument from pre-encoded BCS bytes.
   *
   * @param bcsBytes - The BCS-encoded enum bytes
   */
  constructor(bcsBytes: Uint8Array) {
    super();
    this.bcsBytes = bcsBytes;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.bcsBytes);
  }

  serializeForEntryFunction(serializer: Serializer): void {
    // For entry functions, we need to prefix with the byte length
    serializer.serializeU32AsUleb128(this.bcsBytes.length);
    serializer.serializeFixedBytes(this.bcsBytes);
  }

  bcsToBytes(): Uint8Array {
    // Return raw enum bytes without additional wrapping
    return this.bcsBytes;
  }
}

/**
 * Parser for struct and enum transaction arguments.
 *
 * This class enables passing public copy structs and enums as transaction arguments
 * by automatically fetching module ABIs and encoding values to BCS format.
 *
 * @example
 * ```typescript
 * // Example 1: Encode a simple struct
 * const parser = new StructEnumArgumentParser(config);
 * const structTag = parseTypeTag("0x1::test::Point") as TypeTagStruct;
 * const value = { x: "10", y: "20" };
 * const encoded = await parser.encodeStructArgument(structTag, value);
 * ```
 *
 * @example
 * ```typescript
 * // Example 2: Encode an enum variant
 * const parser = new StructEnumArgumentParser(config);
 * const enumTag = parseTypeTag("0x1::test::Color") as TypeTagStruct;
 * const value = { Red: {} }; // No fields
 * const encoded = await parser.encodeEnumArgument(enumTag, value);
 * ```
 *
 * @example
 * ```typescript
 * // Example 3: Use in transaction builder
 * const txn = await aptos.transaction.build.simple({
 *   sender: alice.accountAddress,
 *   data: {
 *     function: "0x1::test::draw_line",
 *     functionArguments: [
 *       { start: { x: "0", y: "0" }, end: { x: "10", y: "10" } }, // Line struct
 *     ],
 *   },
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Example 4: Generic structs with type substitution
 * const parser = new StructEnumArgumentParser(config);
 * const boxTag = parseTypeTag("0x1::test::Box<u64>") as TypeTagStruct;
 * const value = { value: "42" };
 * const encoded = await parser.encodeStructArgument(boxTag, value);
 * // Generic parameter T0 is automatically substituted with u64
 * ```
 *
 * @example
 * ```typescript
 * // Example 5: Option enum (dual format support)
 * // Vector format (backward compatible):
 * functionArguments: [[]];  // None
 * functionArguments: [[42]]; // Some(42)
 *
 * // Enum format (new standard):
 * functionArguments: [{ None: {} }];
 * functionArguments: [{ Some: { "0": "42" } }];
 * ```
 *
 * Features:
 * - Automatic module ABI fetching and caching
 * - Recursive encoding for nested structs/enums
 * - Generic type parameter substitution (T0, T1, etc.)
 * - Depth limit enforcement (max 7 levels)
 * - Support for all Move primitive types
 * - Vector encoding with element recursion
 * - Special handling for String, Object<T>, Option<T>
 *
 * @group Implementation
 * @category Transactions
 */
export class StructEnumArgumentParser {
  private aptosConfig: AptosConfig;

  /**
   * Cache of module bytecode to avoid repeated fetches.
   * Key: "address::module_name"
   */
  private moduleCache: Map<string, MoveModuleBytecode> = new Map();

  constructor(aptosConfig: AptosConfig) {
    this.aptosConfig = aptosConfig;
  }

  /**
   * Pre-populates the module cache with modules from a ModuleAbiBundle.
   * This optimization eliminates nested network calls by providing all necessary
   * struct definitions upfront.
   *
   * @param modules - Map of module ID (address::name) to MoveModule
   */
  preloadModules(modules: Map<string, MoveModuleBytecode>): void {
    for (const [moduleId, moduleBytecode] of modules.entries()) {
      this.moduleCache.set(moduleId, moduleBytecode);
    }
  }

  /**
   * Parses a struct tag string into components.
   *
   * @param typeStr - Type string like "0x1::option::Option<u64>"
   * @returns Parsed TypeTag
   */
  parseTypeString(typeStr: string): TypeTag {
    // Use the SDK's built-in TypeTag parsing with generics support
    return parseTypeTag(typeStr, { allowGenerics: true });
  }

  /**
   * Checks if the nesting depth exceeds the maximum allowed.
   *
   * @param depth - Current nesting depth
   * @param typeName - Type name for error messages
   */
  private checkDepth(depth: number, typeName: string): void {
    if (depth > MAX_NESTING_DEPTH) {
      throw new Error(`${typeName} nesting depth ${depth} exceeds maximum allowed depth of ${MAX_NESTING_DEPTH}`);
    }
  }

  /**
   * Fetches module bytecode from the chain.
   * Results are cached to avoid repeated fetches.
   *
   * @param moduleAddress - Module address
   * @param moduleName - Module name
   * @returns Module bytecode
   */
  private async fetchModule(moduleAddress: AccountAddress, moduleName: string): Promise<MoveModuleBytecode> {
    const cacheKey = `${moduleAddress.toString()}${MODULE_SEPARATOR}${moduleName}`;

    // Check cache first
    if (this.moduleCache.has(cacheKey)) {
      return this.moduleCache.get(cacheKey)!;
    }

    // Fetch from chain
    try {
      const accountModules = await getModule({
        aptosConfig: this.aptosConfig,
        accountAddress: moduleAddress,
        moduleName,
      });

      this.moduleCache.set(cacheKey, accountModules);
      return accountModules;
    } catch (error) {
      throw new Error(`Failed to fetch module ${moduleAddress}${MODULE_SEPARATOR}${moduleName}: ${error}`);
    }
  }

  /**
   * Determines if a type is a struct or enum that requires special handling.
   *
   * @param typeTag - The type tag to check
   * @returns true if this is a struct/enum requiring special parsing
   */
  isStructOrEnum(typeTag: TypeTag): boolean {
    if (!(typeTag instanceof TypeTagStruct)) {
      return false;
    }

    const qualifiedName = `${typeTag.value.address.toString()}${MODULE_SEPARATOR}${typeTag.value.moduleName.identifier}${MODULE_SEPARATOR}${typeTag.value.name.identifier}`;

    // Special built-in types that are already handled
    const builtinTypes = ["0x1::string::String", "0x1::object::Object", "0x1::option::Option"];

    // If it's a built-in type, don't treat as custom struct/enum
    for (const builtinType of builtinTypes) {
      if (qualifiedName.startsWith(builtinType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Encodes a struct argument to BCS bytes.
   *
   * @param structTag - The struct type tag
   * @param value - JSON object with field values
   * @param depth - Current nesting depth
   * @returns BCS-encoded struct argument
   */
  async encodeStructArgument(structTag: TypeTagStruct, value: any, depth: number = 0): Promise<MoveStructArgument> {
    this.checkDepth(depth, "Struct");

    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`Expected object for struct argument, got ${typeof value}`);
    }

    // Fetch module to get struct definition
    const module = await this.fetchModule(structTag.value.address, structTag.value.moduleName.identifier);

    if (!module.abi) {
      throw new Error(
        `Module ${structTag.value.address}${MODULE_SEPARATOR}${structTag.value.moduleName.identifier} has no ABI`,
      );
    }

    // Find the struct definition
    const structDef = module.abi.structs.find((s) => s.name === structTag.value.name.identifier);

    if (!structDef) {
      throw new Error(
        `Struct ${structTag.value.name.identifier} not found in module ${structTag.value.address}${MODULE_SEPARATOR}${structTag.value.moduleName.identifier}`,
      );
    }

    if (structDef.is_enum) {
      throw new Error(
        `Type ${structTag.value.name.identifier} is an enum. Use enum variant syntax instead (e.g., {"VariantName": {...}})`,
      );
    }

    if (structDef.is_native) {
      throw new Error(`Struct ${structTag.value.name.identifier} is a native struct and cannot be used as an argument`);
    }

    // Encode each field in order
    const serializer = new Serializer();

    for (const field of structDef.fields) {
      const fieldValue = value[field.name];
      if (fieldValue === undefined) {
        throw new Error(`Missing field '${field.name}' for struct ${structTag.value.name.identifier}`);
      }

      // Parse field type and substitute generics
      const fieldTypeTag = this.parseTypeString(field.type);
      const substitutedType = this.substituteTypeParams(fieldTypeTag, structTag);

      // Encode field value
      const encoded = await this.encodeValueByType(substitutedType, fieldValue, depth + 1);
      serializer.serializeFixedBytes(encoded);
    }

    return new MoveStructArgument(serializer.toUint8Array());
  }

  /**
   * Encodes an enum argument to BCS bytes.
   *
   * @param structTag - The enum type tag
   * @param value - JSON object with variant name and fields
   * @param depth - Current nesting depth
   * @returns BCS-encoded enum argument
   */
  async encodeEnumArgument(structTag: TypeTagStruct, value: any, depth: number = 0): Promise<MoveEnumArgument> {
    this.checkDepth(depth, "Enum");

    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`Expected object for enum argument, got ${typeof value}`);
    }

    // Enum format: { "VariantName": { "field1": value1, ... } }
    const variantNames = Object.keys(value);
    if (variantNames.length !== 1) {
      throw new Error(`Enum value must have exactly one variant, got ${variantNames.length}`);
    }

    const variantName = variantNames[0];
    const variantFields = value[variantName];

    // Special handling for Option<T> - uses vector encoding for backward compatibility
    if (this.isOptionType(structTag)) {
      return this.encodeOptionArgument(structTag, variantName, variantFields, depth);
    }

    // Fetch module to get enum definition
    const module = await this.fetchModule(structTag.value.address, structTag.value.moduleName.identifier);

    if (!module.abi) {
      throw new Error(
        `Module ${structTag.value.address}${MODULE_SEPARATOR}${structTag.value.moduleName.identifier} has no ABI`,
      );
    }

    // Find the enum definition
    const enumDef = module.abi.structs.find((s) => s.name === structTag.value.name.identifier);

    if (!enumDef) {
      throw new Error(
        `Enum ${structTag.value.name.identifier} not found in module ${structTag.value.address}${MODULE_SEPARATOR}${structTag.value.moduleName.identifier}`,
      );
    }

    if (!enumDef.is_enum) {
      throw new Error(
        `Type ${structTag.value.name.identifier} is a struct, not an enum. Provide field values directly as an object.`,
      );
    }

    // For enums, fields array represents variants
    // Find variant index by name
    const variantIndex = enumDef.fields.findIndex((f) => f.name === variantName);

    if (variantIndex === -1) {
      const availableVariants = enumDef.fields.map((f) => f.name).join(", ");
      throw new Error(
        `Variant '${variantName}' not found in enum ${structTag.value.name.identifier}. Available variants: ${availableVariants}`,
      );
    }

    const serializer = new Serializer();

    // Encode variant index as ULEB128
    serializer.serializeU32AsUleb128(variantIndex);

    // Note: For enum variants with fields, the field information is in the variant's type string
    // E.g., for "Some" variant of Option<T>, the type might be "T"
    // However, the REST API may not provide complete field metadata for enum variants
    // We need to handle the variantFields based on the type string

    const variantDef = enumDef.fields[variantIndex];
    const variantType = this.parseTypeString(variantDef.type);

    // If variant has fields, encode them
    if (typeof variantFields === "object" && variantFields !== null && !Array.isArray(variantFields)) {
      // Variant has fields as an object
      const fieldKeys = Object.keys(variantFields);

      // Sort keys to ensure correct field order
      // Enum variants with multiple fields should use numbered keys: {"0": val1, "1": val2, ...}
      const sortedKeys = fieldKeys.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);

        // If keys are not numeric, maintain object key order (which may be wrong)
        if (isNaN(numA) || isNaN(numB)) {
          return 0;
        }

        return numA - numB;
      });

      // Validate that multi-field variants use sequential numeric keys
      if (sortedKeys.length > 1) {
        for (let i = 0; i < sortedKeys.length; i++) {
          const expectedKey = i.toString();
          if (sortedKeys[i] !== expectedKey) {
            throw new Error(
              `Enum variant with multiple fields must use sequential numeric keys starting from "0". ` +
                `Expected key "${expectedKey}" at position ${i}, got "${sortedKeys[i]}". ` +
                `Use format: { ${variantName}: { "0": value1, "1": value2, ... } }`,
            );
          }
        }

        // Note: The REST API doesn't provide individual field type information for enum variants.
        // For multi-field variants, we use the variant's type for all fields (limitation).
        // This may not work for variants with fields of different types.
        // TODO: Use bytecode parsing to get exact field types when available
      }

      // Encode each field in order
      for (const key of sortedKeys) {
        const fieldValue = variantFields[key];
        // Use the variant's type as the field type (simplified approach)
        const encoded = await this.encodeValueByType(variantType, fieldValue, depth + 1);
        serializer.serializeFixedBytes(encoded);
      }
    } else if (variantFields !== undefined && variantFields !== null) {
      // Single value variant (not an object)
      const encoded = await this.encodeValueByType(variantType, variantFields, depth + 1);
      serializer.serializeFixedBytes(encoded);
    }

    return new MoveEnumArgument(serializer.toUint8Array());
  }

  /**
   * Encodes Option<T> enum using vector encoding for backward compatibility.
   */
  private async encodeOptionArgument(
    structTag: TypeTagStruct,
    variant: string,
    fieldValue: any,
    depth: number,
  ): Promise<MoveEnumArgument> {
    if (structTag.value.typeArgs.length === 0) {
      throw new Error("Option must have a type parameter");
    }

    const innerType = structTag.value.typeArgs[0];
    const serializer = new Serializer();

    if (variant === "None") {
      // None: empty vector (length = 0)
      serializer.serializeU32AsUleb128(0);
    } else if (variant === "Some") {
      // Some: vector with one element (length = 1)
      serializer.serializeU32AsUleb128(1);

      // Extract the value from the field
      let value: any;
      if (typeof fieldValue === "object" && fieldValue !== null && !Array.isArray(fieldValue)) {
        // Handle {"0": value} format
        value = fieldValue["0"] !== undefined ? fieldValue["0"] : fieldValue;
      } else {
        value = fieldValue;
      }

      const encoded = await this.encodeValueByType(innerType, value, depth + 1);
      serializer.serializeFixedBytes(encoded);
    } else {
      throw new Error(`Unknown Option variant '${variant}'. Expected 'None' or 'Some'`);
    }

    return new MoveEnumArgument(serializer.toUint8Array());
  }

  /**
   * Checks if a struct tag represents std::option::Option
   */
  private isOptionType(structTag: TypeTagStruct): boolean {
    return (
      structTag.value.address.toString() === "0x1" &&
      structTag.value.moduleName.identifier === "option" &&
      structTag.value.name.identifier === "Option"
    );
  }

  /**
   * Substitute generic type parameters with concrete types.
   *
   * Replaces generic type parameters (T0, T1, T2, etc.) with their concrete
   * instantiations from the struct/enum type arguments.
   *
   * @example
   * // Struct: Box<T0> { value: T0 }
   * // Instantiation: Box<u64>
   * // Field type T0 → u64
   *
   * @param fieldType - The type tag that may contain generic parameters
   * @param structTag - The instantiated struct/enum with concrete type arguments
   * @returns Type tag with all generic parameters replaced
   */
  private substituteTypeParams(fieldType: TypeTag, structTag: TypeTagStruct): TypeTag {
    // Handle generic type parameter (T0, T1, T2, etc.)
    if (fieldType instanceof TypeTagGeneric) {
      const index = fieldType.value;
      if (index >= structTag.value.typeArgs.length) {
        throw new Error(
          `Generic type parameter T${index} out of bounds. ${structTag.value.name.identifier} has ${structTag.value.typeArgs.length} type arguments.`,
        );
      }
      return structTag.value.typeArgs[index];
    }

    // Handle vector types - recursively substitute inner type
    if (fieldType instanceof TypeTagVector) {
      const substitutedInner = this.substituteTypeParams(fieldType.value, structTag);
      return new TypeTagVector(substitutedInner);
    }

    // Handle struct types - recursively substitute type arguments
    if (fieldType instanceof TypeTagStruct) {
      if (fieldType.value.typeArgs.length === 0) {
        // No type arguments, return as-is
        return fieldType;
      }

      // Substitute each type argument
      const substitutedTypeArgs = fieldType.value.typeArgs.map((typeArg) =>
        this.substituteTypeParams(typeArg, structTag),
      );

      // Create new struct tag with substituted type arguments
      const newStructTag = new StructTag(
        fieldType.value.address,
        fieldType.value.moduleName,
        fieldType.value.name,
        substitutedTypeArgs,
      );
      return new TypeTagStruct(newStructTag);
    }

    // Primitive types and other non-generic types remain unchanged
    return fieldType;
  }

  /**
   * Encode a value based on its Move type.
   */
  private async encodeValueByType(typeTag: TypeTag, value: any, depth: number): Promise<Uint8Array> {
    this.checkDepth(depth, "Type");

    // Primitive types - use instanceof to avoid TypeScript control flow issues
    if (typeTag instanceof TypeTagBool) {
      if (typeof value !== "boolean") {
        throw new Error(`Expected boolean for bool type, got ${typeof value}`);
      }
      return new Bool(value).bcsToBytes();
    }
    if (typeTag instanceof TypeTagU8) {
      return new U8(this.parseNumber(value, "u8")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagU16) {
      return new U16(this.parseNumber(value, "u16")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagU32) {
      return new U32(this.parseNumber(value, "u32")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagU64) {
      return new U64(this.parseNumberBigInt(value, "u64")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagU128) {
      return new U128(this.parseNumberBigInt(value, "u128")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagU256) {
      return new U256(this.parseNumberBigInt(value, "u256")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagI8) {
      return new I8(this.parseNumber(value, "i8")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagI16) {
      return new I16(this.parseNumber(value, "i16")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagI32) {
      return new I32(this.parseNumber(value, "i32")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagI64) {
      return new I64(this.parseNumberBigInt(value, "i64")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagI128) {
      return new I128(this.parseNumberBigInt(value, "i128")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagI256) {
      return new I256(this.parseNumberBigInt(value, "i256")).bcsToBytes();
    }
    if (typeTag instanceof TypeTagAddress) {
      const addr = AccountAddress.from(value);
      return addr.bcsToBytes();
    }
    if (typeTag instanceof TypeTagVector) {
      return this.encodeVector(typeTag, value, depth);
    }
    if (typeTag instanceof TypeTagStruct) {
      return this.encodeStruct(typeTag, value, depth);
    }

    throw new Error(`Unsupported type: ${typeTag.toString()}`);
  }

  /**
   * Encode a vector value.
   */
  private async encodeVector(vectorType: TypeTagVector, value: any, depth: number): Promise<Uint8Array> {
    if (!Array.isArray(value)) {
      // Special case: vector<u8> can be a string
      if (vectorType.value instanceof TypeTagU8 && typeof value === "string") {
        // Treat as UTF-8 encoded string
        const encoder = new TextEncoder();
        const bytes = encoder.encode(value);
        const serializer = new Serializer();
        serializer.serializeU32AsUleb128(bytes.length);
        serializer.serializeBytes(bytes);
        return serializer.toUint8Array();
      }

      throw new Error(`Expected array for vector type, got ${typeof value}`);
    }

    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(value.length);

    for (const item of value) {
      const encoded = await this.encodeValueByType(vectorType.value, item, depth + 1);
      serializer.serializeFixedBytes(encoded);
    }

    return serializer.toUint8Array();
  }

  /**
   * Encode a struct value.
   */
  private async encodeStruct(structTag: TypeTagStruct, value: any, depth: number): Promise<Uint8Array> {
    const qualifiedName = `${structTag.value.address.toString()}${MODULE_SEPARATOR}${structTag.value.moduleName.identifier}${MODULE_SEPARATOR}${structTag.value.name.identifier}`;

    // Handle special framework types
    if (qualifiedName === "0x1::string::String") {
      if (typeof value !== "string") {
        throw new Error(`Expected string for String type, got ${typeof value}`);
      }
      return new MoveString(value).bcsToBytes();
    }

    if (qualifiedName === "0x1::object::Object") {
      const addr = AccountAddress.from(value);
      return addr.bcsToBytes();
    }

    if (qualifiedName === "0x1::option::Option") {
      // Handle Option<T> in both formats
      if (Array.isArray(value)) {
        // Vector format: [] or [value]
        if (value.length === 0) {
          return new MoveOption(null).bcsToBytes();
        }
        if (value.length === 1) {
          // Encode the inner value
          if (structTag.value.typeArgs.length === 0) {
            throw new Error("Option must have a type parameter");
          }
          const innerType = structTag.value.typeArgs[0];
          const encodedInner = await this.encodeValueByType(innerType, value[0], depth + 1);
          const serializer = new Serializer();
          serializer.serializeU32AsUleb128(1); // Some
          serializer.serializeFixedBytes(encodedInner);
          return serializer.toUint8Array();
        }
        throw new Error(`Option as vector must have 0 or 1 elements, got ${value.length}`);
      }

      if (typeof value === "object" && value !== null) {
        // Enum format: {"None": {}} or {"Some": {"0": value}}
        const variantNames = Object.keys(value);
        if (variantNames.length === 1) {
          const result = await this.encodeEnumArgument(structTag, value, depth);
          return result.bcsToBytes();
        }
      }

      throw new Error(`Invalid Option format. Expected array [] or [value], or enum {"None": {}} or {"Some": {...}}`);
    }

    // Check if this is an enum (single key = variant name)
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length === 1) {
        // Might be an enum variant
        // Try to fetch the struct and check is_enum flag
        try {
          const module = await this.fetchModule(structTag.value.address, structTag.value.moduleName.identifier);
          if (module.abi) {
            const structDef = module.abi.structs.find((s) => s.name === structTag.value.name.identifier);
            if (structDef && structDef.is_enum) {
              const result = await this.encodeEnumArgument(structTag, value, depth);
              return result.bcsToBytes();
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // If we can't determine, treat as struct
        }
      }
    }

    // Regular struct
    const result = await this.encodeStructArgument(structTag, value, depth);
    return result.bcsToBytes();
  }

  /**
   * Parse a number from JSON value.
   */
  private parseNumber(value: any, typeName: string): number {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (isNaN(parsed)) {
        throw new Error(`Invalid ${typeName} value: ${value}`);
      }
      return parsed;
    }
    throw new Error(`Expected number or string for ${typeName}, got ${typeof value}`);
  }

  /**
   * Parse a BigInt from JSON value.
   */
  private parseNumberBigInt(value: any, typeName: string): bigint {
    if (typeof value === "bigint") {
      return value;
    }
    if (typeof value === "number") {
      return BigInt(value);
    }
    if (typeof value === "string") {
      try {
        return BigInt(value);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) {
        throw new Error(`Invalid ${typeName} value: ${value}`);
      }
    }
    throw new Error(`Expected number, bigint, or string for ${typeName}, got ${typeof value}`);
  }
}
