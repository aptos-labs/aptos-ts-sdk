/* eslint-disable no-console */
/* eslint-disable max-len */

import {
  Account,
  AccountAddress,
  AnyNumber,
  Aptos,
  AptosConfig,
  ClientConfig,
  InputViewFunctionData,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

/**
 * This example demonstrate how one can compile, deploy, and transfer fungible assets (FA) between primary and secondary stores
 * It uses the fa_coin.move and secondary_store.move modules that can be found in the move folder
 *
 * Before running this example, we should compile the package locally:
 * 1. Acquire the Aptos CLI, see https://aptos.dev/tools/aptos-cli/
 * 2. cd `~/aptos-ts-sdk/examples/typescript`
 * 3. Run `pnpm run transfer_between_fungible_stores`
 */

// Set up the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

/**
 * Utility function to wait for a specified number of milliseconds
 * @param ms - Number of milliseconds to wait
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Admin mint the newly created coin to the specified receiver address */
async function mintCoin(admin: Account, receiver: Account, amount: AnyNumber): Promise<string> {
  const transaction = await aptos.transaction.build.simple({
    sender: admin.accountAddress,
    data: {
      function: `${admin.accountAddress}::fa_coin::mint`,
      functionArguments: [receiver.accountAddress, amount],
    },
  });

  const senderAuthenticator = aptos.transaction.sign({ signer: admin, transaction });
  const pendingTxn = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });

  return pendingTxn.hash;
}

/** Create a secondary store for a user */
async function createSecondaryStore(admin: Account, user: Account, metadata: AccountAddress): Promise<string> {
  const transaction = await aptos.transaction.build.simple({
    sender: user.accountAddress,
    data: {
      function: `${admin.accountAddress}::secondary_store::create_secondary_store`,
      functionArguments: [metadata],
    },
  });

  const senderAuthenticator = aptos.transaction.sign({ signer: user, transaction });
  const pendingTxn = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });

  return pendingTxn.hash;
}

/** Get the primary store address for a user and metadata */
async function getPrimaryStore(user: Account, metadata: AccountAddress): Promise<string> {
  const payload: InputViewFunctionData = {
    function: `0x1::primary_fungible_store::primary_store`,
    typeArguments: ["0x1::object::ObjectCore"],
    functionArguments: [user.accountAddress, metadata],
  };
  const res = (await aptos.view<[{ inner: string }]>({ payload }))[0];
  return res.inner;
}

/** Get the secondary store address for a user and metadata */
async function getSecondaryStore(admin: Account, user: Account, metadata: AccountAddress): Promise<string> {
  const payload: InputViewFunctionData = {
    function: `${admin.accountAddress}::secondary_store::get_secondary_store`,
    functionArguments: [user.accountAddress, metadata],
  };
  const res = (await aptos.view<[{ inner: string }]>({ payload }))[0];
  return res.inner;
}

/**
 * Gets the fungible asset balance for a specific store
 * @param owner - The owner account
 * @param assetType - The asset type
 * @param isPrimary - Whether to check the primary store or secondary store(s)
 * @returns The balance amount
 */
const getFaBalance = async (owner: Account, assetType: string, isPrimary: boolean): Promise<number> => {
  const data = await aptos.getCurrentFungibleAssetBalances({
    options: {
      where: {
        owner_address: { _eq: owner.accountAddress.toStringLong() },
        asset_type: { _eq: assetType },
        is_primary: { _eq: isPrimary },
      },
    },
  });

  return data[0]?.amount ?? 0;
};

/** Return the address of the managed fungible asset that's created when this module is deployed */
async function getMetadata(admin: Account): Promise<string> {
  const payload: InputViewFunctionData = {
    function: `${admin.accountAddress}::fa_coin::get_metadata`,
    functionArguments: [],
  };
  const res = (await aptos.view<[{ inner: string }]>({ payload }))[0];
  return res.inner;
}

/** Prints the balances for both Bob and Charlie's primary and secondary stores */
async function printBalances(title: string, metadataAddress: string, bob: Account, charlie: Account) {
  await delay(1000); // Wait for indexer to catch up
  const balances = await Promise.all([
    getFaBalance(bob, metadataAddress, true),
    getFaBalance(bob, metadataAddress, false),
    getFaBalance(charlie, metadataAddress, true),
    getFaBalance(charlie, metadataAddress, false),
  ]);
  console.log(`\n=== ${title} ===`);
  console.log(`Bob's primary store balance: ${balances[0]}`);
  console.log(`Bob's secondary store balance: ${balances[1]}`);
  console.log(`Charlie's primary store balance: ${balances[2]}`);
  console.log(`Charlie's secondary store balance: ${balances[3]}`);
}

async function main() {
  try {
    // Initialize accounts
    const alice = Account.generate();
    const bob = Account.generate();
    const charlie = Account.generate();

    console.log("\n=== Addresses ===");
    console.log(`Alice: ${alice.accountAddress.toString()}`);
    console.log(`Bob: ${bob.accountAddress.toString()}`);
    console.log(`Charlie: ${charlie.accountAddress.toString()}`);

    // Fund accounts
    await Promise.all([
      aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 }),
      aptos.fundAccount({ accountAddress: bob.accountAddress, amount: 100_000_000 }),
      aptos.fundAccount({ accountAddress: charlie.accountAddress, amount: 100_000_000 }),
    ]);

    // Compile and publish package
    console.log("\n=== Compiling FACoin package locally ===");
    compilePackage("move/facoin", "move/facoin/transfer-facoin.json", [
      { name: "FACoin", address: alice.accountAddress },
    ]);

    const { metadataBytes, byteCode } = getPackageBytesToPublish("move/facoin/transfer-facoin.json");

    console.log("\n=== Publishing FACoin package ===");
    const transaction = await aptos.publishPackageTransaction({
      account: alice.accountAddress,
      metadataBytes,
      moduleBytecode: byteCode,
    });
    const response = await aptos.signAndSubmitTransaction({
      signer: alice,
      transaction,
    });
    console.log(`Transaction hash: ${response.hash}`);
    await aptos.waitForTransaction({
      transactionHash: response.hash,
    });

    const metadataAddress = await getMetadata(alice);
    console.log("metadata address:", metadataAddress);

    // Create secondary stores
    console.log("\n=== Creating secondary stores ===");
    await Promise.all([
      createSecondaryStore(alice, bob, AccountAddress.from(metadataAddress)),
      createSecondaryStore(alice, charlie, AccountAddress.from(metadataAddress)),
    ]);

    // Mint initial coins
    console.log("Alice mints Bob 10 FA coin.");
    const mintCoinTransactionHash = await mintCoin(alice, bob, 1_000_000_000);
    await aptos.waitForTransaction({ transactionHash: mintCoinTransactionHash });

    // Get store addresses
    const bobPrimaryStoreAddress = await getPrimaryStore(bob, AccountAddress.from(metadataAddress));
    const bobSecondaryStore = await getSecondaryStore(alice, bob, AccountAddress.from(metadataAddress));
    const charlieSecondaryStore = await getSecondaryStore(alice, charlie, AccountAddress.from(metadataAddress));

    console.log("\n=== Store Addresses ===");
    console.log("Bob's primary store:", bobPrimaryStoreAddress);
    console.log("Bob's secondary store:", bobSecondaryStore);
    console.log("Charlie's secondary store:", charlieSecondaryStore);

    // Display initial balances
    await printBalances("Initial Balances", metadataAddress, bob, charlie);

    // Transfer from primary to secondary store
    console.log("\n=== Transferring from primary to secondary store ===");
    const transferToSecondaryTxn = await aptos.transferFungibleAssetBetweenStores({
      sender: bob,
      fromStore: bobPrimaryStoreAddress,
      toStore: bobSecondaryStore,
      amount: 800_000_000,
    });
    const transferToSecondaryResponse = await aptos.signAndSubmitTransaction({
      signer: bob,
      transaction: transferToSecondaryTxn,
    });
    await aptos.waitForTransaction({ transactionHash: transferToSecondaryResponse.hash });

    // Display updated balances
    await printBalances("Updated Balances", metadataAddress, bob, charlie);

    // Transfer between secondary stores
    console.log("\n=== Transferring between secondary stores ===");
    const transferBetweenSecondaryTxn = await aptos.transferFungibleAssetBetweenStores({
      sender: bob,
      fromStore: bobSecondaryStore,
      toStore: charlieSecondaryStore,
      amount: 600_000_000,
    });
    const transferBetweenSecondaryResponse = await aptos.signAndSubmitTransaction({
      signer: bob,
      transaction: transferBetweenSecondaryTxn,
    });
    await aptos.waitForTransaction({ transactionHash: transferBetweenSecondaryResponse.hash });

    // Display updated balances
    await printBalances("Updated Balances", metadataAddress, bob, charlie);

    // Transfer from secondary store to primary store
    console.log("\n=== Transferring from secondary to primary store ===");
    const transferFromSecondaryTxn = await aptos.transferFungibleAssetBetweenStores({
      sender: charlie,
      fromStore: charlieSecondaryStore,
      toStore: bobPrimaryStoreAddress,
      amount: 350_000_000,
    });
    const transferFromSecondaryResponse = await aptos.signAndSubmitTransaction({
      signer: charlie,
      transaction: transferFromSecondaryTxn,
    });
    await aptos.waitForTransaction({ transactionHash: transferFromSecondaryResponse.hash });

    // Display final balances
    await printBalances("Final Balances", metadataAddress, bob, charlie);
  } catch (error) {
    console.error("Error in main function:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
