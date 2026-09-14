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

- Define deterministic, hard-coded private keys for the initial Ed25519 signer, three MultiEd25519 components, and the final Ed25519 signer.
- Create a 2-of-3 MultiEd25519 public key and construct its signer with two component private keys and the initial Ed25519 account address.
- Construct the final Ed25519 signer from its fixed private key and the same account address.
- Label every embedded private key as public, example-only material that must never hold real funds.

The account address remains unchanged throughout. Only its on-chain authentication key and signing requirements change.

## Repeatable Preflight

A verified rotation adds the target authentication key to the framework's one-to-one `OriginatingAddress` map. Reusing a fixed target key for a different random account would abort with `ENEW_AUTH_KEY_ALREADY_MAPPED`, so the example always uses the same deterministic account address and key set.

After funding the account, inspect its current on-chain authentication key:

- If it matches the initial Ed25519 key, begin the demonstration.
- If it matches the MultiEd25519 or final Ed25519 key, use that deterministic signer to rotate back to the initial Ed25519 key before beginning.
- If it matches none of the example's keys, stop with a descriptive error instead of submitting a transaction with the wrong signer.

This preflight also recovers from a prior run interrupted after the first rotation. Resetting to the initial key removes any prior `OriginatingAddress` entry for the final key, making the main flow repeatable on persistent development networks.

## Rotation Flow

For each transition:

1. Build the rotation transaction with `aptos.rotateAuthKey`.
2. Sign and submit it with the account that controls the current authentication key.
3. Wait for the transaction to commit.
4. Fetch account information for the unchanged account address.
5. Compare the on-chain authentication key with the target public key's derived authentication key and throw a descriptive error if they differ.

The first transaction is signed by the initial Ed25519 account and targets the MultiEd25519 account. The second is signed by the MultiEd25519 account and targets the fixed Ed25519 account.

## Output and Errors

Log the stable account address, any preflight reset, each signer type, expected authentication keys, and committed transaction hashes. Do not print private-key material.

Allow faucet, submission, and transaction-wait failures to surface. Authentication-key mismatches use explicit errors so an example run cannot report success after an incomplete rotation.

## Validation

- Type-check the TypeScript examples.
- Run formatting and lint checks.
- Execute the example twice against the same configured development network and confirm the second run resets the deterministic account before both requested rotations commit and all authentication-key assertions pass.

