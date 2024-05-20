/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * Example to submit a simple sponsored transaction where Alice transfers APT coin to Bob
 * with a sponsor account to pay for the gas fee
 */
import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const ALICE_INITIAL_BALANCE = 100_000_000;
const SPONSOR_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 10;

export const sponsorTransaction = async () => {
  // Setup the client
  const aptosConfig = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(aptosConfig);

  // Create three accounts
  const alice = Account.generate();
  const bob = Account.generate();
  const sponsor = Account.generate();

  // Variables to hold Alice and sponsor accounts address
  const aliceAddress = alice.accountAddress;
  const bobAddress = bob.accountAddress;
  const sponsorAddress = sponsor.accountAddress;

  // Fund Alice and sponsor accounts
  await aptos.fundAccount({ accountAddress: aliceAddress, amount: ALICE_INITIAL_BALANCE });
  await aptos.fundAccount({ accountAddress: sponsorAddress, amount: SPONSOR_INITIAL_BALANCE });

  // Show account balances
  const aliceBalanceBefore = await aptos.getAccountCoinsData({ accountAddress: aliceAddress });
  const sponsorBalanceBefore = await aptos.getAccountCoinsData({ accountAddress: sponsorAddress });

  if (aliceBalanceBefore[0].amount !== ALICE_INITIAL_BALANCE) throw new Error("Alice's balance is incorrect");
  if (sponsorBalanceBefore[0].amount !== SPONSOR_INITIAL_BALANCE) throw new Error("Sponsors's balance is incorrect");

  // Generate a fee payer (aka sponsor) transaction
  // with Alice as the sender and sponsor as the fee payer
  const transaction = await aptos.transaction.build.simple({
    sender: aliceAddress,
    withFeePayer: true,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
    },
  });

  // Alice signs
  const senderSignature = aptos.transaction.sign({ signer: alice, transaction });

  // Sponsor signs
  const sponsorSignature = aptos.transaction.signAsFeePayer({ signer: sponsor, transaction });

  // Submit the transaction to chain
  const committedTxn = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator: senderSignature,
    feePayerAuthenticator: sponsorSignature,
  });

  const response = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  const aliceBalanceAfter = await aptos.getAccountCoinsData({
    accountAddress: aliceAddress,
    minimumLedgerVersion: BigInt(response.version),
  });
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
};
