/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * Example to submit a simple sponsored transaction where Alice transfers APT coin to Bob
 * with a sponsor account to pay for the gas fee
 */
import "dotenv";
import { Account, Aptos, AptosConfig, Network, NetworkToNetworkName, U64 } from "@aptos-labs/ts-sdk";

const ALICE_INITIAL_BALANCE = 100_000_000;
const SPONSOR_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 0;
const TRANSFER_AMOUNT = 10;
// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;

const example = async () => {
  console.log(
    "This example will create three accounts (Alice, Bob and Sponsor), fund Alice and Sponsor, transfer between Alice and Bob with sponsor to pay the gas fee.",
  );

  // Setup the client
  const aptosConfig = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(aptosConfig);

  // Create three accounts
  const alice = Account.generate();
  const bob = Account.generate();
  const sponsor = Account.generate();

  // Variables to hold Alice and sponsor accounts address
  const aliceAddres = alice.accountAddress.toString();
  const bobAddress = bob.accountAddress.toString();
  const sponsorAddress = sponsor.accountAddress.toString();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${aliceAddres}`);
  console.log(`Bob's address is: ${bobAddress}`);
  console.log(`Sponsor's address is: ${sponsorAddress}`);

  // Fund Alice and sponsor accounts
  await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: ALICE_INITIAL_BALANCE });
  await aptos.fundAccount({ accountAddress: sponsor.accountAddress.toString(), amount: SPONSOR_INITIAL_BALANCE });

  // Show account balances
  const aliceBalanceBefore = await aptos.getAccountCoinsData({ accountAddress: aliceAddres });
  const sponsorBalanceBefore = await aptos.getAccountCoinsData({ accountAddress: sponsorAddress });

  console.log("\n=== Balances ===\n");
  console.log(`Alice's balance is: ${aliceBalanceBefore[0].amount}`);
  console.log(`Bobs's balance is: ${BOB_INITIAL_BALANCE}`);
  console.log(`Sponsor's balance is: ${sponsorBalanceBefore[0].amount}`);

  if (aliceBalanceBefore[0].amount !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (sponsorBalanceBefore[0].amount !== SPONSOR_INITIAL_BALANCE) throw new Error("Sponsors's balance is incorrect");

  // Generate a fee payer (aka sponsor) transaction
  // with Alice as the sender and sponsor as the fee payer
  console.log("\n=== Submitting Transaction ===\n");
  const transaction = await aptos.generateTransaction({
    sender: aliceAddres,
    feePayerAddress: sponsorAddress,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [bob.accountAddress, new U64(TRANSFER_AMOUNT)],
    },
  });

  const senderSignature = aptos.signTransaction({ signer: alice, transaction });
  const sponsorSignature = aptos.signTransaction({ signer: sponsor, transaction });

  // Submit the transaction to chain
  const committedTxn = await aptos.submitTransaction({
    transaction,
    senderAuthenticator: senderSignature,
    secondarySignerAuthenticators: { feePayerAuthenticator: sponsorSignature },
  });

  console.log(`Submitted transaction: ${committedTxn.hash}`);
  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await sleep(500);

  console.log("\n=== Balances after transfer ===\n");
  const aliceBalanceAfter = await aptos.getAccountCoinsData({ accountAddress: aliceAddres });
  const bobBalanceAfter = await aptos.getAccountCoinsData({ accountAddress: bobAddress });
  const sponsorBalanceAfter = await aptos.getAccountCoinsData({ accountAddress: sponsorAddress });

  // Bob should have the transfer amount
  if (bobBalanceAfter[0].amount !== TRANSFER_AMOUNT) throw new Error("Bob's balance after transfer is incorrect");

  // Alice should have the initial balance minus tranfer amount
  if (aliceBalanceAfter[0].amount !== ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT)
    throw new Error("Alice's balance after transfer is incorrect");

  // Sponsor should have the initial balance minus gas
  if (sponsorBalanceAfter[0].amount >= SPONSOR_INITIAL_BALANCE)
    throw new Error("Sponsor's balance after transfer is incorrect");

  console.log(`Alice's final balance is: ${aliceBalanceAfter[0].amount}`);
  console.log(`Bob's balance is: ${bobBalanceAfter[0].amount}`);
  console.log(`Sponsor's balance is: ${sponsorBalanceAfter[0].amount}`);
};

const sleep = async (timeMs: number): Promise<null> =>
  new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });

example();
