/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * This example shows how to use the Cedra client to mint and transfer a Digital Asset.
 */

import dotenv from "dotenv";
dotenv.config();
import { Account, Cedra, CedraConfig, Network, NetworkToNetworkName } from "@cedra-labs/ts-sdk";

const INITIAL_BALANCE = 100_000_000;

// Set up the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;
const config = new CedraConfig({ network: APTOS_NETWORK });
const cedra = new Cedra(config);

const example = async () => {
  console.log(
    "This example will create and fund Alice and Bob, then Alice account will create a collection and a digital asset in that collection and transfer it to Bob.",
  );

  // Create Alice and Bob accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);

  // Fund and create the accounts
  await cedra.fundAccount({
    accountAddress: alice.accountAddress,
    amount: INITIAL_BALANCE,
  });
  await cedra.fundAccount({
    accountAddress: bob.accountAddress,
    amount: INITIAL_BALANCE,
  });

  const collectionName = "Example Collection";
  const collectionDescription = "Example description.";
  const collectionURI = "cedra.dev";

  // Create the collection
  const createCollectionTransaction = await cedra.createCollectionTransaction({
    creator: alice,
    description: collectionDescription,
    name: collectionName,
    uri: collectionURI,
  });

  console.log("\n=== Create the collection ===\n");
  let committedTxn = await cedra.signAndSubmitTransaction({ signer: alice, transaction: createCollectionTransaction });

  let pendingTxn = await cedra.waitForTransaction({ transactionHash: committedTxn.hash });

  const aliceCollection = await cedra.getCollectionData({
    creatorAddress: alice.accountAddress,
    collectionName,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's collection: ${JSON.stringify(aliceCollection, null, 4)}`);

  const tokenName = "Example Asset";
  const tokenDescription = "Example asset description.";
  const tokenURI = "cedra.dev/asset";

  console.log("\n=== Alice Mints the digital asset ===\n");

  const mintTokenTransaction = await cedra.mintDigitalAssetTransaction({
    creator: alice,
    collection: collectionName,
    description: tokenDescription,
    name: tokenName,
    uri: tokenURI,
  });

  committedTxn = await cedra.signAndSubmitTransaction({ signer: alice, transaction: mintTokenTransaction });
  pendingTxn = await cedra.waitForTransaction({ transactionHash: committedTxn.hash });

  const aliceDigitalAsset = await cedra.getOwnedDigitalAssets({
    ownerAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's digital assets balance: ${aliceDigitalAsset.length}`);

  console.log(`Alice's digital asset: ${JSON.stringify(aliceDigitalAsset[0], null, 4)}`);

  console.log("\n=== Transfer the digital asset to Bob ===\n");

  const transferTransaction = await cedra.transferDigitalAssetTransaction({
    sender: alice,
    digitalAssetAddress: aliceDigitalAsset[0].token_data_id,
    recipient: bob.accountAddress,
  });
  committedTxn = await cedra.signAndSubmitTransaction({ signer: alice, transaction: transferTransaction });
  pendingTxn = await cedra.waitForTransaction({ transactionHash: committedTxn.hash });

  const aliceDigitalAssetsAfter = await cedra.getOwnedDigitalAssets({
    ownerAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's digital assets balance: ${aliceDigitalAssetsAfter.length}`);

  const bobDigitalAssetsAfter = await cedra.getOwnedDigitalAssets({
    ownerAddress: bob.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Bob's digital assets balance: ${bobDigitalAssetsAfter.length}`);
};

example();
