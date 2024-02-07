/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 */

import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const example = async () => {
  console.log("This example will create two accounts (Alice and Bob), fund them, and transfer between them.");

  // Setup the client
  const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://fullnode.random.aptoslabs.com/v1",
    indexer: "https://indexer-randomnet.hasura.app/v1/graphql",
  });
  const aptos = new Aptos(config);

  const myAptogotchisResponse = await aptos.getAccountOwnedTokensFromCollectionAddress({
    collectionAddress: "0x969d5a925fd5c4431da55852573d4a25dab945380129869bf604102e0e061128",
    accountAddress: "0xc65d86f64516ac89d1bd60909b4ae6cbde1b9bc99e11befdf5807e493c368f89",
  });
  console.log(myAptogotchisResponse);

  // // Create two accounts
  // const alice = Account.generate();
  // const bob = Account.generate();

  // console.log("=== Addresses ===\n");
  // console.log(`Alice's address is: ${alice.accountAddress}`);
  // console.log(`Bob's address is: ${bob.accountAddress}`);

  // // Fund the accounts
  // console.log("\n=== Funding accounts ===\n");

  // const aliceFundTxn = await aptos.faucet.fundAccount({
  //   accountAddress: alice.accountAddress,
  //   amount: ALICE_INITIAL_BALANCE,
  // });
  // console.log("Alice's fund transaction: ", aliceFundTxn);

  // const bobFundTxn = await aptos.faucet.fundAccount({
  //   accountAddress: bob.accountAddress,
  //   amount: BOB_INITIAL_BALANCE,
  // });
  // console.log("Bob's fund transaction: ", bobFundTxn);

  // // Show the balances
  // console.log("\n=== Balances ===\n");
  // const aliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  // const bobBalance = await balance(aptos, "Bob", bob.accountAddress);

  // if (aliceBalance !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  // if (bobBalance !== BOB_INITIAL_BALANCE) throw new Error("Bob's balance is incorrect");

  // // Transfer between users
  // const txn = await aptos.transaction.build.simple({
  //   sender: alice.accountAddress,
  //   data: {
  //     function: "0x1::coin::transfer",
  //     typeArguments: [APTOS_COIN],
  //     functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
  //   },
  // });

  // console.log("\n=== Transfer transaction ===\n");
  // const committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });

  // await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  // console.log(`Committed transaction: ${committedTxn.hash}`);

  // console.log("\n=== Balances after transfer ===\n");
  // const newAliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  // const newBobBalance = await balance(aptos, "Bob", bob.accountAddress);

  // // Bob should have the transfer amount
  // if (newBobBalance !== TRANSFER_AMOUNT + BOB_INITIAL_BALANCE)
  //   throw new Error("Bob's balance after transfer is incorrect");

  // // Alice should have the remainder minus gas
  // if (newAliceBalance >= ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT)
  //   throw new Error("Alice's balance after transfer is incorrect");
};

example();
