/**
 * Full SDK Example
 *
 * This example demonstrates using the full @aptos-labs/ts-sdk package.
 * Use this when you need all SDK features including keyless authentication.
 *
 * Bundle size: ~910KB minified
 *
 * Best for:
 * - Server-side applications
 * - Full-featured dApps that use keyless auth
 * - Applications where bundle size is not critical
 */

import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
  AccountAddress,
  // Keyless-specific imports (only available in full SDK)
  EphemeralKeyPair,
  KeylessAccount,
} from "@aptos-labs/ts-sdk";

async function main() {
  // Initialize the Aptos client
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);

  console.log("=== Full SDK Example ===\n");

  // 1. Basic account operations
  console.log("1. Creating accounts...");
  const alice = Account.generate();
  const bob = Account.generate();
  console.log(`   Alice: ${alice.accountAddress}`);
  console.log(`   Bob: ${bob.accountAddress}`);

  // 2. Fund accounts using faucet
  console.log("\n2. Funding accounts...");
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: 100_000_000,
  });
  console.log("   Alice funded with 1 APT");

  // 3. Check balance
  console.log("\n3. Checking balances...");
  const aliceBalance = await aptos.getAccountAPTAmount({
    accountAddress: alice.accountAddress,
  });
  console.log(`   Alice balance: ${aliceBalance / 100_000_000} APT`);

  // 4. Transfer APT
  console.log("\n4. Transferring APT...");
  const txn = await aptos.transferCoinTransaction({
    sender: alice.accountAddress,
    recipient: bob.accountAddress,
    amount: 10_000_000,
  });
  const pendingTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction: txn,
  });
  await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log(`   Transfer complete: ${pendingTxn.hash}`);

  // 5. Keyless authentication (only in full SDK)
  console.log("\n5. Keyless authentication setup...");
  // Note: EphemeralKeyPair.generate() is now async
  const ephemeralKeyPair = await EphemeralKeyPair.generate();
  console.log(`   Ephemeral public key: ${ephemeralKeyPair.getPublicKey()}`);
  console.log(`   Nonce for OAuth: ${ephemeralKeyPair.nonce}`);
  console.log("   (In production, redirect user to OAuth provider with this nonce)");

  // 6. View functions
  console.log("\n6. Calling view functions...");
  const [chainId] = await aptos.view({
    payload: {
      function: "0x1::chain_id::get",
      typeArguments: [],
      functionArguments: [],
    },
  });
  console.log(`   Chain ID: ${chainId}`);

  console.log("\n=== Full SDK Example Complete ===");
}

main().catch(console.error);

