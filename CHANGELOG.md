# Aptos TS SDK Changelog

All notable changes to the Aptos Node SDK will be captured in this file. This changelog is written by hand for now. It adheres to the format set out by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 0.0.0 (2023-10-18)

- Fetch data from chain
- Fund account with APT coins
- Proper formatting and parsing of account addresses as defined by AIP-40
- Submit transactions
  - single signer
  - fee payer
  - multi agent
  - with payloads
    - entry function
    - script
    - multisig
- Simulate a transaction
  - single signer
  - fee payer
  - multi agent
- Built in transfer coins transaction generation
- Keys management (ed25519 & secp256k1 schemes)
  - ed25519 & secp256k1
  - generate new keys
  - derive from existing private key
  - derive from mnemonics path
  - derive from private key and address (for account that has it's key rotated)
  - sign
  - verify signature
- BCS support
  - Move sub-classes to easily serialize and deserialize Move types
  - Unified Argument class for entry and script payloads argument types
  - Nested serialization/deserialization support
- Examples (both typescript and javascript)
  - simple transfer transaction example
  - transfer example using built in transferCoinTransaction
  - fee payer (aka sponsored) transaction example
  - multi agent transaction example
- Local custom types (instead of generating types)
- In depths type checking on compile time
  - Typescript can infer the return type based on the argument being passed into `generateTransaction` function (singlesigner,multiagent,feepayer)
  - Support for orderBy keys type checking for indexer queries
