/**
 * This example shows how to use the Aptos client to mint a NFT.
 */

import { Account, Aptos, AptosConfig, Network } from "aptos";

const ALICE_INITIAL_BALANCE = 100_000_000;

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const accountTokens = async (aptos: Aptos, name: string, accountAddress: string) => {
  let tokens = await aptos.getOwnedTokens({ ownerAddress: accountAddress });

  if (tokens.length === 0) {
    console.log(`\n${name} has no tokens.\n`);
    return;
  }

  console.log(`\n${name}'s tokens:`);
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    console.log(
      `*${token.current_token_data.token_name}* in the *${token.current_token_data.current_collection.collection_name}* collection`,
    );
  }
};

const example = async () => {
  console.log(
    "This example will create and fund an account (Alice), then the account will create a collection and a token in that collection.",
  );

  // Setup the client
  const config = new AptosConfig({ network: Network.DEVNET });
  const aptos = new Aptos(config);

  // Create the account
  let alice = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress.toString()}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  const aliceFundTxn = await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress.toUint8Array(),
    amount: ALICE_INITIAL_BALANCE,
  });
  console.log("Alice's fund transaction: ", aliceFundTxn);

  const collectionName = "Example Collection";
  const collectionDescription = "Example description.";
  const collectionURI = "aptos.dev";

  // Create the collection
  let transaction = await aptos.createCollectionTransaction({
    creator: alice,
    description: collectionDescription,
    name: collectionName,
    uri: collectionURI,
  });

  console.log("\n=== Create the collection ===\n");
  let committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  console.log(`Created collection:`);
  let exampleCollection = await aptos.getCollectionData({
    collectionName,
    creatorAddress: alice.accountAddress.toString(),
  });
  console.log(exampleCollection);

  await accountTokens(aptos, "Alice", alice.accountAddress.toString());

  const tokenName = "Example Token";
  const tokenDescription = "Example token description.";
  const tokenURI = "aptos.dev/token";

  // Mint the token
  transaction = await aptos.mintTokenTransaction({
    creator: alice,
    collection: collectionName,
    description: tokenDescription,
    name: tokenName,
    uri: tokenURI,
  });

  console.log("\n=== Mint the token ===\n");
  committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction });
  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log(`Committed transaction: ${committedTxn.hash}`);

  await accountTokens(aptos, "Alice", alice.accountAddress.toString());
};

example();
