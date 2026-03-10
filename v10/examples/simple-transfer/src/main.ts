/**
 * Simple Transfer Example
 *
 * Demonstrates the core Aptos transaction flow:
 * 1. Generate two accounts (Alice and Bob)
 * 2. Fund Alice via the faucet
 * 3. Check Alice's balance
 * 4. Build a transfer transaction
 * 5. Sign and submit the transaction
 * 6. Wait for confirmation
 * 7. Check Bob's balance
 */

import { Aptos, Network, generateAccount, U64 } from "@aptos-labs/ts-sdk";

const TRANSFER_AMOUNT = 1_000_000; // 0.01 APT in Octas

async function main() {
  // Initialize the Aptos client for devnet
  const aptos = new Aptos({ network: Network.DEVNET });

  // Step 1: Generate two accounts
  const alice = generateAccount();
  const bob = generateAccount();

  console.log("=== Account Addresses ===");
  console.log(`Alice: ${alice.accountAddress}`);
  console.log(`Bob:   ${bob.accountAddress}`);

  // Step 2: Fund Alice's account from the faucet (1 APT = 100_000_000 Octas)
  console.log("\n=== Funding Alice ===");
  const fundTxn = await aptos.faucet.fund(alice.accountAddress, 100_000_000);
  console.log(`Faucet transaction committed: ${fundTxn.hash}`);

  // Step 3: Check Alice's balance using a view function
  console.log("\n=== Checking Balances ===");
  const [aliceBalance] = await aptos.general.view({
    function: "0x1::coin::balance",
    type_arguments: ["0x1::aptos_coin::AptosCoin"],
    arguments: [alice.accountAddress.toString()],
  });
  console.log(`Alice's balance: ${aliceBalance} Octas`);

  // Step 4: Build a transfer transaction from Alice to Bob
  console.log("\n=== Building Transfer ===");
  const transaction = await aptos.transaction.buildSimple(
    alice.accountAddress,
    {
      function: "0x1::aptos_account::transfer",
      typeArguments: [],
      functionArguments: [bob.accountAddress, new U64(TRANSFER_AMOUNT)],
    },
  );
  console.log("Transaction built successfully");

  // Step 5: Sign and submit the transaction
  console.log("\n=== Signing & Submitting ===");
  const pendingTxn = await aptos.transaction.signAndSubmit(alice, transaction);
  console.log(`Submitted transaction hash: ${pendingTxn.hash}`);

  // Step 6: Wait for the transaction to be committed on-chain
  console.log("\n=== Waiting for Confirmation ===");
  const committedTxn = await aptos.transaction.waitForTransaction(
    pendingTxn.hash,
  );
  console.log(
    `Transaction confirmed! Version: ${committedTxn.version}, Gas used: ${committedTxn.gas_used}`,
  );

  // Step 7: Check Bob's balance
  console.log("\n=== Final Balances ===");
  const [bobBalance] = await aptos.general.view({
    function: "0x1::coin::balance",
    type_arguments: ["0x1::aptos_coin::AptosCoin"],
    arguments: [bob.accountAddress.toString()],
  });
  console.log(`Bob's balance: ${bobBalance} Octas`);

  console.log("\nDone! Transferred", TRANSFER_AMOUNT, "Octas from Alice to Bob.");
}

main().catch(console.error);
