/* eslint-disable max-len */
/* eslint-disable no-console */

/**
 * This example shows how to use the Keyless accounts on Cedra
 */

import { Account, AccountAddress, Cedra, CedraConfig, EphemeralKeyPair, Network } from "@cedra-labs/ts-sdk";
import * as readlineSync from "readline-sync";

const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 10_000;

/**
 * Prints the balance of an account
 * @param cedra
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (cedra: Cedra, name: string, address: AccountAddress): Promise<any> => {
  const amount = await cedra.getAccountCEDRAAmount({
    accountAddress: address,
  });
  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

const example = async () => {
  // Set up the client
  const network = Network.DEVNET;
  const config = new CedraConfig({ network });
  const cedra = new Cedra(config);

  // Generate the ephemeral (temporary) key pair that will be used to sign transactions.
  const aliceEphem = EphemeralKeyPair.generate();

  console.log("\n=== Keyless Account Example ===\n");

  const link = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground&prompt=consent&response_type=code&client_id=407408718192.apps.googleusercontent.com&scope=openid&access_type=offline&service=lso&o2v=2&theme=glif&flowName=GeneralOAuthFlow&nonce=${aliceEphem.nonce}`;
  console.log(`${link}\n`);

  console.log("1. Open the link above");
  console.log("2. Log in with your Google account");
  console.log("3. Click 'Exchange authorization code for tokens'");
  console.log("4. Copy the 'id_token' - (toggling 'Wrap lines' option at the bottom makes this easier)\n");

  function inputJwt(): string {
    return readlineSync.question("Paste the JWT (id_token) token here and press enter: ", {
      hideEchoBack: false,
    });
  }

  const jwt = inputJwt();
  // Derive the Keyless Account from the JWT and ephemeral key pair.
  const alice = await cedra.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair: aliceEphem,
  });

  console.log("=== Addresses ===\n");
  console.log(`Alice's keyless account address is: ${alice.accountAddress}`);
  console.log(`Alice's nonce is: ${aliceEphem.nonce}`);
  console.log(`Alice's ephemeral public key is: ${aliceEphem.getPublicKey().toString()}`);

  const bob = Account.generate();
  console.log(`Bob's address is: ${bob.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  await cedra.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });
  await cedra.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
    options: { waitForIndexer: false },
  });

  // // Show the balances
  console.log("\n=== Balances ===\n");
  const aliceBalance = await balance(cedra, "Alice", alice.accountAddress);
  const bobBalance = await balance(cedra, "Bob", bob.accountAddress);

  // Transfer between users
  const transaction = await cedra.transferCoinTransaction({
    sender: alice.accountAddress,
    recipient: bob.accountAddress,
    amount: TRANSFER_AMOUNT,
  });

  const committedTxn = await cedra.signAndSubmitTransaction({ signer: alice, transaction });

  await cedra.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`\nCommitted transaction:\nhttps://explorer.cedralabs.com/txn/${committedTxn.hash}?network=${network}`);

  console.log("\n=== Balances after transfer ===\n");
  const newAliceBalance = await balance(cedra, "Alice", alice.accountAddress);
  const newBobBalance = await balance(cedra, "Bob", bob.accountAddress);

  // Bob should have the transfer amount
  if (TRANSFER_AMOUNT !== newBobBalance - bobBalance) throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the remainder minus gas
  if (TRANSFER_AMOUNT >= aliceBalance - newAliceBalance) throw new Error("Alice's balance after transfer is incorrect");
};

example();
