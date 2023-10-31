/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/transaction_submission}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * transaction_submission namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { MoveVector } from "../bcs";
import { postAptosFullNode } from "../client";
import { Account } from "../core/account";
import { AccountAuthenticator } from "../transactions/authenticator/account";
import {
  buildTransaction,
  generateTransactionPayload,
  generateSignedTransactionForSimulation,
  generateSignedTransaction,
  sign,
} from "../transactions/transactionBuilder/transactionBuilder";
import {
  InputGenerateTransactionData,
  AnyRawTransaction,
  InputSimulateTransactionData,
  InputGenerateTransactionOptions,
  InputSingleSignerTransaction,
  InputGenerateTransactionPayloadDataWithRemoteABI,
} from "../transactions/types";
import { UserTransactionResponse, PendingTransactionResponse, MimeType, HexInput } from "../types";

/**
 * Generates any transaction by passing in the required arguments
 *
 * @param args.sender The transaction sender's account address as a HexInput
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
 * @return A raw transaction type (note that it holds the raw transaction as a bcs serialized data)
 * ```
 * {
 *  rawTransaction: Uint8Array,
 *  secondarySignerAddresses? : Array<AccountAddress>,
 *  feePayerAddress?: AccountAddress
 * }
 * ```
 */
export async function generateTransaction(
  args: { aptosConfig: AptosConfig } & InputGenerateTransactionData,
): Promise<AnyRawTransaction> {
  const { aptosConfig, sender, data, options, secondarySignerAddresses, feePayerAddress } = args;

  // Merge in aptosConfig for remote ABI on non-script payloads
  let generateTransactionPayloadData: InputGenerateTransactionPayloadDataWithRemoteABI;
  if ("bytecode" in data) {
    generateTransactionPayloadData = data;
  } else if ("multisigAddress" in data) {
    generateTransactionPayloadData = {
      aptosConfig,
      multisigAddress: data.multisigAddress,
      function: data.function,
      functionArguments: data.functionArguments,
      typeArguments: data.typeArguments,
    };
  } else {
    generateTransactionPayloadData = {
      aptosConfig,
      function: data.function,
      functionArguments: data.functionArguments,
      typeArguments: data.typeArguments,
    };
  }
  const payload = await generateTransactionPayload(generateTransactionPayloadData);
  return buildTransaction({
    aptosConfig,
    sender,
    payload,
    options,
    secondarySignerAddresses,
    feePayerAddress,
  });
}

/**
 * Sign a transaction that can later be submitted to chain
 *
 * @param args.signer The signer account to sign the transaction
 * @param args.transaction A raw transaction type (note that it holds the raw transaction as a bcs serialized data)
 * ```
 * {
 *  rawTransaction: Uint8Array,
 *  secondarySignerAddresses? : Array<AccountAddress>,
 *  feePayerAddress?: AccountAddress
 * }
 * ```
 *
 * @return The signer AccountAuthenticator
 */
export function signTransaction(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
  const accountAuthenticator = sign({ ...args });
  return accountAuthenticator;
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
export async function submitTransaction(args: {
  aptosConfig: AptosConfig;
  transaction: AnyRawTransaction;
  senderAuthenticator: AccountAuthenticator;
  secondarySignerAuthenticators?: {
    feePayerAuthenticator?: AccountAuthenticator;
    additionalSignersAuthenticators?: Array<AccountAuthenticator>;
  };
}): Promise<PendingTransactionResponse> {
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

export async function signAndSubmitTransaction(args: {
  aptosConfig: AptosConfig;
  signer: Account;
  transaction: AnyRawTransaction;
}): Promise<PendingTransactionResponse> {
  const { aptosConfig, signer, transaction } = args;
  const authenticator = signTransaction({ signer, transaction });
  return submitTransaction({
    aptosConfig,
    transaction,
    senderAuthenticator: authenticator,
  });
}

export async function publicPackageTransaction(args: {
  aptosConfig: AptosConfig;
  account: HexInput;
  metadataBytes: HexInput;
  moduleBytecode: Array<HexInput>;
  options?: InputGenerateTransactionOptions;
}): Promise<InputSingleSignerTransaction> {
  const { aptosConfig, account, metadataBytes, moduleBytecode, options } = args;

  const totalByteCode = moduleBytecode.map((bytecode) => MoveVector.U8(bytecode));

  const transaction = await generateTransaction({
    aptosConfig,
    sender: account,
    data: {
      function: "0x1::code::publish_package_txn",
      functionArguments: [MoveVector.U8(metadataBytes), new MoveVector(totalByteCode)],
    },
    options,
  });
  return transaction as InputSingleSignerTransaction;
}
