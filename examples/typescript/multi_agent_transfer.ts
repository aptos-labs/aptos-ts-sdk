/* eslint-disable max-len */
/* eslint-disable no-console */

/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 */
import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  U64,
  parseTypeTag,
  Network,
  NetworkToNetworkName,
  InputViewFunctionJsonData,
} from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
dotenv.config();

// TODO: There currently isn't a way to use the APTOS_COIN in the COIN_STORE due to a regex
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 10;
// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (aptos: Aptos, name: string, address: AccountAddress): Promise<any> => {
  const payload: InputViewFunctionJsonData = {
    function: "0x1::coin::balance",
    typeArguments: ["0x1::aptos_coin::AptosCoin"],
    functionArguments: [address.toString()],
  };
  const [balance] = await aptos.viewJson<[number]>({ payload: payload });

  console.log(`${name}'s balance is: ${balance}`);
  return Number(balance);
};

const CREATE_OBJECT_SCRIPT =
  "0xa11ceb0b060000000601000402040403080a051209071b3608512000000001000302000102000200000402030001060c000105010800066f626a656374067369676e65720a616464726573735f6f660e436f6e7374727563746f725265660d6372656174655f6f626a6563740000000000000000000000000000000000000000000000000000000000000001000001050b00110011010102";
const TRANSFER_SCRIPT =
  "0xa11ceb0b060000000701000602060a031017042706052d2d075a4b08a5012000000001000201030701000101040800020503040000060602010001070408010801060902010801050207030704060c060c0503010b000108010001060c010501090003060c0503010801010b0001090003060c0b000109000504636f696e066f626a656374067369676e6572064f626a6563740a4f626a656374436f72650a616464726573735f6f66087472616e7366657211616464726573735f746f5f6f626a6563740000000000000000000000000000000000000000000000000000000000000001010000010e0a010a0011000b0338000b0238010c040b000b040b011100380202";

const example = async () => {
  console.log(
    "This example will create two accounts (Alice and Bob), fund them, create an object, and transfer the object between them using move scripts and a multi-agent transaction.",
  );

  // Set up the client
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  // Create two accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Bob's address is: ${bob.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  const aliceFundTxn = await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: ALICE_INITIAL_BALANCE,
  });
  console.log("Alice's fund transaction: ", aliceFundTxn);

  const bobFundTxn = await aptos.fundAccount({
    accountAddress: bob.accountAddress,
    amount: BOB_INITIAL_BALANCE,
  });
  console.log("Bob's fund transaction: ", bobFundTxn);

  // Show the balances
  console.log("\n=== Balances ===\n");
  const alicePreBalance = await balance(aptos, "Alice", alice.accountAddress);
  const bobPreBalance = await balance(aptos, "Bob", bob.accountAddress);
  console.log(`Alice: ${alicePreBalance}`);
  console.log(`Bob: ${bobPreBalance}`);

  if (alicePreBalance !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (bobPreBalance !== BOB_INITIAL_BALANCE) throw new Error("Bob's balance is incorrect");

  // Create the object
  console.log("\n=== Create an object owned by Alice ===\n");
  const createObject = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      bytecode: CREATE_OBJECT_SCRIPT,
      functionArguments: [],
    },
  });
  const pendingObjectTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: createObject });
  const response = await aptos.waitForTransaction({ transactionHash: pendingObjectTxn.hash });

  const objects = await aptos.getAccountOwnedObjects({
    accountAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(response.version),
  });

  // getAccountOwnedObjects returns ALL objects owned by the account, including the fungible asset store object.
  // Until indexer returns an indication of the fungible asset store object, we need to filter it out.
  const objectAddress = objects.find((object) => object.allow_ungated_transfer)?.object_address;
  if (!objectAddress) throw new Error("Object address not found");

  console.log(`Created object ${objectAddress} with transaction: ${pendingObjectTxn.hash}`);

  console.log("\n=== Transfer object ownership to Bob ===\n");
  const transferTxn = await aptos.transaction.build.multiAgent({
    sender: alice.accountAddress,
    secondarySignerAddresses: [bob.accountAddress],
    data: {
      bytecode: TRANSFER_SCRIPT,
      typeArguments: [parseTypeTag(APTOS_COIN)],
      functionArguments: [AccountAddress.fromString(objectAddress), new U64(TRANSFER_AMOUNT)],
    },
  });

  // Alice signs
  const aliceSignature = aptos.transaction.sign({ signer: alice, transaction: transferTxn });

  // Bob signs
  const bobSignature = aptos.transaction.sign({ signer: bob, transaction: transferTxn });

  const pendingTransferTxn = await aptos.transaction.submit.multiAgent({
    transaction: transferTxn,
    senderAuthenticator: aliceSignature,
    additionalSignersAuthenticators: [bobSignature],
  });
  const transferResponse = await aptos.waitForTransaction({ transactionHash: pendingTransferTxn.hash });

  const bobObjectsAfter = await aptos.getAccountOwnedObjects({
    accountAddress: bob.accountAddress,
    minimumLedgerVersion: BigInt(transferResponse.version),
  });

  if (
    bobObjectsAfter.find((object: { object_address: string }) => object.object_address === objectAddress) === undefined
  ) {
    throw new Error(`Failed to transfer object to bob ${objectAddress}`);
  }

  // Check balance
  console.log("\n=== New Balances ===\n");
  const alicePostBalance = await balance(aptos, "Alice", alice.accountAddress);
  const bobPostBalance = await balance(aptos, "Bob", bob.accountAddress);

  if (alicePostBalance >= ALICE_INITIAL_BALANCE + TRANSFER_AMOUNT) throw new Error("Alice's balance is incorrect");
  if (bobPostBalance !== BOB_INITIAL_BALANCE - TRANSFER_AMOUNT) throw new Error("Bob's balance is incorrect");
};

example();
