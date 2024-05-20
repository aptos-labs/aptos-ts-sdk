/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 */

import { Account, AccountAddress, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// TODO: There currently isn't a way to use the APTOS_COIN in the COIN_STORE due to a regex
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

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
    accountAddress: address,
    resourceType: COIN_STORE,
  });
  const amount = Number(resource.coin.value);

  return amount;
};

export const transferAPT = async () => {
  // Setup the client
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);

  // Create two accounts
  const alice = Account.generate();
  const bob = Account.generate();

  await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });

  await aptos.faucet.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
  });

  // Show the balances
  const aliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const bobBalance = await balance(aptos, "Bob", bob.accountAddress);

  if (aliceBalance !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (bobBalance !== BOB_INITIAL_BALANCE) throw new Error("Bob's balance is incorrect");

  // Transfer between users
  const txn = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [APTOS_COIN],
      functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
    },
  });

  const committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  const newAliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const newBobBalance = await balance(aptos, "Bob", bob.accountAddress);

  // Bob should have the transfer amount
  if (newBobBalance !== TRANSFER_AMOUNT + BOB_INITIAL_BALANCE)
    throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the remainder minus gas
  if (newAliceBalance >= ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT)
    throw new Error("Alice's balance after transfer is incorrect");
};
