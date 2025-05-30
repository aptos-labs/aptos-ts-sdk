/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * Example to demonstrate creating and adding to liquidity pools, swapping between two fungible asset.
 *
 * Steps:
 * 1. Create two accounts (Alice and Bob)
 * 2. Fund Alice and Bob
 * 3. Create a FA with Alice as the owner
 * 4. Create another FA with Bob as the owner
 * 5. Create a liquidity pool with Alice's FA and Bob's FA
 * 6. Swap between Alice's FA and Bob's FA
 */
import "dotenv";
import {
  Account,
  AccountAddress,
  Cedra,
  CedraConfig,
  Ed25519PrivateKey,
  InputViewFunctionData,
  Network,
  NetworkToNetworkName,
} from "@cedra-labs/ts-sdk";
import { createInterface } from "readline";
// Default to devnet, but allow for overriding
const CEDRA_NETWORK: Network = NetworkToNetworkName[process.env.CEDRA_NETWORK ?? Network.DEVNET];

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const getOptimalLpAmount = async (
  cedra: Cedra,
  swap: AccountAddress,
  token1Addr: AccountAddress,
  token2Addr: AccountAddress,
): Promise<void> => {
  const payload: InputViewFunctionData = {
    function: `${swap.toString()}::router::optimal_liquidity_amounts`,
    functionArguments: [token1Addr, token2Addr, false, "200000", "300000", "200", "300"],
  };
  const result = await cedra.view({ payload });
  console.log("Optimal LP amount: ", result);
};

const addLiquidity = async (
  cedra: Cedra,
  swap: AccountAddress,
  deployer: Account,
  token1Addr: AccountAddress,
  token2Addr: AccountAddress,
): Promise<string> => {
  const rawTxn = await cedra.transaction.build.simple({
    sender: deployer.accountAddress,
    data: {
      function: `${swap.toString()}::router::add_liquidity_entry`,
      functionArguments: [token1Addr, token2Addr, false, 200000, 300000, 200, 300],
    },
  });
  const pendingTxn = await cedra.signAndSubmitTransaction({ signer: deployer, transaction: rawTxn });
  const response = await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log("Add liquidity succeed. - ", response.hash);
  return response.hash;
};

const swapAssets = async (
  cedra: Cedra,
  swap: AccountAddress,
  deployer: Account,
  fromToken: AccountAddress,
  toToken: AccountAddress,
  amountIn: number,
  amountOutMin: number,
  recipient: AccountAddress,
): Promise<string> => {
  const rawTxn = await cedra.transaction.build.simple({
    sender: deployer.accountAddress.toString(),
    data: {
      function: `${swap.toString()}::router::swap_entry`,
      functionArguments: [amountIn, amountOutMin, fromToken, toToken, false, recipient],
    },
  });
  const pendingTxn = await cedra.signAndSubmitTransaction({ signer: deployer, transaction: rawTxn });
  const response = await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log("Swap succeed. - ", response.hash);
  return response.hash;
};

const getAssetType = async (cedra: Cedra, owner: Account): Promise<any> => {
  const data = await cedra.getFungibleAssetMetadata({
    options: {
      where: {
        creator_address: { _eq: owner.accountAddress.toStringLong() },
      },
    },
  });

  if (data.length !== 2) throw new Error("Expected two Fungible Assets.");

  console.log("Fungible Asset: ", data);
  return {
    cat: data[0].asset_type,
    dog: data[1].asset_type,
  };
};

const getFaBalance = async (cedra: Cedra, owner: Account, assetType: string): Promise<number> => {
  const data = await cedra.getCurrentFungibleAssetBalances({
    options: {
      where: {
        owner_address: { _eq: owner.accountAddress.toStringLong() },
        asset_type: { _eq: assetType },
      },
    },
  });

  return data[0].amount;
};

const createLiquidityPool = async (
  cedra: Cedra,
  swap: AccountAddress,
  deployer: Account,
  dogCoinAddr: AccountAddress,
  catCoinAddr: AccountAddress,
): Promise<string> => {
  const rawTxn = await cedra.transaction.build.simple({
    sender: deployer.accountAddress,
    data: {
      function: `${swap.toString()}::router::create_pool`,
      functionArguments: [dogCoinAddr, catCoinAddr, false],
    },
  });
  const pendingTxn = await cedra.signAndSubmitTransaction({ signer: deployer, transaction: rawTxn });
  const response = await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log("Creating liquidity pool successful. - ", response.hash);
  return response.hash;
};

const initLiquidityPool = async (cedra: Cedra, swap: AccountAddress, deployer: Account): Promise<string> => {
  const rawTxn = await cedra.transaction.build.simple({
    sender: deployer.accountAddress,
    data: {
      function: `${swap.toString()}::liquidity_pool::initialize`,
      functionArguments: [],
    },
  });
  const pendingTxn = await cedra.signAndSubmitTransaction({ signer: deployer, transaction: rawTxn });
  const response = await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log("Init LP Pool success. - ", response.hash);
  return response.hash;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createFungibleAsset = async (cedra: Cedra, admin: Account): Promise<void> => {
  await new Promise<void>((resolve) => {
    readline.question(
      "Follow the steps to publish the Dog and Cat Coin module with Admin's address, and press enter. \n" +
        "1. cd to /cedra-ts-sdk/examples/typescript/move/facoin folder \n" +
        "2. run 'cedra move publish --named-address FACoin=[admin] --profile=[admin] \n" +
        "   Note: [admin] is the same profile you used to publish your 'swap' package",
      () => {
        resolve();
      },
    );
  });
};

/**
 *  Admin mint the coin
 */
const mintCoin = async (cedra: Cedra, admin: Account, amount: number | bigint, coinName: string): Promise<string> => {
  const rawTxn = await cedra.transaction.build.simple({
    sender: admin.accountAddress,
    data: {
      function: `${admin.accountAddress.toString()}::${coinName}::mint`,
      functionArguments: [admin.accountAddress, amount],
    },
  });
  const pendingTxn = await cedra.signAndSubmitTransaction({ signer: admin, transaction: rawTxn });
  const response = await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log(`Minting ${coinName} coin successful. - `, response.hash);
  return response.hash;
};

const example = async () => {
  console.log(
    "This example will create a main user account called 'Admin', it will be used to deploy Liquidity pool and two new fungible assets. \n" +
      "After creating the Dog and Cat coin, and the liquidity pool, it will swap one token for another. \n" +
      "Note: This example requires you to have the 'swap' module published before running. \n" +
      "If you haven't published the 'swap' module, please publish the package using \n" +
      "'cedra move create-resource-account-and-publish-package --seed 0 --address-name=swap --named-addresses deployer=[admin] --profile [admin]' first. \n" +
      "[admin] is the account profile you will be using for this example. \n",
  );

  // Prerequisite check
  if (process.argv.length !== 4) {
    console.log("Required usage: pnpm swap [swap_address] [user_private_key]");
    process.exit(1);
  }

  const cedraConfig = new CedraConfig({ network: CEDRA_NETWORK });
  const cedra = new Cedra(cedraConfig);
  // Create three accounts
  const swapAddress = AccountAddress.from(process.argv[2]);
  const admin = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.argv[3]),
    address: swapAddress,
  });

  console.log("====== Account info ======\n");
  console.log(`Admin's address is: ${admin.accountAddress.toString()}`);
  console.log(`Swap address is: ${swapAddress.toString()}`);
  // Fund Admin account
  await cedra.fundAccount({ accountAddress: admin.accountAddress, amount: 100_000_000 });

  console.log("\n====== Create Fungible Asset -> (Dog and Cat coin) ======\n");
  await createFungibleAsset(cedra, admin);
  const assetTypes = await getAssetType(cedra, admin);
  const dogCoinAddr = AccountAddress.from(assetTypes.dog);
  const catCoinAddr = AccountAddress.from(assetTypes.cat);
  console.log(`Cat FACoin asset type: ${catCoinAddr}`);
  console.log(`Dog FACoin asset type: ${dogCoinAddr}`);

  console.log("\n====== Mint Dog and Cat Coin ======\n");
  console.log("minting 20_000_000 Dog coin...");
  await mintCoin(cedra, admin, 20_000_000, "dog");
  console.log("minting 30_000_000 Cat coin...");
  await mintCoin(cedra, admin, 30_000_000, "cat");

  console.log("\n====== Current Balance ======\n");
  console.log(`Admin's Dog coin balance: ${await getFaBalance(cedra, admin, dogCoinAddr.toString())}.`);
  console.log(`Admin's Cat coin balance: ${await getFaBalance(cedra, admin, catCoinAddr.toString())}.`);

  console.log("\n====== Create Liquidity Pool ======\n");
  console.log("initializing Liquidity Pool......");
  await initLiquidityPool(cedra, swapAddress, admin);
  console.log("Creating liquidity pool......");
  await createLiquidityPool(cedra, swapAddress, admin, dogCoinAddr, catCoinAddr);
  console.log("Getting optimal LP amount......");
  await getOptimalLpAmount(cedra, swapAddress, dogCoinAddr, catCoinAddr);
  console.log("Adding liquidity......");
  await addLiquidity(cedra, swapAddress, admin, dogCoinAddr, catCoinAddr);
  console.log("Done.");

  console.log("\n====== Swap 100 Dog coins for Cat coins ======\n");
  console.log("Swapping 100 Dog coin to Cat coin......");
  await swapAssets(cedra, swapAddress, admin, dogCoinAddr, catCoinAddr, 100, 1, admin.accountAddress);
  console.log("Swap finished.");

  console.log("\n====== Current Balance ======\n");
  console.log(`Admin's Dog coin balance: ${await getFaBalance(cedra, admin, dogCoinAddr.toString())}.`);
  console.log(`Admin's Cat coin balance: ${await getFaBalance(cedra, admin, catCoinAddr.toString())}.`);

  readline.close();
};

example();
