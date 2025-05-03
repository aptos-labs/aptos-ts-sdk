/* eslint-disable no-console */
/* eslint-disable max-len */
import dotenv from "dotenv";
dotenv.config();
import { Account, AccountAddress, Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

/**
 * This example demonstrate how one can publish a new custom coin to chain.
 * It uses the `MoonCoin.move()` module that can be found in this folder
 *
 * Before running this example, we should compile the package locally:
 * 1. Acquire the Aptos CLI, see https://aptos.dev/tools/aptos-cli/
 * 2. cd `~/aptos-ts-sdk/examples/typescript`
 * 3. Run `pnpm run your_coin`
 */

const MOON_COINS_TO_MINT = 100;
const MOON_COINS_TO_TRANSFER = 100;

// Set up the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

/** Register the receiver account to receive transfers for the new coin. */
async function registerCoin(receiver: Account, coinTypeAddress: AccountAddress): Promise<string> {
  const transaction = await aptos.transaction.build.simple({
    sender: receiver.accountAddress,
    data: {
      function: "0x1::managed_coin::register",
      typeArguments: [`${coinTypeAddress}::moon_coin::MoonCoin`],
      functionArguments: [],
    },
  });

  const senderAuthenticator = aptos.transaction.sign({ signer: receiver, transaction });
  const pendingTxn = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });

  return pendingTxn.hash;
}

/** Transfer the newly created coin to a specified receiver address */
async function transferCoin(
  sender: Account,
  receiverAddress: AccountAddress,
  amount: number | bigint,
): Promise<string> {
  const transaction = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer_coins",
      typeArguments: [`${sender.accountAddress}::moon_coin::MoonCoin`],
      functionArguments: [receiverAddress, amount],
    },
  });

  const senderAuthenticator = aptos.transaction.sign({ signer: sender, transaction });
  const pendingTxn = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });

  return pendingTxn.hash;
}

/** Mints amount of the newly created coin to a specified receiver address */
async function mintCoin(minter: Account, receiverAddress: AccountAddress, amount: number): Promise<string> {
  const transaction = await aptos.transaction.build.simple({
    sender: minter.accountAddress,
    data: {
      function: "0x1::managed_coin::mint",
      typeArguments: [`${minter.accountAddress}::moon_coin::MoonCoin`],
      functionArguments: [receiverAddress, amount],
    },
  });

  const senderAuthenticator = aptos.transaction.sign({ signer: minter, transaction });
  const pendingTxn = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });

  return pendingTxn.hash;
}

/** Returns the balance of the newly created coin for an account */
const getBalance = async (accountAddress: AccountAddress, coinTypeAddress: AccountAddress) =>
  aptos.getAccountCoinAmount({
    accountAddress,
    coinType: `${coinTypeAddress.toString()}::moon_coin::MoonCoin`,
  });

async function main() {
  // Create two accounts, Alice and Bob
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("\n=== Addresses ===");
  console.log(`Alice: ${alice.accountAddress.toString()}`);
  console.log(`Bob: ${bob.accountAddress.toString()}`);

  // Fund alice account
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: 100_000_000,
  });

  // Please ensure you have the aptos CLI installed
  console.log("\n=== Compiling MoonCoin package locally ===");
  compilePackage("move/moonCoin", "move/moonCoin/moonCoin.json", [{ name: "MoonCoin", address: alice.accountAddress }]);

  const { metadataBytes, byteCode } = getPackageBytesToPublish("move/moonCoin/moonCoin.json");

  console.log(`\n=== Publishing MoonCoin package to ${aptos.config.network} network ===`);

  // Publish MoonCoin package to chain
  const transaction = await aptos.publishPackageTransaction({
    account: alice.accountAddress,
    metadataBytes,
    moduleBytecode: byteCode,
  });

  const pendingTransaction = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction,
  });

  console.log(`Publish package transaction hash: ${pendingTransaction.hash}`);
  await aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });

  console.log(`Bob's initial MoonCoin balance: ${await getBalance(bob.accountAddress, alice.accountAddress)}.`);

  console.log(`Alice mints herself ${MOON_COINS_TO_MINT} MoonCoin.`);
  const registerCoinTransactionHash = await registerCoin(alice, alice.accountAddress);
  await aptos.waitForTransaction({ transactionHash: registerCoinTransactionHash });

  const mintCoinTransactionHash = await mintCoin(alice, alice.accountAddress, MOON_COINS_TO_MINT);
  await aptos.waitForTransaction({ transactionHash: mintCoinTransactionHash });

  console.log(`Alice transfers ${MOON_COINS_TO_TRANSFER} MoonCoin to Bob.`);
  const transferCoinTransactionHash = await transferCoin(alice, bob.accountAddress, MOON_COINS_TO_TRANSFER);
  await aptos.waitForTransaction({ transactionHash: transferCoinTransactionHash });
  console.log(`Bob's updated MoonCoin balance: ${await getBalance(bob.accountAddress, alice.accountAddress)}.`);
}

main();
