/* eslint-disable max-len */
/* eslint-disable no-console */

/**
 * This example shows how to use the Federated Keyless accounts on Aptos
 */

import { Account, AccountAddress, Aptos, AptosConfig, EphemeralKeyPair, Network } from "@aptos-labs/ts-sdk";
import * as readlineSync from "readline-sync";

const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 10_000;

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (aptos: Aptos, name: string, address: AccountAddress): Promise<any> => {
  const amount = await aptos.getAccountAPTAmount({
    accountAddress: address,
  });
  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

const example = async () => {
  // Set up the client
  const config = new AptosConfig({ network: Network.DEVNET });
  const aptos = new Aptos(config);

  // Generate the ephemeral (temporary) key pair that will be used to sign transactions.
  const ephemeralKeyPair = EphemeralKeyPair.generate();

  console.log("\n=== Federated Keyless Account Example ===\n");

  const link = `https://dev-qtdgjv22jh0v1k7g.us.auth0.com/authorize?client_id=dzqI77x0M5YwdOSUx6j25xkdOt8SIxeE&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fcallback&response_type=id_token&scope=openid&nonce=${ephemeralKeyPair.nonce}`;
  console.log(`${link}\n`);

  console.log("1. Open the link above");
  console.log("2. Log in with your Google account");
  console.log("3. Click 'Exchange authorization code for tokens'");
  console.log("4. Copy the 'id_token' - (toggling 'Wrap lines' option at the bottom makes this easier)\n");

  function inputJwt(): string {
    return readlineSync.question("Paste the JWT (id_token) token here and press enter:\n\n", {
      hideEchoBack: false,
    });
  }

  const jwt = inputJwt();

  const bob = Account.generate();

  // Derive the Keyless Account from the JWT and ephemeral key pair.
  const alice = await aptos.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair,
    jwkAddress: bob.accountAddress,
  });

  console.log("\n=== Addresses ===\n");
  console.log(`Alice's keyless account address is: ${alice.accountAddress}`);
  console.log(`Alice's nonce is: ${ephemeralKeyPair.nonce}`);
  console.log(`Alice's ephemeral public key is: ${ephemeralKeyPair.getPublicKey().toString()}`);
  console.log(`\nBob's account address is: ${bob.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
    options: { waitForIndexer: false },
  });
  await aptos.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
    options: { waitForIndexer: false },
  });

  // // Show the balances
  console.log("\n=== Balances ===\n");
  const aliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const bobBalance = await balance(aptos, "Bob", bob.accountAddress);

  const iss = "https://dev-qtdgjv22jh0v1k7g.us.auth0.com/";

  console.log("\n=== Installing JSON Web Key Set (JWKS) ===\n");
  const jwkTxn = await aptos.updateFederatedKeylessJwkSetTransaction({ sender: bob, iss });
  const committedJwkTxn = await aptos.signAndSubmitTransaction({ signer: bob, transaction: jwkTxn });
  await aptos.waitForTransaction({ transactionHash: committedJwkTxn.hash });
  console.log(`Committed transaction: ${committedJwkTxn.hash}`);

  // Transfer between users
  const transaction = await aptos.transferCoinTransaction({
    sender: alice.accountAddress,
    recipient: bob.accountAddress,
    amount: TRANSFER_AMOUNT,
  });

  console.log("\n=== Transferring ===\n");
  const committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newAliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const newBobBalance = await balance(aptos, "Bob", bob.accountAddress);

  // Bob should have the transfer amount minus gas to insert jwk
  if (TRANSFER_AMOUNT <= newBobBalance - bobBalance) throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the remainder minus gas
  if (TRANSFER_AMOUNT >= aliceBalance - newAliceBalance) throw new Error("Alice's balance after transfer is incorrect");
};

example();
