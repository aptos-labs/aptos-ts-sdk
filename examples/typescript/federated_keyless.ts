/* eslint-disable max-len */
/* eslint-disable no-console */

/**
 * This example shows how to use the Keyless accounts on Aptos
 */

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  EphemeralKeyPair,
  MoveString,
  Network,
} from "@aptos-labs/ts-sdk";
import * as readlineSync from "readline-sync";
import { getMoveBytes } from "./utils";

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
const balance = async (aptos: Aptos, name: string, address: AccountAddress) => {
  const amount = await aptos.getAccountAPTAmount({
    accountAddress: address,
  });
  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

const example = async () => {
  // Setup the client
  const config = new AptosConfig({ network: Network.DEVNET });
  const aptos = new Aptos(config);

  // Generate the ephemeral (temporary) key pair that will be used to sign transactions.
  const aliceEphem = new EphemeralKeyPair({
    privateKey: new Ed25519PrivateKey("0x1111111111111111111111111111111111111111111111111111111111111111"),
    expiryDateSecs: 1735497501,
    blinder: new Uint8Array(31),
  });

  console.log("\n=== Federated Keyless Account Example ===\n");

  const link = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground&prompt=consent&response_type=code&client_id=407408718192.apps.googleusercontent.com&scope=openid&access_type=offline&service=lso&o2v=2&theme=glif&flowName=GeneralOAuthFlow&nonce=${aliceEphem.nonce}`;
  console.log(`${link}\n`);

  console.log("1. Open the link above");
  console.log("2. Log in with your Google account");
  console.log("3. Click 'Exchange authorization code for tokens");
  console.log("4. Copy the 'id_token' - (toggling 'Wrap lines' option at the bottom makes this easier)\n");

  function inputJwt(): string {
    const jwt: string = readlineSync.question("Paste the JWT (id_token) token here and press enter: ", {
      hideEchoBack: false,
    });
    return jwt;
  }

  const jwt = inputJwt();

  const bob = Account.generate();
  console.log(`Bob's address is: ${bob.accountAddress}`);

  // Derive the Keyless Account from the JWT and ephemeral key pair.
  const alice = await aptos.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair: aliceEphem,
    jwkAddress: bob.accountAddress,
  });

  console.log("=== Addresses ===\n");
  console.log(`Alice's keyless account address is: ${alice.accountAddress}`);
  console.log(`Alice's nonce is: ${aliceEphem.nonce}`);
  console.log(`Alice's ephem pubkey is: ${aliceEphem.getPublicKey().toString()}`);

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

  const bytecode = getMoveBytes("move/jwks/script.mv");

  const iss = "https://dev-qtdgjv22jh0v1k7g.us.auth0.com/";
  const kid = "OYryNKGFtFhtHVOd1d_BU";
  const alg = "RS256";
  const e = "AQAB";
  const n =
    "rHZUp7dZTV15qJbH_5lsUZqY0qIDKubQH7TMUoURc_DjUQWCL1o92YKc8WhMcCUdUMq57XrRiAimMzn_hhsPk3vZXBT5V9TJA8SzGR5w9sxDkQklKSNw7EIQw38WwVGeQdrEuGPiNtmNf7NZFbs3U2wJmPVCmS8cQdFEhOpszfL1KpRdCDxQ_3uWpReEKyWfaVJV4M83_q6rw386a20u9w1p3motQjyJHk5tMMvFsyF6iYZebDcY2zGr2kw_1EjDP_Rsk3Vka1sKPg2tghJ00djcmi7Szla6Tz8igkoRI2Tcs0KnnQ-sgcUcm8xIgS3StlhuJiURNclHYbahnLx6ow";

  console.log("\n===Publishing FACoin package===");
  const jwkTransaction = await aptos.transaction.build.simple({
    sender: bob.accountAddress,
    data: {
      bytecode,
      functionArguments: [],
    },
  });

  const committedJwkTxn = await aptos.signAndSubmitTransaction({ signer: bob, transaction: jwkTransaction });

  await aptos.waitForTransaction({ transactionHash: committedJwkTxn.hash });
  console.log(`Committed transaction: ${committedJwkTxn.hash}`);

  // Transfer between users
  const transaction = await aptos.transferCoinTransaction({
    sender: alice.accountAddress,
    recipient: bob.accountAddress,
    amount: TRANSFER_AMOUNT,
  });

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
