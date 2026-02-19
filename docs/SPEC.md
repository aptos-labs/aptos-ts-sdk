# Aptos TypeScript SDK Specification

**Package:** `@aptos-labs/ts-sdk`
**Version:** 6.0.0
**License:** Apache-2.0
**Runtime:** Node.js >= 20.0.0
**Module Formats:** CommonJS (`dist/common/index.js`) and ESM (`dist/esm/index.mjs`)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Configuration](#3-configuration)
4. [Account System](#4-account-system)
5. [Cryptographic Primitives](#5-cryptographic-primitives)
6. [Transaction System](#6-transaction-system)
7. [BCS Serialization](#7-bcs-serialization)
8. [HTTP Client Layer](#8-http-client-layer)
9. [API Surface](#9-api-surface)
10. [Keyless Authentication](#10-keyless-authentication)
11. [Account Abstraction](#11-account-abstraction)
12. [Digital Assets (NFTs)](#12-digital-assets-nfts)
13. [Fungible Assets](#13-fungible-assets)
14. [Aptos Name Service (ANS)](#14-aptos-name-service-ans)
15. [Error Handling](#15-error-handling)
16. [Constants and Defaults](#16-constants-and-defaults)
17. [Network Endpoints](#17-network-endpoints)
18. [Type System](#18-type-system)
19. [Assumptions and Preferences](#19-assumptions-and-preferences)
20. [Edge Behaviors](#20-edge-behaviors)

---

## 1. Overview

The Aptos TypeScript SDK is a comprehensive client library for interacting with the Aptos blockchain. It provides:

- Account management (creation, signing, key rotation)
- Transaction building, signing, simulation, and submission
- Blockchain data querying via full node REST API and GraphQL indexer
- Digital asset (NFT) and fungible asset management
- Keyless authentication via OIDC providers
- Account abstraction with dispatchable authentication
- Aptos Name Service (ANS) integration
- BCS (Binary Canonical Serialization) encoding/decoding
- Staking and delegation operations

### 1.1 Primary Entry Point

The `Aptos` class is the primary user-facing interface. It aggregates all domain-specific functionality through composition:

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
```

### 1.2 Public Exports

The SDK SHALL export all public types and classes from these modules via `src/index.ts`:

| Module | Content |
|--------|---------|
| `./account` | Account implementations and utilities |
| `./api` | High-level API classes |
| `./bcs` | BCS serializer/deserializer |
| `./client` | HTTP client layer |
| `./core` | Cryptographic primitives, addresses, hex |
| `./errors` | Error types |
| `./transactions` | Transaction types, builders, authenticators |
| `./transactions/management` | Transaction batch management |
| `./types` | TypeScript types and generated indexer types |
| `./utils` | Utility functions, constants, API endpoints |

---

## 2. Architecture

### 2.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Aptos (Main Class)                     │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │ account  │  coin    │  ans     │ keyless  │ object │ │
│  │ digital  │ fungible │ staking  │ general  │ table  │ │
│  │ Asset    │ Asset    │          │          │        │ │
│  │ faucet   │ abstrac  │transaction                   │ │
│  └──────────┴──────────┴──────────┴──────────┴────────┘ │
├─────────────────────────────────────────────────────────┤
│                   Internal Layer                         │
│  (src/internal/ - Implementation of API methods)         │
├─────────────────────────────────────────────────────────┤
│                Transaction Builder Layer                  │
│  (src/transactions/ - Payload, signing, authenticators)  │
├─────────────────────────────────────────────────────────┤
│                     HTTP Client Layer                     │
│  (src/client/ - GET/POST, pagination, error handling)    │
├─────────────────────────────────────────────────────────┤
│               Core / Cryptographic Layer                  │
│  (src/core/ - Keys, signatures, addresses, BCS)          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Composition Pattern

The `Aptos` class SHALL use composition (not inheritance) to aggregate domain APIs:

```typescript
class Aptos {
  readonly config: AptosConfig;
  readonly account: AccountAPI;
  readonly abstraction: AccountAbstraction;
  readonly ans: ANS;
  readonly coin: Coin;
  readonly digitalAsset: DigitalAsset;
  readonly faucet: Faucet;
  readonly fungibleAsset: FungibleAsset;
  readonly general: General;
  readonly keyless: Keyless;
  readonly object: AptosObject;
  readonly staking: Staking;
  readonly table: Table;
  readonly transaction: Transaction;
}
```

Each domain API class SHALL receive `AptosConfig` in its constructor and delegate to internal implementation functions.

---

## 3. Configuration

### 3.1 AptosConfig Class

The `AptosConfig` class SHALL be the sole configuration mechanism for the SDK.

**Constructor:**

```typescript
new AptosConfig(settings?: AptosSettings)
```

**AptosSettings Interface:**

```json
{
  "network": "Network enum (MAINNET | TESTNET | DEVNET | SHELBYNET | NETNA | LOCAL | CUSTOM)",
  "fullnode": "string | undefined - Custom full node REST API URL",
  "faucet": "string | undefined - Custom faucet URL",
  "indexer": "string | undefined - Custom indexer GraphQL URL",
  "pepper": "string | undefined - Custom pepper service URL (for keyless)",
  "prover": "string | undefined - Custom prover service URL (for keyless)",
  "client": "Client | undefined - Custom HTTP client implementation",
  "clientConfig": {
    "API_KEY": "string | undefined",
    "HEADERS": "Record<string, string | number | boolean> | undefined",
    "WITH_CREDENTIALS": "boolean | undefined",
    "http2": "boolean | undefined - Default: true (except for Bun)"
  },
  "fullnodeConfig": {
    "HEADERS": "Record<string, string | number | boolean> | undefined"
  },
  "indexerConfig": {
    "HEADERS": "Record<string, string | number | boolean> | undefined"
  },
  "faucetConfig": {
    "AUTH_TOKEN": "string | undefined",
    "HEADERS": "Record<string, string | number | boolean> | undefined"
  },
  "transactionGenerationConfig": {
    "defaultMaxGasAmount": "number | undefined - Default: 200000",
    "defaultTxnExpirySecFromNow": "number | undefined - Default: 20"
  },
  "pluginSettings": {
    "TRANSACTION_SUBMITTER": "TransactionSubmitter | undefined"
  }
}
```

### 3.2 Configuration Behaviors

1. **Default network** SHALL be `Network.DEVNET` when no network is specified.
2. If custom endpoint URLs are provided (`fullnode`, `indexer`, `faucet`, `pepper`, `prover`) without a `network`, the constructor SHALL throw an error: `"Custom endpoints require a network to be specified"`.
3. If `network` is `Network.CUSTOM`, the SDK SHALL log an info message: `"Note: using CUSTOM network will require queries to lookup ChainId"`.
4. If running in Bun and `clientConfig.http2` is not explicitly `false`, the SDK SHALL log a warning recommending disabling HTTP/2.
5. When `network` is `CUSTOM` and a required endpoint URL is not provided, `getRequestUrl()` SHALL throw an error describing which URL is missing.
6. Faucet is NOT available for `MAINNET` or `TESTNET` programmatically. Requests SHALL throw with appropriate error messages.

### 3.3 TransactionSubmitter Plugin

The SDK SHALL support a plugin mechanism for overriding transaction submission behavior:

```typescript
interface TransactionSubmitter {
  submitTransaction(args: {
    aptosConfig: AptosConfig;
    transaction: AnyRawTransaction;
    senderAuthenticator: AccountAuthenticator;
    secondarySignerAuthenticators?: { feePayerAuthenticator?: AccountAuthenticator; additionalSignersAuthenticators?: AccountAuthenticator[] };
    pluginParams?: any;
  }): Promise<PendingTransactionResponse>;
}
```

- `setIgnoreTransactionSubmitter(ignore: boolean)` SHALL allow toggling the plugin at runtime.
- `getTransactionSubmitter()` SHALL return `undefined` when either no plugin is set or `IGNORE_TRANSACTION_SUBMITTER` is `true`.

---

## 4. Account System

### 4.1 Account Abstract Interface

The `Account` abstract class SHALL define the interface all account types implement:

```typescript
abstract class Account {
  abstract readonly accountAddress: AccountAddress;
  abstract readonly publicKey: AccountPublicKey;
  abstract readonly signingScheme: SigningScheme;

  abstract signTransaction(transaction: AnyRawTransaction): Signature;
  abstract signTransactionWithAuthenticator(transaction: AnyRawTransaction): AccountAuthenticator;
  abstract signWithAuthenticator(message: HexInput): AccountAuthenticator;
  abstract sign(message: HexInput): Signature;
}
```

### 4.2 Account Types

| Type | Signing Scheme | Description |
|------|---------------|-------------|
| `Ed25519Account` | `SigningScheme.Ed25519` | Legacy Ed25519 single-key account |
| `SingleKeyAccount` | `SigningScheme.SingleKey` | Single key using AnyPublicKey (Ed25519, Secp256k1, Secp256r1) |
| `MultiKeyAccount` | `SigningScheme.MultiKey` | M-of-N multi-key account |
| `MultiEd25519Account` | `SigningScheme.MultiEd25519` | Legacy M-of-N Ed25519 multi-sig |
| `KeylessAccount` | `SigningScheme.SingleKey` | OIDC-based keyless account |
| `FederatedKeylessAccount` | `SigningScheme.SingleKey` | Federated keyless account with custom JWK address |
| `AbstractedAccount` | `SigningScheme.Abstraction` | Account with custom on-chain authentication |
| `DerivableAbstractedAccount` | `SigningScheme.Abstraction` | Abstracted account with derivable addresses |

### 4.3 Account Factory Methods

#### `Account.generate(args?)`

```typescript
static generate(args?: GenerateEd25519AccountArgs): Ed25519Account;
static generate(args: GenerateEd25519SingleKeyAccountArgs): SingleKeyAccount;
static generate(args: GenerateSecp256k1AccountArgs): SingleKeyAccount;
```

- Default (no args) SHALL generate an `Ed25519Account` (legacy).
- `{ legacy: false }` SHALL generate a `SingleKeyAccount` with Ed25519.
- `{ scheme: SigningSchemeInput.Secp256k1Ecdsa }` SHALL generate a `SingleKeyAccount` with Secp256k1.

#### `Account.fromPrivateKey(args)`

```typescript
static fromPrivateKey(args: CreateEd25519AccountFromPrivateKeyArgs): Ed25519Account;
static fromPrivateKey(args: CreateEd25519SingleKeyAccountFromPrivateKeyArgs): SingleKeyAccount;
static fromPrivateKey(args: CreateSingleKeyAccountFromPrivateKeyArgs): SingleKeyAccount;
```

- If `privateKey` is `Ed25519PrivateKey` and `legacy` is `true` (or omitted), SHALL return `Ed25519Account`.
- If `privateKey` is `Ed25519PrivateKey` and `legacy` is `false`, SHALL return `SingleKeyAccount`.
- If `privateKey` is not `Ed25519PrivateKey`, SHALL return `SingleKeyAccount` regardless of `legacy`.

#### `Account.fromDerivationPath(args)`

```typescript
static fromDerivationPath(args: {
  path: string;
  mnemonic: string;
  scheme?: SigningSchemeInput;
  legacy?: boolean;
}): Ed25519Account | SingleKeyAccount;
```

- SHALL derive a private key from BIP-39 mnemonic and BIP-44 derivation path.
- Default path format: `m/44'/637'/{index}'/0'/0'`.
- Supported schemes: Ed25519 (default), Secp256k1.

### 4.4 AccountUtils Namespace

The `AccountUtils` namespace SHALL provide serialization utilities:

- `toBytes(account: Account): Uint8Array` - Serialize account to bytes
- `toHexString(account: Account): string` - Serialize to hex string with `0x` prefix
- `toHexStringWithoutPrefix(account: Account): string` - Serialize without prefix
- `fromHex(hex: HexInput): Account` - Deserialize from hex
- `fromBytes(bytes: Uint8Array): Account` - Deserialize from bytes
- `deserialize(deserializer: Deserializer): Account` - BCS deserialization
- Type-specific deserializers: `keylessAccountFromHex`, `federatedKeylessAccountFromHex`, `multiKeyAccountFromHex`, `singleKeyAccountFromHex`, `ed25519AccountFromHex`

### 4.5 Serialization Format

Account serialization format SHALL be:

```
[SigningScheme as ULEB128] [AccountAddress (32 bytes)] [Scheme-specific data]
```

- **Ed25519:** `[Ed25519PrivateKey]`
- **SingleKey:** `[AnyPublicKeyVariant as ULEB128] [Variant-specific data]`
  - Ed25519/Secp256k1: `[PrivateKey]`
  - Keyless: `[jwt, uidKey, pepper, ephemeralKeyPair, proof, verificationKeyHash?]`
  - FederatedKeyless: `[jwt, uidKey, pepper, ephemeralKeyPair, proof, verificationKeyHash?, jwkAddress, audless]`
- **MultiKey:** `[MultiKey] [signers count as ULEB128] [signer1 bytes] [signer2 bytes] ...`

---

## 5. Cryptographic Primitives

### 5.1 Key Types

| Class | Length | Description |
|-------|--------|-------------|
| `Ed25519PublicKey` | 32 bytes | Ed25519 public key |
| `Ed25519PrivateKey` | 32 bytes | Ed25519 private key |
| `Ed25519Signature` | 64 bytes | Ed25519 signature |
| `Secp256k1PublicKey` | 65 bytes (uncompressed) or 33 bytes (compressed) | ECDSA secp256k1 public key |
| `Secp256k1PrivateKey` | 32 bytes | ECDSA secp256k1 private key |
| `Secp256k1Signature` | 64 bytes | ECDSA secp256k1 signature |
| `Secp256r1PublicKey` | 65 bytes (uncompressed) or 33 bytes (compressed) | ECDSA secp256r1 public key |
| `Secp256r1PrivateKey` | 32 bytes | ECDSA secp256r1 private key |
| `Secp256r1Signature` | 64 bytes | ECDSA secp256r1 signature |
| `MultiEd25519PublicKey` | variable | M-of-N Ed25519 public keys |
| `MultiKey` | variable | M-of-N keys of any type |
| `KeylessPublicKey` | variable | Keyless (iss + idCommitment) |
| `FederatedKeylessPublicKey` | variable | Federated keyless with JWK address |

### 5.2 AnyPublicKey Variants

```typescript
enum AnyPublicKeyVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  Secp256r1 = 2,
  Keyless = 3,
  FederatedKeyless = 4,
  SlhDsaSha2_128s = 5  // Post-quantum (not yet fully implemented)
}
```

### 5.3 AnySignature Variants

```typescript
enum AnySignatureVariant {
  Ed25519 = 0,
  Secp256k1 = 1,
  WebAuthn = 2,
  Keyless = 3,
  SlhDsaSha2_128s = 4  // Post-quantum (not yet fully implemented)
}
```

### 5.4 AIP-80 Private Key Format

Private keys SHALL support AIP-80 format for import/export:

- Ed25519: `ed25519-priv-<hex>`
- Secp256k1: `secp256k1-priv-<hex>`
- Secp256r1: `secp256r1-priv-<hex>`

```typescript
PrivateKey.formatPrivateKey(privateKeyHex: string, type: PrivateKeyVariants): string
```

### 5.5 AccountAddress

- SHALL be exactly 32 bytes.
- SHALL support `0x` hex string representation.
- SHALL support short form (leading zeros omitted) and long form.
- Special addresses (0x0 through 0xf) SHALL use short form by default.
- `AccountAddress.from(input)` SHALL accept `string | AccountAddress`.
- `AccountAddress.ZERO` SHALL be the all-zeros address.

### 5.6 AuthenticationKey

- SHALL be 32 bytes derived from the public key using the appropriate scheme.
- Derivation: `SHA3-256(publicKeyBytes || signingScheme)`.
- For MultiKey: `SHA3-256(bcs_serialize(multikey) || MultiKey scheme byte)`.

---

## 6. Transaction System

### 6.1 Transaction Flow

The standard transaction flow SHALL be:

```
Build → Sign → Submit → Wait
```

#### Transaction Lifecycle Diagram

```
                          ┌─────────────────────┐
                          │   BUILD TRANSACTION  │
                          │                      │
                          │ • Fetch ABI (cached) │
                          │ • Fetch sequence num │
                          │ • Fetch gas price    │
                          │ • Fetch chain ID     │
                          └──────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                 │
              ┌─────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
              │   Simple    │  │ Multi-Agent │  │  Fee Payer  │
              │ Transaction │  │ Transaction │  │ Transaction │
              └─────┬──────┘  └─────┬──────┘  └──────┬──────┘
                    │                │                 │
                    │         ┌──────▼──────────────────▼──────┐
                    │         │  SIGN (each signer signs same  │
                    │         │  MultiAgent/FeePayer message)   │
                    │         │                                 │
                    │         │  Primary: sign(rawTxn)          │
                    │         │  Secondary[]: sign(rawTxn)      │
                    │         │  FeePayer?: signAsFeePayer(txn)  │
                    │         └──────────────┬──────────────────┘
              ┌─────▼──────┐                 │
              │    SIGN     │                 │
              │ sign(rawTxn)│                 │
              └─────┬──────┘                 │
                    │                        │
                    └───────────┬─────────────┘
                                │
                     ┌──────────▼───────────┐
                     │  SUBMIT (POST /txns) │
                     │  BCS-serialized      │
                     │  SignedTransaction    │
                     └──────────┬───────────┘
                                │
                     ┌──────────▼───────────┐
                     │       WAIT           │
                     │ 1. GET by_hash       │
                     │ 2. GET wait_by_hash  │
                     │ 3. Poll with backoff │
                     │ 4. Wait for indexer  │
                     └──────────┬───────────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │               │
          ┌──────▼──────┐ ┌────▼─────┐  ┌──────▼──────┐
          │   Success    │ │ Timeout  │  │   Failed    │
          │ Committed    │ │WaitFor   │  │FailedTxn    │
          │ TxnResponse  │ │TxnError  │  │Error        │
          └─────────────┘ └──────────┘  └─────────────┘
```

#### 6.1.1 Build

```typescript
// Simple transaction
const txn = await aptos.transaction.build.simple({
  sender: senderAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [recipientAddress, amount],
  },
  options?: InputGenerateTransactionOptions,
  withFeePayer?: boolean,
});

// Multi-agent transaction
const txn = await aptos.transaction.build.multiAgent({
  sender: senderAddress,
  data: { ... },
  secondarySignerAddresses: [addr1, addr2],
  options?: InputGenerateTransactionOptions,
  withFeePayer?: boolean,
});
```

#### 6.1.2 Sign

```typescript
const senderAuth = aptos.transaction.sign({ signer: account, transaction: txn });
const feePayerAuth = aptos.transaction.signAsFeePayer({ signer: feePayer, transaction: txn });
```

#### 6.1.3 Submit

```typescript
const pending = await aptos.transaction.submit.simple({
  transaction: txn,
  senderAuthenticator: senderAuth,
  feePayerAuthenticator?: feePayerAuth,
});
```

#### 6.1.4 Wait

```typescript
const committed = await aptos.waitForTransaction({
  transactionHash: pending.hash,
  options?: {
    timeoutSecs?: number,     // Default: 20
    checkSuccess?: boolean,   // Default: true
    waitForIndexer?: boolean, // Default: true
  },
});
```

**waitForTransaction Retry Protocol:**

```
┌──────────────────────────────────────────────────┐
│  waitForTransaction(hash, options)                │
│  backoff = 200ms, multiplier = 1.5x              │
│  timeout = options.timeoutSecs ?? 20              │
└──────────────┬───────────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │  GET /transactions/ │
    │  by_hash/{hash}     │───── 404 ──────────────────┐
    └──────────┬──────────┘                             │
               │                                        │
         type == pending?                         isPending = true
               │                                        │
        ┌──Yes─┴───No──┐                               │
        │               │                               │
        ▼               ▼                               │
  isPending=true   RETURN result                        │
        │                                               │
        └──────────────┬────────────────────────────────┘
                       │
            ┌──────────▼──────────┐
            │  GET /transactions/ │
            │  wait_by_hash/{hash}│ (server blocks until settled)
            └──────────┬──────────┘
                       │
                 404 or 5xx? ──Yes──┐
                       │             │
                       No            │
                       │             │
                 type == pending?    │
                  Yes──┤──No         │
                       │    │        │
                       │  RETURN     │
                       │             │
         ┌─────────────▼─────────────▼──────────┐
         │  POLLING LOOP                         │
         │  while isPending && time < timeout:   │
         │    sleep(backoff)                     │
         │    GET /transactions/by_hash/{hash}   │
         │      404, 5xx → continue              │
         │      4xx (not 404) → THROW            │
         │      not pending → BREAK              │
         │    backoff *= 1.5                     │
         └──────────────┬───────────────────────┘
                        │
              ┌─────────▼─────────┐
              │  Still pending?   │
              │                   │
              │  Yes → THROW      │
              │  WaitForTxnError  │
              │                   │
              │  No + failed →    │
              │  THROW FailedTxn  │
              │  Error            │
              │                   │
              │  No + success →   │
              │  RETURN committed │
              └───────────────────┘
```

**Error classification during polling:**
- **404**: Transaction not yet visible — SHALL retry.
- **4xx (not 404)**: Client error — SHALL throw immediately.
- **5xx**: Server error — SHALL retry.

#### 6.1.5 Combined Sign and Submit

```typescript
const pending = await aptos.signAndSubmitTransaction({
  signer: account,
  transaction: txn,
  feePayer?: feePayerAccount,       // Optional fee payer
  feePayerAuthenticator?: auth,      // Or pre-signed fee payer auth
});
```

### 6.2 Transaction Types

#### SimpleTransaction

```typescript
class SimpleTransaction {
  readonly rawTransaction: RawTransaction;
  readonly feePayerAddress?: AccountAddress;
  readonly secondarySignerAddresses: undefined;
}
```

- SHALL be used for single-signer transactions.
- COULD have an optional fee payer.

#### MultiAgentTransaction

```typescript
class MultiAgentTransaction {
  readonly rawTransaction: RawTransaction;
  readonly secondarySignerAddresses: AccountAddress[];
  readonly feePayerAddress?: AccountAddress;
}
```

- SHALL be used when multiple accounts must authorize a transaction.
- COULD have an optional fee payer.

#### RawTransaction

```typescript
class RawTransaction {
  readonly sender: AccountAddress;
  readonly sequence_number: bigint;
  readonly payload: TransactionPayload;
  readonly max_gas_amount: bigint;
  readonly gas_unit_price: bigint;
  readonly expiration_timestamp_secs: bigint;
  readonly chain_id: ChainId;
}
```

### 6.3 Transaction Payloads

#### Entry Function Payload

```typescript
{
  function: MoveFunctionId,         // "0x1::module::function"
  functionArguments: Array<any>,    // Arguments (auto-converted via ABI)
  typeArguments?: Array<string>,    // Generic type parameters
  abi?: EntryFunctionABI,           // Optional pre-fetched ABI
}
```

- The SDK SHALL automatically fetch the ABI from the blockchain if not provided.
- ABI results SHALL be cached with a 5-minute TTL using `memoizeAsync`.
- Function arguments SHALL be validated against ABI parameter count and types.
- Type arguments SHALL be validated against ABI type parameter count.

#### Script Payload

```typescript
{
  bytecode: HexInput,
  functionArguments: Array<ScriptFunctionArgument>,
  typeArguments?: Array<TypeTag>,
}
```

#### Multi-sig Payload

```typescript
{
  multisigAddress: AccountAddressInput,
  function: MoveFunctionId,
  functionArguments: Array<any>,
  typeArguments?: Array<string>,
  abi?: EntryFunctionABI,
}
```

### 6.4 Transaction Generation Options

```typescript
interface InputGenerateTransactionOptions {
  maxGasAmount?: number;          // Default: 200000
  gasUnitPrice?: number;          // Default: fetched from chain
  expireTimestamp?: number;       // Default: now + 20 seconds
  accountSequenceNumber?: AnyNumber; // Default: fetched from chain
  replayProtectionNonce?: AnyNumber; // For orderless transactions (mutually exclusive with accountSequenceNumber)
}
```

- When `replayProtectionNonce` is provided, the transaction SHALL use the orderless (inner payload) format.
- `accountSequenceNumber` and `replayProtectionNonce` SHALL be mutually exclusive.
- When neither is provided, `accountSequenceNumber` SHALL be fetched from the chain.

### 6.5 Transaction Simulation

```typescript
const result = await aptos.transaction.simulate.simple({
  signerPublicKey?: PublicKey,     // Optional (simulation uses invalid signatures)
  transaction: AnyRawTransaction,
  feePayerPublicKey?: PublicKey,
  options?: {
    estimateGasUnitPrice?: boolean,
    estimateMaxGasAmount?: boolean,
    estimatePrioritizedGasUnitPrice?: boolean,
  },
});
```

- Simulation SHALL NOT require real signatures.
- Simulation SHALL return gas usage, events, and execution status.
- Simulation SHALL POST to `/transactions/simulate` endpoint.

### 6.6 Transaction Signing Message

The signing message for a transaction SHALL be computed as:

```
SHA3-256("APTOS::RawTransaction" || BCS(raw_transaction))
```

For multi-agent and fee payer transactions:

```
SHA3-256("APTOS::RawTransactionWithData" || BCS(variant_index) || BCS(raw_transaction) || BCS(additional_data))
```

### 6.7 Transaction Authenticators

#### Account Authenticators (per-account signatures)

| Variant | Index | Description |
|---------|-------|-------------|
| `AccountAuthenticatorEd25519` | 0 | Legacy Ed25519 |
| `AccountAuthenticatorMultiEd25519` | 1 | Legacy multi-Ed25519 |
| `AccountAuthenticatorSingleKey` | 2 | Single key (any type) |
| `AccountAuthenticatorMultiKey` | 3 | Multi-key |
| `AccountAuthenticatorNoAccountAuthenticator` | 4 | Simulation placeholder |
| `AccountAuthenticatorAbstraction` | 5 | Abstracted account |

#### Transaction Authenticators (wrapping all signatures)

| Variant | Index | Description |
|---------|-------|-------------|
| `TransactionAuthenticatorEd25519` | 0 | Single Ed25519 signer |
| `TransactionAuthenticatorMultiEd25519` | 1 | Multi-Ed25519 signer |
| `TransactionAuthenticatorMultiAgent` | 2 | Multiple signers |
| `TransactionAuthenticatorFeePayer` | 3 | With fee payer |
| `TransactionAuthenticatorSingleSender` | 4 | Single sender (any key) |

### 6.8 Signed Transaction Submission

The final signed transaction SHALL be serialized as:

```
BCS(SignedTransaction { raw_txn: RawTransaction, authenticator: TransactionAuthenticator })
```

And submitted via:

```
POST /transactions
Content-Type: application/x.aptos.signed_transaction+bcs
Body: <BCS bytes>
```

### 6.9 Multi-Agent and Fee Payer Signing Details

#### Multi-Agent Signing

All signers (primary and secondary) SHALL sign the **same** `MultiAgentRawTransaction` object:

```
Signing message = SHA3("APTOS::RawTransactionWithData") || BCS(MultiAgentRawTransaction)

MultiAgentRawTransaction BCS serialization:
  [rawTransaction]
  [secondarySignerAddresses as vector<AccountAddress>]
```

Each signer produces an independent `AccountAuthenticator`. The primary signer's authenticator and all secondary authenticators are combined into `TransactionAuthenticatorMultiAgent`.

#### Fee Payer Signing

When a fee payer is present, **all signers** (including the fee payer) SHALL sign a `FeePayerRawTransaction`:

```
Signing message = SHA3("APTOS::RawTransactionWithData") || BCS(FeePayerRawTransaction)

FeePayerRawTransaction BCS serialization:
  [rawTransaction]
  [secondarySignerAddresses as vector<AccountAddress>]
  [feePayerAddress: AccountAddress]
```

The resulting authenticators are combined into `TransactionAuthenticatorFeePayer`:

```
TransactionAuthenticatorFeePayer BCS serialization:
  [variant: 3 as u32]
  [senderAuthenticator: AccountAuthenticator]
  [secondarySignerAddresses: vector<AccountAddress>]
  [secondaryAuthenticators: vector<AccountAuthenticator>]
  [feePayerAddress: AccountAddress]
  [feePayerAuthenticator: AccountAuthenticator]
```

### 6.10 Transaction Batch Management

The SDK SHALL export batch transaction management via `./transactions/management`:

#### 6.10.1 TransactionWorker

`TransactionWorker` SHALL extend `EventEmitter` and provide batch transaction processing:

```typescript
class TransactionWorker extends EventEmitter<TransactionWorkerEvents> {
  constructor(
    aptosConfig: AptosConfig,
    account: Account,
    maxWaitTime?: number,      // Default: 30 seconds
    maximumInFlight?: number,  // Default: 100
    sleepTime?: number,        // Default: 10 seconds
  );

  // Start processing
  start(): void;

  // Add transaction to queue
  push(payload: InputGenerateTransactionPayloadData, options?: InputGenerateTransactionOptions): Promise<void>;
}
```

**Events:**

| Event | Data | Description |
|-------|------|-------------|
| `TransactionSent` | `{ message, transactionHash }` | Transaction submitted to chain |
| `TransactionSendFailed` | `{ message, error }` | Submission pre-execution failed |
| `TransactionExecuted` | `{ message, transactionHash }` | Transaction committed on-chain |
| `TransactionExecutionFailed` | `{ message, error }` | On-chain execution failed |
| `ExecutionFinish` | `{ message }` | Batch processing complete |

**Worker Architecture Diagram:**

```
                    push(payload)
                         │
                         ▼
              ┌──────────────────┐
              │ transactionsQueue │  (AsyncQueue of payloads)
              │ (input buffer)    │
              └────────┬─────────┘
                       │
          ┌────────────▼────────────┐
          │  submitNextTransaction   │ (loop)
          │  1. Get next seq number  │
          │  2. Build transaction    │
          │  3. Sign & submit        │
          │  4. Push to outstanding  │
          └────────────┬────────────┘
                       │
              ┌────────▼─────────┐
              │ outstandingTxns   │  (AsyncQueue of pending promises)
              └────────┬─────────┘
                       │
          ┌────────────▼────────────┐
          │  processTransactions     │ (loop)
          │  1. Collect pending      │
          │  2. Promise.allSettled   │
          │  3. Emit events          │
          │  4. Wait for execution   │
          └─────────────────────────┘
```

**History Management:**
- `sentTransactions` and `executedTransactions` arrays SHALL track up to 10,000 entries each.
- When capacity is exceeded, the oldest ~10% (1,000 entries) SHALL be evicted.

#### 6.10.2 AccountSequenceNumber

`AccountSequenceNumber` SHALL manage concurrent sequence number allocation:

```typescript
class AccountSequenceNumber {
  constructor(
    aptosConfig: AptosConfig,
    account: Account,
    maxWaitTime: number,      // Default: 30 seconds
    maximumInFlight: number,  // Default: 100
    sleepTime: number,        // Default: 10 seconds
  );

  async nextSequenceNumber(): Promise<bigint | null>;
  async synchronize(): Promise<void>;
}
```

**Sequence Number Windowing:**

```
On-chain committed: lastUncommintedNumber = N
Local allocated:    currentNumber = N + K

Window = currentNumber - lastUncommintedNumber

If window >= maximumInFlight (100):
  → Query on-chain for latest committed sequence
  → Wait and retry until window shrinks
  → If waited > maxWaitTime (30s): reinitialize from on-chain
```

- `nextSequenceNumber()` SHALL use a lock to prevent concurrent access.
- When the queue is empty, SHALL return `null`.
- On initialization, SHALL fetch the on-chain sequence number via `GET /accounts/{address}`.

---

## 7. BCS Serialization

### 7.1 Serializer

The `Serializer` class SHALL provide these serialization methods:

| Method | Input Type | BCS Format |
|--------|-----------|------------|
| `serializeBool` | boolean | 1 byte: 0x00 or 0x01 |
| `serializeU8` | number | 1 byte unsigned |
| `serializeU16` | number | 2 bytes LE |
| `serializeU32` | number | 4 bytes LE |
| `serializeU64` | bigint/number | 8 bytes LE |
| `serializeU128` | bigint | 16 bytes LE |
| `serializeU256` | bigint | 32 bytes LE |
| `serializeI8` | number | 1 byte signed (two's complement) |
| `serializeI16` | number | 2 bytes LE signed |
| `serializeI32` | number | 4 bytes LE signed |
| `serializeI64` | bigint | 8 bytes LE signed |
| `serializeI128` | bigint | 16 bytes LE signed |
| `serializeI256` | bigint | 32 bytes LE signed |
| `serializeStr` | string | ULEB128 length + UTF8 bytes |
| `serializeBytes` | Uint8Array | ULEB128 length + bytes |
| `serializeFixedBytes` | Uint8Array | bytes only (no length prefix) |
| `serializeU32AsUleb128` | number | Variable-length ULEB128 |
| `serializeVector` | T[] | ULEB128 count + serialized items |
| `serializeOption` | T \| undefined | 0x00 (none) or 0x01 + serialized value |

**Buffer Management:**
- Initial buffer size: 64 bytes.
- Growth strategy: max(current * 1.5, current + needed), minimum 256 byte increment.
- Object pooling: up to 8 Serializer instances in pool for reuse.

### 7.2 Deserializer

The `Deserializer` class SHALL mirror the Serializer with corresponding deserialization methods.

**Security constraints:**
- `deserializeBytes()` SHALL enforce a 10MB maximum length.
- Byte array methods SHALL return copies (not views) to prevent external mutation.
- `assertFinished()` SHALL throw if unconsumed bytes remain.

### 7.3 Serializable Base Class

All BCS-serializable types SHALL extend the `Serializable` abstract class:

```typescript
abstract class Serializable {
  abstract serialize(serializer: Serializer): void;
  bcsToBytes(): Uint8Array;
  bcsToHex(): Hex;
}
```

### 7.4 BCS Constants

```typescript
MAX_U8_NUMBER = 255
MAX_U16_NUMBER = 65535
MAX_U32_NUMBER = 4294967295
MAX_U64_BIG_INT = 18446744073709551615n
MAX_U128_BIG_INT = 340282366920938463463374607431768211455n
MAX_U256_BIG_INT = 115792089237316195423570985008687907853269984665640564039457584007913129639935n

MIN_I8_NUMBER = -128 / MAX_I8_NUMBER = 127
MIN_I16_NUMBER = -32768 / MAX_I16_NUMBER = 32767
MIN_I32_NUMBER = -2147483648 / MAX_I32_NUMBER = 2147483647
// (and corresponding for I64, I128, I256)
```

---

## 8. HTTP Client Layer

### 8.1 Client Interface

```typescript
interface Client {
  provider<Req, Res>(requestOptions: ClientRequest<Req>): Promise<ClientResponse<Res>>;
}
```

The default client implementation SHALL use `@aptos-labs/aptos-client`.

### 8.2 Request Types

```typescript
interface AptosRequest {
  url: string;
  method: "GET" | "POST";
  path?: string;
  body?: any;
  contentType?: string;
  acceptType?: string;
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  originMethod?: string;
  overrides?: ClientConfig & FullNodeConfig & IndexerConfig & FaucetConfig;
}
```

### 8.3 API Types

The SDK SHALL route requests through 5 API types:

```typescript
enum AptosApiType {
  FULLNODE = "Fullnode",
  INDEXER = "Indexer",
  FAUCET = "Faucet",
  PEPPER = "Pepper",
  PROVER = "Prover",
}
```

### 8.4 Automatic Request Headers

Every HTTP request SHALL automatically include these headers:

```json
{
  "x-aptos-client": "aptos-typescript-sdk/{VERSION}",
  "content-type": "application/json",
  "x-aptos-typescript-sdk-origin-method": "{originMethod}"
}
```

Additionally:
- If `overrides.AUTH_TOKEN` is set, SHALL include `Authorization: Bearer {AUTH_TOKEN}`.
- If `overrides.API_KEY` is set, SHALL include `Authorization: Bearer {API_KEY}`.
- If both `AUTH_TOKEN` and `API_KEY` are set, `API_KEY` SHALL take precedence (overwrites `AUTH_TOKEN`).
- `content-type` SHALL be overridden when the payload requires a different MIME type (e.g., BCS).

### 8.5 Response Headers

The SDK SHALL inspect these response headers:
- `x-aptos-cursor`: Opaque pagination cursor for cursor-based pagination. Present when more results are available.
- `traceparent`: W3C trace context header. The SDK SHALL extract the `trace_id` from this header and include it in error messages for debugging.

### 8.6 Per-Endpoint Request Behaviors

#### Full Node (GET and POST)

Full node requests SHALL:
1. Construct the URL from `AptosConfig.getRequestUrl(AptosApiType.FULLNODE)` + path.
2. Merge headers from `clientConfig.HEADERS` and `fullnodeConfig.HEADERS`.
3. Include `API_KEY` as `Authorization: Bearer <key>` if configured.
4. Set `Content-Type` based on the payload (JSON or BCS).
5. Pass `http2` flag from client config.

#### Indexer (POST only)

GraphQL queries to the indexer SHALL:
1. POST to `AptosConfig.getRequestUrl(AptosApiType.INDEXER)`.
2. Send `{ query: string, variables?: {} }` as JSON body.
3. Merge headers from `clientConfig.HEADERS` and `indexerConfig.HEADERS`.
4. Error responses SHALL be detected by the presence of an `.errors` field in the JSON response body, even when the HTTP status is 200.

#### Faucet (POST only)

Faucet requests SHALL:
1. POST to `AptosConfig.getRequestUrl(AptosApiType.FAUCET)`.
2. Explicitly strip `API_KEY` from the client config before sending. The faucet service does NOT accept API keys.
3. Include `AUTH_TOKEN` from `faucetConfig.AUTH_TOKEN` if configured (separate from `API_KEY`).

#### Pepper Service (GET and POST)

Pepper service requests SHALL:
1. Use `AptosConfig.getRequestUrl(AptosApiType.PEPPER)`.
2. Merge headers from `clientConfig.HEADERS`.
3. NOT strip `API_KEY` (pepper service accepts API keys).

#### Prover Service (POST only)

Prover service requests SHALL:
1. Use `AptosConfig.getRequestUrl(AptosApiType.PROVER)`.
2. Merge headers from `clientConfig.HEADERS`.
3. NOT strip `API_KEY` (prover service accepts API keys).

### 8.7 Full Node REST API Endpoint Catalog

The SDK SHALL interact with these full node REST API endpoints:

#### Account Endpoints

**GET /accounts/{address}**
```json
// Response
{
  "sequence_number": "string",
  "authentication_key": "string"
}
```

**GET /accounts/{address}/resources**
```json
// Response
[
  {
    "type": "0x1::module::StructName",
    "data": { ... }
  }
]
```
- Supports cursor-based pagination via `x-aptos-cursor` response header.
- `start` query parameter accepts cursor value from previous response.

**GET /accounts/{address}/resource/{resource_type}**
```json
// Response
{
  "type": "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
  "data": { ... }
}
```
- `resource_type` SHALL be URL-encoded (e.g., `0x1::coin::CoinStore%3C0x1::aptos_coin::AptosCoin%3E`).
- Supports `ledger_version` query parameter for historical reads.

**GET /accounts/{address}/modules**
```json
// Response
[
  {
    "bytecode": "0x...",
    "abi": {
      "address": "0x1",
      "name": "module_name",
      "friends": [],
      "exposed_functions": [],
      "structs": []
    }
  }
]
```
- Supports cursor-based pagination via `x-aptos-cursor` response header.

**GET /accounts/{address}/module/{module_name}**
```json
// Response
{
  "bytecode": "0x...",
  "abi": {
    "address": "0x1",
    "name": "module_name",
    "friends": [],
    "exposed_functions": [...],
    "structs": [...]
  }
}
```
- Supports `ledger_version` query parameter for historical reads.

#### Transaction Endpoints

**GET /transactions**
```json
// Response
[
  {
    "type": "user_transaction",
    "version": "string",
    "hash": "0x...",
    "state_change_hash": "0x...",
    "event_root_hash": "0x...",
    "state_checkpoint_hash": "0x...",
    "gas_used": "string",
    "success": true,
    "vm_status": "Executed successfully",
    "accumulator_root_hash": "0x...",
    "changes": [...],
    "sender": "0x...",
    "sequence_number": "string",
    "max_gas_amount": "string",
    "gas_unit_price": "string",
    "expiration_timestamp_secs": "string",
    "payload": { ... },
    "signature": { ... },
    "events": [...],
    "timestamp": "string"
  }
]
```
- Supports `start` and `limit` query parameters for pagination.

**GET /transactions/by_hash/{hash}**
```json
// Response: TransactionResponse (same as above, or PendingTransactionResponse)
// PendingTransactionResponse:
{
  "type": "pending_transaction",
  "hash": "0x...",
  "sender": "0x...",
  "sequence_number": "string",
  "max_gas_amount": "string",
  "gas_unit_price": "string",
  "expiration_timestamp_secs": "string",
  "payload": { ... },
  "signature": { ... }
}
```
- Returns 404 if transaction not found.

**GET /transactions/by_version/{version}**
```json
// Response: CommittedTransactionResponse (same shape as user_transaction above)
```

**GET /transactions/wait_by_hash/{hash}**
- Server-side long polling endpoint. The server SHALL block until the transaction settles or timeout.
- Returns the same shape as `GET /transactions/by_hash/{hash}`.
- Used internally by `waitForTransaction()` for the initial long-wait phase.

**POST /transactions**
```
Content-Type: application/x.aptos.signed_transaction+bcs
Body: BCS-serialized SignedTransaction
```
Response:
```json
{
  "hash": "0x...",
  "sender": "0x...",
  "sequence_number": "0",
  "max_gas_amount": "200000",
  "gas_unit_price": "100",
  "expiration_timestamp_secs": "1234567890",
  "payload": { ... },
  "signature": { ... }
}
```

**POST /transactions/simulate**
```
Content-Type: application/x.aptos.signed_transaction+bcs
Query Parameters:
  estimate_gas_unit_price?: boolean
  estimate_max_gas_amount?: boolean
  estimate_prioritized_gas_unit_price?: boolean
Body: BCS-serialized SignedTransaction (with invalid signatures)
```
Response: Array of `UserTransactionResponse` with simulated results.

**GET /estimate_gas_price**
```json
{
  "gas_estimate": 100,
  "deprioritized_gas_estimate": 100,
  "prioritized_gas_estimate": 150
}
```

#### Block Endpoints

**GET /blocks/by_height/{height}**
```json
{
  "block_height": "string",
  "block_hash": "0x...",
  "block_timestamp": "string",
  "first_version": "string",
  "last_version": "string",
  "transactions": [...]
}
```
- `with_transactions` query parameter (boolean) controls whether transactions are included.

**GET /blocks/by_version/{version}**
```json
// Same shape as /blocks/by_height response
```

#### View Function Endpoints

**POST /view** (BCS)
```
Content-Type: application/x.aptos.view_function+bcs
Body: BCS-serialized view function payload
```

**POST /view** (JSON)
```json
{
  "function": "0x1::coin::balance",
  "type_arguments": ["0x1::aptos_coin::AptosCoin"],
  "arguments": ["0x1"]
}
```

#### Ledger Info

**GET /**
```json
{
  "chain_id": 1,
  "epoch": "string",
  "ledger_version": "string",
  "oldest_ledger_version": "string",
  "ledger_timestamp": "string",
  "node_role": "validator | full_node",
  "oldest_block_height": "string",
  "block_height": "string",
  "git_hash": "string"
}
```

#### Table Endpoints

**POST /tables/{handle}/item**
```json
// Request
{
  "key_type": "address",
  "value_type": "u64",
  "key": "0x1"
}
```

#### Faucet Endpoint

**POST /fund**
```json
// Request
{
  "address": "0x...",
  "amount": 100000000
}
```
- SHALL create the account on-chain if it does not already exist.
- SHALL NOT be available for MAINNET or TESTNET.

### 8.8 Error Response Shapes

#### Full Node Error Response
```json
{
  "message": "Account not found by Address(0x1234...)",
  "error_code": "account_not_found",
  "vm_error_code": null
}
```
- Error messages in `AptosApiError` SHALL be truncated to 400 characters (first 200 + `"..."` + last 200) when exceeding the limit.

#### Indexer GraphQL Error Response
```json
{
  "errors": [
    {
      "message": "field 'invalid_field' not found in type: 'current_token_ownerships_v2'",
      "extensions": { "path": "$.selectionSet...", "code": "validation-failed" }
    }
  ]
}
```
- The SDK SHALL extract the first error message from the `errors` array.
- GraphQL errors MAY return HTTP 200 with an `errors` field.

#### Pepper Service Error Response
```json
{
  "error": "description of error"
}
```
- Status >= 400 SHALL throw `AptosApiError`.

#### Prover Service Error Response
```json
{
  "error": "description of error"
}
```
- Status >= 400 SHALL throw `AptosApiError`.

### 8.9 Pagination

#### Offset-based pagination (full node)

```typescript
interface PaginationArgs {
  offset?: AnyNumber;
  limit?: number;  // Default: 25
}
```

#### Cursor-based pagination (full node)

```typescript
interface CursorPaginationArgs {
  cursor?: string;  // Opaque cursor from `x-aptos-cursor` header
  limit?: number;   // Default: 25
}
```

- The SDK SHALL automatically paginate when the response includes an `x-aptos-cursor` response header.
- `paginateWithCursor` SHALL collect all pages until no more cursor is returned.
- `getPageWithObfuscatedCursor` SHALL return a single page with the cursor for manual pagination.
- Cursor values are opaque and SHALL NOT be manipulated by the client.

#### Indexer pagination

Indexer queries SHALL use `offset` and `limit` variables passed into GraphQL queries.

### 8.10 MIME Types

```typescript
enum MimeType {
  JSON = "application/json",
  BCS = "application/x-bcs",
  BCS_SIGNED_TRANSACTION = "application/x.aptos.signed_transaction+bcs",
  BCS_VIEW_FUNCTION = "application/x.aptos.view_function+bcs",
}
```

### 8.11 Caching

The SDK SHALL use an LRU cache with TTL via `memoizeAsync`:

| Cached Value | TTL | Notes |
|-------------|-----|-------|
| `getLedgerInfo()` | 10 seconds | Refreshed frequently |
| `getGasPriceEstimation()` | 5 minutes | For transaction building |
| ABI lookups (`getModule()`) | 5 minutes | Skipped if explicit `ledgerVersion` provided |
| Chain ID | Indefinite | Fetched once per config |

Cache behavior:
- Maximum cache size: 1000 entries.
- LRU eviction: When cache is full, SHALL remove approximately 10% of least-recently-used entries.
- Automatic cleanup: Expired entries SHALL be cleaned every 60 seconds.
- Cache key validation: Keys SHALL be >= 10 characters with a namespace prefix (e.g., `"module-abi-"`).
- `clearMemoizeCache()` SHALL be available for testing purposes.

---

## 9. API Surface

### 9.1 Account API

#### Query Methods

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getAccountInfo` | `{ accountAddress }` | `AccountData` | Get account sequence number and auth key |
| `getAccountModules` | `{ accountAddress, options? }` | `MoveModuleBytecode[]` | Get all account modules |
| `getAccountModulesPage` | `{ accountAddress, options? }` | `{ modules, cursor }` | Get modules with cursor pagination |
| `getAccountModule` | `{ accountAddress, moduleName, options? }` | `MoveModuleBytecode` | Get specific module |
| `getAccountTransactions` | `{ accountAddress, options? }` | `TransactionResponse[]` | Get account transactions |
| `getAccountResources` | `{ accountAddress, options? }` | `MoveResource[]` | Get all account resources |
| `getAccountResourcesPage` | `{ accountAddress, options? }` | `{ resources, cursor }` | Get resources with cursor pagination |
| `getAccountResource<T>` | `{ accountAddress, resourceType, options? }` | `T` | Get specific resource |
| `lookupOriginalAccountAddress` | `{ authenticationKey, options? }` | `AccountAddress` | Lookup original address for rotated key |
| `getAccountTokensCount` | `{ accountAddress }` | `number` | Count of tokens owned |
| `getAccountOwnedTokens` | `{ accountAddress, options? }` | `GetAccountOwnedTokensQueryResponse` | Get owned tokens |
| `getAccountOwnedTokensFromCollectionAddress` | `{ accountAddress, collectionAddress, options? }` | `GetAccountOwnedTokensFromCollectionResponse` | Get tokens from specific collection |
| `getAccountCollectionsWithOwnedTokens` | `{ accountAddress, options? }` | `GetAccountCollectionsWithOwnedTokenResponse` | Get collections with owned tokens |
| `getAccountTransactionsCount` | `{ accountAddress }` | `number` | Count of transactions |
| `getAccountCoinsData` | `{ accountAddress, options? }` | `GetAccountCoinsDataResponse` | Get coins data |
| `getAccountCoinsCount` | `{ accountAddress }` | `number` | Count of coin types |
| `getAccountAPTAmount` | `{ accountAddress }` | `number` | APT balance |
| `getBalance` | `{ accountAddress, asset }` | `number` | Balance of specific asset |
| `getAccountOwnedObjects` | `{ accountAddress, options? }` | `GetObjectDataQueryResponse` | Get owned objects |
| `deriveOwnedAccountsFromSigner` | `{ signer, options? }` | `Account[]` | Derive all accounts owned by a signer |
| `getAccountsForPublicKey` | `{ publicKey, options? }` | `AccountInfo[]` | Get accounts for a public key |

#### `getAccountsForPublicKey` Behavior

This method SHALL discover all accounts associated with a public key through:

1. **Default account lookup**: Check if the public key has a "default" account where `address == authKey derived from publicKey`. For Ed25519, SHALL check both legacy `Ed25519PublicKey` and `AnyPublicKey` forms.
2. **Multi-key discovery**: Query indexer (`GetAuthKeysForPublicKey`) to find multi-key accounts containing this public key. SHALL filter by `is_public_key_used` unless `includeUnverified: true`.
3. **Auth key rotation lookup**: Query indexer (`GetAccountAddressesForAuthKey`) to find accounts whose auth key was rotated to match this public key.

Returns `AccountInfo[]` sorted by `lastTransactionVersion` descending (most recent first).

```typescript
type AccountInfo = {
  accountAddress: AccountAddress;
  publicKey: BaseAccountPublicKey;
  lastTransactionVersion: number;
};
```

#### `deriveOwnedAccountsFromSigner` Behavior

This method SHALL derive all accounts owned by a given signer by:

1. Inspecting the signer type (Ed25519Account, SingleKeyAccount, KeylessAccount, FederatedKeylessAccount, MultiKeyAccount, MultiEd25519Account).
2. Extracting the private key or iterating recursively for multi-key signers.
3. For keyless signers, calling `deriveOwnedAccountsFromKeylessSigner()`.
4. Returning fully reconstructed `Account` instances that can sign transactions.

REST API shapes for account endpoints are documented in [Section 8.7](#87-full-node-rest-api-endpoint-catalog).

### 9.2 General API

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getLedgerInfo` | none | `LedgerInfo` | Get ledger info |
| `getChainId` | none | `number` | Get chain ID |
| `getBlockByVersion` | `{ ledgerVersion, options? }` | `Block` | Get block by version |
| `getBlockByHeight` | `{ blockHeight, options? }` | `Block` | Get block by height |
| `view<T>` | `{ payload, options? }` | `T` | Call view function (BCS) |
| `viewJson<T>` | `{ payload, options? }` | `T` | Call view function (JSON) |
| `getChainTopUserTransactions` | `{ limit }` | `GetChainTopUserTransactionsResponse` | Get top user transactions |
| `queryIndexer<T>` | `{ query }` | `T` | Execute raw GraphQL query |
| `getIndexerLastSuccessVersion` | none | `bigint` | Last successful indexer version |
| `getProcessorStatus` | `processorType` | `GetProcessorStatusResponse[0]` | Get processor status |

REST API shapes for general endpoints are documented in [Section 8.7](#87-full-node-rest-api-endpoint-catalog).

### 9.3 Transaction API

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getTransactions` | `{ options? }` | `TransactionResponse[]` | Get transactions |
| `getTransactionByVersion` | `{ ledgerVersion }` | `TransactionResponse` | Get by version |
| `getTransactionByHash` | `{ transactionHash }` | `TransactionResponse` | Get by hash |
| `isPendingTransaction` | `{ transactionHash }` | `boolean` | Check if pending |
| `waitForTransaction` | `{ transactionHash, options? }` | `CommittedTransactionResponse` | Wait for completion |
| `getGasPriceEstimation` | none | `GasEstimation` | Estimate gas |
| `getSigningMessage` | `{ transaction }` | `Uint8Array` | Get signing message |
| `publishPackageTransaction` | `{ account, metadataBytes, moduleBytecode, options? }` | `SimpleTransaction` | Publish Move package |
| `rotateAuthKey` | `{ fromAccount, toAccount/toNewPrivateKey, options? }` | `SimpleTransaction` | Rotate auth key |
| `signAndSubmitTransaction` | `{ signer, transaction, feePayer?, ... }` | `PendingTransactionResponse` | Sign and submit |
| `signAndSubmitAsFeePayer` | `{ feePayer, senderAuthenticator, transaction }` | `PendingTransactionResponse` | Submit as fee payer |

REST API shapes for transaction endpoints are documented in [Section 8.7](#87-full-node-rest-api-endpoint-catalog).

### 9.4 Coin API

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `transferCoinTransaction` | `{ sender, recipient, amount, coinType?, options? }` | `SimpleTransaction` | Create coin transfer txn |

- Default `coinType` SHALL be `"0x1::aptos_coin::AptosCoin"`.

### 9.5 Faucet API

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `fundAccount` | `{ accountAddress, amount, options? }` | `UserTransactionResponse` | Fund account |

- Faucet SHALL only be available for DEVNET, SHELBYNET, NETNA, LOCAL, and CUSTOM networks.
- TESTNET SHALL throw: `"There is no way to programmatically mint testnet APT"`.
- MAINNET SHALL throw: `"There is no mainnet faucet"`.

REST API shape for faucet endpoint is documented in [Section 8.7](#87-full-node-rest-api-endpoint-catalog).

### 9.6 Staking API

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getNumberOfDelegators` | `{ poolAddress }` | `number` | Delegator count for pool |
| `getNumberOfDelegatorsForAllPools` | `{ options? }` | `GetNumberOfDelegatorsResponse` | All pool delegator counts |
| `getDelegatedStakingActivities` | `{ delegatorAddress, poolAddress }` | `GetDelegatedStakingActivitiesResponse` | Staking activities |

### 9.7 Table API

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getTableItem<T>` | `{ handle, data, options? }` | `T` | Get table item |
| `getTableItemsData` | `{ options? }` | `GetTableItemsDataResponse` | Get table items data |
| `getTableItemsMetadata` | `{ options? }` | `GetTableItemsMetadataResponse` | Get table items metadata |

REST API shape for table endpoints is documented in [Section 8.7](#87-full-node-rest-api-endpoint-catalog).

### 9.8 Object API

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getObjectDataByObjectAddress` | `{ objectAddress, options? }` | `GetObjectDataQueryResponse[0]` | Get object data |

---

## 10. Keyless Authentication

### 10.1 Overview

Keyless authentication allows users to authenticate using OIDC tokens (e.g., Google, Apple) without managing private keys.

#### Keyless Authentication Flow Diagram

```
┌──────────┐    ┌──────────────┐    ┌────────────────┐    ┌──────────────┐    ┌──────────┐
│  Client   │    │ OIDC Provider│    │ Pepper Service  │    │Prover Service│    │ Full Node│
│  (SDK)    │    │(Google, etc.)│    │                 │    │              │    │          │
└─────┬─────┘    └──────┬───────┘    └────────┬────────┘    └──────┬───────┘    └────┬─────┘
      │                 │                     │                    │                  │
      │  1. Generate    │                     │                    │                  │
      │  EphemeralKeyPair                     │                    │                  │
      │  (local)        │                     │                    │                  │
      │                 │                     │                    │                  │
      │  2. Authenticate│                     │                    │                  │
      │  (nonce = hash  │                     │                    │                  │
      │  of epk+expiry+ │                     │                    │                  │
      │  blinder)       │                     │                    │                  │
      │────────────────>│                     │                    │                  │
      │   JWT (with nonce)                    │                    │                  │
      │<────────────────│                     │                    │                  │
      │                 │                     │                    │                  │
      │  3. Fetch Pepper│                     │                    │                  │
      │  POST /fetch    │                     │                    │                  │
      │  {jwt, epk, exp}│                     │                    │                  │
      │────────────────────────────────────>  │                    │                  │
      │        pepper (31 bytes)              │                    │                  │
      │<────────────────────────────────────  │                    │                  │
      │                 │                     │                    │                  │
      │  4. Compute idCommitment              │                    │                  │
      │  = Poseidon(pepper, aud, uid_val, uid_key)                 │                  │
      │  (local)        │                     │                    │                  │
      │                 │                     │                    │                  │
      │  5. Fetch ZK Proof                    │                    │                  │
      │  POST /prove    │                     │                    │                  │
      │  {jwt, epk, pepper, blinder, ...}     │                    │                  │
      │──────────────────────────────────────────────────────────> │                  │
      │        ZeroKnowledgeSig (Groth16 proof + training wheels)  │                  │
      │<────────────────────────────────────────────────────────── │                  │
      │                 │                     │                    │                  │
      │  6. Derive Account Address            │                    │                  │
      │  = AuthKey(KeylessPublicKey(iss, idCommitment))            │                  │
      │  (local)        │                     │                    │                  │
      │                 │                     │                    │                  │
      │  7. Lookup Original Address           │                    │                  │
      │  (for key rotation support)           │                    │                  │
      │──────────────────────────────────────────────────────────────────────────────>│
      │        AccountAddress                 │                    │                  │
      │<──────────────────────────────────────────────────────────────────────────────│
      │                 │                     │                    │                  │
      │  8. Return KeylessAccount             │                    │                  │
      │  (ready to sign)│                     │                    │                  │
```

**Async Proof Fetching (alternative path at step 5):**
- When `proofFetchCallback` is provided, step 5 SHALL NOT block.
- The `KeylessAccount` SHALL be created immediately with a `Promise<ZeroKnowledgeSig>` for the proof.
- The proof SHALL be fetched in the background.
- Signing operations SHALL await the proof promise before proceeding.
- If proof fetching fails, the callback SHALL receive the error.

### 10.2 EphemeralKeyPair

```typescript
class EphemeralKeyPair {
  readonly blinder: Uint8Array;       // 31 bytes
  readonly expiryDateSecs: number;    // Unix timestamp
  readonly nonce: string;             // Derived from public key + expiry + blinder

  static generate(args?: { scheme?: EphemeralPublicKeyVariant; expiryDateSecs?: number }): EphemeralKeyPair;
  isExpired(): boolean;
}
```

- Default expiry: 24 hours from creation.
- Nonce derivation: `Poseidon hash of [public key fields, max expiry horizon, blinder, padded field]`.
- The nonce SHALL be included in the OIDC authentication request as the `nonce` parameter.

### 10.3 Keyless API Methods

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `getPepper` | `{ jwt, ephemeralKeyPair, derivationPath? }` | `Uint8Array` | Fetch pepper from pepper service |
| `getProof` | `{ jwt, ephemeralKeyPair, pepper?, uidKey? }` | `ZeroKnowledgeSig` | Fetch ZK proof from prover |
| `deriveKeylessAccount` | `{ jwt, ephemeralKeyPair, jwkAddress?, uidKey?, pepper?, proofFetchCallback? }` | `KeylessAccount \| FederatedKeylessAccount` | Derive keyless account |
| `updateFederatedKeylessJwkSetTransaction` | `{ sender, iss, jwksUrl?, options? }` | `SimpleTransaction` | Update JWK set for federated keyless |

### 10.4 Pepper Service API

**POST {pepperServiceUrl}/fetch**
```json
{
  "jwt_b64": "eyJ...",
  "epk": { "type": "ed25519", "value": "0x..." },
  "exp_date_secs": 1234567890,
  "uid_key": "sub",
  "derivation_path": "m/44'/637'/0'/0'/0'"
}
```

Response:
```json
{
  "pepper": "0x..." // 31 bytes hex
}
```

### 10.5 Prover Service API

**POST {proverServiceUrl}/prove**
```json
{
  "jwt_b64": "eyJ...",
  "epk": { "type": "ed25519", "value": "0x..." },
  "epk_blinder": "0x...",
  "exp_date_secs": 1234567890,
  "exp_horizon_secs": 10000000,
  "pepper": "0x...",
  "uid_key": "sub",
  "extra_field": "aud"
}
```

Response:
```json
{
  "proof": {
    "a": "0x...",
    "b": "0x...",
    "c": "0x..."
  },
  "training_wheels_signature": "0x..."
}
```

### 10.6 Keyless Account Validity

Before signing, keyless accounts SHALL validate:
1. Ephemeral key pair is not expired.
2. ZK proof is available (may be fetched asynchronously).
3. JWK used for JWT verification exists on-chain.
4. Proof verification key exists on-chain.

`checkKeylessAccountValidity(aptosConfig)` SHALL be called automatically before signing via `signAndSubmitTransaction`.

### 10.7 Federated Keyless

- FederatedKeylessAccount extends the keyless concept with a custom `jwkAddress` for JWK storage.
- The `audless` flag allows omitting audience claim verification.
- JWK sets for federated providers SHALL be updated on-chain using `updateFederatedKeylessJwkSetTransaction`.

---

## 11. Account Abstraction

### 11.1 Overview

Account abstraction allows accounts to use custom on-chain authentication logic via dispatchable authenticators.

### 11.2 API Methods

| Method | Parameters | Return Type | Description |
|--------|-----------|-------------|-------------|
| `abstraction.addAuthenticationFunctionTransaction` | `{ accountAddress, authenticationFunction, options? }` | `SimpleTransaction` | Add auth function |
| `abstraction.removeAuthenticationFunctionTransaction` | `{ accountAddress, authenticationFunction, options? }` | `SimpleTransaction` | Remove auth function |
| `abstraction.removeDispatchableAuthenticatorTransaction` | `{ accountAddress, options? }` | `SimpleTransaction` | Remove all auth |
| `abstraction.getAuthenticationFunction` | `{ accountAddress }` | `FunctionInfo[] \| undefined` | Get auth functions |
| `abstraction.isAccountAbstractionEnabled` | `{ accountAddress, authenticationFunction }` | `boolean` | Check if enabled |
| `abstraction.enableAccountAbstractionTransaction` | (alias for add) | `SimpleTransaction` | Enable abstraction |
| `abstraction.disableAccountAbstractionTransaction` | `{ accountAddress, authenticationFunction?, options? }` | `SimpleTransaction` | Disable abstraction |

### 11.3 AbstractedAccount Class

```typescript
class AbstractedAccount extends Account {
  readonly accountAddress: AccountAddress;
  readonly publicKey: AbstractPublicKey;
  readonly signingScheme: SigningScheme.Abstraction;
  readonly authenticationFunction: MoveFunctionId;
  readonly abstractSigner: (args: { digest: Uint8Array }) => Promise<Uint8Array>;
}
```

#### Account Abstraction Signing Flow

```
┌──────────────────────────────────────────────────────────┐
│  signTransactionWithAuthenticator(rawTransaction)        │
└──────────────────────┬───────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │ 1. Compute standard     │
          │    signing message:     │
          │    SHA3("APTOS::Raw     │
          │    Transaction") ||     │
          │    BCS(rawTransaction)  │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │ 2. Create Account       │
          │    AbstractionMessage:  │
          │    { variant: V1,       │
          │      originalMessage,   │
          │      moduleAddress,     │
          │      moduleName,        │
          │      functionName }     │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │ 3. Compute AA message:  │
          │    SHA3("APTOS::AA      │
          │    SigningData") ||      │
          │    BCS(abstraction_msg) │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │ 4. Hash:                │
          │    digest = SHA3(       │
          │      aa_message)        │
          │    (32 bytes)           │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │ 5. Call abstractSigner: │
          │    sig = signer(digest) │
          │    (custom auth bytes)  │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │ 6. Return Authenticator:│
          │    AccountAuthenticator │
          │    Abstraction {        │
          │      functionInfo,      │
          │      digest,            │
          │      signature          │
          │    }                    │
          └─────────────────────────┘
```

**AccountAuthenticatorAbstraction Serialization Format:**

```
Standard AA (V1):
  [6 as u32]                          // AccountAuthenticatorVariant.Abstraction
  [moduleAddress: 32 bytes]           // Authentication function module address
  [moduleName: ULEB128 len + UTF8]    // Authentication function module name
  [functionName: ULEB128 len + UTF8]  // Authentication function name
  [0 as u32]                          // AbstractAuthenticationDataVariant.V1
  [signingMessageDigest: bytes]       // SHA3 digest (variable length)
  [abstractionSignature: fixed bytes] // Custom signature bytes

Derivable AA (DerivableV1):
  [6 as u32]                          // AccountAuthenticatorVariant.Abstraction
  [moduleAddress: 32 bytes]
  [moduleName: ULEB128 len + UTF8]
  [functionName: ULEB128 len + UTF8]
  [1 as u32]                          // AbstractAuthenticationDataVariant.DerivableV1
  [signingMessageDigest: bytes]       // SHA3 digest
  [abstractionSignature: bytes]       // Custom signature (variable length)
  [accountIdentity: bytes]            // Public key of source wallet
```

### 11.4 DerivableAbstractedAccount

`DerivableAbstractedAccount` extends `AbstractedAccount` with deterministic address derivation:

```typescript
class DerivableAbstractedAccount extends AbstractedAccount {
  // Address derivation:
  // SHA3(moduleAddress || moduleName || functionName || abstractPublicKey || domainSeparator)

  static computeAccountAddress(args: {
    authenticationFunction: MoveFunctionId;
    abstractPublicKey: HexInput;
    domainSeparator?: string;
  }): AccountAddress;
}
```

- The `accountIdentity` field SHALL be included in the `AccountAuthenticatorAbstraction` when signing.
- `abstractSigner` callback SHALL return both the signature and account identity.

### 11.5 Factory Methods

```typescript
// Create from permissioned signer (Ed25519)
AbstractedAccount.fromPermissionedSigner(args: {
  signer: Ed25519Account;
  accountAddress?: AccountAddress;
}): AbstractedAccount
```

- `setSigner(signer)` SHALL allow updating the signer callback at runtime (useful for async operations).

---

## 12. Digital Assets (NFTs)

### 12.1 Query Methods

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `getCollectionDataByCreatorAddressAndCollectionName` | `{ creatorAddress, collectionName, options? }` | `GetCollectionDataResponse` |
| `getCollectionDataByCreatorAddress` | `{ creatorAddress, options? }` | `GetCollectionDataResponse` |
| `getCollectionDataByCollectionId` | `{ collectionId, options? }` | `GetCollectionDataResponse` |
| `getCollectionId` | `{ creatorAddress, collectionName, options? }` | `string` |
| `getDigitalAssetData` | `{ digitalAssetAddress }` | `GetTokenDataResponse` |
| `getCurrentDigitalAssetOwnership` | `{ digitalAssetAddress }` | `GetCurrentTokenOwnershipResponse` |
| `getOwnedDigitalAssets` | `{ ownerAddress, options? }` | `GetOwnedTokensResponse` |
| `getDigitalAssetActivity` | `{ digitalAssetAddress, options? }` | `GetTokenActivityResponse` |

### 12.2 Transaction Methods

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `createCollectionTransaction` | `{ creator, description, name, uri, options?, ...collectionOptions }` | `SimpleTransaction` |
| `mintDigitalAssetTransaction` | `{ creator, collection, description, name, uri, propertyKeys?, propertyTypes?, propertyValues?, options? }` | `SimpleTransaction` |
| `transferDigitalAssetTransaction` | `{ sender, digitalAssetAddress, recipient, digitalAssetType?, options? }` | `SimpleTransaction` |
| `mintSoulBoundTransaction` | `{ account, collection, description, name, uri, recipient, options? }` | `SimpleTransaction` |
| `burnDigitalAssetTransaction` | `{ creator, digitalAssetAddress, options? }` | `SimpleTransaction` |
| `freezeDigitalAssetTransaferTransaction` | `{ creator, digitalAssetAddress, options? }` | `SimpleTransaction` |
| `unfreezeDigitalAssetTransaferTransaction` | `{ creator, digitalAssetAddress, options? }` | `SimpleTransaction` |
| `setDigitalAssetDescriptionTransaction` | `{ creator, description, digitalAssetAddress, options? }` | `SimpleTransaction` |
| `setDigitalAssetNameTransaction` | `{ creator, name, digitalAssetAddress, options? }` | `SimpleTransaction` |
| `setDigitalAssetURITransaction` | `{ creator, uri, digitalAssetAddress, options? }` | `SimpleTransaction` |
| `addDigitalAssetPropertyTransaction` | `{ creator, propertyKey, propertyType, propertyValue, digitalAssetAddress, options? }` | `SimpleTransaction` |
| `removeDigitalAssetPropertyTransaction` | `{ creator, propertyKey, propertyType, propertyValue, digitalAssetAddress, options? }` | `SimpleTransaction` |
| `updateDigitalAssetPropertyTransaction` | `{ creator, propertyKey, propertyType, propertyValue, digitalAssetAddress, options? }` | `SimpleTransaction` |
| `addDigitalAssetTypedPropertyTransaction` | same as add but typed | `SimpleTransaction` |
| `updateDigitalAssetTypedPropertyTransaction` | same as update but typed | `SimpleTransaction` |

### 12.3 Collection Options

```typescript
interface CreateCollectionOptions {
  maxSupply?: AnyNumber;
  mutableDescription?: boolean;
  mutableRoyalty?: boolean;
  mutableURI?: boolean;
  mutableTokenDescription?: boolean;
  mutableTokenName?: boolean;
  mutableTokenProperties?: boolean;
  mutableTokenURI?: boolean;
  tokensBurnableByCreator?: boolean;
  tokensFreezableByCreator?: boolean;
  royaltyNumerator?: number;
  royaltyDenominator?: number;
}
```

---

## 13. Fungible Assets

### 13.1 Query Methods

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `getFungibleAssetMetadata` | `{ options? }` | `GetFungibleAssetMetadataResponse` |
| `getFungibleAssetMetadataByAssetType` | `{ assetType }` | `GetFungibleAssetMetadataResponse[0]` |
| `getFungibleAssetMetadataByCreatorAddress` | `{ creatorAddress }` | `GetFungibleAssetMetadataResponse` |
| `getFungibleAssetActivities` | `{ options? }` | `GetFungibleAssetActivitiesResponse` |
| `getCurrentFungibleAssetBalances` | `{ options? }` | `GetCurrentFungibleAssetBalancesResponse` |

### 13.2 Transaction Methods

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `transferFungibleAsset` | `{ sender, fungibleAssetMetadataAddress, recipient, amount, options? }` | `SimpleTransaction` |
| `transferFungibleAssetBetweenStores` | `{ sender, fromStore, toStore, amount, options? }` | `SimpleTransaction` |

---

## 14. Aptos Name Service (ANS)

### 14.1 Query Methods

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `getOwnerAddress` | `{ name }` | `AccountAddress \| undefined` |
| `getExpiration` | `{ name }` | `number \| undefined` |
| `getTargetAddress` | `{ name }` | `AccountAddress \| undefined` |
| `getPrimaryName` | `{ address }` | `string \| undefined` |
| `getName` | `{ name }` | `AnsName \| undefined` |
| `getAccountNames` | `{ accountAddress, options? }` | `{ names: AnsName[], total: number }` |
| `getAccountDomains` | `{ accountAddress, options? }` | `{ names: AnsName[], total: number }` |
| `getAccountSubdomains` | `{ accountAddress, options? }` | `{ names: AnsName[], total: number }` |
| `getDomainSubdomains` | `{ domain, options? }` | `{ names: AnsName[], total: number }` |

### 14.2 Transaction Methods

| Method | Parameters | Return Type |
|--------|-----------|-------------|
| `registerName` | `{ sender, name, expiration, ... }` | `{ transaction, data }` |
| `setTargetAddress` | `{ sender, name, address, options? }` | `{ transaction, data }` |
| `clearTargetAddress` | `{ sender, name, options? }` | `{ transaction, data }` |
| `setPrimaryName` | `{ sender, name?, options? }` | `{ transaction, data }` |
| `renewDomain` | `{ sender, name, years?, options? }` | `{ transaction, data }` |

- ANS methods return `{ transaction, data }` where `data` is the `InputEntryFunctionData` used.
- Name format: `"name.apt"` for domains, `"sub.name.apt"` for subdomains.

---

## 15. Error Handling

### 15.1 AptosApiError

```typescript
class AptosApiError extends Error {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly data: any;
  readonly request: AptosRequest;
}
```

- SHALL be thrown for all HTTP API errors.
- Error messages SHALL include the API type, URL, status, and response data.
- For indexer errors, SHALL extract the first GraphQL error message.
- For structured error responses (with `message` and `error_code`), SHALL serialize the full response.
- Response payload in error messages SHALL be truncated to 400 characters (200 first + "..." + 200 last) when exceeding limit.
- SHALL include `trace_id` from the `traceparent` response header (W3C trace context) when available.

### 15.2 WaitForTransactionError

```typescript
class WaitForTransactionError extends Error {
  readonly lastSubmittedTransaction: TransactionResponse | undefined;
}
```

- SHALL be thrown when `waitForTransaction` exceeds its timeout while the transaction is still pending or not found.
- `lastSubmittedTransaction` SHALL contain the last known state of the transaction (if any).

### 15.3 FailedTransactionError

```typescript
class FailedTransactionError extends Error {
  readonly transaction: CommittedTransactionResponse;
}
```

- SHALL be thrown when `waitForTransaction` finds the transaction committed but with `success === false`.
- SHALL NOT be thrown if `checkSuccess: false` is passed in options.
- The error message SHALL include the `vm_status` from the transaction response.

### 15.4 KeylessError

```typescript
class KeylessError extends Error {
  readonly type: KeylessErrorType;
  readonly category: KeylessErrorCategory;
  readonly resolutionTip: KeylessErrorResolutionTip;
  readonly innerError?: unknown;
  readonly details?: string;
}
```

**Error Categories:**
- `API_ERROR` - Issues with API calls
- `EXTERNAL_API_ERROR` - Issues with external services (JWK fetch)
- `SESSION_EXPIRED` - Ephemeral key or JWK expired
- `INVALID_STATE` - Invalid internal state
- `INVALID_SIGNATURE` - Signature verification failed
- `UNKNOWN` - Unknown error

**Error Types (30+ types):**
- `EPHEMERAL_KEY_PAIR_EXPIRED`
- `PROOF_NOT_FOUND`
- `ASYNC_PROOF_FETCH_FAILED`
- `INVALID_JWT_JWK_NOT_FOUND`
- `RATE_LIMIT_EXCEEDED`
- `PEPPER_SERVICE_INTERNAL_ERROR`
- `PROVER_SERVICE_INTERNAL_ERROR`
- (and many more - see `src/errors/index.ts`)

---

## 16. Constants and Defaults

### 16.1 Gas Defaults

```typescript
DEFAULT_MAX_GAS_AMOUNT = 200000
DEFAULT_TXN_EXP_SEC_FROM_NOW = 20
DEFAULT_TXN_TIMEOUT_SEC = 20
```

### 16.2 Framework Addresses

```typescript
APTOS_COIN = "0x1::aptos_coin::AptosCoin"
APTOS_FA = "0x000000000000000000000000000000000000000000000000000000000000000a"
```

### 16.3 Signing Salts

```typescript
RAW_TRANSACTION_SALT = "APTOS::RawTransaction"
RAW_TRANSACTION_WITH_DATA_SALT = "APTOS::RawTransactionWithData"
ACCOUNT_ABSTRACTION_SIGNING_DATA_SALT = "APTOS::AASigningData"
```

### 16.4 Processor Types

```typescript
enum ProcessorType {
  ACCOUNT_RESTORATION_PROCESSOR = "account_restoration_processor",
  ACCOUNT_TRANSACTION_PROCESSOR = "account_transactions_processor",
  DEFAULT = "default_processor",
  EVENTS_PROCESSOR = "events_processor",
  FUNGIBLE_ASSET_PROCESSOR = "fungible_asset_processor",
  STAKE_PROCESSOR = "stake_processor",
  TOKEN_V2_PROCESSOR = "token_v2_processor",
  USER_TRANSACTION_PROCESSOR = "user_transaction_processor",
  OBJECT_PROCESSOR = "objects_processor",
}
```

---

## 17. Network Endpoints

### 17.1 Full Node REST API

| Network | URL |
|---------|-----|
| Mainnet | `https://api.mainnet.aptoslabs.com/v1` |
| Testnet | `https://api.testnet.aptoslabs.com/v1` |
| Devnet | `https://api.devnet.aptoslabs.com/v1` |
| Shelbynet | `https://api.shelbynet.shelby.xyz/v1` |
| Netna | `https://api.netna.staging.aptoslabs.com/v1` |
| Local | `http://127.0.0.1:8080/v1` |

### 17.2 Indexer GraphQL API

| Network | URL |
|---------|-----|
| Mainnet | `https://api.mainnet.aptoslabs.com/v1/graphql` |
| Testnet | `https://api.testnet.aptoslabs.com/v1/graphql` |
| Devnet | `https://api.devnet.aptoslabs.com/v1/graphql` |
| Local | `http://127.0.0.1:8090/v1/graphql` |

### 17.3 Faucet API

| Network | URL |
|---------|-----|
| Devnet | `https://faucet.devnet.aptoslabs.com` |
| Shelbynet | `https://faucet.shelbynet.shelby.xyz` |
| Local | `http://127.0.0.1:8081` |

### 17.4 Pepper Service API

| Network | URL |
|---------|-----|
| Mainnet | `https://api.mainnet.aptoslabs.com/keyless/pepper/v0` |
| Testnet | `https://api.testnet.aptoslabs.com/keyless/pepper/v0` |
| Devnet | `https://api.devnet.aptoslabs.com/keyless/pepper/v0` |
| Local | `https://api.devnet.aptoslabs.com/keyless/pepper/v0` (uses devnet) |

### 17.5 Prover Service API

| Network | URL |
|---------|-----|
| Mainnet | `https://api.mainnet.aptoslabs.com/keyless/prover/v0` |
| Testnet | `https://api.testnet.aptoslabs.com/keyless/prover/v0` |
| Devnet | `https://api.devnet.aptoslabs.com/keyless/prover/v0` |
| Local | `https://api.devnet.aptoslabs.com/keyless/prover/v0` (uses devnet) |

### 17.6 Chain IDs

| Network | Chain ID |
|---------|----------|
| Mainnet | 1 |
| Testnet | 2 |
| Local | 4 |

---

## 18. Type System

### 18.1 Move Type Mappings

| Move Type | TypeScript Type | JSON Representation |
|-----------|----------------|-------------------|
| `bool` | `boolean` | `true` / `false` |
| `u8`, `u16`, `u32` | `number` | Number |
| `u64`, `u128`, `u256` | `string` | String (decimal) |
| `i8`, `i16`, `i32` | `number` | Number |
| `i64`, `i128`, `i256` | `string` | String (decimal) |
| `address` | `string` | `"0x..."` |
| `String` | `string` | String |
| `vector<T>` | `Array<T>` | JSON array |
| `Option<T>` | `T \| null \| undefined` | Value or null |
| `Object<T>` | `string` | `"0x..."` (address) |

### 18.2 Type Tags

```typescript
enum TypeTagVariants {
  Bool = 0, U8 = 1, U64 = 2, U128 = 3,
  Address = 4, Signer = 5, Vector = 6, Struct = 7,
  U16 = 8, U32 = 9, U256 = 10,
  I8 = 11, I16 = 12, I32 = 13, I64 = 14, I128 = 15, I256 = 16,
  Reference = 254, Generic = 255
}
```

- Type tags SHALL be parseable from string format: `parseTypeTag("vector<u64>")`.
- Struct type tags SHALL follow format: `"0x1::module::StructName<TypeArgs>"`.

### 18.3 Transaction Response Types

```typescript
type TransactionResponse = PendingTransactionResponse | CommittedTransactionResponse;

type CommittedTransactionResponse =
  | UserTransactionResponse
  | GenesisTransactionResponse
  | BlockMetadataTransactionResponse
  | StateCheckpointTransactionResponse
  | ValidatorTransactionResponse
  | BlockEpilogueTransactionResponse;
```

Type guard functions SHALL be provided:
- `isPendingTransactionResponse(response)`
- `isUserTransactionResponse(response)`
- `isGenesisTransactionResponse(response)`
- `isBlockMetadataTransactionResponse(response)`
- `isStateCheckpointTransactionResponse(response)`
- `isValidatorTransactionResponse(response)`
- `isBlockEpilogueTransactionResponse(response)`

### 18.4 Indexer Response Types

All indexer query responses SHALL be derived from generated GraphQL types:

```typescript
type GetObjectDataQueryResponse = GetObjectDataQuery["current_objects"];
type GetAccountOwnedTokensQueryResponse = GetAccountOwnedTokensQuery["current_token_ownerships_v2"];
type GetCollectionDataResponse = GetCollectionDataQuery["current_collections_v2"][0];
type GetTokenDataResponse = GetTokenDataQuery["current_token_datas_v2"][0];
// ... (see src/types/indexer.ts for complete list)
```

### 18.5 GraphQL Query Type

```typescript
type GraphqlQuery = {
  query: string;
  variables?: {};
};
```

### 18.6 Ordering and Filtering

```typescript
type OrderBy<T> = Array<{ [K in keyof T]?: OrderByValue }>;
type OrderByValue = "asc" | "asc_nulls_first" | "asc_nulls_last" | "desc" | "desc_nulls_first" | "desc_nulls_last";
type TokenStandard = "v1" | "v2";
```

---

## 19. Assumptions and Preferences

### 19.1 Runtime Assumptions

1. The SDK SHALL run in Node.js >= 20.0.0.
2. The SDK SHOULD be compatible with Bun, with HTTP/2 disabled.
3. The SDK SHALL work in both CommonJS and ESM environments.
4. BigInt support is required (all modern JS engines).

### 19.2 Network Assumptions

1. Full node REST API SHALL be available at the configured endpoint.
2. Indexer queries SHALL be available for all networks except CUSTOM (where user must provide URL).
3. Chain ID SHALL be deterministic for known networks (mainnet=1, testnet=2, local=4).
4. For unknown/custom networks, chain ID SHALL be fetched from the ledger info endpoint.

### 19.3 Security Assumptions

1. Private keys SHALL never be transmitted over the network.
2. BCS deserialization SHALL enforce length limits (10MB max for byte arrays).
3. API responses SHALL be validated (status codes, data structures).
4. Error messages from API responses SHALL be truncated to prevent information leakage.

### 19.4 Dependency Preferences

- Cryptographic operations: `@noble/curves`, `@noble/hashes` (audited, pure JS)
- BIP-32/39 key derivation: `@scure/bip32`, `@scure/bip39`
- Base64: `js-base64`
- JWT decoding: `jwt-decode`
- Poseidon hash (for keyless nonces): `poseidon-lite`
- Events: `eventemitter3`
- HTTP client: `@aptos-labs/aptos-client`

---

## 20. Edge Behaviors

### 20.1 Transaction Ordering

- When `accountSequenceNumber` is not provided, the SDK SHALL fetch it from the chain.
- When `replayProtectionNonce` is provided, the SDK SHALL use orderless transaction format.
- These two options are mutually exclusive; providing both SHALL result in undefined behavior.

### 20.2 Fee Payer Transactions

- When building with `withFeePayer: true`, the fee payer address SHALL be set to `AccountAddress.ZERO` as a placeholder.
- The actual fee payer address SHALL be set when the fee payer signs the transaction via `signAsFeePayer`.
- Fee payer transactions SHALL NOT be submitted without a fee payer signature.

### 20.3 Keyless Account Async Proof Fetching

- When `proofFetchCallback` is provided to `deriveKeylessAccount`, the proof SHALL be fetched asynchronously.
- The account SHALL be immediately usable for operations that don't require signing.
- Calling `sign()` or `signTransaction()` before the proof arrives SHALL call `checkKeylessAccountValidity()` which waits for the proof.
- If async proof fetching fails, the callback SHALL receive the error. Subsequent signing attempts SHALL throw `KeylessError` with type `PROOF_NOT_FOUND` or `ASYNC_PROOF_FETCH_FAILED`.

### 20.4 Multi-Key Account Signing

- Only the signers provided to `MultiKeyAccount` SHALL sign transactions.
- The number of signers SHALL be >= the threshold specified in the `MultiKey`.
- Signer indices SHALL match their position in the `MultiKey.publicKeys` array.

### 20.5 Bun Compatibility

- When running in Bun, `isBun()` SHALL return `true`.
- The SDK SHALL warn (not error) when HTTP/2 is enabled in Bun.
- Bun detection uses `try-catch` around global `Bun` access for robustness.

### 20.6 Account Rotation

- `rotateAuthKey` SHALL require the new account's private key for proof of ownership.
- `rotateAuthKeyUnverified` SHALL only require the new public key (no ownership proof).
- After rotation, `lookupOriginalAccountAddress` SHALL resolve the original address from the new auth key.

### 20.7 Indexer Lag

- `waitForTransaction` SHALL (by default) wait for the indexer to catch up to the committed version.
- This behavior can be disabled with `waitForIndexer: false`.
- `minimumLedgerVersion` parameters on indexer queries SHALL be used to ensure data freshness.

### 20.8 Gas Estimation Caching

- Gas price estimation SHALL be cached for 5 minutes.
- This means rapid transaction building will reuse the same gas price.
- For time-sensitive applications, explicitly provide `gasUnitPrice` in transaction options.

### 20.9 View Function Formats

- `view()` SHALL use BCS encoding (more efficient, supports complex types).
- `viewJson()` SHALL use JSON encoding (simpler, for basic types).
- View functions SHALL NOT modify blockchain state.

### 20.10 Generated Code

The following code SHALL NOT be hand-edited:
- `src/types/generated/` - GraphQL types from `pnpm indexer-codegen`
- `src/internal/queries/` - Generated query implementations
- `docs/` - Versioned TypeDoc output from `pnpm doc`

### 20.11 Version Consistency

- Version SHALL be consistent across `package.json`, `src/version.ts`, and docs.
- `pnpm check-version` SHALL validate consistency.
- `pnpm update-version` SHALL update all version references.

### 20.12 Faucet Account Creation

- The faucet endpoint SHALL create the target account on-chain if it does not already exist.
- The funded amount SHALL be in octas (1 APT = 100,000,000 octas).

### 20.13 Simulation Signatures

- Transaction simulation SHALL use invalid (empty/zeroed) signatures; the chain does NOT verify signatures during simulation.
- `AccountAuthenticatorNoAccountAuthenticator` (variant index 4) SHALL be used as a placeholder authenticator for simulation when no real signer is available.
- Simulation results include gas usage, events, and execution status, enabling gas estimation without spending funds.

### 20.14 Read Consistency with LedgerVersion

- Most full node GET endpoints accept an optional `ledger_version` query parameter for historical reads.
- When provided, the response SHALL reflect the state at that specific ledger version.
- The `LedgerVersionArg` type is:

```typescript
interface LedgerVersionArg {
  ledgerVersion?: AnyNumber;
}
```

- Indexer queries accept `minimumLedgerVersion` to ensure data freshness. When provided, the SDK SHALL wait for the indexer to reach that version before returning results.

### 20.15 Transaction Batch Worker Limits

- `TransactionWorker.sentTransactions` and `executedTransactions` SHALL each track up to 10,000 entries.
- When capacity is exceeded, the oldest ~10% (1,000 entries) SHALL be evicted to prevent unbounded memory growth.
- `AccountSequenceNumber.maximumInFlight` (default 100) SHALL cap the number of unconfirmed transactions per account, preventing sequence number exhaustion.

### 20.16 Providing Both Sequence Number and Replay Nonce

- `accountSequenceNumber` and `replayProtectionNonce` in `InputGenerateTransactionOptions` are mutually exclusive.
- If both are provided, the SDK's behavior is undefined. Implementations SHOULD validate and throw if both are set.

### 20.17 Indexer Sync Waiting

- When `waitForTransaction` succeeds with `waitForIndexer: true` (default), the SDK SHALL additionally wait for the indexer to catch up to the committed version.
- Indexer sync timeout: 3 seconds (hard-coded).
- Indexer sync polling interval: 200ms.
- If a specific `ProcessorType` is relevant, the SDK SHALL check that processor's last success version.

### 20.18 No Dedicated Event Query API

- The SDK does NOT expose a dedicated event query API surface.
- Events SHALL be accessed through transaction responses, which include an `events` array.
- Event filtering SHOULD be done client-side on the returned transaction data or via raw GraphQL indexer queries using `queryIndexer()`.
