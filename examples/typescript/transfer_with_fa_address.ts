/* eslint-disable no-console */

/**
 * This example shows how to use the Cedra client to create accounts, fund them, and transfer between them.
 */

import {
  Account,
  AccountAddress,
  Cedra,
  CedraConfig,
  InputViewFunctionJsonData,
  Network,
  NetworkToNetworkName,
} from "@cedra-labs/ts-sdk";
import dotenv from "dotenv";
dotenv.config();

const CEDRA_COIN = "0x1::cedra_coin::CedraCoin";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

// Default to devnet, but allow for overriding
const CEDRA_NETWORK: Network = NetworkToNetworkName[process.env.CEDRA_NETWORK ?? Network.DEVNET];

/**
 * Prints the balance of an account
 * @param cedra
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (cedra: Cedra, name: string, address: AccountAddress): Promise<any> => {
  const payload: InputViewFunctionJsonData = {
    function: "0x1::coin::balance",
    typeArguments: ["0x1::cedra_coin::CedraCoin"],
    functionArguments: [address.toString()],
  };
  const [balance] = await cedra.viewJson<[number]>({ payload: payload });

  console.log(`${name}'s balance is: ${balance}`);
  return Number(balance);
};

const example = async () => {
  console.log("This example will create two accounts (Alice and Bob), fund them, and transfer between them.");

  // Set up the client
  const config = new CedraConfig({ network: CEDRA_NETWORK });
  const cedra = new Cedra(config);

  // Create two accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Bob's address is: ${bob.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  const aliceFundTxn = await cedra.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });
  console.log("Alice's fund transaction: ", aliceFundTxn);

  const bobFundTxn = await cedra.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
  });
  console.log("Bob's fund transaction: ", bobFundTxn);

  // Show the balances
  console.log("\n=== Balances ===\n");
  const aliceBalance = await balance(cedra, "Alice", alice.accountAddress);
  const bobBalance = await balance(cedra, "Bob", bob.accountAddress);

  console.log("aliceBalance", aliceBalance);
  console.log("ALICE_INITIAL_BALANCE", ALICE_INITIAL_BALANCE);
  if (aliceBalance !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (bobBalance !== BOB_INITIAL_BALANCE) throw new Error("Bob's balance is incorrect");

  // Transfer between users
  const txn = await cedra.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [CEDRA_COIN],
      functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
    },
  });

  console.log("\n=== Transfer transaction ===\n");
  const committedTxn = await cedra.signAndSubmitTransaction({ signer: alice, transaction: txn });

  await cedra.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newAliceBalance = await balance(cedra, "Alice", alice.accountAddress);
  const newBobBalance = await balance(cedra, "Bob", bob.accountAddress);
};

example();
