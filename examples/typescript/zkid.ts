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
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

// TODO: There currently isn't a way to use the APTOS_COIN in the COIN_STORE due to a regex
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.LOCAL;

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
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  // Create two accounts
  const privateKey = new Ed25519PrivateKey("0x96d5a92a80455c520841d26d07b3b827f36ba0302839c23bb41df87eed3a88d4");
  const expiryTimestamp = BigInt(1712413858);
  const aliceEphem = new EphemeralAccount({ privateKey, expiryTimestamp });

  console.log("=== Nonce ===\n");
  console.log(aliceEphem.nonce);
  const link = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?state=%2Fhome&client_id=768056533295-s37otp56men05m4ppburuo4sclk6b5a2.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fzksend.com%2Fcallback&response_type=id_token&scope=openid%20email&nonce=${aliceEphem.nonce}&service=lso&o2v=2&theme=glif&flowName=GeneralOAuthFlow`;
  // const aliceEphem =  EphemeralAccount.generate();
  console.log(link);

  const bob = Account.generate();

  const jwtToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjliMDI4NWMzMWJmZDhiMDQwZTAzMTU3YjE5YzRlOTYwYmRjMTBjNmYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3NjgwNTY1MzMyOTUtczM3b3RwNTZtZW4wNW00cHBidXJ1bzRzY2xrNmI1YTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3NjgwNTY1MzMyOTUtczM3b3RwNTZtZW4wNW00cHBidXJ1bzRzY2xrNmI1YTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTUyNjEyMTU0NTAxNDcwMjgyMTMiLCJlbWFpbCI6ImhlbGl1Y2h1YW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5vbmNlIjoiZnNQMDJOaVNoLXFRdzFtRUJxMnFpRVdDaUFQcUZDZ3BEODBEZDRxOFNoOCIsIm5iZiI6MTcwMjgwODkzNiwiaWF0IjoxNzAyODA5MjM2LCJleHAiOjE3MDI4MTI4MzYsImp0aSI6ImYxMGFmYmYwZTdiYjk3MmViOGZhNjNmMDI0OWIwYTM0YTIzMWZjNDAifQ.k8P2xxWMmv-QBArwlcefGDq3-456GXbjxIp6qtE3zOFbh9QZLt2Br1BHtouSnYL9wQxrS9FKV_CkYdx6d3bDPH4jyDDj1D3ji7X6r3GG03mqZ6mmaHLzKfNSnFqWwAYwvA0vj2puuGayjBQkCvvSsEjA5MmV3XuQSwvpjF1qbWhdu4dPXLlj5wyzJzHQX4mUcnMZ_b0lNw5eXAHSm7xF8t3Nt6PAH-xs3x3OTBD5TaOyV0GhCSYq4eHu4-WROI5g3I3zLRWSpoPL6TpkLHn0-TYMIB9BkPbLu4OJqhcRL041VoHZFI9Sx0K8IDhqHq9YA4m5LdtaTsqPQUP3wB8t6A"
  const pepper = new Uint8Array([
    242, 155, 63, 12, 138, 2, 229, 135, 201, 26, 85, 149, 1, 4, 91, 232, 46, 185, 141, 235, 156, 244, 218, 226, 81, 22,
    225, 207, 203, 200, 5,
  ]);
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

  const aliceFundTxn = await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
    options: { waitForIndexer: false },
  });
  const bobFundTxn = await aptos.faucet.fundAccount({
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
