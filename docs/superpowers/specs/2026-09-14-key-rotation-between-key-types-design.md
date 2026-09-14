# Key Rotation Between Key Types Example

## Goal

Update the TypeScript key-rotation example to demonstrate a complete authentication-key lifecycle:

1. Start with an Ed25519 account.
2. Rotate the account to a 2-of-3 MultiEd25519 signer.
3. Rotate the same account address to a fixed Ed25519 key.

The example must submit both rotation transactions and verify each resulting authentication key on-chain.

## Scope

Modify `examples/typescript/rotate_key.ts` and its package scripts. No SDK API changes are required because `Aptos.rotateAuthKey` already accepts Ed25519 and MultiEd25519 target accounts.

Add an entry to the TypeScript SDK changelog describing the expanded example.

## Account Setup

- Generate the initial Ed25519 account at runtime and fund only its address.
- Generate three MultiEd25519 component keys at runtime and create a 2-of-3 public key. Construct the MultiEd25519 signer with two component private keys and the initial account address.
- Construct the final Ed25519 signer from a constant private key and the initial account address. The constant must be labeled as public, example-only material that must never hold real funds.

The account address remains unchanged throughout. Only its on-chain authentication key and signing requirements change.

## Rotation Flow

For each transition:

1. Build the rotation transaction with `aptos.rotateAuthKey`.
2. Sign and submit it with the account that controls the current authentication key.
3. Wait for the transaction to commit.
4. Fetch account information for the unchanged account address.
5. Compare the on-chain authentication key with the target public key's derived authentication key and throw a descriptive error if they differ.

The first transaction is signed by the initial Ed25519 account and targets the MultiEd25519 account. The second is signed by the MultiEd25519 account and targets the fixed Ed25519 account.

## Output and Errors

Log the stable account address, each signer type, expected authentication keys, and committed transaction hashes. Do not print private-key material.

Allow faucet, submission, and transaction-wait failures to surface. Authentication-key mismatches use explicit errors so an example run cannot report success after an incomplete rotation.

## Validation

- Type-check the TypeScript examples.
- Run formatting and lint checks.
- Execute the example against the configured development network and confirm both transactions commit and both authentication-key assertions pass.

