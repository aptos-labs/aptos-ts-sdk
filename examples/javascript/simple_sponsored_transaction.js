/**
 * Example to submit a simple sponsored transaction where Alice transfers APT coin to Bob
 * with a Sponser account to pay for the gas fee
 */
const aptos = require("aptos");

const ALICE_INITIAL_BALANCE = 100_000_000;
const SPONSER_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 0;
const TRANSFER_AMOUNT = 10;

(async () => {
  console.log(
    "This example will create three accounts (Alice, Bob and Sponser), fund Alice and Sponser, transfer between Alice and Bob with Sponser to pay the gas fee.",
  );

  // Setup the client
  const sdk = new aptos.Aptos();

  // Create three accounts
  const alice = aptos.Account.generate();
  const bob = aptos.Account.generate();
  const sponser = aptos.Account.generate();

  // Variables to hold Alice and Sponser accounts address
  const aliceAddres = alice.accountAddress.toString();
  const bobAddress = bob.accountAddress.toString();
  const sponserAddress = sponser.accountAddress.toString();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${aliceAddres}`);
  console.log(`Bob's address is: ${bobAddress}`);
  console.log(`Sponser's address is: ${sponserAddress}`);

  // Fund Alice and Sponser accounts
  await sdk.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: ALICE_INITIAL_BALANCE });
  await sdk.fundAccount({ accountAddress: sponser.accountAddress.toString(), amount: SPONSER_INITIAL_BALANCE });

  // Show account balances
  const aliceBalanceBefore = await sdk.getAccountCoinsData({ accountAddress: aliceAddres });
  const sponserBalanceBefore = await sdk.getAccountCoinsData({ accountAddress: sponserAddress });

  console.log("\n=== Balances ===\n");
  console.log(`Alice's balance is: ${aliceBalanceBefore[0].amount}`);
  console.log(`Bobs's balance is: ${BOB_INITIAL_BALANCE}`);
  console.log(`Sponser's balance is: ${sponserBalanceBefore[0].amount}`);

  if (aliceBalanceBefore[0].amount !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (sponserBalanceBefore[0].amount !== SPONSER_INITIAL_BALANCE) throw new Error("Sponsers's balance is incorrect");

  // Generate a fee payer (aka sponser) transaction
  // with Alice as the sender and Sponser as the fee payer
  console.log("\n=== Submitting Transaction ===\n");
  const transaction = await sdk.generateTransaction({
    sender: aliceAddres,
    feePayerAddress: sponserAddress,
    data: {
      function: "0x1::aptos_account::transfer",
      type_arguments: [],
      arguments: [bob.accountAddress, new aptos.U64(TRANSFER_AMOUNT)],
    },
  });

  // Alice and Sponser to sign the transaction (order matters)
  const senderSignature = sdk.signTransaction({ signer: alice, transaction });
  const sponserSignature = sdk.signTransaction({ signer: sponser, transaction });

  // Submit the transaction to chain
  const committedTxn = await sdk.submitTransaction({
    transaction,
    senderAuthenticator: senderSignature,
    secondarySignerAuthenticators: { feePayerAuthenticator: sponserSignature },
  });

  console.log(`Submitted transaction: ${committedTxn.hash}`);
  await sdk.waitForTransaction({ txnHash: committedTxn.hash });

  console.log("\n=== Balances after transfer ===\n");
  const aliceBalanceAfter = await sdk.getAccountCoinsData({ accountAddress: aliceAddres });
  const bobBalanceAfter = await sdk.getAccountCoinsData({ accountAddress: bobAddress });
  const sponserBalanceAfter = await sdk.getAccountCoinsData({ accountAddress: sponserAddress });

  // Bob should have the transfer amount
  if (bobBalanceAfter[0].amount !== TRANSFER_AMOUNT) throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the initial balance minus tranfer amount
  if (aliceBalanceAfter[0].amount !== ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT)
    throw new Error("Alice's balance after transfer is incorrect");

  // Sponser should have the initial balance minus gas
  if (sponserBalanceAfter[0].amount >= SPONSER_INITIAL_BALANCE)
    throw new Error("Sponser's balance after transfer is incorrect");

  console.log(`Alice's final balance is: ${ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT}`);
  console.log(`Bob's balance is: ${TRANSFER_AMOUNT}`);
  console.log(`Sponser's balance is: ${sponserBalanceAfter[0].amount}`);
})();
