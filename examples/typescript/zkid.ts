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
  EphemeralAccount,
} from "@aptos-labs/ts-sdk";

// TODO: There currently isn't a way to use the APTOS_COIN in the COIN_STORE due to a regex
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
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
  const config = new AptosConfig(); // Default to devnet
  const aptos = new Aptos(config);

  // Create two accounts
  const privateKey = new Ed25519PrivateKey("0x1111111111111111111111111111111111111111111111111111111111111111");
  const expiryTimestamp = BigInt(2000000000);
  const blinder = new Uint8Array(31);
  for (let i = 0; i < blinder.length; i += 1) {
    blinder[i] = 0;
  }
  const pepper = blinder;  // Use 0 for both pepper and blinder for testing
  const aliceEphem = new EphemeralAccount({ privateKey, expiryTimestamp, blinder });

  console.log("=== Nonce ===\n");
  console.log(aliceEphem.nonce);
  // const link /= `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?state=%2Fhome&client_id=768056533295-s37otp56men05m4ppburuo4sclk6b5a2.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fzksend.com%2Fcallback&response_type=id_token&scope=openid%20email&nonce=${aliceEphem.nonce}&service=lso&o2v=2&theme=glif&flowName=GeneralOAuthFlow`;
  // console.log(link);

  const bob = Account.generate();

  const jwtToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3RfandrIiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhdWQiOiJ0ZXN0X2NsaWVudF9pZCIsInN1YiI6InRlc3RfYWNjb3VudCIsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibm9uY2UiOiJFVVRhSE9HdDcwRTNxbk9QMUJibnUzbE03QjR5TTdzaHZTb1NvdXF1VVJ3IiwibmJmIjoxNzAyODA4OTM2LCJpYXQiOjE3MDQ5MDkyMzYsImV4cCI6MTcwNzgxMjgzNiwianRpIjoiZjEwYWZiZjBlN2JiOTcyZWI4ZmE2M2YwMjQ5YjBhMzRhMjMxZmM0MCJ9.CEgO4S7hRgASaINsGST5Ygtl_CY-mUn2GaQ6d7q9q1eGz1MjW0o0yusJQDU6Hi1nDfXlNSvCF2SgD9ayG3uDGC5-18H0AWo2QgyZ2rC_OUa36RCTmhdo-i_H8xmwPxa3yHZZsGC-gJy_vVX-rfMLIh-JgdIFFIzGVPN75MwXLP3bYUaB9Lw52g50rf_006Qg5ubkZ70I13vGUTVbRVWanQIN69naFqHreLCjVsGsEBVBoUtexZw6Ulr8s0VajBpcTUqlMvbvqMfQ33NXaBQYvu3YZivpkus8rcG_eAMrFbYFY9AZF7AaW2HUaYo5QjzMQDsIA1lpnAcOW3GzWvb0vw";
  const alice = await aptos.deriveAccountFromJWTAndEphemAccount({
    jwt: jwtToken,
    ephemeralAccount: aliceEphem,
    pepper,
  });

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Alice's pk is: ${aliceEphem.privateKey}`);

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
  const txn = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [APTOS_COIN],
      functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
    },
  });

  const committedTxn = await aptos.signAndSubmitWithOIDC({ signer: alice, transaction: txn, jwt: jwtToken });

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
