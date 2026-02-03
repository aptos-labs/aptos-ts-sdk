/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client with Deno runtime
 * for sponsored transactions.
 */

import { Account, Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

const ALICE_INITIAL_BALANCE = 0;
const BOB_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 10;

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[Deno.env.get("APTOS_NETWORK") ?? ""] ?? Network.DEVNET;

const example = async () => {
  console.log("Deno Runtime Test: Sponsored transaction example.");
  console.log(`Running with Deno version: ${Deno.version.deno}`);

  // Set up the client
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  // Create accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress}`);
  console.log(`Bob (sponsor): ${bob.accountAddress}`);

  // Only fund bob (sponsor) - alice has no funds
  console.log("\n=== Funding sponsor account ===");
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });

  await aptos.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
  });
  console.log("Bob funded successfully");

  // Build a sponsored transaction where Bob pays for Alice's transaction
  console.log("\n=== Building sponsored transaction ===");
  const transaction = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    withFeePayer: true,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
    },
  });

  // Alice signs the transaction
  const aliceSenderAuthenticator = aptos.transaction.sign({ signer: alice, transaction });

  // Bob (fee payer) signs the transaction
  const bobSponsorAuthenticator = aptos.transaction.signAsFeePayer({ signer: bob, transaction });

  // Submit the transaction with both signatures
  console.log("\n=== Submitting sponsored transaction ===");
  const committedTxn = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator: aliceSenderAuthenticator,
    feePayerAuthenticator: bobSponsorAuthenticator,
  });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Transaction successful: ${committedTxn.hash}`);

  console.log("\n=== Deno Sponsored Transaction Test Passed! ===");
};

await example();
