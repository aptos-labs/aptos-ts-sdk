# Multisig Pre-Proposal Simulation Example Design

## Context

The SDK already supports simulating a transaction as a multisig account before a proposal exists. A focused devnet
verification succeeded by building an entry-function transaction with the multisig address as sender, enabling a fee
payer (left as `0x0`), and omitting both public keys from `simulate.simple`.

The complete `multisig_v2` example currently fails before reaching that simulation. Devnet's faucet credits a new
account with 100,000,000 octas even when the example requests more, while the SDK reserves a maximum fee of
200,000,000 octas at the current gas price by default. Fullnode validation therefore rejects multisig account creation
with `INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE`.

## Changes

1. Configure the example's `AptosConfig` with a `defaultMaxGasAmount` of 100,000. The focused verification established
   that this limit is sufficient for multisig creation and the simulated transfer while keeping the maximum fee below
   the faucet-funded balance.
2. Clarify the example's simulation comments: no proposal exists yet, the multisig address acts as sender, the
   zero-address fee payer is created by `withFeePayer`, and omitted public keys skip authentication-key validation.
3. Add the same pre-proposal recipe to the `simulate.simple` API documentation so users can discover the behavior
   without first finding the example.
4. Record the example and documentation correction in the TS SDK changelog.

No SDK runtime behavior or generated documentation will be changed.

## Verification

- Build `@aptos-labs/ts-sdk`.
- Run the complete `multisig_v2` example against devnet and confirm all multisig operations finish.
- Run the repository formatter and check commands required before commit.
