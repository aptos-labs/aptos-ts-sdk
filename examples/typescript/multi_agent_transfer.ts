/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 */

import { Account, AccountAddress, Aptos, AptosConfig, Network, StructTag, TypeTagStruct, U64 } from "aptos";

// TODO: There currently isn't a way to use the APTOS_COIN in the COIN_STORE due to a regex
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`;
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 10;

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (aptos: Aptos, name: string, address: AccountAddress) => {
  let resource = await aptos.getAccountResource({ accountAddress: address.toUint8Array(), resourceType: COIN_STORE });
  let amount = Number((resource.data as { coin: { value: string } }).coin.value);

  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

const example = async () => {
  console.log(
    "This example will create two accounts (Alice and Bob), fund them, create an object, and transfer the object between them using move scripts and a multi-agent transaction.",
  );

  // Setup the client
  const config = new AptosConfig();
  const aptos = new Aptos(config);

  // Create two accounts
  let alice = Account.generate();
  let bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress.toString()}`);
  console.log(`Bob's address is: ${bob.accountAddress.toString()}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  const aliceFundTxn = await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress.toUint8Array(),
    amount: ALICE_INITIAL_BALANCE,
  });
  console.log("Alice's fund transaction: ", aliceFundTxn);

  const bobFundTxn = await aptos.faucet.fundAccount({
    accountAddress: bob.accountAddress.toUint8Array(),
    amount: BOB_INITIAL_BALANCE,
  });
  console.log("Bob's fund transaction: ", bobFundTxn);

  // Show the balances
  console.log("\n=== Balances ===\n");
  let alicePreBalance = await balance(aptos, "Alice", alice.accountAddress);
  let bobPreBalance = await balance(aptos, "Bob", bob.accountAddress);
  console.log(`Alice: ${alicePreBalance}`);
  console.log(`Bob: ${bobPreBalance}`);

  if (alicePreBalance !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (bobPreBalance !== BOB_INITIAL_BALANCE) throw new Error("Bob's balance is incorrect");

  // Create the object
  console.log("\n=== Create an object owned by Alice ===\n");
  const createObject = await aptos.generateTransaction({
    sender: alice.accountAddress.toUint8Array(),
    data: {
      bytecode: CREATE_OBJECT_SCRIPT,
      arguments: [],
    },
  });
  const pendingObjectTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: createObject });
  await aptos.waitForTransaction({ transactionHash: pendingObjectTxn.hash });

  let objects = await aptos.getAccountOwnedObjects({ accountAddress: alice.accountAddress.toUint8Array() });
  let objectAddress = objects[0].object_address;

  console.log(`Created object ${objectAddress} with transaction: ${pendingObjectTxn.hash}`);

  console.log("\n=== Transfer object ownership to Bob ===\n");
  let transferTxn = await aptos.generateTransaction({
    sender: alice.accountAddress.toUint8Array(),
    secondarySignerAddresses: [bob.accountAddress.toUint8Array()],
    data: {
      bytecode: TRANSFER_SCRIPT,
      typeArguments: [new TypeTagStruct(StructTag.fromString(APTOS_COIN))],
      arguments: [AccountAddress.fromStringRelaxed(objectAddress), new U64(TRANSFER_AMOUNT)],
    },
  });

  // Alice signs
  let aliceSignature = aptos.transactionSubmission.signTransaction({ signer: alice, transaction: transferTxn });

  // Bob signs
  let bobSignature = aptos.transactionSubmission.signTransaction({ signer: bob, transaction: transferTxn });

  const pendingTransferTxn = await aptos.transactionSubmission.submitTransaction({
    transaction: transferTxn,
    senderAuthenticator: aliceSignature,
    secondarySignerAuthenticators: {
      additionalSignersAuthenticators: [bobSignature],
    },
  });
  await aptos.waitForTransaction({ transactionHash: pendingObjectTxn.hash });

  let bobObjectsAfter = await aptos.getAccountOwnedObjects({ accountAddress: bob.accountAddress.toUint8Array() });
  if (bobObjectsAfter[0].object_address != objectAddress) {
    throw new Error(`Failed to transfer object ${objectAddress}`);
  }

  console.log("Transferred object in txn: ", pendingTransferTxn.hash);

  // Check balance
  console.log("\n=== New Balances ===\n");
  let alicePostBalance = await balance(aptos, "Alice", alice.accountAddress);
  let bobPostBalance = await balance(aptos, "Bob", bob.accountAddress);

  if (alicePostBalance >= ALICE_INITIAL_BALANCE + TRANSFER_AMOUNT) throw new Error("Alice's balance is incorrect");
  if (bobPostBalance !== BOB_INITIAL_BALANCE - TRANSFER_AMOUNT) throw new Error("Bob's balance is incorrect");
};

example();

const CREATE_OBJECT_SCRIPT =
  "a11ceb0b060000000601000402040403080a051209071b3608512000000001000302000102000200000402030001060c000105010800066f626a656374067369676e65720a616464726573735f6f660e436f6e7374727563746f725265660d6372656174655f6f626a6563740000000000000000000000000000000000000000000000000000000000000001000001050b00110011010102";
const TRANSFER_SCRIPT =
  "a11ceb0b060000000701000602060a031017042706052d2d075a4b08a5012000000001000201030701000101040800020503040000060602010001070408010801060902010801050207030704060c060c0503010b000108010001060c010501090003060c0503010801010b0001090003060c0b000109000504636f696e066f626a656374067369676e6572064f626a6563740a4f626a656374436f72650a616464726573735f6f66087472616e7366657211616464726573735f746f5f6f626a6563740000000000000000000000000000000000000000000000000000000000000001010000010e0a010a0011000b0338000b0238010c040b000b040b011100380202";
