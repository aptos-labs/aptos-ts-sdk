/**
 * This file contains the underlying implementations for exposed submission API surface in
 * the {@link api/transaction}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * transaction namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { MoveVector, U8 } from "../bcs";
import { postAptosFullNode } from "../client";
import { Account, KeylessAccount, MultiKeyAccount } from "../account";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { PrivateKey } from "../core/crypto";
import { AccountAuthenticator } from "../transactions/authenticator/account";
import { RotationProofChallenge } from "../transactions/instances/rotationProofChallenge";
import {
  buildTransaction,
  generateTransactionPayload,
  generateSignedTransactionForSimulation,
  generateSignedTransaction,
} from "../transactions/transactionBuilder/transactionBuilder";
import {
  InputGenerateTransactionData,
  AnyRawTransaction,
  InputSimulateTransactionData,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadDataWithRemoteABI,
  InputSubmitTransactionData,
  InputGenerateMultiAgentRawTransactionData,
  InputGenerateSingleSignerRawTransactionData,
  AnyTransactionPayloadInstance,
  EntryFunctionABI,
} from "../transactions/types";
import { getInfo } from "./account";
import { UserTransactionResponse, PendingTransactionResponse, MimeType, HexInput, TransactionResponse } from "../types";
import { TypeTagU8, TypeTagVector, generateSigningMessageForTransaction } from "../transactions";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { MultiAgentTransaction } from "../transactions/instances/multiAgentTransaction";

/**
 * We are defining function signatures, each with its specific input and output.
 * These are the possible function signature for `generateTransaction` function.
 * When we call `generateTransaction` function with the relevant type properties,
 * Typescript can infer the return type based on the appropriate function overload.
 */
export async function generateTransaction(
  args: { aptosConfig: AptosConfig } & InputGenerateSingleSignerRawTransactionData,
): Promise<SimpleTransaction>;
export async function generateTransaction(
  args: { aptosConfig: AptosConfig } & InputGenerateMultiAgentRawTransactionData,
): Promise<MultiAgentTransaction>;
/**
 * Generates any transaction by passing in the required arguments
 *
 * @param args.sender The transaction sender's account address as a AccountAddressInput
 * @param args.data EntryFunctionData | ScriptData | MultiSigData
 * @param args.feePayerAddress optional. For a fee payer (aka sponsored) transaction
 * @param args.secondarySignerAddresses optional. For a multi-agent or fee payer (aka sponsored) transactions
 * @param args.options optional. GenerateTransactionOptions type
 *
 * @example
 * For a single signer entry function
 * move function name, move function type arguments, move function arguments
 * `
 * data: {
 *  function:"0x1::aptos_account::transfer",
 *  typeArguments:[]
 *  functionArguments :[receiverAddress,10]
 * }
 * `
 *
 * @example
 * For a single signer script function
 * module bytecode, move function type arguments, move function arguments
 * ```
 * data: {
 *  bytecode:"0x001234567",
 *  typeArguments:[],
 *  functionArguments :[receiverAddress,10]
 * }
 * ```
 *
 * @return An instance of a RawTransaction, plus optional secondary/fee payer addresses
 * ```
 * {
 *  rawTransaction: RawTransaction,
 *  secondarySignerAddresses? : Array<AccountAddress>,
 *  feePayerAddress?: AccountAddress
 * }
 * ```
 */
export async

/**
 * Generates a raw transaction based on the provided configuration and input data.
 * This function helps in creating a transaction payload that can be submitted to the Aptos blockchain.
 * 
 * @param args - The arguments for generating the transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.sender - The account address of the sender.
 * @param args.data - The transaction data, including the function to be called and its arguments.
 * @param args.options - Optional parameters for the transaction, such as gas price or sequence number.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Generate a transaction to transfer coins
 *   const transaction = await aptos.transaction.generateTransaction({
 *     aptosConfig: config,
 *     sender: "0x1", // replace with a real sender address
 *     data: {
 *       function: "0x1::aptos_account::transfer_coins",
 *       functionArguments: ["0x2", 100], // replace with a real recipient address and amount
 *     },
 *     options: {
 *       gasPrice: 1000, // specify your own gas price if needed
 *     },
 *   });
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function generateTransaction(
  args: { aptosConfig: AptosConfig } & InputGenerateTransactionData,
): Promise<AnyRawTransaction> {
  const payload = await buildTransactionPayload(args);
  return buildRawTransaction(args, payload);
}

export async

/**
 * Builds a transaction payload based on the provided configuration and data.
 * This function allows you to create a payload for executing transactions on the Aptos blockchain.
 * 
 * @param args - The arguments for building the transaction payload.
 * @param args.aptosConfig - The configuration object for Aptos.
 * @param args.data - The data required to generate the transaction payload, which can include:
 *   - `bytecode`: The bytecode of the transaction.
 *   - `multisigAddress`: The address of the multisig account (if applicable).
 *   - `function`: The function to be called in the transaction.
 *   - `functionArguments`: The arguments to be passed to the function.
 *   - `typeArguments`: The type arguments for the function.
 *   - `abi`: The ABI of the function (if available).
 * 
 * @returns A promise that resolves to the generated transaction payload.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const transactionPayload = await aptos.buildTransactionPayload({
 *     aptosConfig: config,
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: ["0x1", 100], // replace with a real account address
 *       typeArguments: [],
 *       abi: undefined // specify if available
 *     }
 *   });
 * 
 *   console.log(transactionPayload); // Logs the generated transaction payload
 * }
 * runExample().catch(console.error);
 * ```
 */
 function buildTransactionPayload(
  args: { aptosConfig: AptosConfig } & InputGenerateTransactionData,
): Promise<AnyTransactionPayloadInstance> {
  const { aptosConfig, data } = args;
  // Merge in aptosConfig for remote ABI on non-script payloads
  let generateTransactionPayloadData: InputGenerateTransactionPayloadDataWithRemoteABI;
  let payload: AnyTransactionPayloadInstance;

  if ("bytecode" in data) {
    // TODO: Add ABI checking later
    payload = await generateTransactionPayload(data);
  } else if ("multisigAddress" in data) {
    generateTransactionPayloadData = {
      aptosConfig,
      multisigAddress: data.multisigAddress,
      function: data.function,
      functionArguments: data.functionArguments,
      typeArguments: data.typeArguments,
      abi: data.abi,
    };
    payload = await generateTransactionPayload(generateTransactionPayloadData);
  } else {
    generateTransactionPayloadData = {
      aptosConfig,
      function: data.function,
      functionArguments: data.functionArguments,
      typeArguments: data.typeArguments,
      abi: data.abi,
    };
    payload = await generateTransactionPayload(generateTransactionPayloadData);
  }
  return payload;
}

export async

/**
 * Builds a raw transaction based on the provided configuration and payload.
 * This function is essential for creating transactions that can be sent to the Aptos blockchain.
 * 
 * @param args - The arguments for building the transaction.
 * @param args.aptosConfig - The configuration object for the Aptos client.
 * @param args.sender - The account address of the transaction sender.
 * @param args.options - Additional options for the transaction.
 * @param payload - The payload containing the transaction details.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const sender = Account.generate(); // Replace with a real sender account
 * 
 *   const payload = {
 *     function: "0x1::aptos_account::transfer",
 *     functionArguments: [Account.generate().accountAddress, 100], // Replace with a real destination account
 *   };
 * 
 *   const transaction = await aptos.transaction.buildRawTransaction({
 *     aptosConfig: config,
 *     sender: sender.accountAddress,
 *     options: {},
 *   }, payload);
 * 
 *   console.log(transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function buildRawTransaction(
  args: { aptosConfig: AptosConfig } & InputGenerateTransactionData,
  payload: AnyTransactionPayloadInstance,
): Promise<AnyRawTransaction> {
  const { aptosConfig, sender, options } = args;

  let feePayerAddress;
  if (isFeePayerTransactionInput(args)) {
    feePayerAddress = AccountAddress.ZERO.toString();
  }

  if (isMultiAgentTransactionInput(args)) {
    const { secondarySignerAddresses } = args;
    return buildTransaction({
      aptosConfig,
      sender,
      payload,
      options,
      secondarySignerAddresses,
      feePayerAddress,
    });
  }

  return buildTransaction({
    aptosConfig,
    sender,
    payload,
    options,
    feePayerAddress,
  });
}

function isFeePayerTransactionInput(data: InputGenerateTransactionData): boolean {
  return data.withFeePayer === true;
}

function isMultiAgentTransactionInput(
  data: InputGenerateTransactionData,
): data is InputGenerateMultiAgentRawTransactionData {
  return "secondarySignerAddresses" in data;
}

/**
 * Builds a signing message that can be signed by external signers
 *
 * Note: Please prefer using `signTransaction` unless signing outside the SDK
 *
 * @param args.transaction AnyRawTransaction, as generated by `generateTransaction()`
 *
 * @return The message to be signed
 */
export function getSigningMessage(args: { transaction: AnyRawTransaction }): Uint8Array {
  const { transaction } = args;
  return generateSigningMessageForTransaction(transaction);
}

/**
 * Sign a transaction that can later be submitted to chain
 *
 * @param args.signer The signer account to sign the transaction
 * @param args.transaction An instance of a RawTransaction, plus optional secondary/fee payer addresses
 * ```
 * {
 *  rawTransaction: RawTransaction,
 *  secondarySignerAddresses? : Array<AccountAddress>,
 *  feePayerAddress?: AccountAddress
 * }
 * ```
 *
 * @return The signer AccountAuthenticator
 */
export function signTransaction(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
  const { signer, transaction } = args;
  return signer.signTransactionWithAuthenticator(transaction);
}

/**
 * Simulates a transaction before singing it.
 *
 * @param args.signerPublicKey The signer public key
 * @param args.transaction The raw transaction to simulate
 * @param args.secondarySignersPublicKeys optional. For when the transaction is a multi signers transaction
 * @param args.feePayerPublicKey optional. For when the transaction is a fee payer (aka sponsored) transaction
 * @param args.options optional. A config to simulate the transaction with
 */
export async function simulateTransaction(
  args: { aptosConfig: AptosConfig } & InputSimulateTransactionData,
): Promise<Array<UserTransactionResponse>> {
  const { aptosConfig, transaction, signerPublicKey, secondarySignersPublicKeys, feePayerPublicKey, options } = args;

  const signedTransaction = generateSignedTransactionForSimulation({
    transaction,
    signerPublicKey,
    secondarySignersPublicKeys,
    feePayerPublicKey,
    options,
  });

  const { data } = await postAptosFullNode<Uint8Array, Array<UserTransactionResponse>>({
    aptosConfig,
    body: signedTransaction,
    path: "transactions/simulate",
    params: {
      estimate_gas_unit_price: args.options?.estimateGasUnitPrice ?? false,
      estimate_max_gas_amount: args.options?.estimateMaxGasAmount ?? false,
      estimate_prioritized_gas_unit_price: args.options?.estimatePrioritizedGasUnitPrice ?? false,
    },
    originMethod: "simulateTransaction",
    contentType: MimeType.BCS_SIGNED_TRANSACTION,
  });
  return data;
}

/**
 * Submit transaction to chain
 *
 * @param args.transaction A aptos transaction type
 * @param args.senderAuthenticator The account authenticator of the transaction sender
 * @param args.secondarySignerAuthenticators optional. For when the transaction is a multi signers transaction
 *
 * @return PendingTransactionResponse
 */
export async

/**
 * Submits a signed transaction to the Aptos blockchain. This function is essential for executing transactions and interacting with smart contracts on the Aptos network.
 * 
 * @param args - The arguments for submitting the transaction.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.data - The data required for the transaction submission.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const transactionData = {
 *     // Replace with actual transaction data
 *   };
 * 
 *   // Submitting a transaction to the Aptos blockchain
 *   const response = await aptos.transaction.submitTransaction({
 *     aptosConfig: config,
 *     ...transactionData,
 *   });
 * 
 *   console.log("Transaction submitted:", response);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function submitTransaction(
  args: {
    aptosConfig: AptosConfig;
  } & InputSubmitTransactionData,
): Promise<PendingTransactionResponse> {
  const { aptosConfig } = args;
  const signedTransaction = generateSignedTransaction({ ...args });
  const { data } = await postAptosFullNode<Uint8Array, PendingTransactionResponse>({
    aptosConfig,
    body: signedTransaction,
    path: "transactions",
    originMethod: "submitTransaction",
    contentType: MimeType.BCS_SIGNED_TRANSACTION,
  });
  return data;
}

export async

/**
 * Signs and submits a transaction to the Aptos blockchain.
 * This function allows users to securely sign a transaction and submit it for processing.
 * 
 * @param args - The arguments for signing and submitting the transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.signer - The account that will sign the transaction.
 * @param args.transaction - The raw transaction to be signed and submitted.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * const sender = Account.generate(); // Generate a new account for sending the transaction
 * 
 * async function runExample() {
 *   const sequenceNumber = await aptos.account.sequenceNumber(sender.accountAddress);
 * 
 *   const transaction = await aptos.transaction.build.simple({
 *     sender: sender.accountAddress,
 *     data: {
 *       function: "0x1::aptos_account::transfer",
 *       functionArguments: [sender.accountAddress, 100], // Replace with a real destination account
 *     },
 *   });
 * 
 *   // Sign and submit the transaction
 *   const pendingTransaction = await aptos.transaction.signAndSubmitTransaction({
 *     aptosConfig: config,
 *     signer: sender,
 *     transaction,
 *   });
 * 
 *   console.log("Pending Transaction:", pendingTransaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function signAndSubmitTransaction(args: {
  aptosConfig: AptosConfig;
  signer: Account;
  transaction: AnyRawTransaction;
}): Promise<PendingTransactionResponse> {
  const { aptosConfig, signer, transaction } = args;
  // If the signer contains a KeylessAccount, await proof fetching in case the proof
  // was fetched asyncronously.
  if (signer instanceof KeylessAccount || signer instanceof MultiKeyAccount) {
    await signer.waitForProofFetch();
  }
  const authenticator = signTransaction({ signer, transaction });
  return submitTransaction({
    aptosConfig,
    transaction,
    senderAuthenticator: authenticator,
  });
}

const packagePublishAbi: EntryFunctionABI = {
  typeParameters: [],
  parameters: [TypeTagVector.u8(), new TypeTagVector(TypeTagVector.u8())],
};

export async

/**
 * Publishes a package transaction to the Aptos blockchain using the provided metadata and module bytecode.
 * This function allows users to deploy new modules and associated metadata to the blockchain.
 * 
 * @param args - The arguments for the package transaction.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.account - The account address that will send the transaction.
 * @param args.metadataBytes - The metadata for the package in hexadecimal format.
 * @param args.moduleBytecode - An array of module bytecode in hexadecimal format.
 * @param args.options - Optional parameters for generating the transaction.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const account = "0x1"; // replace with a real account address
 *   const metadataBytes = "0xabcdef"; // replace with real metadata in hex
 *   const moduleBytecode = ["0x123456"]; // replace with real module bytecode in hex
 * 
 *   // Publishing a package transaction
 *   const transaction = await aptos.transaction.publicPackageTransaction({
 *     aptosConfig: config,
 *     account,
 *     metadataBytes,
 *     moduleBytecode,
 *   });
 * 
 *   console.log("Transaction published:", transaction);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function publicPackageTransaction(args: {
  aptosConfig: AptosConfig;
  account: AccountAddressInput;
  metadataBytes: HexInput;
  moduleBytecode: Array<HexInput>;
  options?: InputGenerateTransactionOptions;
}): Promise<SimpleTransaction> {
  const { aptosConfig, account, metadataBytes, moduleBytecode, options } = args;

  const totalByteCode = moduleBytecode.map((bytecode) => MoveVector.U8(bytecode));

  return generateTransaction({
    aptosConfig,
    sender: AccountAddress.from(account),
    data: {
      function: "0x1::code::publish_package_txn",
      functionArguments: [MoveVector.U8(metadataBytes), new MoveVector(totalByteCode)],
      abi: packagePublishAbi,
    },
    options,
  });
}

const rotateAuthKeyAbi: EntryFunctionABI = {
  typeParameters: [],
  parameters: [
    new TypeTagU8(),
    TypeTagVector.u8(),
    new TypeTagU8(),
    TypeTagVector.u8(),
    TypeTagVector.u8(),
    TypeTagVector.u8(),
  ],
};

/**
 * TODO: Need to refactor and move this function out of transactionSubmission
 */
export async

/**
 * Rotates the authentication key for a specified account to a new private key.
 * This function is essential for enhancing account security by allowing users to change their authentication key.
 * 
 * @param args - The parameters for rotating the authentication key.
 * @param args.aptosConfig - The configuration settings for the Aptos client.
 * @param args.fromAccount - The account from which the authentication key will be rotated.
 * @param args.toNewPrivateKey - The new private key to be set for the account.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network, Account, PrivateKey } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const fromAccount = Account.generate(); // Replace with your own account
 *   const toNewPrivateKey = PrivateKey.fromHex("0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"); // replace with a real private key
 * 
 *   // Rotate the authentication key for the account
 *   const result = await aptos.transaction.rotateAuthKey({
 *     aptosConfig: config,
 *     fromAccount,
 *     toNewPrivateKey,
 *   });
 * 
 *   console.log("Authentication key rotated successfully:", result);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function rotateAuthKey(args: {
  aptosConfig: AptosConfig;
  fromAccount: Account;
  toNewPrivateKey: PrivateKey;
}): Promise<TransactionResponse> {
  const { aptosConfig, fromAccount, toNewPrivateKey } = args;
  const accountInfo = await getInfo({
    aptosConfig,
    accountAddress: fromAccount.accountAddress,
  });

  const newAccount = Account.fromPrivateKey({ privateKey: toNewPrivateKey, legacy: true });

  const challenge = new RotationProofChallenge({
    sequenceNumber: BigInt(accountInfo.sequence_number),
    originator: fromAccount.accountAddress,
    currentAuthKey: AccountAddress.from(accountInfo.authentication_key),
    newPublicKey: newAccount.publicKey,
  });

  // Sign the challenge
  const challengeHex = challenge.bcsToBytes();
  const proofSignedByCurrentPrivateKey = fromAccount.sign(challengeHex);
  const proofSignedByNewPrivateKey = newAccount.sign(challengeHex);

  // Generate transaction
  const rawTxn = await generateTransaction({
    aptosConfig,
    sender: fromAccount.accountAddress,
    data: {
      function: "0x1::account::rotate_authentication_key",
      functionArguments: [
        new U8(fromAccount.signingScheme), // from scheme
        MoveVector.U8(fromAccount.publicKey.toUint8Array()),
        new U8(newAccount.signingScheme), // to scheme
        MoveVector.U8(newAccount.publicKey.toUint8Array()),
        MoveVector.U8(proofSignedByCurrentPrivateKey.toUint8Array()),
        MoveVector.U8(proofSignedByNewPrivateKey.toUint8Array()),
      ],
      abi: rotateAuthKeyAbi,
    },
  });
  return signAndSubmitTransaction({
    aptosConfig,
    signer: fromAccount,
    transaction: rawTxn,
  });
}