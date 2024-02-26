/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 */

import * as readline from "readline";

import { promisify } from "util";
import { randomBytes } from "crypto";
import {
  AuthenticationKey,
  AccountAddress,
  computeAddressSeed,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  EphemeralAccount,
  KeylessPublicKey,
  MultiKey,
  Network,
  MultiKeyAccount,
} from "../../dist/common";
// import { AccountAuthenticatorMultiKey, AuthenticationKey, computeAddressSeed } from "../../dist/common";

// TODO: There currently isn't a way to use the APTOS_COIN in the COIN_STORE due to a regex
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const ALICE_INITIAL_BALANCE = 100_000_000_000;
const TRANSFER_AMOUNT = 100_000_000;
const TRANSFER_AMOUNT_WITH_FEE = TRANSFER_AMOUNT + 600;

const TEST_JWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU1YzE4OGE4MzU0NmZjMTg4ZTUxNTc2YmE3MjgzNmUwNjAwZThiNzMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTE2Mjc3NzI0NjA3NTIzNDIzMTIiLCJhdF9oYXNoIjoidmFmWFBtaFY5VjA1eUVfNTBrTlRkQSIsIm5vbmNlIjoiMTAxNzE4NzQyOTY2Mzc2NDAyMjM5MjUzOTc3ODY1NTM0MDMxNDIwNzkzOTEyNDgwMTQyMDkyNjU2MzM5NzUzMzY4NjM0ODQ5NzAxMzEiLCJuYW1lIjoiT2xpdmVyIEhlIiwiZ2l2ZW5fbmFtZSI6Ik9saXZlciIsImZhbWlseV9uYW1lIjoiSGUiLCJsb2NhbGUiOiJlbiIsImlhdCI6MTcwODkxMTk2NiwiZXhwIjoxNzA4OTE1NTY2fQ.HfYunneuF3RV-zjqrxBFdn3gtEFZ9TpWVc_WXN4kOkQsO3h3MQEwl76G6wwJg7J-fl8PVwHdH3bTLu2kUJauLN3_63T96whTkSNVa8SLuIstG7LzyX04yCTPb2SvAAWTQSliGB00TljLml_cy2MMK0m5B052oWw3j7XKcjHgTkcR18akiSOmePJw5yuAI3Yg3IBE-catd7DHGd20OrTdVoy1Orl3PfvuFTGZ1opwMZHd6pHMhIx0O40OcPZ-Y6vK0LUkEpari8wKXwpzGJLO9B5TEr_O-BGZR-G20U78xClxYA-uv1yytA1L1TgBL9aPKNR_8YvbBoUEggi-Q9oTtw";

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
  const aptos = new Aptos(config);

  // Create two accounts
  const privateKey = new Ed25519PrivateKey("0x1111111111111111111111111111111111111111111111111111111111111111");
  const expiryTimestamp = BigInt(1718911224);
  const blinder = new Uint8Array(31);
  for (let i = 0; i < blinder.length; i += 1) {
    blinder[i] = 0;
  }
  const aliceEphem = new EphemeralAccount({ privateKey, expiryTimestamp, blinder });

  console.log();
  console.log("=== Get token via the below link ===");
  console.log();

  const link = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground&prompt=consent&response_type=code&client_id=407408718192.apps.googleusercontent.com&scope=openid%20email&access_type=offline&service=lso&o2v=2&theme=glif&flowName=GeneralOAuthFlow&nonce=${aliceEphem.nonce}`;
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
        // rl.close();
        return TEST_JWT
      }
      return response.trim()
    } catch (error) {
      rl.close();
      console.error("Error reading user input:", error);
    }
  }

  // eslint-disable-next-line consistent-return
  async function getUserInputBobEmail(): Promise<string> {
    try {
      const response = await questionAsync("Enter the bob's email address (the recipient): ");
      if (response.trim() === "") {
        console.log();
        console.log("No email inputted. Using oliver.he@aptoslabs.com");
        console.log();
        // rl.close();
        return "heliuchuan@gmail.com"
      }
      return response.trim()
    } catch (error) {
      rl.close();
      console.error("Error reading user input:", error);
    }
  }

  const iss = "https://accounts.google.com";
  const aud = "407408718192.apps.googleusercontent.com"
  const uidKey = "email"

  const jwt = await getUserInput();

  const bobEmail = await getUserInputBobEmail();

  // const bobEmail = "oliver.he@aptoslabs.com";

  const alice = await aptos.deriveKeylessAccount({
    jwt,
    ephemeralAccount: aliceEphem,
  });

  const uidVal = bobEmail
  const pepper = randomBytes(31);;
  const escrowAddressSeed = computeAddressSeed({
    uidKey,
    uidVal,
    aud,
    pepper,
  });
  const escrowPublicKey = new KeylessPublicKey(iss, escrowAddressSeed);

  const multiKey = new MultiKey({publicKeys: [alice.publicKey, escrowPublicKey], signaturesRequired: 1})
  const mkAddr = AuthenticationKey.fromPublicKey({ publicKey: multiKey} ).derivedAddress();

  console.log("\n=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Alice's ephem secret key is: ${aliceEphem.privateKey}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
    options: { waitForIndexer: false },
  });
  await aptos.faucet.fundAccount({
    accountAddress: mkAddr,
    amount: 1,
    options: { waitForIndexer: false },
  });

  // // Show the balances
  console.log("\n=== Balances ===\n");
  const aliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const escrowBalance = await balance(aptos, "escrow", mkAddr);

  // Transfer between users
  const transaction = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [APTOS_COIN],
      functionArguments: [mkAddr, TRANSFER_AMOUNT_WITH_FEE],
    },
  });

  console.log("\n=== Transferring ===\n");

  const committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  console.log("\n=== Balances after transfer ===\n");
  const newAliceBalance = await balance(aptos, "Alice", alice.accountAddress);
  const newEscrowBalance = await balance(aptos, "escrow", mkAddr);

  console.error("Amount transferred:", TRANSFER_AMOUNT_WITH_FEE);
  console.error("Transfer fee:", aliceBalance - (newAliceBalance + TRANSFER_AMOUNT_WITH_FEE));
  console.error("");



  // const bobJWT = await getUserInput();

  const bobJWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU1YzE4OGE4MzU0NmZjMTg4ZTUxNTc2YmE3MjgzNmUwNjAwZThiNzMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTUyNjEyMTU0NTAxNDcwMjgyMTMiLCJlbWFpbCI6ImhlbGl1Y2h1YW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJ1OGZIRGY1ME1WUkhMYTZYeXFmeFZnIiwibm9uY2UiOiIxMDE3MTg3NDI5NjYzNzY0MDIyMzkyNTM5Nzc4NjU1MzQwMzE0MjA3OTM5MTI0ODAxNDIwOTI2NTYzMzk3NTMzNjg2MzQ4NDk3MDEzMSIsImlhdCI6MTcwODkyMzcyMSwiZXhwIjoxNzA4OTI3MzIxfQ.LAz0lt-mZU3u7uaFbghW7WYlQCVBovhXfOf_N_32Kmy7lNUA22xomgTuhDNFJpQ80sBHhRf42e-Zsy4uPjvQR2obTzNPaXCJ_L_zMUKrOtWoNTmQIBETbxMKeZw0UXmL7EWODcQ4urFj1vDIOmWphmtFaJorozBBdqcUoDDbkt16hO411Iuv4Be4zh5CA7iqXZrt5f1jyhf4nIf6vcwNGzngdf1Kh9cUNVCVAppDoldMUR3Gwfi92NBugafnO_mt4n-dhsP5AdzM5bKg7AanQcFjCXN6EFp_lhKCnMZR2dYgpIquwIi6HEMNSnl0_65jgxGgO3TW1cfgAKKlF9gsIw";
  
  const bobTempZkIDAccount = await aptos.deriveKeylessAccount({
    jwt: bobJWT,
    uidKey,
    ephemeralAccount: aliceEphem,
    pepper
  });

  const bobZkID = await aptos.deriveAccountFromJWTAndEphemAccount({
    jwt: bobJWT,
    uidKey,
    ephemeralAccount: aliceEphem,
  });

  const escrowAccount = new MultiKeyAccount({ multiKey, signers: [bobTempZkIDAccount] })

  // Fund the accounts
  console.log("\n=== Funding Bob's account ===\n");
  await aptos.faucet.fundAccount({
    accountAddress: bobZkID.accountAddress,
    amount: 1,
    options: { waitForIndexer: false },
  });

  console.log("\n=== Balances ===\n");
  await balance(aptos, "Alice", alice.accountAddress);
  const esc = await balance(aptos, "escrow", escrowAccount.accountAddress);
  await balance(aptos, "Bob", bobZkID.accountAddress);

  const transferToBobTxn = await aptos.transaction.build.simple({
    sender: mkAddr,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [APTOS_COIN],
      functionArguments: [bobZkID.accountAddress, TRANSFER_AMOUNT],
    },
  });

  console.log("\n=== Transferring ===\n");

  const response = await aptos.signAndSubmitTransaction({ signer: escrowAccount, transaction:transferToBobTxn });
  console.log("Transaction hash: ", response.hash)
  await aptos.waitForTransaction({
    transactionHash: response.hash,
  });

  console.log("\n=== Balances after transfer ===\n");
  await balance(aptos, "Alice", alice.accountAddress);
  const esc2 = await balance(aptos, "escrow", mkAddr);
  await balance(aptos, "Bob", bobZkID.accountAddress);

  console.error("Amount transferred:", TRANSFER_AMOUNT);
  console.error("Transfer fee:", esc - (esc2 + TRANSFER_AMOUNT));

  rl.close();
};

example();
