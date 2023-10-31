/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 * Similar to ./simple_transfer.ts, but uses transferCoinTransaction to generate the transaction.
 */

import { Account, AccountAddress, Aptos, AptosConfig } from "aptos";

const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 1_000_000;
const TRANSFER_AMOUNT = 1_000_000;

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (aptos: Aptos, name: string, address: AccountAddress) => {
  type Coin = { coin: { value: string } };
  const resource = await aptos.getAccountResource<Coin>({
    accountAddress: address.toUint8Array(),
    resourceType: COIN_STORE,
  });
  const amount = Number(resource.coin.value);

  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

const example = async () => {
  console.log(
    "This example will create two accounts (Alice and Bob), fund them, and transfer between them using transferCoinTransaction.",
  );

  // Setup the client
  const config = new AptosConfig();
  const aptos = new Aptos(config);

  // Create two accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress.toString()}`);
  console.log(`Bob's address is: ${bob.accountAddress.toString()}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  // Fund alice account
  const aliceFundTxn = await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress.toUint8Array(),
    amount: ALICE_INITIAL_BALANCE,
  });
  console.log("Alice's fund transaction: ", aliceFundTxn);

  // Fund bob account
  const bobFundTxn = await aptos.faucet.fundAccount({
    accountAddress: bob.accountAddress.toUint8Array(),
    amount: BOB_INITIAL_BALANCE,
  });
  console.log("Bob's fund transaction: ", bobFundTxn);

  // Show the balances
  console.log("\n=== Balances ===\n");
  const aliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const bobBalance = await balance(aptos, "Bob", bob.accountAddress);

  if (aliceBalance !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (bobBalance !== BOB_INITIAL_BALANCE) throw new Error("Bob's balance is incorrect");

  // Transfer between users
  console.log(`\n=== Transfer ${TRANSFER_AMOUNT} from Alice to Bob ===\n`);
  const transaction = await aptos.transferCoinTransaction({
    sender: alice,
    recipient: bob.accountAddress.toString(),
    amount: TRANSFER_AMOUNT,
  });
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction });
  const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log(`Committed transaction: ${response.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newAliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const newBobBalance = await balance(aptos, "Bob", bob.accountAddress);

  // Bob should have the transfer amount
  if (newBobBalance !== TRANSFER_AMOUNT + BOB_INITIAL_BALANCE)
    throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the remainder minus gas
  if (newAliceBalance >= ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT)
    throw new Error("Alice's balance after transfer is incorrect");
};

example();
