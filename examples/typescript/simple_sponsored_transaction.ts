/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * Example to submit a simple sponsored transaction where Alice transfers APT coin to Bob
 * with a sponsor account to pay for the gas fee
 */
import { Account, Cedra, CedraConfig, Network, NetworkToNetworkName } from "@cedra-labs/ts-sdk";
import dotenv from "dotenv";
dotenv.config();

const ALICE_INITIAL_BALANCE = 100_000_000;
const SPONSOR_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 0;
const TRANSFER_AMOUNT = 10;
// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

const example = async () => {
  console.log(
    "This example will create three accounts (Alice, Bob and Sponsor), fund Alice and Sponsor, transfer between Alice and Bob with sponsor to pay the gas fee.",
  );

  // Set up the client
  const cedraConfig = new CedraConfig({ network: APTOS_NETWORK });
  const cedra = new Cedra(cedraConfig);

  // Create three accounts
  const alice = Account.generate();
  const bob = Account.generate();
  const sponsor = Account.generate();

  // Variables to hold Alice and sponsor accounts address
  const aliceAddress = alice.accountAddress;
  const bobAddress = bob.accountAddress;
  const sponsorAddress = sponsor.accountAddress;

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${aliceAddress}`);
  console.log(`Bob's address is: ${bobAddress}`);
  console.log(`Sponsor's address is: ${sponsorAddress}`);

  // Fund Alice and sponsor accounts
  await cedra.fundAccount({ accountAddress: aliceAddress, amount: ALICE_INITIAL_BALANCE });
  await cedra.fundAccount({
    accountAddress: sponsorAddress,
    amount: SPONSOR_INITIAL_BALANCE,
  });

  // Show account balances
  const aliceBalanceBefore = await cedra.getAccountCoinsData({ accountAddress: aliceAddress });
  const sponsorBalanceBefore = await cedra.getAccountCoinsData({ accountAddress: sponsorAddress });

  console.log("\n=== Balances ===\n");
  console.log(`Alice's balance is: ${aliceBalanceBefore[0].amount}`);
  console.log(`Bob's balance is: ${BOB_INITIAL_BALANCE}`);
  console.log(`Sponsor's balance is: ${sponsorBalanceBefore[0].amount}`);

  if (aliceBalanceBefore[0].amount !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (sponsorBalanceBefore[0].amount !== SPONSOR_INITIAL_BALANCE) throw new Error("Sponsor's balance is incorrect");

  // Generate a fee payer (aka sponsor) transaction
  // with Alice as the sender and sponsor as the fee payer
  console.log("\n=== Submitting Transaction ===\n");
  const transaction = await cedra.transaction.build.simple({
    sender: aliceAddress,
    withFeePayer: true,
    data: {
      function: "0x1::cedra_account::transfer",
      functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
    },
  });

  // Sponsor signs
  const sponsorSignature = cedra.transaction.signAsFeePayer({ signer: sponsor, transaction });

  // Submit the transaction to chain
  const committedTxn = await cedra.signAndSubmitTransaction({
    signer: alice,
    // TODO: This doesn't actually work here?
    feePayerAuthenticator: sponsorSignature,
    transaction,
  });

  console.log(`Submitted transaction: ${committedTxn.hash}`);
  const response = await cedra.waitForTransaction({ transactionHash: committedTxn.hash });

  console.log("\n=== Balances after transfer ===\n");
  const aliceBalanceAfter = await cedra.getAccountCoinsData({
    accountAddress: aliceAddress,
    minimumLedgerVersion: BigInt(response.version),
  });
  const bobBalanceAfter = await cedra.getAccountCoinsData({ accountAddress: bobAddress });
  const sponsorBalanceAfter = await cedra.getAccountCoinsData({ accountAddress: sponsorAddress });

  // Bob should have the transfer amount
  if (bobBalanceAfter[0].amount !== TRANSFER_AMOUNT) throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the initial balance minus transfer amount
  if (aliceBalanceAfter[0].amount !== ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT)
    throw new Error("Alice's balance after transfer is incorrect");

  // Sponsor should have the initial balance minus gas
  if (sponsorBalanceAfter[0].amount >= SPONSOR_INITIAL_BALANCE)
    throw new Error("Sponsor's balance after transfer is incorrect");

  console.log(`Alice's final balance is: ${aliceBalanceAfter[0].amount}`);
  console.log(`Bob's balance is: ${bobBalanceAfter[0].amount}`);
  console.log(`Sponsor's balance is: ${sponsorBalanceAfter[0].amount}`);
};

example();
