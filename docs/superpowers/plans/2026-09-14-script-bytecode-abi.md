# Script Bytecode ABI Parsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically convert JSON-compatible Move script arguments by extracting the script's callable ABI from compiled bytecode.

**Architecture:** Add a focused byte reader that resolves the compiled script's main signature into existing SDK `TypeTag` classes. The script payload builder invokes it only when at least one argument is not already a script wrapper, then reuses `convertArgument`; wrapper-only calls retain their existing no-parse path.

**Tech Stack:** TypeScript, `Uint8Array`, existing Aptos SDK `TypeTag`/BCS classes, Vitest, Biome, Turbo/pnpm.

## Global Constraints

- The parser must work in browsers, React Native, Node.js 22+, Bun, and Deno.
- Do not use `Buffer`, `node:` imports, unguarded `process`, or other Node-only APIs.
- Do not add a dependency or network call.
- Do not hand-edit generated code or generated docs.
- Preserve wrapper-only and empty-argument script payload behavior byte-for-byte.
- Plain custom struct and enum objects remain unsupported; callers use `Serialized`.

---

### Task 1: Parse compiled script ABIs

**Files:**
- Create: `packages/ts-sdk/src/transactions/transactionBuilder/scriptAbi.ts`
- Create: `packages/ts-sdk/tests/unit/transactions/scriptAbi.test.ts`
- Modify: `packages/ts-sdk/src/transactions/transactionBuilder/index.ts`
- Modify: `packages/ts-sdk/src/transactions/types.ts`

**Interfaces:**
- Consumes: `HexInput`, `TypeTag`, `MoveAbility`, `AccountAddress`, `Identifier`.
- Produces: `ScriptABI` and `parseScriptAbi(bytecode: HexInput): ScriptABI`.

- [ ] **Step 1: Add parser tests before production code**

Create `scriptAbi.test.ts` with:

```typescript
import { describe, expect, it } from "vitest";
import {
  MoveAbility,
  TypeTagAddress,
  TypeTagStruct,
  TypeTagU64,
  parseScriptAbi,
} from "../../../src/index.js";

const COIN_TRANSFER_SCRIPT =
  "a11ceb0b060000000701000202020603080c04140405181a07321b084d2000000001040100010002030101000003040501000002010203060c0305010b0001090001090002060c0302050b000109000004636f696e04436f696e087769746864726177076465706f736974000000000000000000000000000000000000000000000000000000000000000101000001080b000b0138000c030b020b03380102";

function uleb(value: number): number[] {
  const bytes: number[] = [];
  let remaining = value;
  do {
    let byte = remaining % 128;
    remaining = Math.floor(remaining / 128);
    if (remaining > 0) byte |= 0x80;
    bytes.push(byte);
  } while (remaining > 0);
  return bytes;
}

function minimalScript(signatureTable: number[], mainSignature = 0, abilities: number[] = []): Uint8Array {
  return new Uint8Array([
    0xa1, 0x1c, 0xeb, 0x0b,
    6, 0, 0, 0,
    1,
    5, 0, ...uleb(signatureTable.length),
    ...signatureTable,
    ...uleb(abilities.length),
    ...abilities.flatMap(uleb),
    ...uleb(mainSignature),
    0, 1, 2,
  ]);
}

function structScript(): Uint8Array {
  const identifiers = [1, "m".charCodeAt(0), 1, "S".charCodeAt(0)];
  const tables = [
    { kind: 1, bytes: [0, 0] },
    { kind: 2, bytes: [0, 1, 0, 0] },
    { kind: 5, bytes: [1, 8, 0] },
    { kind: 7, bytes: identifiers },
    { kind: 8, bytes: [...new Uint8Array(31), 1] },
  ];
  let offset = 0;
  const headers = tables.flatMap(({ kind, bytes }) => {
    const header = [kind, ...uleb(offset), ...uleb(bytes.length)];
    offset += bytes.length;
    return header;
  });
  return new Uint8Array([
    0xa1, 0x1c, 0xeb, 0x0b,
    6, 0, 0, 0,
    ...uleb(tables.length),
    ...headers,
    ...tables.flatMap(({ bytes }) => bytes),
    0, 0, 0, 1, 2,
  ]);
}

describe("parseScriptAbi", () => {
  it("extracts signer, generic, and caller parameter types from a real script", () => {
    const abi = parseScriptAbi(COIN_TRANSFER_SCRIPT);
    expect(abi.signers).toBe(1);
    expect(abi.typeParameters).toEqual([{ constraints: [] }]);
    expect(abi.parameters).toEqual([new TypeTagU64(), new TypeTagAddress()]);
  });

  it("resolves struct handles through module, identifier, and address tables", () => {
    const abi = parseScriptAbi(structScript());
    expect(abi.parameters).toHaveLength(1);
    expect(abi.parameters[0]).toBeInstanceOf(TypeTagStruct);
    expect(abi.parameters[0].toString()).toBe("0x1::m::S");
  });

  it("maps generic ability bits", () => {
    const abi = parseScriptAbi(minimalScript([0], 0, [15]));
    expect(abi.typeParameters[0].constraints).toEqual([
      MoveAbility.COPY,
      MoveAbility.DROP,
      MoveAbility.STORE,
      MoveAbility.KEY,
    ]);
  });

  it("rejects malformed and unsupported binaries", () => {
    expect(() => parseScriptAbi("0x00")).toThrow(/Invalid script bytecode.*magic|too short/i);
    expect(() => parseScriptAbi(minimalScript([1, 255]))).toThrow(/signature token/i);

    const unsupported = minimalScript([0]);
    unsupported.set([11, 0, 0, 10], 4);
    expect(() => parseScriptAbi(unsupported)).toThrow(/version 11/i);
  });

  it("rejects invalid table ranges and signature references", () => {
    const invalidRange = minimalScript([0]);
    invalidRange[11] = 100;
    expect(() => parseScriptAbi(invalidRange)).toThrow(/table/i);
    expect(() => parseScriptAbi(minimalScript([0], 1))).toThrow(/signature index/i);
  });
});
```

- [ ] **Step 2: Commit and push the red tests, then verify they fail for the missing export**

Run:

```bash
git add packages/ts-sdk/tests/unit/transactions/scriptAbi.test.ts
git commit -m "test: define compiled script ABI parsing behavior"
git push -u origin greg/script-bytecode-abi-5261
pnpm --filter @aptos-labs/ts-sdk exec vitest run --config vitest.config.unit.ts tests/unit/transactions/scriptAbi.test.ts
```

Expected: FAIL because `parseScriptAbi` is not exported.

- [ ] **Step 3: Define the public ABI type**

Add after `FunctionABI` in `transactions/types.ts`:

```typescript
export type ScriptABI = FunctionABI & {
  /** Number of leading signer parameters supplied by transaction authentication. */
  signers: number;
};
```

- [ ] **Step 4: Implement the focused bytecode reader**

In `scriptAbi.ts`, implement:

```typescript
export function parseScriptAbi(bytecode: HexInput): ScriptABI;
```

The implementation must contain these concrete units:

```typescript
class ScriptBytecodeReader {
  constructor(
    private readonly bytes: Uint8Array,
    private readonly start = 0,
    private readonly end = bytes.length,
  ) {}

  get position(): number;
  get remaining(): number;
  readU8(label: string): number;
  readU32(label: string): number;
  readUleb128(label: string, max: number): number;
  readBytes(length: number, label: string): Uint8Array;
  subReader(offset: number, length: number, label: string): ScriptBytecodeReader;
}
```

`readUleb128` will use arithmetic rather than 32-bit bitwise accumulation, reject continuation after
five bytes, reject a zero terminal group in a multi-byte value, and reject values above the supplied
maximum. Every reader failure must throw `Invalid script bytecode: <specific reason>`.

Define the Aptos constants exactly:

```typescript
const MOVE_MAGIC = [0xa1, 0x1c, 0xeb, 0x0b] as const;
const APTOS_BYTECODE_VERSION_MASK = 0x0a000000;
const MIN_BYTECODE_VERSION = 1;
const MAX_BYTECODE_VERSION = 10;

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
```

Parse table headers as `(kind, offset, byteLength)`, reject duplicates, sort by offset, and require
contiguous non-empty ranges beginning at offset zero. Parse identifiers as length-prefixed UTF-8,
addresses as 32-byte values, module handles as address/name ULEB indices, and struct handles as
module/name indices followed by an ability set and versioned type-parameter declarations.

Represent signature tokens internally as a discriminated tree retaining reference mutability,
struct-handle indices, and function-token children. Decode all `SerializedType` variants with a
maximum nesting depth of 256. Resolve that tree to the existing `TypeTagBool`, integer tags,
`TypeTagAddress`, `TypeTagSigner`, `TypeTagVector`, `TypeTagGeneric`, `TypeTagReference`, and
`TypeTagStruct` classes. Resolve a struct through:

```typescript
const structHandle = structHandles[token.index];
const moduleHandle = moduleHandles[structHandle.module];
const address = addresses[moduleHandle.address];
const moduleName = identifiers[moduleHandle.name];
const structName = identifiers[structHandle.name];
return new TypeTagStruct(
  new StructTag(new AccountAddress(address), new Identifier(moduleName), new Identifier(structName), typeArguments),
);
```

Reject missing indices and function tokens with targeted messages. Decode generic ability bits in
COPY, DROP, STORE, KEY order. Count only leading signer tokens, including immutable and mutable
references to signer, and omit those from `parameters`.

- [ ] **Step 5: Export the parser**

Append to `transactionBuilder/index.ts`:

```typescript
export * from "./scriptAbi.js";
```

- [ ] **Step 6: Commit and push the parser, then verify the focused tests pass**

```bash
git add packages/ts-sdk/src/transactions/types.ts \
  packages/ts-sdk/src/transactions/transactionBuilder/index.ts \
  packages/ts-sdk/src/transactions/transactionBuilder/scriptAbi.ts
git commit -m "feat: parse ABIs from compiled scripts"
git push -u origin greg/script-bytecode-abi-5261
pnpm --filter @aptos-labs/ts-sdk exec vitest run --config vitest.config.unit.ts tests/unit/transactions/scriptAbi.test.ts
```

Expected: PASS.

### Task 2: Convert plain script arguments automatically

**Files:**
- Modify: `packages/ts-sdk/src/transactions/types.ts`
- Modify: `packages/ts-sdk/src/transactions/transactionBuilder/transactionBuilder.ts`
- Modify: `packages/ts-sdk/tests/unit/transactions/transactionBuilder.test.ts`
- Modify: `packages/ts-sdk/CHANGELOG.md`

**Interfaces:**
- Consumes: `parseScriptAbi`, `convertArgument`, `Serialized`, and existing script wrappers.
- Produces: automatic conversion in both normal and multisig script payloads.

- [ ] **Step 1: Add automatic-conversion tests**

Use the Task 1 `COIN_TRANSFER_SCRIPT` fixture in the transaction-builder suite and add:

```typescript
it("converts plain script arguments from the bytecode ABI", async () => {
  const payload = await generateTransactionPayload({
    bytecode: COIN_TRANSFER_SCRIPT,
    typeArguments: ["0x1::aptos_coin::AptosCoin"],
    functionArguments: [627, "0x1"],
  });

  expect(payload).toBeInstanceOf(TransactionPayloadScript);
  expect(payload.script.args[0]).toEqual(new U64(627));
  expect(payload.script.args[1]).toEqual(AccountAddress.ONE);
});

it("preserves wrapper-only script arguments without parsing", async () => {
  const amount = new U64(627);
  const payload = await generateTransactionPayload({
    bytecode: "0x00",
    typeArguments: [],
    functionArguments: [amount],
  });
  expect(payload.script.args[0]).toBe(amount);
});

it("converts mixed plain and wrapper script arguments", async () => {
  const amount = new U64(627);
  const payload = await generateTransactionPayload({
    bytecode: COIN_TRANSFER_SCRIPT,
    typeArguments: ["0x1::aptos_coin::AptosCoin"],
    functionArguments: [amount, "0x1"],
  });
  expect(payload.script.args[0]).toBe(amount);
  expect(payload.script.args[1]).toEqual(AccountAddress.ONE);
});

it("validates parsed script argument counts", async () => {
  await expect(
    generateTransactionPayload({
      bytecode: COIN_TRANSFER_SCRIPT,
      typeArguments: [],
      functionArguments: [627, "0x1"],
    }),
  ).rejects.toThrow(/Type argument count mismatch/);

  await expect(
    generateTransactionPayload({
      bytecode: COIN_TRANSFER_SCRIPT,
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [627],
    }),
  ).rejects.toThrow(/argument count mismatch/);
});

it("converts plain arguments before wrapping a multisig script", async () => {
  const payload = await generateTransactionPayload({
    bytecode: COIN_TRANSFER_SCRIPT,
    typeArguments: ["0x1::aptos_coin::AptosCoin"],
    functionArguments: [627, "0x1"],
    multisigAddress: AccountAddress.A,
  });
  expect(payload).toBeInstanceOf(TransactionPayloadMultiSig);
  const script = payload.multiSig.transaction_payload?.transaction_payload;
  expect(script).toBeInstanceOf(Script);
  expect((script as Script).args[0]).toEqual(new U64(627));
});
```

- [ ] **Step 2: Commit and push the red tests, then verify the first test fails on the plain arguments**

```bash
git add packages/ts-sdk/tests/unit/transactions/transactionBuilder.test.ts
git commit -m "test: define automatic script argument conversion"
git push -u origin greg/script-bytecode-abi-5261
pnpm --filter @aptos-labs/ts-sdk exec vitest run --config vitest.config.unit.ts tests/unit/transactions/transactionBuilder.test.ts
```

Expected: FAIL because plain values do not implement `serializeForScriptFunction`.

- [ ] **Step 3: Broaden the script input type**

Change `InputScriptData.functionArguments` to:

```typescript
functionArguments: Array<ScriptFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes>;
```

- [ ] **Step 4: Implement conditional ABI conversion**

Add this guard near the script builder:

```typescript
function isScriptFunctionArgument(
  arg: ScriptFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes | EntryFunctionArgumentTypes,
): arg is ScriptFunctionArgumentTypes {
  return (
    typeof arg === "object" &&
    arg !== null &&
    "serializeForScriptFunction" in arg &&
    typeof arg.serializeForScriptFunction === "function"
  );
}
```

Replace `generateTransactionPayloadScript` with:

```typescript
function generateTransactionPayloadScript(args: InputScriptData): TransactionPayloadScript {
  const typeArguments = standardizeTypeTags(args.typeArguments);

  if (args.functionArguments.every(isScriptFunctionArgument)) {
    return new TransactionPayloadScript(
      new Script(Hex.fromHexInput(args.bytecode).toUint8Array(), typeArguments, args.functionArguments),
    );
  }

  const abi = parseScriptAbi(args.bytecode);
  if (typeArguments.length !== abi.typeParameters.length) {
    throw new Error(
      `Type argument count mismatch, expected ${abi.typeParameters.length}, received ${typeArguments.length}`,
    );
  }
  if (args.functionArguments.length !== abi.parameters.length) {
    throw new Error(
      `Script function argument count mismatch, expected ${abi.parameters.length}, received ${args.functionArguments.length}`,
    );
  }

  const functionArguments = args.functionArguments.map((arg, index): ScriptFunctionArgumentTypes => {
    if (isScriptFunctionArgument(arg)) return arg;
    const converted = convertArgument("script", abi, arg, index, typeArguments);
    return isScriptFunctionArgument(converted) ? converted : new Serialized(converted.bcsToBytes());
  });

  return new TransactionPayloadScript(
    new Script(Hex.fromHexInput(args.bytecode).toUint8Array(), typeArguments, functionArguments),
  );
}
```

Import `parseScriptAbi`, `Serialized`, `ScriptFunctionArgumentTypes`, and
`SimpleEntryFunctionArgumentTypes` from their existing package-local modules.

- [ ] **Step 5: Add the changelog entry**

Under `# Unreleased` → `## Added` in `packages/ts-sdk/CHANGELOG.md`, add:

```markdown
- Parse compiled script ABIs automatically when script payloads contain plain JSON-compatible
  arguments, reusing ABI conversion while preserving existing BCS-wrapper and `Serialized` inputs.
```

- [ ] **Step 6: Commit and push the implementation, then run focused tests**

```bash
git add packages/ts-sdk/src/transactions/types.ts \
  packages/ts-sdk/src/transactions/transactionBuilder/transactionBuilder.ts \
  packages/ts-sdk/CHANGELOG.md
git commit -m "feat: convert plain script arguments from bytecode ABI"
git push -u origin greg/script-bytecode-abi-5261
pnpm --filter @aptos-labs/ts-sdk exec vitest run --config vitest.config.unit.ts \
  tests/unit/transactions/scriptAbi.test.ts \
  tests/unit/transactions/transactionBuilder.test.ts \
  tests/unit/scriptTransactionArguments.test.ts
```

Expected: PASS.

### Task 3: Verify the SDK change

**Files:**
- Modify only files requiring formatting or fixes discovered by verification.

**Interfaces:**
- Consumes: completed parser and builder integration.
- Produces: CI-aligned verification evidence.

- [ ] **Step 1: Format, commit any formatting changes, and push before broad verification**

```bash
pnpm fmt
git add packages/ts-sdk docs/superpowers
git diff --cached --quiet || git commit -m "style: format script ABI support"
git push -u origin greg/script-bytecode-abi-5261
```

- [ ] **Step 2: Run package checks and build**

```bash
pnpm check
pnpm turbo run build --filter=@aptos-labs/ts-sdk
```

Expected: both commands exit 0.

- [ ] **Step 3: Run the TS SDK unit suite**

```bash
TMPDIR=/tmp pnpm --filter @aptos-labs/ts-sdk unit-test
```

Expected: all unit tests pass.

- [ ] **Step 4: Inspect the final diff**

```bash
git diff --check origin/main...HEAD
git status --short --branch
```

Expected: no whitespace errors and a clean working tree.
