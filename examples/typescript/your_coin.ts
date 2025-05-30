/* eslint-disable no-console */
/* eslint-disable max-len */
import dotenv from "dotenv";
dotenv.config();
import { Account, AccountAddress, Cedra, CedraConfig, Network, NetworkToNetworkName } from "@cedra-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

/**
 * This example demonstrate how one can publish a new custom coin to chain.
 * It uses the `MoonCoin.move()` module that can be found in this folder
 *
 * Before running this example, we should compile the package locally:
 * 1. Acquire the Cedra CLI, see https://cedra.dev/tools/cedra-cli/
 * 2. cd `~/cedra-ts-sdk/examples/typescript`
 * 3. Run `pnpm run your_coin`
 */

const MOON_COINS_TO_MINT = 100;
const MOON_COINS_TO_TRANSFER = 100;

// Set up the client
const CEDRA_NETWORK: Network = NetworkToNetworkName[process.env.CEDRA_NETWORK ?? Network.DEVNET];
const config = new CedraConfig({ network: CEDRA_NETWORK });
const cedra = new Cedra(config);

/** Register the receiver account to receive transfers for the new coin. */
async function registerCoin(receiver: Account, coinTypeAddress: AccountAddress): Promise<string> {
  const transaction = await cedra.transaction.build.simple({
    sender: receiver.accountAddress,
    data: {
      function: "0x1::managed_coin::register",
      typeArguments: [`${coinTypeAddress}::moon_coin::MoonCoin`],
      functionArguments: [],
    },
  });

  const senderAuthenticator = cedra.transaction.sign({ signer: receiver, transaction });
  const pendingTxn = await cedra.transaction.submit.simple({ transaction, senderAuthenticator });

  return pendingTxn.hash;
}

/** Transfer the newly created coin to a specified receiver address */
async function transferCoin(
  sender: Account,
  receiverAddress: AccountAddress,
  amount: number | bigint,
): Promise<string> {
  const transaction = await cedra.transaction.build.simple({
    sender: sender.accountAddress,
    data: {
      function: "0x1::cedra_account::transfer_coins",
      typeArguments: [`${sender.accountAddress}::moon_coin::MoonCoin`],
      functionArguments: [receiverAddress, amount],
    },
  });

  const senderAuthenticator = cedra.transaction.sign({ signer: sender, transaction });
  const pendingTxn = await cedra.transaction.submit.simple({ transaction, senderAuthenticator });

  return pendingTxn.hash;
}

/** Mints amount of the newly created coin to a specified receiver address */
async function mintCoin(minter: Account, receiverAddress: AccountAddress, amount: number): Promise<string> {
  const transaction = await cedra.transaction.build.simple({
    sender: minter.accountAddress,
    data: {
      function: "0x1::managed_coin::mint",
      typeArguments: [`${minter.accountAddress}::moon_coin::MoonCoin`],
      functionArguments: [receiverAddress, amount],
    },
  });

  const senderAuthenticator = cedra.transaction.sign({ signer: minter, transaction });
  const pendingTxn = await cedra.transaction.submit.simple({ transaction, senderAuthenticator });

  return pendingTxn.hash;
}

/** Returns the balance of the newly created coin for an account */
const getBalance = async (accountAddress: AccountAddress, coinTypeAddress: AccountAddress) =>
  cedra.getAccountCoinAmount({
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
  await cedra.fundAccount({
    accountAddress: alice.accountAddress,
    amount: 100_000_000,
  });

  // Please ensure you have the cedra CLI installed
  console.log("\n=== Compiling MoonCoin package locally ===");
  compilePackage("move/moonCoin", "move/moonCoin/moonCoin.json", [{ name: "MoonCoin", address: alice.accountAddress }]);

  const { metadataBytes, byteCode } = getPackageBytesToPublish("move/moonCoin/moonCoin.json");

  console.log(`\n=== Publishing MoonCoin package to ${cedra.config.network} network ===`);

  // Publish MoonCoin package to chain
  const transaction = await cedra.publishPackageTransaction({
    account: alice.accountAddress,
    metadataBytes,
    moduleBytecode: byteCode,
  });

  const pendingTransaction = await cedra.signAndSubmitTransaction({
    signer: alice,
    transaction,
  });

  console.log(`Publish package transaction hash: ${pendingTransaction.hash}`);
  await cedra.waitForTransaction({ transactionHash: pendingTransaction.hash });

  console.log(`Bob's initial MoonCoin balance: ${await getBalance(bob.accountAddress, alice.accountAddress)}.`);

  console.log(`Alice mints herself ${MOON_COINS_TO_MINT} MoonCoin.`);
  const registerCoinTransactionHash = await registerCoin(alice, alice.accountAddress);
  await cedra.waitForTransaction({ transactionHash: registerCoinTransactionHash });

  const mintCoinTransactionHash = await mintCoin(alice, alice.accountAddress, MOON_COINS_TO_MINT);
  await cedra.waitForTransaction({ transactionHash: mintCoinTransactionHash });

  console.log(`Alice transfers ${MOON_COINS_TO_TRANSFER} MoonCoin to Bob.`);
  const transferCoinTransactionHash = await transferCoin(alice, bob.accountAddress, MOON_COINS_TO_TRANSFER);
  await cedra.waitForTransaction({ transactionHash: transferCoinTransactionHash });
  console.log(`Bob's updated MoonCoin balance: ${await getBalance(bob.accountAddress, alice.accountAddress)}.`);
}

main();
