/* eslint-disable no-console */

/**
 * This example demonstrates how to use MultiEd25519 accounts to send transactions.
 *
 * A MultiEd25519 account is a K-of-N multi-signer account where all keys must be Ed25519.
 * This is a legacy scheme; for new applications, prefer MultiKey which supports mixed key types.
 *
 * This example creates a 2-of-3 MultiEd25519 account using three Ed25519 private keys,
 * funds it, and sends a transfer transaction signed by two of the three keys.
 */

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  InputViewFunctionJsonData,
  MultiEd25519PublicKey,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";
import { MultiEd25519Account } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";

dotenv.config();

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const MULTI_ED25519_INITIAL_BALANCE = 1_000_000_000;
const RECEIVER_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

const balance = async (aptos: Aptos, name: string, address: AccountAddress): Promise<number> => {
  const payload: InputViewFunctionJsonData = {
    function: "0x1::coin::balance",
    typeArguments: [APTOS_COIN],
    functionArguments: [address.toString()],
  };
  const [amount] = await aptos.viewJson<[number]>({ payload });
  console.log(`${name}'s balance is: ${amount}`);
  return Number(amount);
};

const example = async () => {
  console.log("This example will create a 2-of-3 MultiEd25519 account, fund it, and transfer from it.");

  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  // Generate three Ed25519 private keys
  const privateKey1 = Ed25519PrivateKey.generate();
  const privateKey2 = Ed25519PrivateKey.generate();
  const privateKey3 = Ed25519PrivateKey.generate();

  console.log("\n=== Ed25519 Public Keys ===\n");
  console.log(`Key 1: ${privateKey1.publicKey().toString()}`);
  console.log(`Key 2: ${privateKey2.publicKey().toString()}`);
  console.log(`Key 3: ${privateKey3.publicKey().toString()}`);

  // Create a 2-of-3 MultiEd25519 public key
  const multiEd25519PublicKey = new MultiEd25519PublicKey({
    publicKeys: [privateKey1.publicKey(), privateKey2.publicKey(), privateKey3.publicKey()],
    threshold: 2,
  });

  // Create the MultiEd25519Account with two of the three private keys as signers.
  // Here we use keys 1 and 3 (skipping key 2) to demonstrate that any K signers work.
  const multiEd25519Account = new MultiEd25519Account({
    publicKey: multiEd25519PublicKey,
    signers: [privateKey1, privateKey3],
  });

  console.log(`\nMultiEd25519 account address: ${multiEd25519Account.accountAddress}`);
  console.log(`Signing scheme: ${multiEd25519Account.signingScheme}`);

  // Create a receiver
  const receiver = Account.generate();
  console.log(`Receiver address: ${receiver.accountAddress}`);

  // Fund accounts
  console.log("\n=== Funding accounts ===\n");
  await aptos.fundAccount({
    accountAddress: multiEd25519Account.accountAddress,
    amount: MULTI_ED25519_INITIAL_BALANCE,
  });
  console.log(`Funded MultiEd25519 account with ${MULTI_ED25519_INITIAL_BALANCE}`);

  await aptos.fundAccount({ accountAddress: receiver.accountAddress, amount: RECEIVER_INITIAL_BALANCE });
  console.log(`Funded Receiver account with ${RECEIVER_INITIAL_BALANCE}`);

  // Show initial balances
  console.log("\n=== Initial Balances ===\n");
  const senderBalance = await balance(aptos, "MultiEd25519", multiEd25519Account.accountAddress);
  const receiverBalance = await balance(aptos, "Receiver", receiver.accountAddress);

  if (senderBalance !== MULTI_ED25519_INITIAL_BALANCE) throw new Error("MultiEd25519 balance is incorrect");
  if (receiverBalance !== RECEIVER_INITIAL_BALANCE) throw new Error("Receiver balance is incorrect");

  // Build a transfer transaction from the MultiEd25519 account
  const transaction = await aptos.transaction.build.simple({
    sender: multiEd25519Account.accountAddress,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [APTOS_COIN],
      functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
    },
  });

  // Sign — both selected private keys (1 and 3) sign under the hood
  console.log("\n=== Signing and Submitting Transaction ===\n");
  const senderAuthenticator = aptos.transaction.sign({ signer: multiEd25519Account, transaction });

  const response = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });
  console.log(`Submitted transaction: ${response.hash}`);

  await aptos.waitForTransaction({ transactionHash: response.hash });
  console.log("Transaction confirmed!");

  // Show final balances
  console.log("\n=== Balances After Transfer ===\n");
  const newSenderBalance = await balance(aptos, "MultiEd25519", multiEd25519Account.accountAddress);
  const newReceiverBalance = await balance(aptos, "Receiver", receiver.accountAddress);

  if (newReceiverBalance !== TRANSFER_AMOUNT + RECEIVER_INITIAL_BALANCE) {
    throw new Error("Receiver balance after transfer is incorrect");
  }
  if (newSenderBalance >= MULTI_ED25519_INITIAL_BALANCE - TRANSFER_AMOUNT) {
    throw new Error("MultiEd25519 balance after transfer is incorrect");
  }

  console.log("\nMultiEd25519 transfer example completed successfully!");
};

example();
