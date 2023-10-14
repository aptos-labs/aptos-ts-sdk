/**
 * This example shows how to use the Aptos client to create accounts, fund them, and transfer between them.
 */

const aptos = require("aptos");

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = `0x1::coin::CoinStore<${APTOS_COIN}>`;
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 * TODO: Change to AccountAddress for address
 */
const balance = async (sdk, name, address) => {
  let balance = await sdk.getAccountResource({ accountAddress: address, resourceType: COIN_STORE });

  let amount = Number(balance.data.coin.value);

  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

const example = async () => {
  console.log("This example will create two accounts (Alice and Bob), fund them, and transfer between them.");

  // Setup the client
  const sdk = new aptos.Aptos();

  // Create two accounts
  let alice = aptos.Account.generate({ scheme: 0 });
  let bob = aptos.Account.generate({ scheme: 0 });

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress.toString()}`);
  console.log(`Bob's address is: ${bob.accountAddress.toString()}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  const aliceFundTxn = await sdk.fundAccount({
    accountAddress: alice.accountAddress.toUint8Array(),
    amount: ALICE_INITIAL_BALANCE,
  });
  console.log("Alice's fund transaction: ", aliceFundTxn);

  const bobFundTxn = await sdk.fundAccount({
    accountAddress: bob.accountAddress.toUint8Array(),
    amount: BOB_INITIAL_BALANCE,
  });
  console.log("Bob's fund transaction: ", bobFundTxn);

  // Show the balances
  console.log("\n=== Balances ===\n");
  let aliceBalance = await balance(sdk, "Alice", alice.accountAddress.toUint8Array());
  let bobBalance = await balance(sdk, "Bob", bob.accountAddress.toUint8Array());

  if (aliceBalance !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (bobBalance !== BOB_INITIAL_BALANCE) throw new Error("Bob's balance is incorrect");

  // Transfer between users
  const txn = await sdk.generateTransaction({
    sender: alice.accountAddress.toString(),
    data: {
      function: "0x1::coin::transfer",
      type_arguments: [new aptos.TypeTagStruct(aptos.StructTag.fromString(APTOS_COIN))],
      arguments: [
        aptos.AccountAddress.fromHexInput({ input: bob.accountAddress.toString() }),
        new aptos.U64(TRANSFER_AMOUNT),
      ],
    },
  });

  console.log("\n=== Transfer transaction ===\n");
  let signature = sdk.signTransaction({ signer: alice, transaction: txn });
  const committedTxn = await sdk.submitTransaction({
    transaction: txn,
    senderAuthenticator: signature,
  });
  console.log(`Committed transaction: ${committedTxn.hash}`);
  await sdk.waitForTransaction({ txnHash: committedTxn.hash });

  console.log("\n=== Balances after transfer ===\n");
  let newAliceBalance = await balance(sdk, "Alice", alice.accountAddress.toUint8Array());
  let newBobBalance = await balance(sdk, "Bob", bob.accountAddress.toUint8Array());

  // Bob should have the transfer amount
  if (newBobBalance !== TRANSFER_AMOUNT + BOB_INITIAL_BALANCE)
    throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the remainder minus gas
  if (newAliceBalance >= ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT)
    throw new Error("Alice's balance after transfer is incorrect");
};

example();
