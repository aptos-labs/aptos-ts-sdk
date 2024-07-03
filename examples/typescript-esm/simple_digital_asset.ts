/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * This example shows how to use the Aptos client to mint and transfer a Digital Asset.
 */

import "dotenv";
import { Account, Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

const INITIAL_BALANCE = 100_000_000;

// Setup the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

const example = async () => {
  console.log(
    "This example will create and fund Alice and Bob, then Alice account will create a collection and a digital asset in that collection and tranfer it to Bob.",
  );

  // Create Alice and Bob accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);

  // Fund and create the accounts
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: INITIAL_BALANCE,
  });
  await aptos.fundAccount({
    accountAddress: bob.accountAddress,
    amount: INITIAL_BALANCE,
  });

  const collectionName = "Example Collection";
  const collectionDescription = "Example description.";
  const collectionURI = "aptos.dev";

  // Create the collection
  const createCollectionTransaction = await aptos.createCollectionTransaction({
    creator: alice,
    description: collectionDescription,
    name: collectionName,
    uri: collectionURI,
  });

  console.log("\n=== Create the collection ===\n");
  let committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: createCollectionTransaction });

  let pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  const alicesCollection = await aptos.getCollectionData({
    creatorAddress: alice.accountAddress,
    collectionName,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's collection: ${JSON.stringify(alicesCollection, null, 4)}`);

  const tokenName = "Example Asset";
  const tokenDescription = "Example asset description.";
  const tokenURI = "aptos.dev/asset";

  console.log("\n=== Alice Mints the digital asset ===\n");

  const mintTokenTransaction = await aptos.mintDigitalAssetTransaction({
    creator: alice,
    collection: collectionName,
    description: tokenDescription,
    name: tokenName,
    uri: tokenURI,
  });

  committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: mintTokenTransaction });
  pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  const alicesDigitalAsset = await aptos.getOwnedDigitalAssets({
    ownerAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's digital assets balance: ${alicesDigitalAsset.length}`);

  console.log(`Alice's digital asset: ${JSON.stringify(alicesDigitalAsset[0], null, 4)}`);

  console.log("\n=== Transfer the digital asset to Bob ===\n");

  const transferTransaction = await aptos.transferDigitalAssetTransaction({
    sender: alice,
    digitalAssetAddress: alicesDigitalAsset[0].token_data_id,
    recipient: bob.accountAddress,
  });
  committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: transferTransaction });
  pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  const alicesDigitalAssetsAfter = await aptos.getOwnedDigitalAssets({
    ownerAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alices's digital assets balance: ${alicesDigitalAssetsAfter.length}`);

  const bobDigitalAssetsAfter = await aptos.getOwnedDigitalAssets({
    ownerAddress: bob.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Bob's digital assets balance: ${bobDigitalAssetsAfter.length}`);
};

example();
