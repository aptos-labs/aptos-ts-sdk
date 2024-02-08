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
  ZkIDPublicKey,
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

const TEST_JWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3RfandrIiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhdWQiOiJ0ZXN0X2NsaWVudF9pZCIsInN1YiI6InRlc3RfYWNjb3VudCIsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibm9uY2UiOiIxYlFsNF9YYzUtSXBDcFViS19BZVhwZ2Q2R1o0MGxVVjN1YjN5b19FTHhrIiwibmJmIjoxNzAyODA4OTM2LCJpYXQiOjE3MDQ5MDkyMzYsImV4cCI6MTcwNzgxMjgzNiwianRpIjoiZjEwYWZiZjBlN2JiOTcyZWI4ZmE2M2YwMjQ5YjBhMzRhMjMxZmM0MCJ9.oBdOiIUc-ioG2-sHV1hWDLjgk4NrVf3z6V-HmgbOrVAz3PV1CwdfyTXsmVaCqLzOHzcbFB6ZRDxShs3aR7PsqdlhI0Dh8WrfU8kBkyk1FAmx2nST4SoSJROXsnusaOpNFpgSl96Rq3SXgr-yPBE9dEwTfD00vq2gH_fH1JAIeJJhc6WicMcsEZ7iONT1RZOid_9FlDrg1GxlGtNmpn4nEAmIxqnT0JrCESiRvzmuuXUibwx9xvHgIxhyVuAA9amlzaD1DL6jEc5B_0YnGKN7DO_l2Hkj9MbQZvU0beR-Lfcz8jxCjojODTYmWgbtu5E7YWIyC6dsjiBnTxc-svCsmQ";

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
  const expiryTimestamp = BigInt(1707812836);
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
        return "oliver.he@aptoslabs.com"
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

  const alice = await aptos.deriveAccountFromJWTAndEphemAccount({
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
  const escrowPublicKey = new ZkIDPublicKey(iss, escrowAddressSeed);

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

  const bobJWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImJkYzRlMTA5ODE1ZjQ2OTQ2MGU2M2QzNGNkNjg0MjE1MTQ4ZDdiNTkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTE2Mjc3NzI0NjA3NTIzNDIzMTIiLCJoZCI6ImFwdG9zbGFicy5jb20iLCJlbWFpbCI6Im9saXZlci5oZUBhcHRvc2xhYnMuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJqZmNIRFJDSzI0cUVZY2t4SzhGd0NRIiwibm9uY2UiOiIxYlFsNF9YYzUtSXBDcFViS19BZVhwZ2Q2R1o0MGxVVjN1YjN5b19FTHhrIiwiaWF0IjoxNzA3MzkxNjE0LCJleHAiOjE3MDczOTUyMTR9.jgdGz1GdwtUQ5q24IvgItBCd8cFmuUKO-zG5MwUQbP2V84H1Nk9ybWkXR1ffzr1JDU03yNvFjbqtKiRkO62X0DBphCnSnLEhAHE5PAqBt948y6f10pVDey56fhftIFaRgYQFTasDF0E75Gk1W8KPSP-ytwMfUwvNkZaFeGo_sVacIro0BgFN7Uy2QHInBhTMQXvO5xM4zc1oNoRB47s7nhXghGYOdT7wqJzIt1mZZmkb4XpnYPA0p_El9dAUNmWICw1vyLv2xEyz2r9Xm_Tx8gtD6SycZB3e0k3zbloRXC37rZ1Aok9-lvM-89Lk_CSqn95c-eUuUckU60JzEEpRHw";

  const bobTempZkIDAccount = await aptos.deriveAccountFromJWTAndEphemAccount({
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
