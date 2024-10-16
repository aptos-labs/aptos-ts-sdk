/* eslint-disable max-len */
/* eslint-disable no-console */

/**
 * This example shows how to use the Keyless accounts on Aptos
 */

import { AccountAddress, Aptos, AptosConfig, EphemeralKeyPair, Network } from "@aptos-labs/ts-sdk";
import * as readlineSync from "readline-sync";

const TRANSFER_AMOUNT = 10;

/**
 * Prints the balance of an account
 * @param aptos
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (aptos: Aptos, address: AccountAddress): Promise<any> =>
  aptos.getAccountAPTAmount({
    accountAddress: address,
  });

const example = async () => {
  // Set up the client
  const config = new AptosConfig({ network: Network.MAINNET });
  const aptos = new Aptos(config);

  // Generate the ephemeral (temporary) key pair that will be used to sign transactions.
  const aliceEphem = EphemeralKeyPair.generate();

  console.log("\n=== Keyless Account Example (Mainnet) ===\n");

  const link = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground&prompt=consent&response_type=code&client_id=407408718192.apps.googleusercontent.com&scope=openid&access_type=offline&service=lso&o2v=2&theme=glif&flowName=GeneralOAuthFlow&nonce=${aliceEphem.nonce}`;
  console.log(`${link}\n`);

  console.log("1. Open the link above");
  console.log("2. Log in with your Google account");
  console.log("3. Click 'Exchange authorization code for tokens");
  console.log("4. Copy the 'id_token' - (toggling 'Wrap lines' option at the bottom makes this easier)\n");

  function inputJwt(): string {
    return readlineSync.question("Paste the JWT (id_token) token here and press enter: ", {
      hideEchoBack: false,
    });
  }

  const jwt = inputJwt();
  // Derive the Keyless Account from the JWT and ephemeral key pair.
  const alice = await aptos.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair: aliceEphem,
  });

  console.log("=== Addresses ===\n");
  console.log(`Alice's keyless account address is: ${alice.accountAddress}`);
  console.log(`Alice's nonce is: ${aliceEphem.nonce}`);
  console.log(`Alice's ephemeral public key is: ${aliceEphem.getPublicKey().toString()}`);

  let aliceBalance;
  try {
    aliceBalance = await balance(aptos, alice.accountAddress);
    console.log("\n=== Balances ===\n");
    console.log(`Alice's balance is: ${aliceBalance}`);
  } catch (error) {
    console.log("\n=== Fund the account ===\n");
    console.log(
      "The account does not yet exist. Send at least APT to the address below to create the account in order to proceed.\n",
    );
    console.log(`Address: ${alice.accountAddress}\n`);
    console.log("Press enter once funded");
    readlineSync.question("");
    aliceBalance = await balance(aptos, alice.accountAddress);
    console.log("\n=== Balances ===\n");
    console.log(`Alice's balance is: ${aliceBalance}`);
  }

  // Transfer to yourself to not waste APT
  const transaction = await aptos.transferCoinTransaction({
    sender: alice.accountAddress,
    recipient: alice.accountAddress,
    amount: TRANSFER_AMOUNT,
    options: { maxGasAmount: 200 },
  });

  const committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newAliceBalance = await balance(aptos, alice.accountAddress);
  console.log(`Alice's balance is: ${newAliceBalance}`);
  // Alice should have the remainder minus gas
  if (TRANSFER_AMOUNT >= aliceBalance - newAliceBalance) throw new Error("Alice's balance after transfer is incorrect");
};

example();
