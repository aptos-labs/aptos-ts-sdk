# Aptos TypeScript SDK Changelog

All notable changes to the Aptos TypeScript SDK will be captured in this file. This changelog is written by hand for now. It adheres to the format set out by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

# Unreleased

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
