# Script Bytecode ABI Parsing Design

## Context

Script payloads currently bypass the transaction builder's ABI conversion path. As a result, every
`InputScriptData.functionArguments` value must already be an SDK BCS wrapper such as `U64` or `Bool`.
Those class instances are inconvenient for JSON-based callers, even though compiled Move scripts
already contain the `main` function's type parameters and parameter signature.

## Goals

- Parse a compiled Move script's callable ABI locally from its bytecode.
- Automatically convert JSON-compatible script arguments through the existing ABI conversion logic.
- Preserve all existing script payload calls that pass BCS wrapper or `Serialized` instances.
- Work in browsers, React Native, Node.js, Bun, and Deno without Node-only APIs.
- Keep custom struct support explicit: callers continue to pass custom values as `Serialized`.

## Non-goals

- Implement a general-purpose Move bytecode disassembler or verifier.
- Fetch module ABIs or other data from a fullnode.
- Convert plain JavaScript objects for custom structs or enums.
- Parse module bytecode; this feature only accepts compiled scripts.

## Public API

Add a `ScriptABI` type with the same conversion fields as `FunctionABI` plus the number of leading
signer parameters:

```typescript
export type ScriptABI = FunctionABI & {
  signers: number;
};
```

Export a synchronous helper:

```typescript
export function parseScriptAbi(bytecode: HexInput): ScriptABI;
```

`InputScriptData.functionArguments` will accept both the current `ScriptFunctionArgumentTypes` and
`SimpleEntryFunctionArgumentTypes`. Existing wrapper-based code remains valid, while callers can
write JSON-compatible payloads such as:

```typescript
{
  bytecode: "0xa11c...",
  typeArguments: [],
  functionArguments: [627, true, "100000", false],
}
```

No `aptosConfig` or network request is required.

## Bytecode Parser

The parser will be a focused, dependency-free implementation of the portions of the Aptos Move
binary format needed to resolve the compiled script's `main` signature:

1. Validate the Move magic bytes and decode the masked bytecode version.
2. Decode and bounds-check the table headers.
3. Decode signature tokens from the signatures table.
4. Decode identifier, address, module-handle, and struct-handle tables so struct signature tokens can
   be represented as SDK `TypeTagStruct` values.
5. Read the script trailer's type-parameter abilities and main parameter-signature index.
6. Count and remove only the leading `signer`, `&signer`, and `&mut signer` parameters supplied by
   transaction authentication.
7. Return the remaining parameters as SDK `TypeTag` instances and generic constraints as
   `MoveFunctionGenericTypeParam` values.

The reader will enforce byte bounds, canonical finite ULEB128 values, non-overlapping table ranges,
valid table references, and the currently supported Aptos bytecode versions. It will parse primitive,
signed-integer, vector, generic, reference, struct, and struct-instantiation tokens. A function
signature token in a callable parameter will produce an unsupported-type error because the SDK has
no corresponding transaction argument `TypeTag`.

## Automatic Argument Conversion

The script branch of `generateTransactionPayload` will:

1. Detect whether at least one function argument lacks `serializeForScriptFunction`. If every
   argument is already a script wrapper (including an empty argument list), construct the payload
   through the existing path without parsing its bytecode.
2. When conversion is needed, parse the ABI from `bytecode`.
3. Standardize and validate `typeArguments` against the parsed generic count.
4. Validate the caller-provided argument count against the parsed non-signer parameters.
5. Pass any existing value with `serializeForScriptFunction` through unchanged, preserving current
   BCS wrapper and `Serialized` behavior.
6. Convert each remaining plain value with the existing `convertArgument` logic and its corresponding
   parsed `TypeTag`.
7. Use the converted script-capable wrapper directly. If conversion returns an entry-only wrapper,
   encode its raw BCS bytes as `Serialized`.
8. Construct the existing `Script` and `TransactionPayloadScript` classes unchanged.

Multisig script payloads use the same conversion path before being wrapped in
`TransactionPayloadMultiSig`.

## Errors

When ABI parsing is requested directly or triggered by a plain argument, malformed or unsupported
bytecode will fail before payload construction with an error identifying the invalid header, table,
signature token, or reference. Type-argument and function-argument count errors will use the existing
transaction builder wording where possible. Plain custom struct or enum objects will continue to
fail with guidance to provide `Serialized` BCS bytes.

## Compatibility

- Wrapper-only and empty-argument payloads follow the current no-parse path.
- Existing wrapper inputs in mixed payloads are passed through without conversion or additional type
  checks.
- Script payload serialization classes and transaction wire formats do not change.
- The parser uses `Uint8Array`, `DataView`, and existing SDK types only.
- No dependency is added, avoiding WASM initialization and bundle-size/runtime compatibility costs.

## Testing

Unit tests will use real compiled-script fixtures already represented in the repository to verify:

- extraction of leading signers, generic constraints, primitives, vectors, and struct references;
- automatic conversion of JSON-compatible booleans, numbers, strings, addresses, and arrays;
- unchanged identity and serialization of existing BCS wrapper and `Serialized` arguments;
- script and multisig-script payload construction;
- generic and function argument count validation; and
- malformed magic, unsupported versions, truncated data, invalid table references, and unsupported
  signature-token errors.

The focused unit tests will run before the package-wide formatter, checker, build, and unit suite.
