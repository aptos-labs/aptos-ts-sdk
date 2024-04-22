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
  EphemeralKeyPair,
  Network
} from "@aptos-labs/ts-sdk";
import { promisify } from "util";

// TODO: There currently isn't a way to use the APTOS_COIN in the COIN_STORE due to a regex
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 10_000;

const TEST_JWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4YmY1YzM3NzJkZDRlN2E3MjdhMTAxYmY1MjBmNjU3NWNhYzMyNmYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTUyNjEyMTU0NTAxNDcwMjgyMTMiLCJhdF9oYXNoIjoiSlFCcEZQZlNIbmJVdGJUTzFiNFdjZyIsIm5vbmNlIjoiMTAxNzE4NzQyOTY2Mzc2NDAyMjM5MjUzOTc3ODY1NTM0MDMxNDIwNzkzOTEyNDgwMTQyMDkyNjU2MzM5NzUzMzY4NjM0ODQ5NzAxMzEiLCJpYXQiOjE3MTAxODI1MTAsImV4cCI6MTcxMDE4NjExMH0.dLVMdxFUqhvsXK3dR6CwWKIrWt8Z460VSxX-CXEhqwmFySskOGBSjcEGvUH23Z7Jc14UE5IKIbtrUCa_w4JRxedVTrfGo5JIlZAuDkqqCA-ogDjDK3iyQENrNShR4E_CH2b9186rK9jIANI6SbD3IzMj4lYRuCOEwdU4bw2RMbc059GzhPbzK1NCi5QeF-TQrbaDg7tfBZsojgPZ_aMVFt7LQIQRO2vjW8aPgXeg0RbQXIUYOGW382qMhQ6BoXC3GpR148EdOq9A3riViZqqAuC6QWsDK5StMwQbZiWI3m7nZISI632x9ISs09BQLJW2cTh_Y_NUk8mTKDzoDCZpKw";

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

  const privateKey = new Ed25519PrivateKey("0x1111111111111111111111111111111111111111111111111111111111111111");
  const expiryDateSecs = BigInt(1718911224);
  const blinder = new Uint8Array(31);
  for (let i = 0; i < blinder.length; i += 1) {
    blinder[i] = 0;
  }
  const aliceEphem = new EphemeralKeyPair({ privateKey, expiryDateSecs, blinder });

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

  const alice = await aptos.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair: aliceEphem,
    // pepper: "4c000000000000000000000000000000000000000000000000000000000000",
    // extraFieldKey: "family_name"
  });

  console.log("=== Addresses ===\n");
  console.log(`Alice's keyless account address is: ${alice.accountAddress}`);
  console.log(`Alice's pk is: ${aliceEphem.privateKey}`);
  console.log(`Alice's nonce is: ${aliceEphem.nonce}`);
  // console.log(`Alice's zkid is: ${alice.publicKey.addressSeed}`);
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
