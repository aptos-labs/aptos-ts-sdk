# Signed Integer TypeTag Support

This SDK now supports signed integer TypeTags (i8, i16, i32, i64, i128, i256) similar to the existing unsigned integer types.

## New TypeTag Classes

The following signed integer TypeTag classes have been added:

- `TypeTagI8` - 8-bit signed integer
- `TypeTagI16` - 16-bit signed integer  
- `TypeTagI32` - 32-bit signed integer
- `TypeTagI64` - 64-bit signed integer
- `TypeTagI128` - 128-bit signed integer
- `TypeTagI256` - 256-bit signed integer

## Usage

### Creating Signed Integer TypeTags

```typescript
import { TypeTagI8, TypeTagI16, TypeTagI32, TypeTagI64, TypeTagI128, TypeTagI256 } from '@aptos-labs/ts-sdk';

// Create signed integer type tags
const i8Tag = new TypeTagI8();
const i16Tag = new TypeTagI16();
const i32Tag = new TypeTagI32();
const i64Tag = new TypeTagI64();
const i128Tag = new TypeTagI128();
const i256Tag = new TypeTagI256();
```

### Parsing Signed Integer Types

```typescript
import { parseTypeTag } from '@aptos-labs/ts-sdk';

// Parse signed integer types from strings
const i8Type = parseTypeTag("i8");
const i16Type = parseTypeTag("i16");
const i32Type = parseTypeTag("i32");
const i64Type = parseTypeTag("i64");
const i128Type = parseTypeTag("i128");
const i256Type = parseTypeTag("i256");
```

### Type Checking

```typescript
import { TypeTag, TypeTagI8 } from '@aptos-labs/ts-sdk';

const typeTag: TypeTag = new TypeTagI8();

// Use type guard methods
if (typeTag.isI8()) {
  console.log("This is an i8 type");
}

// Other available type guards:
// - isI8()
// - isI16()
// - isI32()
// - isI64()
// - isI128()
// - isI256()
```

### Serialization and Deserialization

All signed integer TypeTags support BCS serialization/deserialization:

```typescript
import { Serializer, Deserializer, TypeTag } from '@aptos-labs/ts-sdk';

// Serialize
const serializer = new Serializer();
const i8Tag = new TypeTagI8();
i8Tag.serialize(serializer);
const bytes = serializer.toUint8Array();

// Deserialize
const deserializer = new Deserializer(bytes);
const deserializedTag = TypeTag.deserialize(deserializer);
```

## Type Variants

The `TypeTagVariants` enum has been extended with the following values:

- `I8 = 11`
- `I16 = 12`
- `I32 = 13`
- `I64 = 14`
- `I128 = 15`
- `I256 = 16`

## Implementation Details

### Modified Files

1. **`src/types/types.ts`** - Added signed integer variants to `TypeTagVariants` enum
2. **`src/transactions/typeTag/index.ts`** - Added TypeTag classes for i8, i16, i32, i64, i128, i256
3. **`src/transactions/typeTag/parser.ts`** - Updated parser to recognize signed integer types

### Features

- ✅ Full serialization/deserialization support
- ✅ Type parsing from strings
- ✅ Type guard methods (isI8, isI16, etc.)
- ✅ Primitive type detection
- ✅ Consistent with unsigned integer implementation

## Example: Using in Transaction Arguments

```typescript
import { parseTypeTag } from '@aptos-labs/ts-sdk';

// Parse type arguments for entry functions
const typeArgs = [
  parseTypeTag("i8"),
  parseTypeTag("i64"),
  parseTypeTag("i128")
];

// Use in transaction building...
```
