/**
 * This file contains the underlying implementations for exposed submission API surface in
 * the {@link api/transaction}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * transaction namespace and without having a dependency cycle error.
 * @group Implementation
 */

import { AptosConfig } from "../api/aptosConfig";
import { Deserializer, MoveVector } from "../bcs";
import { postAptosFullNode } from "../client";
import { Account, AbstractKeylessAccount, isKeylessSigner } from "../account";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { FederatedKeylessPublicKey, KeylessPublicKey, KeylessSignature } from "../core/crypto";
import { AccountAuthenticator } from "../transactions/authenticator/account";
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
  InputTransactionPluginData,
} from "../transactions/types";
import { UserTransactionResponse, PendingTransactionResponse, MimeType, HexInput } from "../types";
import { SignedTransaction, TypeTagVector, generateSigningMessageForTransaction } from "../transactions";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";
import { MultiAgentTransaction } from "../transactions/instances/multiAgentTransaction";

/**
 * We are defining function signatures, each with its specific input and output.
 * These are the possible function signature for `generateTransaction` function.
 * When we call `generateTransaction` function with the relevant type properties,
 * Typescript can infer the return type based on the appropriate function overload.
 * @group Implementation
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
 *  secondarySignerAddresses?: Array<AccountAddress>,
 *  feePayerAddress?: AccountAddress
 * }
 * ```
 * @group Implementation
 */
export async function generateTransaction(
  args: { aptosConfig: AptosConfig } & InputGenerateTransactionData,
): Promise<AnyRawTransaction> {
  const payload = await buildTransactionPayload(args);
  return buildRawTransaction(args, payload);
}

/**
 * Builds a transaction payload based on the provided configuration and input data.
 * This function is essential for preparing transaction data for execution on the Aptos blockchain.
 *
 * @param args - The arguments for building the transaction payload.
 * @param args.aptosConfig - Configuration settings for the Aptos network.
 * @param args.data - Input data required to generate the transaction payload, which may include bytecode, multisig address,
 * function name, function arguments, type arguments, and ABI.
 * @returns A promise that resolves to the generated transaction payload instance.
 * @group Implementation
 */
export async function buildTransactionPayload(
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

/**
 * Builds a raw transaction based on the provided configuration and payload.
 * This function helps in creating a transaction that can be sent to the Aptos blockchain.
 *
 * @param args - The arguments for generating the transaction.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param args.sender - The address of the sender of the transaction.
 * @param args.options - Additional options for the transaction.
 * @param payload - The payload of the transaction, which defines the action to be performed.
 * @group Implementation
 */
export async function buildRawTransaction(
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

/**
 * Determine if the transaction input includes a fee payer.
 *
 * @param data - The input data for generating a transaction.
 * @param data.withFeePayer - Indicates whether a fee payer is included in the transaction input.
 * @returns A boolean value indicating if the transaction input has a fee payer.
 * @group Implementation
 */
function isFeePayerTransactionInput(data: InputGenerateTransactionData): boolean {
  return data.withFeePayer === true;
}

/**
 * Determines whether the provided transaction input data includes multiple agent signatures.
 *
 * @param data - The transaction input data to evaluate.
 * @param data.secondarySignerAddresses - An array of secondary signer addresses, indicating multiple agents.
 * @group Implementation
 */
function isMultiAgentTransactionInput(
  data: InputGenerateTransactionData,
): data is InputGenerateMultiAgentRawTransactionData {
  return "secondarySignerAddresses" in data;
}

/**
 * Builds a signing message that can be signed by external signers.
 *
 * Note: Please prefer using `signTransaction` unless signing outside the SDK.
 *
 * @param args - The arguments for generating the signing message.
 * @param args.transaction - AnyRawTransaction, as generated by `generateTransaction()`.
 *
 * @returns The message to be signed.
 * @group Implementation
 */
export function getSigningMessage(args: { transaction: AnyRawTransaction }): Uint8Array {
  const { transaction } = args;
  return generateSigningMessageForTransaction(transaction);
}

/**
 * Sign a transaction that can later be submitted to the chain.
 *
 * @param args The arguments for signing the transaction.
 * @param args.signer The signer account to sign the transaction.
 * @param args.transaction An instance of a RawTransaction, plus optional secondary/fee payer addresses.
 *
 * @return The signer AccountAuthenticator.
 * @group Implementation
 */
export function signTransaction(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
  const { signer, transaction } = args;
  return signer.signTransactionWithAuthenticator(transaction);
}

export function signAsFeePayer(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
  const { signer, transaction } = args;

  // if transaction doesn't hold a "feePayerAddress" prop it means
  // this is not a fee payer transaction
  if (!transaction.feePayerAddress) {
    throw new Error(`Transaction ${transaction} is not a Fee Payer transaction`);
  }

  // Set the feePayerAddress to the signer account address
  transaction.feePayerAddress = signer.accountAddress;

  return signTransaction({
    signer,
    transaction,
  });
}

/**
 * Simulates a transaction before signing it to evaluate its potential outcome.
 *
 * @param args The arguments for simulating the transaction.
 * @param args.aptosConfig The configuration for the Aptos network.
 * @param args.transaction The raw transaction to simulate.
 * @param args.signerPublicKey Optional. The signer public key.
 * @param args.secondarySignersPublicKeys Optional. For when the transaction involves multiple signers.
 * @param args.feePayerPublicKey Optional. For when the transaction is sponsored by a fee payer.
 * @param args.options Optional. A configuration object to customize the simulation process.
 * @param args.options.estimateGasUnitPrice Optional. Indicates whether to estimate the gas unit price.
 * @param args.options.estimateMaxGasAmount Optional. Indicates whether to estimate the maximum gas amount.
 * @param args.options.estimatePrioritizedGasUnitPrice Optional. Indicates whether to estimate the prioritized gas unit price.
 * @group Implementation
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
 * Submit a transaction to the Aptos blockchain.
 *
 * @param args - The arguments for submitting the transaction.
 * @param args.aptosConfig - The configuration for connecting to the Aptos network.
 * @param args.transaction - The Aptos transaction data to be submitted.
 * @param args.senderAuthenticator - The account authenticator of the transaction sender.
 * @param args.secondarySignerAuthenticators - Optional. Authenticators for additional signers in a multi-signer transaction.
 *
 * @returns PendingTransactionResponse - The response containing the status of the submitted transaction.
 * @group Implementation
 */
export async function submitTransaction(
  args: {
    aptosConfig: AptosConfig;
  } & InputSubmitTransactionData,
): Promise<PendingTransactionResponse> {
  const { aptosConfig, transactionSubmitter } = args;
  const maybeTransactionSubmitter =
    transactionSubmitter === undefined ? aptosConfig.getTransactionSubmitter() : transactionSubmitter;
  if (maybeTransactionSubmitter) {
    return maybeTransactionSubmitter.submitTransaction(args);
  }
  const signedTransaction = generateSignedTransaction({ ...args });
  try {
    const { data } = await postAptosFullNode<Uint8Array, PendingTransactionResponse>({
      aptosConfig,
      body: signedTransaction,
      path: "transactions",
      originMethod: "submitTransaction",
      contentType: MimeType.BCS_SIGNED_TRANSACTION,
    });
    return data;
  } catch (e) {
    const signedTxn = SignedTransaction.deserialize(new Deserializer(signedTransaction));
    if (
      signedTxn.authenticator.isSingleSender() &&
      signedTxn.authenticator.sender.isSingleKey() &&
      (signedTxn.authenticator.sender.public_key.publicKey instanceof KeylessPublicKey ||
        signedTxn.authenticator.sender.public_key.publicKey instanceof FederatedKeylessPublicKey)
    ) {
      await AbstractKeylessAccount.fetchJWK({
        aptosConfig,
        publicKey: signedTxn.authenticator.sender.public_key.publicKey,
        kid: (signedTxn.authenticator.sender.signature.signature as KeylessSignature).getJwkKid(),
      });
    }
    throw e;
  }
}

export type FeePayerOrFeePayerAuthenticatorOrNeither =
  | { feePayer: Account; feePayerAuthenticator?: never }
  | { feePayer?: never; feePayerAuthenticator: AccountAuthenticator }
  | { feePayer?: never; feePayerAuthenticator?: never };

export async function signAndSubmitTransaction(
  args: FeePayerOrFeePayerAuthenticatorOrNeither & {
    aptosConfig: AptosConfig;
    signer: Account;
    transaction: AnyRawTransaction;
  } & InputTransactionPluginData,
): Promise<PendingTransactionResponse> {
  const { aptosConfig, signer, feePayer, transaction, ...rest } = args;
  // If the signer contains a KeylessAccount, await proof fetching in case the proof
  // was fetched asynchronously.
  if (isKeylessSigner(signer)) {
    await signer.checkKeylessAccountValidity(aptosConfig);
  }
  if (isKeylessSigner(feePayer)) {
    await feePayer.checkKeylessAccountValidity(aptosConfig);
  }
  const feePayerAuthenticator =
    args.feePayerAuthenticator || (feePayer && signAsFeePayer({ signer: feePayer, transaction }));

  const senderAuthenticator = signTransaction({ signer, transaction });
  return submitTransaction({
    aptosConfig,
    transaction,
    senderAuthenticator,
    feePayerAuthenticator,
    ...rest,
  });
}

export async function signAndSubmitAsFeePayer(
  args: {
    aptosConfig: AptosConfig;
    feePayer: Account;
    senderAuthenticator: AccountAuthenticator;
    transaction: AnyRawTransaction;
  } & InputTransactionPluginData,
): Promise<PendingTransactionResponse> {
  const { aptosConfig, senderAuthenticator, feePayer, transaction, ...rest } = args;

  if (isKeylessSigner(feePayer)) {
    await feePayer.checkKeylessAccountValidity(aptosConfig);
  }

  const feePayerAuthenticator = signAsFeePayer({ signer: feePayer, transaction });

  return submitTransaction({
    aptosConfig,
    transaction,
    senderAuthenticator,
    feePayerAuthenticator,
    ...rest,
  });
}

const packagePublishAbi: EntryFunctionABI = {
  typeParameters: [],
  parameters: [TypeTagVector.u8(), new TypeTagVector(TypeTagVector.u8())],
};

/**
 * Publishes a package transaction to the Aptos blockchain.
 * This function allows you to create and send a transaction that publishes a package with the specified metadata and bytecode.
 *
 * @param args - The arguments for the package transaction.
 * @param args.aptosConfig - The configuration settings for the Aptos client.
 * @param args.account - The address of the account sending the transaction.
 * @param args.metadataBytes - The metadata associated with the package, represented as hexadecimal input.
 * @param args.moduleBytecode - An array of module bytecode, each represented as hexadecimal input.
 * @param args.options - Optional parameters for generating the transaction.
 * @group Implementation
 */
export async function publicPackageTransaction(args: {
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
