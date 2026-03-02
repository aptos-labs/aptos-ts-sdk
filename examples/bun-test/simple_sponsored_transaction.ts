/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client with Bun runtime
 * for sponsored transactions.
 *
 * IMPORTANT: Bun requires HTTP/2 to be disabled in the SDK client config.
 */

import { Account, Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

// Alice needs funds to transfer, Bob (sponsor) pays the gas
const ALICE_INITIAL_BALANCE = 100; // Just enough to transfer
const BOB_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 10;

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[Bun.env.APTOS_NETWORK ?? ""] ?? Network.DEVNET;

const example = async () => {
  console.log("Bun Runtime Test: Sponsored transaction example.");
  console.log(`Running with Bun version: ${Bun.version}`);

  // Set up the client - IMPORTANT: Disable HTTP/2 for Bun compatibility
  const config = new AptosConfig({
    network: APTOS_NETWORK,
    clientConfig: { http2: false },
  });
  const aptos = new Aptos(config);

  // Create accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress}`);
  console.log(`Bob (sponsor): ${bob.accountAddress}`);

  // Fund both accounts - Alice needs funds to transfer, Bob (sponsor) pays the gas
  console.log("\n=== Funding accounts ===");
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });
  await aptos.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
  });
  console.log("Both accounts funded successfully");

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

  console.log("\n=== Bun Sponsored Transaction Test Passed! ===");
};

example();
