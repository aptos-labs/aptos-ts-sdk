/* eslint-disable no-console */

/**
 * This examples demonstrate the new multisig account module (MultiSig V2) and transaction execution flow
 * where in that module, there is no offchain signature aggregation step.
 * Each owner sends its transactions to the chain on its own, and so the "voting" process occurs onchain.
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/aptos-move/framework/aptos-framework/sources/multisig_account.move}
 *
 * This example demonstrates different interaction with the module
 * - create a multi sig account
 * - create a multi sig transaction
 * - approve a multi sig transaction
 * - reject a multi sig transaction
 * - execute a multi sig transaction
 * - fetch multi sig account info
 *
 */

import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  NetworkToNetworkName,
  MoveString,
  generateRawTransaction,
  TransactionPayloadMultiSig,
  MultiSig,
  AccountAddress,
  InputViewFunctionData,
  SimpleTransaction,
  generateTransactionPayload,
} from "@aptos-labs/ts-sdk";

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;

// Setup the client
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

// Generate 3 accounts that will be the owners of the multisig account.
const owner1 = Account.generate();
const owner2 = Account.generate();
const owner3 = Account.generate();

// Global var to hold the created multi sig account address
let multisigAddress: string;

// Generate an account that will recieve coin from a transfer transaction
const recipient = Account.generate();

// Global var to hold the generated coin transfer transaction payload
let transactionPayload: TransactionPayloadMultiSig;

// Generate an account to add and then remove from the multi sig account
const owner4 = Account.generate();

// HELPER FUNCTIONS //

const getNumberOfOwners = async (): Promise<void> => {
  const multisigAccountResource = await aptos.getAccountResource<{ owners: Array<string> }>({
    accountAddress: multisigAddress,
    resourceType: "0x1::multisig_account::MultisigAccount",
  });
  console.log("Number of Owners:", multisigAccountResource.owners.length);
};

const getSignatureThreshold = async (): Promise<void> => {
  const multisigAccountResource = await aptos.getAccountResource<{ num_signatures_required: number }>({
    accountAddress: multisigAddress,
    resourceType: "0x1::multisig_account::MultisigAccount",
  });
  console.log("Signature Threshold:", multisigAccountResource.num_signatures_required);
};

const fundOwnerAccounts = async () => {
  await aptos.fundAccount({ accountAddress: owner1.accountAddress, amount: 100_000_000 });
  await aptos.fundAccount({ accountAddress: owner2.accountAddress, amount: 100_000_000 });
  await aptos.fundAccount({ accountAddress: owner3.accountAddress, amount: 100_000_000 });
  console.log(`owner1: ${owner1.accountAddress.toString()}`);
  console.log(`owner2: ${owner2.accountAddress.toString()}`);
  console.log(`owner3: ${owner3.accountAddress.toString()}`);
};

const settingUpMultiSigAccount = async () => {
  console.log("Setting up a 2-of-3 multisig account...");

  // Step 1: Setup a 2-of-3 multisig account
  // ===========================================================================================
  // Get the next multisig account address. This will be the same as the account address of the multisig account we'll
  // be creating.
  const payload: InputViewFunctionData = {
    function: "0x1::multisig_account::get_next_multisig_account_address",
    functionArguments: [owner1.accountAddress.toString()],
  };
  [multisigAddress] = await aptos.view<[string]>({ payload });
  // Create the multisig account with 3 owners and a signature threshold of 2.
  const createMultisig = await aptos.transaction.build.simple({
    sender: owner1.accountAddress,
    data: {
      function: "0x1::multisig_account::create_with_owners",
      functionArguments: [
        [owner2.accountAddress, owner3.accountAddress],
        2,
        ["Example"],
        [new MoveString("SDK").bcsToBytes()],
      ],
    },
  });
  const owner1Authenticator = aptos.transaction.sign({ signer: owner1, transaction: createMultisig });
  const res = await aptos.transaction.submit.simple({
    senderAuthenticator: owner1Authenticator,
    transaction: createMultisig,
  });
  await aptos.waitForTransaction({ transactionHash: res.hash });

  console.log("Multisig Account Address:", multisigAddress);

  // should be 2
  await getSignatureThreshold();

  // should be 3
  await getNumberOfOwners();
};

const fundMultiSigAccount = async () => {
  console.log("Funding the multisig account...");
  // Fund the multisig account for transfers.
  await aptos.fundAccount({ accountAddress: multisigAddress, amount: 100_000_000 });
};

const createMultiSigTransferTransaction = async () => {
  console.log("Creating a multisig transaction to transfer coins...");

  transactionPayload = await generateTransactionPayload({
    multisigAddress,
    function: "0x1::aptos_account::transfer",
    functionArguments: [recipient.accountAddress, 1_000_000],
    aptosConfig: config,
  });

  // Simulate the transfer transaction to make sure it passes
  const transactionToSimulate = await generateRawTransaction({
    aptosConfig: config,
    sender: owner2.accountAddress,
    payload: transactionPayload,
  });

  const simulateMultisigTx = await aptos.transaction.simulate.simple({
    signerPublicKey: owner2.publicKey,
    transaction: new SimpleTransaction(transactionToSimulate),
  });

  console.log("simulateMultisigTx", simulateMultisigTx);

  // Build create_transaction transaction
  const createMultisigTx = await aptos.transaction.build.simple({
    sender: owner2.accountAddress,
    data: {
      function: "0x1::multisig_account::create_transaction",
      functionArguments: [multisigAddress, transactionPayload.multiSig.transaction_payload.bcsToBytes()],
    },
  });

  // Owner 2 signs the transaction
  const createMultisigTxAuthenticator = aptos.transaction.sign({ signer: owner2, transaction: createMultisigTx });

  // Submit the transaction to chain
  const createMultisigTxResponse = await aptos.transaction.submit.simple({
    senderAuthenticator: createMultisigTxAuthenticator,
    transaction: createMultisigTx,
  });
  await aptos.waitForTransaction({ transactionHash: createMultisigTxResponse.hash });
};

const executeMultiSigTransferTransaction = async () => {
  // Owner 2 can now execute the transactions as it already has 2 approvals (from owners 2 and 3).
  console.log("Owner 2 can now execute the transfer transaction as it already has 2 approvals (from owners 2 and 3).");

  const rawTransaction = await generateRawTransaction({
    aptosConfig: config,
    sender: owner2.accountAddress,
    payload: transactionPayload,
  });

  const transaction = new SimpleTransaction(rawTransaction);

  const owner2Authenticator = aptos.transaction.sign({ signer: owner2, transaction });
  const transferTransactionReponse = await aptos.transaction.submit.simple({
    senderAuthenticator: owner2Authenticator,
    transaction,
  });
  await aptos.waitForTransaction({ transactionHash: transferTransactionReponse.hash });
};

const checkBalance = async () => {
  const accountResource = await aptos.getAccountResource<{ coin: { value: number } }>({
    accountAddress: recipient.accountAddress,
    resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
  });

  console.log("Recipient's balance after transfer", accountResource.coin.value);
};

const createMultiSigTransferTransactionWithPayloadHash = async () => {
  console.log("Creating another multisig transaction using payload hash...");
  // Step 3: Create another multisig transaction to send 1_000_000 coins but use payload hash instead.
  // ===========================================================================================
  const transferTxPayloadHash = sha3Hash.create();
  transferTxPayloadHash.update(transactionPayload.multiSig.transaction_payload.bcsToBytes());

  // Build create_transaction_with_hash transaction
  const createMultisigTxWithHash = await aptos.transaction.build.simple({
    sender: owner2.accountAddress,
    data: {
      function: "0x1::multisig_account::create_transaction_with_hash",
      functionArguments: [multisigAddress, transferTxPayloadHash.digest()],
    },
  });
  // Owner 2 signs the transaction
  const createMultisigTxWithHashAuthenticator = aptos.transaction.sign({
    signer: owner2,
    transaction: createMultisigTxWithHash,
  });
  // Submit the transaction to chain
  const createMultisigTxWithHashResponse = await aptos.transaction.submit.simple({
    senderAuthenticator: createMultisigTxWithHashAuthenticator,
    transaction: createMultisigTxWithHash,
  });
  await aptos.waitForTransaction({ transactionHash: createMultisigTxWithHashResponse.hash });
};

const executeMultiSigTransferTransactionWithPayloadHash = async () => {
  // Owner 2 can now execute the transactions as it already has 2 approvals (from owners 2 and 3).
  console.log(
    "Owner 2 can now execute the transfer with hash transaction as it already has 2 approvals (from owners 2 and 3).",
  );

  const createTransactionWithHashRawTransaction = await generateRawTransaction({
    aptosConfig: config,
    sender: owner2.accountAddress,
    payload: transactionPayload,
  });

  const transaction = new SimpleTransaction(createTransactionWithHashRawTransaction);

  const owner2Authenticator2 = aptos.transaction.sign({
    signer: owner2,
    transaction,
  });
  const multisigTxExecution2Reponse = await aptos.transaction.submit.simple({
    senderAuthenticator: owner2Authenticator2,
    transaction,
  });
  await aptos.waitForTransaction({ transactionHash: multisigTxExecution2Reponse.hash });
};

const createAddingAnOwnerToMultiSigAccountTransaction = async () => {
  console.log("Adding an owner to the multisig account...");

  // Generate a transaction payload as it is one of the input arguments create_transaction expects
  const addOwnerTransactionPayload = await generateTransactionPayload({
    multisigAddress,
    function: "0x1::multisig_account::add_owner",
    functionArguments: [owner4.accountAddress],
    aptosConfig: config,
  });

  // Build create_transaction transaction
  const createAddOwnerTransaction = await aptos.transaction.build.simple({
    sender: owner2.accountAddress,
    data: {
      function: "0x1::multisig_account::create_transaction",
      functionArguments: [multisigAddress, addOwnerTransactionPayload.multiSig.transaction_payload.bcsToBytes()],
    },
  });
  // Owner 2 signs the transaction
  const createAddOwnerTxAuthenticator = aptos.transaction.sign({
    signer: owner2,
    transaction: createAddOwnerTransaction,
  });
  // Submit the transaction to chain
  const createAddOwnerTxResponse = await aptos.transaction.submit.simple({
    senderAuthenticator: createAddOwnerTxAuthenticator,
    transaction: createAddOwnerTransaction,
  });
  await aptos.waitForTransaction({ transactionHash: createAddOwnerTxResponse.hash });
};

const executeAddingAnOwnerToMultiSigAccountTransaction = async () => {
  // Owner 2 can now execute the transactions as it already has 2 approvals (from owners 2 and 3).
  console.log(
    "Owner 2 can now execute the adding an owner transaction as it already has 2 approvals (from owners 2 and 3).",
  );

  const multisigTxExecution3 = await generateRawTransaction({
    aptosConfig: config,
    sender: owner2.accountAddress,
    payload: new TransactionPayloadMultiSig(new MultiSig(AccountAddress.fromString(multisigAddress))),
  });

  const transaction = new SimpleTransaction(multisigTxExecution3);

  const owner2Authenticator3 = aptos.transaction.sign({
    signer: owner2,
    transaction,
  });
  const multisigTxExecution3Reponse = await aptos.transaction.submit.simple({
    senderAuthenticator: owner2Authenticator3,
    transaction,
  });
  await aptos.waitForTransaction({ transactionHash: multisigTxExecution3Reponse.hash });
};

const createRemovingAnOwnerToMultiSigAccount = async () => {
  console.log("Removing an owner from the multisig account...");

  const removeOwnerPayload = await generateTransactionPayload({
    multisigAddress,
    function: "0x1::multisig_account::remove_owner",
    functionArguments: [owner4.accountAddress],
    aptosConfig: config,
  });

  // Build create_transaction transaction
  const removeOwnerTx = await aptos.transaction.build.simple({
    sender: owner2.accountAddress,
    data: {
      function: "0x1::multisig_account::create_transaction",
      functionArguments: [multisigAddress, removeOwnerPayload.multiSig.transaction_payload.bcsToBytes()],
    },
  });

  // Owner 2 signs the transaction
  const createRemoveOwnerTxAuthenticator = aptos.transaction.sign({
    signer: owner2,
    transaction: removeOwnerTx,
  });
  // Submit the transaction to chain
  const createRemoveOwnerTxResponse = await aptos.transaction.submit.simple({
    senderAuthenticator: createRemoveOwnerTxAuthenticator,
    transaction: removeOwnerTx,
  });
  await aptos.waitForTransaction({ transactionHash: createRemoveOwnerTxResponse.hash });
};

const executeRemovingAnOwnerToMultiSigAccount = async () => {
  // Owner 2 can now execute the transactions as it already has 2 approvals (from owners 2 and 3).
  console.log(
    "Owner 2 can now execute the removing an owner transaction as it already has 2 approvals (from owners 2 and 3).",
  );

  const multisigTxExecution4 = await generateRawTransaction({
    aptosConfig: config,
    sender: owner2.accountAddress,
    payload: new TransactionPayloadMultiSig(new MultiSig(AccountAddress.fromString(multisigAddress))),
  });

  const transaction = new SimpleTransaction(multisigTxExecution4);

  const owner2Authenticator4 = aptos.transaction.sign({
    signer: owner2,
    transaction,
  });
  const multisigTxExecution4Reponse = await aptos.transaction.submit.simple({
    senderAuthenticator: owner2Authenticator4,
    transaction,
  });
  await aptos.waitForTransaction({ transactionHash: multisigTxExecution4Reponse.hash });
};

const createChangeSignatureThresholdTransaction = async () => {
  console.log("Changing the signature threshold to 3-of-3...");

  const changeSigThresholdPayload = await generateTransactionPayload({
    multisigAddress,
    function: "0x1::multisig_account::update_signatures_required",
    functionArguments: [3],
    aptosConfig: config,
  });

  // Build create_transaction transaction
  const changeSigThresholdTx = await aptos.transaction.build.simple({
    sender: owner2.accountAddress,
    data: {
      function: "0x1::multisig_account::create_transaction",
      functionArguments: [multisigAddress, changeSigThresholdPayload.multiSig.transaction_payload.bcsToBytes()],
    },
  });

  // Owner 2 signs the transaction
  const changeSigThresholdAuthenticator = aptos.transaction.sign({
    signer: owner2,
    transaction: changeSigThresholdTx,
  });
  // Submit the transaction to chain
  const changeSigThresholdResponse = await aptos.transaction.submit.simple({
    senderAuthenticator: changeSigThresholdAuthenticator,
    transaction: changeSigThresholdTx,
  });
  await aptos.waitForTransaction({ transactionHash: changeSigThresholdResponse.hash });
};

const executeChangeSignatureThresholdTransaction = async () => {
  // Owner 2 can now execute the transactions as it already has 2 approvals (from owners 2 and 3).
  console.log(
    "Owner 2 can now execute the change signature threshold transaction as it already has 2 approvals (from owners 2 and 3).",
  );

  const multisigTxExecution5 = await generateRawTransaction({
    aptosConfig: config,
    sender: owner2.accountAddress,
    payload: new TransactionPayloadMultiSig(new MultiSig(AccountAddress.fromString(multisigAddress))),
  });

  const transaction = new SimpleTransaction(multisigTxExecution5);

  const owner2Authenticator5 = aptos.transaction.sign({
    signer: owner2,
    transaction,
  });
  const multisigTxExecution5Reponse = await aptos.transaction.submit.simple({
    senderAuthenticator: owner2Authenticator5,
    transaction,
  });
  await aptos.waitForTransaction({ transactionHash: multisigTxExecution5Reponse.hash });
};

const rejectAndApprove = async (aprroveOwner: Account, rejectOwner: Account, transactionId: number): Promise<void> => {
  console.log("Owner 1 rejects but owner 3 approves.");
  const rejectTx = await aptos.transaction.build.simple({
    sender: aprroveOwner.accountAddress,
    data: {
      function: "0x1::multisig_account::reject_transaction",
      functionArguments: [multisigAddress, transactionId],
    },
  });

  const rejectSenderAuthenticator = aptos.transaction.sign({ signer: aprroveOwner, transaction: rejectTx });
  const rejectTxResponse = await aptos.transaction.submit.simple({
    senderAuthenticator: rejectSenderAuthenticator,
    transaction: rejectTx,
  });
  await aptos.waitForTransaction({ transactionHash: rejectTxResponse.hash });

  const approveTx = await aptos.transaction.build.simple({
    sender: rejectOwner.accountAddress,
    data: {
      function: "0x1::multisig_account::approve_transaction",
      functionArguments: [multisigAddress, transactionId],
    },
  });

  const approveSenderAuthenticator = aptos.transaction.sign({ signer: rejectOwner, transaction: approveTx });
  const approveTxResponse = await aptos.transaction.submit.simple({
    senderAuthenticator: approveSenderAuthenticator,
    transaction: approveTx,
  });
  await aptos.waitForTransaction({ transactionHash: approveTxResponse.hash });
};

const main = async () => {
  await fundOwnerAccounts();
  await settingUpMultiSigAccount();
  await fundMultiSigAccount();

  await createMultiSigTransferTransaction();
  await rejectAndApprove(owner1, owner3, 1);
  await executeMultiSigTransferTransaction();

  // should be 1_000_000
  await checkBalance();

  await createMultiSigTransferTransactionWithPayloadHash();
  await rejectAndApprove(owner1, owner3, 2);
  await executeMultiSigTransferTransactionWithPayloadHash();

  // should be 2_000_000
  await checkBalance();

  await createAddingAnOwnerToMultiSigAccountTransaction();
  await rejectAndApprove(owner1, owner3, 3);
  await executeAddingAnOwnerToMultiSigAccountTransaction();

  // should be 4
  await getNumberOfOwners();

  await createRemovingAnOwnerToMultiSigAccount();
  await rejectAndApprove(owner1, owner3, 4);
  await executeRemovingAnOwnerToMultiSigAccount();

  // should be 3
  await getNumberOfOwners();

  await createChangeSignatureThresholdTransaction();
  await rejectAndApprove(owner1, owner3, 5);
  await executeChangeSignatureThresholdTransaction();

  // The multisig account should now be 3-of-3.
  await getSignatureThreshold();

  console.log("Multisig setup and transactions complete.");
};

// Start the example
main();
