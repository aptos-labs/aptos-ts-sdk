/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * This example shows how to use the Aptos client to mint and transfer a Digital Asset.
 */

import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const INITIAL_BALANCE = 100_000_000;

// Setup the client
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

const example = async () => {
  // Create Alice and Bob accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);

  // Fund and create the accounts
  await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress,
    amount: INITIAL_BALANCE,
  });
  await aptos.faucet.fundAccount({
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

  let committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: createCollectionTransaction });

  let pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  await aptos.getCollectionData({
    creatorAddress: alice.accountAddress,
    collectionName,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });

  const tokenName = "Example Asset";
  const tokenDescription = "Example asset description.";
  const tokenURI = "aptos.dev/asset";

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
