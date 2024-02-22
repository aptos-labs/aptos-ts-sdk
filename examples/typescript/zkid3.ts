/* eslint-disable max-len */
/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 */

import * as readline from "readline";

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  EphemeralAccount,
  Network
} from "@aptos-labs/ts-sdk";
import { promisify } from "util";

// TODO: There currently isn't a way to use the APTOS_COIN in the COIN_STORE due to a regex
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 10_000;

// const TEST_JWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3RfandrIiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTM5OTAzMDcwODI4OTk3MTg3NzUiLCJoZCI6ImFwdG9zbGFicy5jb20iLCJlbWFpbCI6Im1pY2hhZWxAYXB0b3NsYWJzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiYnhJRVN1STU5SW9aYjVhbENBU3FCZyIsIm5hbWUiOiJNaWNoYWVsIFN0cmFrYSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKdlk0a1ZVQlJ0THhlMUlxS1dMNWk3dEJESnpGcDlZdVdWWE16d1BwYnM9czk2LWMiLCJnaXZlbl9uYW1lIjoiTWljaGFlbCIsImZhbWlseV9uYW1lIjoiU3RyYWthIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE3MDAyNTU5NDQsImV4cCI6MjcwMDI1OTU0NCwibm9uY2UiOiI5Mzc5OTY2MjUyMjQ4MzE1NTY1NTA5NzkwNjEzNDM5OTAyMDA1MTU4ODcxODE1NzA4ODczNjMyNDMxNjk4MTkzNDIxNzk1MDMzNDk4In0.JJNqnxZ_CbJm5htLRy9iR9OYFlKXB2ZyRa41HcS5PevwLWgGYS8co3WGwd312712kNZ8t8JXY651VW5YT57-BIVWTzPq4GhIXnS4nGc12IlNJtn5tmgIAeOfUVsLlITdu8jvdGp5lU3fJDCqlyczeFFhnbZ8irNHRr206hxrwLOMvMKq9VH4iMWl3HdDseJdKGNC-HBJ1U9ik6klAd4_pv9bfXzclpnEfLebr9RgITf7sBjHh2n-0k-EIZhxWra37EgU2sTG5oU1hkYbaLKwj8ZZYIbM4CNBlaKq__iE9tLZ2N_mRMG2oYcn7WlTiU2DOydzPUcSrO4jPU3PNgDpjQ";

const TEST_JWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVkODA2ZjE4NDJiNTg4MDU0YjE4YjY2OWRkMWEwOWE0ZjM2N2FmYzQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTE2Mjc3NzI0NjA3NTIzNDIzMTIiLCJhdF9oYXNoIjoiZ3lTaGROUDA1M0k3WENFalA4bERqUSIsIm5vbmNlIjoiMTI2MDI5OTY4Mjg4NDAwNzg1NjgyNzAxMjUzNzg2NTk5NjE2OTc3MDk0NTg3MzA5MzY4Njg0NTA2MzAyODMwMjg0NzY1OTg3MDg3MCIsImlhdCI6MTcwODQ3MTkzMSwiZXhwIjoxNzA4NDc1NTMxfQ.l9IdxAHKSeDl9TzF04wY_p3RZdj3aUyNnulTi6Ww-dkKByvjgO4ycqpq8uoUHhpHxsX70hcfg_FR-4dd1_qx5p8LOUXOZari7k8vDsdwGXJ0zseUZwqqW1LeDjwdNvbwm7zswS1TBy-nL65xa2osQF-7UomnLBDGtcEUaoRHLSfKBJkx-vUKqaUInPNptkWqjWkvxSr7O8L2YED1lNiPbt3mDT1PtqSnDnALp6UTTm7VXwSao-0Pu0dKpM5AU0iM46L8hk8Y-Q7yjsDOdWayw5OrL9-xGNdzPBiHMfTUqhqhzINF9dWTm1fkMQtRbIlNT_nQXMAQUjXCkdcWBLxclQ";

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

  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

const example = async () => {
  // Setup the client
  const config = new AptosConfig({network: Network.DEVNET});
  // const config = new AptosConfig();

  const aptos = new Aptos(config);

  const privateKey = new Ed25519PrivateKey("0x76b8e0ada0f13d90405d6ae55386bd28bdd219b8a08ded1aa836efcc8b770dc7");
  const expiryTimestamp = BigInt(1709321726);
  const blinder = new Uint8Array(31);
  for (let i = 0; i < blinder.length; i += 1) {
    blinder[i] = 0;
  }
  const aliceEphem = new EphemeralAccount({ privateKey, expiryTimestamp, blinder: "2a00000000000000000000000000000000000000000000000000000000000000" });

  console.log();
  console.log("=== Get token via the below link ===");
  console.log();

  const link = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground&prompt=consent&response_type=code&client_id=407408718192.apps.googleusercontent.com&scope=openid&access_type=offline&service=lso&o2v=2&theme=glif&flowName=GeneralOAuthFlow&nonce=${aliceEphem.nonce}`;
  console.log(link);
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const questionAsync = promisify(rl.question).bind(rl);
  
  // eslint-disable-next-line consistent-return
  async function getUserInput(): Promise<string> {
    try {
      const response = await questionAsync("Paste the JWT token (or press enter to use default test token): ");
      if (response.trim() === "") {
        console.log();
        console.log("No jwt token inputted. Using test jwt token");
        console.log();
        rl.close();
        return TEST_JWT
      }
      rl.close();
      return response.trim()
    } catch (error) {
      rl.close();
      console.error("Error reading user input:", error);
    }
  }

  const jwt = await getUserInput();

  const bob = Account.generate();

  const alice = await aptos.deriveOidbAccountFromJWTAndEphemAccount({
    jwt,
    ephemeralAccount: aliceEphem,
    pepper: "4c000000000000000000000000000000000000000000000000000000000000",
    // extraFieldKey: "family_name"
  });

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Alice's pk is: ${aliceEphem.privateKey}`);
  console.log(`Alice's nonce is: ${aliceEphem.nonce}`);
  console.log(`Alice's zkid is: ${alice.publicKey.addressSeed}`);
  // console.log(`Alice's pk is: ${aliceEphem.privateKey}`);

  console.log(`Bob's address is: ${bob.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
    options: { waitForIndexer: false },
  });
  await aptos.faucet.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
    options: { waitForIndexer: false },
  });

  // // Show the balances
  console.log("\n=== Balances ===\n");
  const aliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const bobBalance = await balance(aptos, "Bob", bob.accountAddress);

  // Transfer between users
  const transaction = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [APTOS_COIN],
      functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
    },
  });

  const committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newAliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const newBobBalance = await balance(aptos, "Bob", bob.accountAddress);

  // Bob should have the transfer amount
  if (TRANSFER_AMOUNT !== newBobBalance - bobBalance) throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the remainder minus gas
  if (TRANSFER_AMOUNT >= aliceBalance - newAliceBalance) throw new Error("Alice's balance after transfer is incorrect");
};

example();
