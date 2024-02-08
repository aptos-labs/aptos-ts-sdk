/* eslint-disable no-console */

/**
 * This example demostrates how one can generate and sign a transaction
 * on one server (for example, frontend) and have it serialized and send
 * it to another server (for example, backend) to deserialize and submit.
 */

import {
  Account,
  AccountAddress,
  AccountAuthenticator,
  Aptos,
  AptosConfig,
  Deserializer,
  Network,
  NetworkToNetworkName,
  RawTransaction,
} from "@aptos-labs/ts-sdk";

const INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 100;

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;
// Setup the client
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

type SerializedData = {
  rawTransactionBytes: Uint8Array;
  feePayerAddressByes: Uint8Array;
  serializedSenderAuthenticatorBytes: Uint8Array;
  serializedFeePayerAuthenticatorBytes: Uint8Array;
};

const sendToOtherServer = async (serializedData: SerializedData) => {
  const {
    rawTransactionBytes,
    feePayerAddressByes,
    serializedSenderAuthenticatorBytes,
    serializedFeePayerAuthenticatorBytes,
  } = serializedData;

  // deserialize raw transaction
  const deserializer = new Deserializer(rawTransactionBytes);
  const rawTransaction = RawTransaction.deserialize(deserializer);

  // deserialize sender authenticator
  const deserializer2 = new Deserializer(serializedSenderAuthenticatorBytes);
  const senderAuthenticator = AccountAuthenticator.deserialize(deserializer2);

  // deserialize fee payer authenticator
  const deserializer3 = new Deserializer(serializedFeePayerAuthenticatorBytes);
  const feePayerAuthenticator = AccountAuthenticator.deserialize(deserializer3);

  // deserialize fee payer address
  const deserializer4 = new Deserializer(feePayerAddressByes);
  const feePayerAddress = AccountAddress.deserialize(deserializer4);

  // The transaction to submit. The transaction is the `rawTransaction` and
  // doesnt have the fee payer address info so we need to assign it here
  const transaction = {
    rawTransaction,
    feePayerAddress,
  };

  const response = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator,
    feePayerAuthenticator,
  });

  const executedTransaction = await aptos.waitForTransaction({ transactionHash: response.hash });
  console.log("executed transaction", executedTransaction.hash);
};

const example = async () => {
  // Create two accounts
  const alice = Account.generate();
  const bob = Account.generate();
  const sponsor = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Bob's address is: ${bob.accountAddress}`);
  console.log(`Sponsor's address is: ${sponsor.accountAddress}`);

  // Fund the accounts
  console.log("\n=== Funding accounts ===\n");

  await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress,
    amount: INITIAL_BALANCE,
  });

  await aptos.fundAccount({ accountAddress: sponsor.accountAddress, amount: INITIAL_BALANCE });

  console.log("\n=== Accounts funded ===\n");

  const transaction = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    withFeePayer: true,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
    },
  });

  // Alice signs
  const senderAuth = aptos.transaction.sign({ signer: alice, transaction });

  // Sponsor signs
  const sponsorAuth = aptos.transaction.signAsFeePayer({ signer: sponsor, transaction });

  // Serialize data

  /**
   * the generated `transaction` is of a simple type and can't be
   * bcs serialized. Therefore we serialize the `rawTransaction` and
   * the `sponsor.accountAddress` separately and send it to the server.
   */
  const rawTransactionBytes = transaction.rawTransaction.bcsToBytes();
  const feePayerAddressByes = sponsor.accountAddress.bcsToBytes();
  const serializedSenderAuthenticatorBytes = senderAuth.bcsToBytes();
  const serializedFeePayerAuthenticatorBytes = sponsorAuth.bcsToBytes();

  const serializedData = {
    rawTransactionBytes,
    feePayerAddressByes,
    serializedSenderAuthenticatorBytes,
    serializedFeePayerAuthenticatorBytes,
  };

  await sendToOtherServer(serializedData);
};

example();
