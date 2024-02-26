# Aptos TypeScript SDK Changelog

All notable changes to the Aptos TypeScript SDK will be captured in this file. This changelog is written by hand for now. It adheres to the format set out by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

# Unreleased

- Add `getCollectionByCollectionId` API

# 1.8.0 (2024-02-24)

- Add `decimals` field to token data queries
- Add support for `validator_transaction` type introduced in 1.10
- Add `getModuleEventsByEventType` API

# 1.7.0 (2024-02-13)

- Add ability to provide ABI to skip ABI fetch, and get roughly 50% performance improvement

# 1.6.0 (2024-02-08)

- Add optional `options` param to `getAccountEventsByCreationNumber` query for paginations and order by
- Add more meaningful API error messages
- Support automated account creation for sponsored transactions
- Add randomnet to known networks

# 1.5.1 (2024-01-24)

- Move eventemitter3 to runtime dependency

# 1.5.0 (2024-01-24)

- Remove request URLs forward slash append
- Add events to `TransactionWorker` module that dapps can listen to
- Introduce `aptos.transaction.batch` namespace to handle batch transactions
- Support `aptos.transaction.batch.forSingleAccount()` to send batch transactions for a single account
- Label `aptos.batchTransactionsForSingleAccount()` as `deprecated` to prefer using `aptos.transaction.batch.forSingleAccount()`

# 1.4.0 (2024-01-08)

- Omit `"build" | "simulate" | "submit"` from `aptos` namespace
- [`Breaking`] Change `sender` property type to `AccountAddressInput` in `transferCoinTransaction()`

# 1.3.0 (2024-01-03)

- [`Breaking`] Capitalize `TransactionPayloadMultiSig` type
- Add support to Array value in digital asset property map
- [`Breaking`] Change `maxGasAmount, gasUnitPrice and expireTimestamp` properties in `InputGenerateTransactionOptions` type to `number` type
- Add `@aptos-labs/aptos-cli` npm package as a dev dependency
- Implement a `LocalNode` module to run a local testnet with in the SDK environment
- Use `LocalNode` module to spin up a local testnet pre running SDK tests
- Update BigInt constants to be hardcoded rather than use Math.pow

# 1.2.0 (2023-12-14)

- Fixed examples to use wait on indexer rather than sleep
- Fixed `waitOnIndexer` to wait on correct tables / remove duplicate or unnecessary waits on indexer
- [`Breaking`] Changed output of `getIndexerLastSuccessVersion` to `bigint` from `number`
- Update dependencies in the Typescript SDK to keep up with latest changes
- Updated @aptos-labs/aptos-client dependency
- [`Breaking`] Hex string inputs to `vector<u8>` entry function arguments will now be interpreted as a string instead of hex
- String inputs to `vector<u8>` entry function arguments will now be interpeted as UTF-8 bytes
- ArrayBuffer is now a possible input for `vector<u8>` entry function arguments

## 1.1.0 (2023-12-11)

- Add release automation, so version updates can be made with simply `pnpm update-version`
- Rename custom request header to `aptos-typescript-sdk`
- [`Breaking`] Rename `token` to `digitalAsset` and add digital asset built in transaction generation functions
- [`Breaking`] change transaction submission builder flow namespace to be under a `transaction` namespace
- [`Breaking`] Rename `SingleSignerTransaction` type to `SimpleTransaction`

## 1.0.0 (2023-12-04)

Release Stable version `1.0.0`

## 0.0.8 (2023-11-29)

- Respect `API_KEY` option in `clientConfig` when making indexer and/or fullnode queries
- [`Added`] Added `waitForIndexer` function to wait for indexer to sync up with full node. All indexer query functions now accepts a new optional param `minimumLedgerVersion` to wait for indexer to sync up with the target processor.
- Add `getSigningMessage` to allow users to sign transactions with external signers and other use cases
- [`Breaking`] Changes ANS date usage to consistently use epoch timestamps represented in milliseconds.
  - `getExpiration`: Previously returned seconds, now returns milliseconds
  - `registerName`: Argument `expiration.expirationDate` was previously a `Date` object, now it is an epoch timestamp represented in milliseconds
  - All query functions return epoch milliseconds instead of ISO date strings.
- [`Breaking`] Flatten options for all functions to be a single level
- Cleanup internal usage of casting
- Export `AnyPublicKey` and `AnySignature` types
- Add `transferFungibleAsset` function to easily generate a transaction to transfer a fungible asset from sender's primary store to recipient's primary store
- [`Breaking`] `AccountAddress.fromRelaxed` is now `AccountAddress.from`, and a new `AccountAddress.fromStrict` has the old functionality.
- Implement transaction management worker layer to manage transaction submission for a single account with a high throughput
- [`Fixed`] Allow for Uint8Array to be passed as a `vector<u8>` argument on entry functions
- [`Fixed`] Allow for raw vectors to be passed as arguments with encoded types within them for Remote ABI on entry functions e.g. [AccountAddress]

## 0.0.7 (2023-11-16)

- Adds additional ANS APIs

  - Transactions
    - setPrimaryName
    - setTargetAddress
    - registerName
    - renew_domain
  - Queries
    - getPrimaryName
    - getOwnerAddress
    - getExpiration
    - getTargetAddress
    - getName
    - getAccountNames
    - getAccountDomains
    - getAccountSubdomains
    - getDomainSubdomains

- [`Breaking`] Refactor transaction builder flow
  - Each builder step is under a dedicated namespace - `aptos.build.transaction`, `aptos.sign.transaction`, `aptos.submit.transaction`
  - Supports and implements 2 types of transactions - single signer as `aptos.*.transaction` and multi agent as `aptos.*.multiAgentTransaction`
  - A boolean `withFeePayer` argument can be passed to any transaction `build` function to make it a Sponsor transaction
  - Different functions `aptos.sign.transaction` to sign a transaction as a single signer and `aptos.sign.transactionAsFeePayer`to sign a transaction as a sponsor
  - Return `InputSingleSignerTransaction` type changed to `SingleSignerTransaction` type
  - Return `InputMultiAgentTransaction` type changed to `MultiAgentTransaction` type

## 0.0.6 (2023-11-14)

- [`Breaking`] Changed `ViewRequestData` to `InputViewRequestData`
- Respect max gas amount value when generating a transaction
- Added a clearer error message for when the typeTagParser encounters a possible generic TypeTag but generics are disallowed
- Update all dependencies to the latest version
- Added ability for providing own output types for view functions

## 0.0.5 (2023-11-09)

- [`Breaking`] Update and changed the flow of Fee payer transaction to be "Optional Fee Payer". A fee payer is now required to sign the transaction `asFeePayer`
- `getAccountEventsByEventType` query uses new `indexed_type` indexed field to avoid rate limit
- [`Breaking`] Rename `TOKEN` to `AUTH_TOKEN` for better visibility
- Set the `AUTH_TOKEN` only for faucet queries

## 0.0.4 (2023-11-03)

- [`Breaking`] Changed all instances of `AccountAddress.fromHexInput` to `AccountAddress.from` to accept AccountAddress as well
- [`Fixed`] Fixed a bug where an entry function with only signers would fail due to type tag parsing
- [`Fixed`] REST API errors now properly give error messages in JSON rather than just `BadRequest`
- All address inputs now also accept AccountAddress
- Support derive account from private key `Account.fromPrivateKey()`
- Derive account from derivation path secp256k1 support
- Default Account generation to Legacy Ed25519
- Remove unnecessary pre-emptive serialization of the field `rawTransaction: Uint8Array` by replacing it with the unserialized `rawTransaction: RawTransaction` class
- ANS (Aptos Names Service) SDK initial support for creation and lookup of names
- Initial Auth key rotation support

## 0.0.3 (2023-10-31)

- Remove MoveObject in favor of AccountAddress, use AccountAddress for Object inputs
- Use revamped parseTypeTag function instead of StructTag.fromString()
- Allow use of generics in parseTypeTag
- Rename publishModuleTransaction to publishPackageTransaction and fix functionality accordingly
- Added toString() for type tags, and reference placeholder type
- Add ability to generate transactions with known ABI and remote ABI
- Fix verify signature logic
- Implement `MultiKey` support for multi authentication key

## 0.0.2 (2023-10-25)

- Build package before publishing\
- Add `AccountAddress.ZERO` to support the frequent future use of an optional fee payer address

## 0.0.1 (2023-10-25)

- [`Breaking`] Changed all instances of `arguments` to `functionArguments` to avoid the reserved keyword in `strict` mode.
- Support publish move module API function
- Fix client config not being added to the request
- Support to config a custom client instance
- Changed all Regex based inputs requiring a `0x` to be optional. This is to allow for easier copy/pasting of addresses and keys.
- Change GetAccountResource to take in a generic output type that matches the struct
- Add support for Single Sender

## 0.0.0 (2023-10-18)

- Fetch data from chain
- Fund account with APT coins
- Proper formatting and parsing of account addresses as defined by [AIP-40](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-40.md)
- Submit transactions
  - Single signer
  - Fee payer
  - Multi agent
  - With payloads
    - Entry function
    - Script
    - Multisig
- Simulate a transaction
  - Single signer
  - Fee payer
  - Multi agent
- Built in transaction generation
  - Transfer coins
  - Mint collection
  - Mint nft
- Keys management
  - ED25519
  - Secp256k1 - to go in next devnet release
  - Generate new keys
  - Derive from existing private key
  - Derive from mnemonics path
  - Derive from private key and address (for account that has it's key rotated)
  - Sign
  - Verify signature
- BCS support
  - Move sub-classes to easily serialize and deserialize Move types
  - Unified Argument class for entry function and script payload argument types
  - Full nested serialization/deserialization support
- Examples (both typescript and javascript)
  - Simple transfer transaction example
  - Transfer transaction example using built in transferCoinTransaction
  - Fee payer (aka sponsored) transaction example
  - Multi agent transaction example
  - Mint collection and nft
- Local custom types (instead of generating types)
- In depths type checking on compile time
  - Typescript can infer the return type based on the argument being passed into `generateTransaction` function (singlesigner,multiagent,feepayer)
  - Support for orderBy keys type checking for indexer queries
