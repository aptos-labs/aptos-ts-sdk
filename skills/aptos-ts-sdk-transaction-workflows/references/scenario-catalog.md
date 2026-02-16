# Scenario Catalog

Use this catalog when repository examples are unavailable.

## Shared Setup

Imports commonly needed:
- `Aptos`, `AptosConfig`, `Network`
- `Account`
- Transaction helpers from `aptos.transaction.*`

Network config baseline:
1. Read env network if provided.
2. Default to `Network.DEVNET`.
3. For Mainnet, avoid faucet assumptions.

## Scenario 1: Simple Transfer

Intent:
- Transfer coins from one account to another.

Core APIs:
1. `aptos.transaction.build.simple`
2. `aptos.transaction.sign` or `aptos.signAndSubmitTransaction`
3. `aptos.waitForTransaction`

Required inputs:
- sender account
- recipient address
- amount

Expected outputs:
- submitted transaction hash
- executed transaction response

## Scenario 2: Sponsored Transaction

Intent:
- Sender initiates transfer; sponsor pays gas.

Core APIs:
1. `aptos.transaction.build.simple` with `withFeePayer: true`
2. `aptos.transaction.signAsFeePayer`
3. `aptos.signAndSubmitTransaction` with `feePayerAuthenticator`

Required inputs:
- sender account
- sponsor account
- recipient address
- amount

Expected outputs:
- transaction hash
- post-transaction balance changes

## Scenario 3: Multi-Agent Transaction

Intent:
- Require multiple signers in one transaction flow.

Core APIs:
1. `aptos.transaction.build.multiAgent`
2. `aptos.transaction.sign` for each signer
3. `aptos.transaction.submit.multiAgent`

Required inputs:
- sender
- secondary signers
- transaction data

Expected outputs:
- transaction hash
- confirmation that state change requires all signatures

## Scenario 4: External Signing

Intent:
- Build in SDK, sign in external system.

Core APIs:
1. build: `aptos.transaction.build.simple`
2. signing payload: `transaction.bcsToBytes()` and/or `aptos.getSigningMessage`
3. authenticator reconstruction: `AccountAuthenticator.deserialize`
4. submission: `aptos.transaction.submit.simple`

Required inputs:
- unsigned transaction bytes
- external signature bytes

Expected outputs:
- reconstructed authenticator
- submitted hash

## Scenario 5: ABI-Aware Performance

Intent:
- Reduce repeated ABI lookup and reduce build latency.

Core APIs:
1. `aptos.transaction.build.simple` with `abi`
2. optional `options.accountSequenceNumber`
3. optional gas options (`gasUnitPrice`, `maxGasAmount`)

Required inputs:
- known ABI
- known type arguments
- known function arguments

Expected outputs:
- same behavior as baseline flow
- improved predictable build path

## Secondary Catalog (Phase 2)

1. Multisig v2 transaction creation/approval/execution flow.
2. Fungible asset transfer flows.
3. Digital asset mint/transfer flows.
