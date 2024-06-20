/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 */

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
  NetworkToNetworkName,
  parseTypeTag,
} from "@aptos-labs/ts-sdk";

// TODO: There currently isn't a way to use the APTOS_COIN in the COIN_STORE due to a regex
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const ALICE_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 100;

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;

const example = async () => {
  console.log("This create an account, and rotate it's key");

  // Set up the client
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  // Create an account
  const alice = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");
  await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });

  // Show that you can sign with the first key
  const txn = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [parseTypeTag(APTOS_COIN)],
      functionArguments: [AccountAddress.fromString("0xbeef"), TRANSFER_AMOUNT],
    },
  });

  console.log("\n=== Transfer transaction ===\n");
  const committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  // Generate new key
  const newKey = Ed25519PrivateKey.generate();

  const beforeInfo = await aptos.getAccountInfo({ accountAddress: alice.accountAddress });
  console.log(`Alice's auth key: ${beforeInfo.authentication_key}`);

  // Rotate key
  console.log("\n=== Rotate key ===\n");
  const rotateTxnSubmitResponse = await aptos.rotateAuthKey({ fromAccount: alice, toNewPrivateKey: newKey });
  await aptos.waitForTransaction({ transactionHash: rotateTxnSubmitResponse.hash });
  console.log(`Committed transaction: ${rotateTxnSubmitResponse.hash}`);

  const afterInfo = await aptos.getAccountInfo({ accountAddress: alice.accountAddress });
  console.log(`Alice's new auth key: ${afterInfo.authentication_key}`);

  // Now let's use the new key
  // Note, you may have to provide the address for other types of rotated keys (non-ed25519)
  const newAlice = Account.fromPrivateKey({ privateKey: newKey, address: alice.accountAddress });

  const newTxn = await aptos.transaction.build.simple({
    sender: newAlice.accountAddress,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [parseTypeTag(APTOS_COIN)],
      functionArguments: [AccountAddress.fromString("0xbeef"), TRANSFER_AMOUNT],
    },
  });

  console.log("\n=== Transfer transaction (with new key) ===\n");
  const newCommittedTxn = await aptos.signAndSubmitTransaction({ signer: newAlice, transaction: newTxn });

  await aptos.waitForTransaction({ transactionHash: newCommittedTxn.hash });
  console.log(`Committed transaction: ${newCommittedTxn.hash}`);
};

example();
