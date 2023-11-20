/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/transaction_submission}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * transaction_submission namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { MoveVector, U8 } from "../bcs";
import { postAptosFullNode } from "../client";
import { LegacyEd25519Signer, Signer } from "../core";
import { AccountAddress, AccountAddressInput } from "../core/accountAddress";
import { PrivateKey } from "../core/crypto";
import { AccountAuthenticator } from "../transactions/authenticator/account";
import { RotationProofChallenge } from "../transactions/instances/rotationProofChallenge";
import {
  buildTransaction,
  generateSignedTransaction,
  generateSignedTransactionForSimulation,
  generateTransactionPayload,
  sign,
} from "../transactions/transactionBuilder/transactionBuilder";
import {
  AnyRawTransaction,
  AnyTransactionPayloadInstance,
  InputGenerateMultiAgentRawTransactionData,
  InputGenerateSingleSignerRawTransactionData,
  InputGenerateTransactionData,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadDataWithRemoteABI,
  InputSimulateTransactionData,
  InputSubmitTransactionData,
  MultiAgentTransaction,
  SingleSignerTransaction,
} from "../transactions/types";
import {
  HexInput,
  MimeType,
  PendingTransactionResponse,
  SigningScheme,
  TransactionResponse,
  UserTransactionResponse,
} from "../types";
import { getInfo } from "./account";

/**
 * We are defining function signatures, each with its specific input and output.
 * These are the possible function signature for `generateTransaction` function.
 * When we call `generateTransaction` function with the relevant type properties,
 * Typescript can infer the return type based on the appropriate function overload.
 */
export async function generateTransaction(
  args: { aptosConfig: AptosConfig } & InputGenerateSingleSignerRawTransactionData,
): Promise<SingleSignerTransaction>;
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
export async function generateTransaction(
  args: { aptosConfig: AptosConfig } & InputGenerateTransactionData,
): Promise<AnyRawTransaction> {
  const { aptosConfig, sender, data, options } = args;

  // Merge in aptosConfig for remote ABI on non-script payloads
  let generateTransactionPayloadData: InputGenerateTransactionPayloadDataWithRemoteABI;
  let payload: AnyTransactionPayloadInstance;
  if ("bytecode" in data) {
    generateTransactionPayloadData = data;
    payload = await generateTransactionPayload(generateTransactionPayloadData);
  } else if ("multisigAddress" in data) {
    generateTransactionPayloadData = {
      aptosConfig,
      multisigAddress: data.multisigAddress,
      function: data.function,
      functionArguments: data.functionArguments,
      typeArguments: data.typeArguments,
    };
    payload = await generateTransactionPayload(generateTransactionPayloadData);
  } else {
    generateTransactionPayloadData = {
      aptosConfig,
      function: data.function,
      functionArguments: data.functionArguments,
      typeArguments: data.typeArguments,
    };
    payload = await generateTransactionPayload(generateTransactionPayloadData);
  }

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
export function signTransaction(args: {
  signer: Signer | LegacyEd25519Signer;
  transaction: AnyRawTransaction;
}): AccountAuthenticator {
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
export async function submitTransaction(
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

export async function signAndSubmitTransaction(args: {
  aptosConfig: AptosConfig;
  signer: Signer | LegacyEd25519Signer;
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
  account: AccountAddressInput;
  metadataBytes: HexInput;
  moduleBytecode: Array<HexInput>;
  options?: InputGenerateTransactionOptions;
}): Promise<SingleSignerTransaction> {
  const { aptosConfig, account, metadataBytes, moduleBytecode, options } = args;

  const totalByteCode = moduleBytecode.map((bytecode) => MoveVector.U8(bytecode));

  const transaction = await generateTransaction({
    aptosConfig,
    sender: AccountAddress.fromRelaxed(account),
    data: {
      function: "0x1::code::publish_package_txn",
      functionArguments: [MoveVector.U8(metadataBytes), new MoveVector(totalByteCode)],
    },
    options,
  });
  return transaction as SingleSignerTransaction;
}

/**
 * TODO: Need to refactor and move this function out of transactionSubmission
 */
export async function rotateAuthKey(args: {
  aptosConfig: AptosConfig;
  fromSigner: Signer | LegacyEd25519Signer;
  toNewPrivateKey: PrivateKey;
}): Promise<TransactionResponse> {
  const { aptosConfig, fromSigner, toNewPrivateKey } = args;
  const accountInfo = await getInfo({
    aptosConfig,
    accountAddress: fromSigner.accountAddress.toString(),
  });

  const newSigner = new Signer({ privateKey: toNewPrivateKey });

  const challenge = new RotationProofChallenge({
    sequenceNumber: BigInt(accountInfo.sequence_number),
    originator: fromSigner.accountAddress,
    currentAuthKey: AccountAddress.from(accountInfo.authentication_key),
    newPublicKey: newSigner.publicKey,
  });

  // Sign the challenge
  const challengeHex = challenge.bcsToBytes();
  const proofSignedByCurrentPrivateKey = fromSigner.sign(challengeHex);
  const proofSignedByNewPrivateKey = newSigner.sign(challengeHex);

  const fromSigningScheme = fromSigner instanceof Signer ? SigningScheme.SingleKey : SigningScheme.Ed25519;
  const toSigningScheme = newSigner instanceof Signer ? SigningScheme.SingleKey : SigningScheme.Ed25519;

  // Generate transaction
  const rawTxn = await generateTransaction({
    aptosConfig,
    sender: fromSigner.accountAddress.toString(),
    data: {
      function: "0x1::account::rotate_authentication_key",
      functionArguments: [
        new U8(fromSigningScheme), // from scheme
        MoveVector.U8(fromSigner.publicKey.toUint8Array()),
        new U8(toSigningScheme), // to scheme
        MoveVector.U8(newSigner.publicKey.toUint8Array()),
        MoveVector.U8(proofSignedByCurrentPrivateKey.toUint8Array()),
        MoveVector.U8(proofSignedByNewPrivateKey.toUint8Array()),
      ],
    },
  });
  const pendingTxn = await signAndSubmitTransaction({
    aptosConfig,
    signer: fromSigner,
    transaction: rawTxn,
  });
  return pendingTxn;
}
