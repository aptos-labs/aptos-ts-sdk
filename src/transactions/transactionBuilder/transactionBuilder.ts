// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file handles the transaction creation lifecycle.
 * It holds different operations to generate a transaction payload, a raw transaction,
 * and a signed transaction that can be simulated, signed and submitted to chain.
 */
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { AptosConfig } from "../../api/aptosConfig";
import {
  AccountAddress,
  AccountAddressInput,
  AnyPublicKey,
  AnySignature,
  Hex,
  Signer,
  MultiEd25519PublicKey,
  MultiKey,
  PublicKeyInput,
} from "../../core";
import { Ed25519PublicKey, Ed25519Signature } from "../../core/crypto/ed25519";
import { Secp256k1PublicKey, Secp256k1Signature } from "../../core/crypto/secp256k1";
import { getInfo } from "../../internal/account";
import { getLedgerInfo } from "../../internal/general";
import { getGasPriceEstimation } from "../../internal/transaction";
import { NetworkToChainId } from "../../utils/apiEndpoints";
import {
  DEFAULT_MAX_GAS_AMOUNT,
  DEFAULT_TXN_EXP_SEC_FROM_NOW,
  RAW_TRANSACTION_SALT,
  RAW_TRANSACTION_WITH_DATA_SALT,
} from "../../utils/const";
import {
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  AccountAuthenticatorMultiEd25519,
  AccountAuthenticatorMultiKey,
  AccountAuthenticatorSingleKey,
} from "../authenticator/account";
import {
  TransactionAuthenticator,
  TransactionAuthenticatorFeePayer,
  TransactionAuthenticatorMultiAgent,
  TransactionAuthenticatorSingleSender,
} from "../authenticator/transaction";
import {
  ChainId,
  EntryFunction,
  FeePayerRawTransaction,
  MultiAgentRawTransaction,
  MultiSig,
  MultiSigTransactionPayload,
  RawTransaction,
  Script,
  TransactionPayloadEntryFunction,
  TransactionPayloadMultiSig,
  TransactionPayloadScript,
} from "../instances";
import { SignedTransaction } from "../instances/signedTransaction";
import {
  AnyRawTransaction,
  AnyTransactionPayloadInstance,
  AnyRawTransactionInstance,
  EntryFunctionArgumentTypes,
  InputGenerateMultiAgentRawTransactionArgs,
  InputGenerateRawTransactionArgs,
  InputGenerateSingleSignerRawTransactionArgs,
  SimpleTransaction,
  InputGenerateTransactionOptions,
  MultiAgentTransaction,
  InputScriptData,
  InputSimulateTransactionData,
  InputMultiSigDataWithRemoteABI,
  InputEntryFunctionDataWithRemoteABI,
  InputGenerateTransactionPayloadDataWithRemoteABI,
  InputSubmitTransactionData,
  InputGenerateTransactionPayloadDataWithABI,
  InputEntryFunctionDataWithABI,
  InputMultiSigDataWithABI,
} from "../types";
import { convertArgument, fetchEntryFunctionAbi, standardizeTypeTags } from "./remoteAbi";
import { memoizeAsync } from "../../utils/memoize";
import { AnyNumber } from "../../types";
import { getFunctionParts, isScriptDataInput } from "./helpers";

/**
 * We are defining function signatures, each with its specific input and output.
 * These are the possible function signature for our `generateTransactionPayload` function.
 * When we call our `generateTransactionPayload` function with the relevant type properties,
 * Typescript can infer the return type based on the appropriate function overload.
 */
export async function generateTransactionPayload(args: InputScriptData): Promise<TransactionPayloadScript>;
export async function generateTransactionPayload(
  args: InputEntryFunctionDataWithRemoteABI,
): Promise<TransactionPayloadEntryFunction>;
export async function generateTransactionPayload(
  args: InputMultiSigDataWithRemoteABI,
): Promise<TransactionPayloadMultiSig>;

/**
 * Builds a transaction payload based on the data argument and returns
 * a transaction payload - TransactionPayloadScript | TransactionPayloadMultiSig | TransactionPayloadEntryFunction
 *
 * This uses the RemoteABI by default, and the remote ABI can be skipped by using generateTransactionPayloadWithABI
 *
 * @param args.data GenerateTransactionPayloadData
 *
 * @return TransactionPayload
 */
export async function generateTransactionPayload(
  args: InputGenerateTransactionPayloadDataWithRemoteABI,
): Promise<AnyTransactionPayloadInstance> {
  if (isScriptDataInput(args)) {
    return generateTransactionPayloadScript(args);
  }

  const { moduleAddress, moduleName, functionName } = getFunctionParts(args.function);

  // We fetch the entry function ABI, and then pretend that we already had the ABI
  const functionAbi = await memoizeAsync(
    async () => fetchEntryFunctionAbi(moduleAddress, moduleName, functionName, args.aptosConfig),
    `entry-function-${args.aptosConfig.network}-${moduleAddress}-${moduleName}-${functionName}`,
    1000 * 60 * 5, // 5 minutes
  )();

  // Fill in the ABI
  return generateTransactionPayloadWithABI({ abi: functionAbi, ...args });
}

export function generateTransactionPayloadWithABI(args: InputEntryFunctionDataWithABI): TransactionPayloadEntryFunction;
export function generateTransactionPayloadWithABI(args: InputMultiSigDataWithABI): TransactionPayloadMultiSig;
export function generateTransactionPayloadWithABI(
  args: InputGenerateTransactionPayloadDataWithABI,
): AnyTransactionPayloadInstance {
  const functionAbi = args.abi;
  const { moduleAddress, moduleName, functionName } = getFunctionParts(args.function);

  // Ensure that all type arguments are typed properly
  const typeArguments = standardizeTypeTags(args.typeArguments);

  // Check the type argument count against the ABI
  if (typeArguments.length !== functionAbi.typeParameters.length) {
    throw new Error(
      `Type argument count mismatch, expected ${functionAbi.typeParameters.length}, received ${typeArguments.length}`,
    );
  }

  // Check all BCS types, and convert any non-BCS types
  const functionArguments: Array<EntryFunctionArgumentTypes> = args.functionArguments.map((arg, i) =>
    convertArgument(args.function, functionAbi, arg, i, typeArguments),
  );

  // Check that all arguments are accounted for
  if (functionArguments.length !== functionAbi.parameters.length) {
    throw new Error(
      // eslint-disable-next-line max-len
      `Too few arguments for '${moduleAddress}::${moduleName}::${functionName}', expected ${functionAbi.parameters.length} but got ${functionArguments.length}`,
    );
  }

  // Generate entry function payload
  const entryFunctionPayload = EntryFunction.build(
    `${moduleAddress}::${moduleName}`,
    functionName,
    typeArguments,
    functionArguments,
  );

  // Send it as multi sig if it's a multisig payload
  if ("multisigAddress" in args) {
    const multisigAddress = AccountAddress.from(args.multisigAddress);
    return new TransactionPayloadMultiSig(
      new MultiSig(multisigAddress, new MultiSigTransactionPayload(entryFunctionPayload)),
    );
  }

  // Otherwise send as an entry function
  return new TransactionPayloadEntryFunction(entryFunctionPayload);
}

function generateTransactionPayloadScript(args: InputScriptData) {
  return new TransactionPayloadScript(
    new Script(Hex.fromHexInput(args.bytecode).toUint8Array(), args.typeArguments ?? [], args.functionArguments),
  );
}

/**
 * Generates a raw transaction
 *
 * @param args.aptosConfig AptosConfig
 * @param args.sender The transaction's sender account address as a hex input
 * @param args.payload The transaction payload - can create by using generateTransactionPayload()
 *
 * @returns RawTransaction
 */
export async function generateRawTransaction(args: {
  aptosConfig: AptosConfig;
  sender: AccountAddressInput;
  payload: AnyTransactionPayloadInstance;
  options?: InputGenerateTransactionOptions;
  feePayerAddress?: AccountAddressInput;
}): Promise<RawTransaction> {
  const { aptosConfig, sender, payload, options, feePayerAddress } = args;

  const getChainId = NetworkToChainId[aptosConfig.network]
    ? Promise.resolve({ chain_id: NetworkToChainId[aptosConfig.network] })
    : getLedgerInfo({ aptosConfig });

  const getGasUnitPrice = options?.gasUnitPrice
    ? Promise.resolve({ gas_estimate: options.gasUnitPrice })
    : getGasPriceEstimation({ aptosConfig });

  const [{ chain_id: chainId }, { gas_estimate: gasEstimate }] = await Promise.all([getChainId, getGasUnitPrice]);

  const getSequenceNumber =
    options?.accountSequenceNumber !== undefined
      ? Promise.resolve({ sequence_number: options.accountSequenceNumber })
      : getInfo({ aptosConfig, accountAddress: sender });

  let sequenceNumber: string | AnyNumber;

  /**
   * Check if is sponsored transaction to honor AIP-52
   * {@link https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-52.md}
   */
  if (feePayerAddress && AccountAddress.from(feePayerAddress).equals(AccountAddress.ZERO)) {
    // Handle sponsored transaction generation with the option that
    // the main signer has not been created on chain
    try {
      // Check if main signer has been created on chain, if not assign sequence number 0
      const { sequence_number: seqNumber } = await getSequenceNumber;
      sequenceNumber = seqNumber;
    } catch (e: any) {
      sequenceNumber = "0";
    }
  } else {
    const { sequence_number: seqNumber } = await getSequenceNumber;
    sequenceNumber = seqNumber;
  }

  const { maxGasAmount, gasUnitPrice, expireTimestamp } = {
    maxGasAmount: options?.maxGasAmount ? BigInt(options.maxGasAmount) : BigInt(DEFAULT_MAX_GAS_AMOUNT),
    gasUnitPrice: BigInt(gasEstimate),
    expireTimestamp: BigInt(Math.floor(Date.now() / 1000) + DEFAULT_TXN_EXP_SEC_FROM_NOW),
    ...options,
  };

  return new RawTransaction(
    AccountAddress.from(sender),
    BigInt(sequenceNumber),
    payload,
    BigInt(maxGasAmount),
    BigInt(gasUnitPrice),
    BigInt(expireTimestamp),
    new ChainId(chainId),
  );
}

/**
 * We are defining function signatures, each with its specific input and output.
 * These are the possible function signature for our `generateTransaction` function.
 * When we call our `generateTransaction` function with the relevant type properties,
 * Typescript can infer the return type based on the appropriate function overload.
 */
export async function buildTransaction(args: InputGenerateSingleSignerRawTransactionArgs): Promise<SimpleTransaction>;
export async function buildTransaction(args: InputGenerateMultiAgentRawTransactionArgs): Promise<MultiAgentTransaction>;

/**
 * Generates a transaction based on the provided arguments
 *
 * Note: we can start with one function to support all different payload/transaction types,
 * and if to complex to use, we could have function for each type
 *
 * @param args.aptosConfig AptosConfig
 * @param args.sender The transaction's sender account address as a hex input
 * @param args.payload The transaction payload - can create by using generateTransactionPayload()
 * @param args.options optional. Transaction options object
 * @param args.secondarySignerAddresses optional. For when want to create a multi signers transaction
 * @param args.feePayerAddress optional. For when want to create a fee payer (aka sponsored) transaction
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
export async function buildTransaction(args: InputGenerateRawTransactionArgs): Promise<AnyRawTransaction> {
  const { aptosConfig, sender, payload, options } = args;
  const feePayerAddress = args.feePayerAddress ? AccountAddress.from(args.feePayerAddress) : undefined;

  // generate raw transaction
  const rawTxn = await generateRawTransaction({
    aptosConfig,
    sender,
    payload,
    options,
    feePayerAddress,
  });

  const secondarySignerAddresses =
    "secondarySignerAddresses" in args
      ? args.secondarySignerAddresses.map((address) => AccountAddress.from(address))
      : undefined;

  return {
    rawTransaction: rawTxn,
    secondarySignerAddresses,
    feePayerAddress,
  };
}

/**
 * Simulate a transaction before signing and submit to chain
 *
 * @param args.transaction A aptos transaction type to sign
 * @param args.signerPublicKey The signer public key
 * @param args.secondarySignersPublicKeys optional. The secondary signers public keys if multi signers transaction
 * @param args.feePayerPublicKey optional. The fee payer public key is a fee payer (aka sponsored) transaction
 * @param args.options optional. SimulateTransactionOptions
 *
 * @returns A signed serialized transaction that can be simulated
 */
export function generateSignedTransactionForSimulation(args: InputSimulateTransactionData): Uint8Array {
  const { transaction, signerPublicKey } = args;

  const signerAuthenticator = getAuthenticatorForSimulation(signerPublicKey);

  let transactionAuthenticator: TransactionAuthenticator;
  if (transaction.feePayerAddress) {
    if (!args.feePayerPublicKey) {
      throw new Error("Missing fee payer public key");
    }
    const secondarySignersAddresses = transaction.secondarySignerAddresses ?? [];
    const secondarySignersPublicKeys = args.secondarySignersPublicKeys ?? [];
    const secondarySignersAuthenticators = secondarySignersPublicKeys.map((pk) => getAuthenticatorForSimulation(pk));
    const feePayerAuthenticator = getAuthenticatorForSimulation(args.feePayerPublicKey);

    transactionAuthenticator = new TransactionAuthenticatorFeePayer(
      signerAuthenticator,
      secondarySignersAddresses,
      secondarySignersAuthenticators,
      {
        address: transaction.feePayerAddress,
        authenticator: feePayerAuthenticator,
      },
    );
  } else if (transaction.secondarySignerAddresses) {
    const secondarySignersAddresses = transaction.secondarySignerAddresses;
    const secondarySignersPublicKeys = args.secondarySignersPublicKeys ?? [];
    const secondarySignersAuthenticators = secondarySignersPublicKeys.map((pk) => getAuthenticatorForSimulation(pk));
    transactionAuthenticator = new TransactionAuthenticatorMultiAgent(
      signerAuthenticator,
      secondarySignersAddresses,
      secondarySignersAuthenticators,
    );
  } else {
    transactionAuthenticator = new TransactionAuthenticatorSingleSender(signerAuthenticator);
  }

  return new SignedTransaction(transaction.rawTransaction, transactionAuthenticator).bcsToBytes();
}

export function getEmptySignature(publicKey: AnyPublicKey) {
  if (publicKey.publicKey instanceof Ed25519PublicKey) {
    AnySignature.fromSignature(new Ed25519Signature(new Uint8Array(64)));
  }
  if (publicKey.publicKey instanceof Secp256k1PublicKey) {
    return AnySignature.fromSignature(new Secp256k1Signature(new Uint8Array(64)));
  }
  throw new Error("Unexpected public key type");
}

export function getAuthenticatorForSimulation(publicKey: PublicKeyInput) {
  if (publicKey instanceof Ed25519PublicKey) {
    // legacy code
    return new AccountAuthenticatorEd25519(publicKey, new Ed25519Signature(new Uint8Array(64)));
  }

  if (publicKey instanceof MultiEd25519PublicKey) {
    const signersAuthenticators = publicKey.publicKeys.map(
      (pk) => new AccountAuthenticatorEd25519(pk, new Ed25519Signature(new Uint8Array(64))),
    );
    return new AccountAuthenticatorMultiEd25519(publicKey, signersAuthenticators);
  }

  if (publicKey instanceof AnyPublicKey) {
    const signature = getEmptySignature(publicKey);
    return new AccountAuthenticatorSingleKey(publicKey, signature);
  }

  if (publicKey instanceof MultiKey) {
    const signersAuthenticators = publicKey.publicKeys.map(
      (pk) => new AccountAuthenticatorSingleKey(pk, getEmptySignature(pk)),
    );
    return new AccountAuthenticatorMultiKey(publicKey, signersAuthenticators);
  }

  throw new Error("Unsupported account type");
}

/**
 * Sign a transaction that can later be submitted to chain
 *
 * @param args.signer The signer account to sign the transaction
 * @param args.transaction A aptos transaction type to sign
 *
 * @return The signer AccountAuthenticator
 */
export function sign(args: { signer: Signer; transaction: AnyRawTransaction }): AccountAuthenticator {
  const { signer, transaction } = args;
  const message = generateSigningMessage(transaction);
  return signer.sign(message);
}

/**
 * Prepare a transaction to be submitted to chain
 *
 * @param args.transaction A aptos transaction type
 * @param args.senderAuthenticator The account authenticator of the transaction sender
 * @param args.secondarySignerAuthenticators optional. For when the transaction is a multi signers transaction
 *
 * @returns A SignedTransaction
 */
export function generateSignedTransaction(args: InputSubmitTransactionData): Uint8Array {
  const { transaction, senderAuthenticator, feePayerAuthenticator } = args;
  const secondarySignersAddresses = transaction.secondarySignerAddresses ?? [];
  const secondarySignersAuthenticators = args.additionalSignersAuthenticators ?? [];

  if (transaction.feePayerAddress && !feePayerAuthenticator) {
    throw new Error("Missing fee payer authenticator");
  }

  if (secondarySignersAddresses.length !== secondarySignersAuthenticators.length) {
    throw new Error("Mismatched number of secondary signers authenticators");
  }

  let txnAuthenticator: TransactionAuthenticator;
  if (feePayerAuthenticator) {
    if (!transaction.feePayerAddress) {
      throw new Error("Unexpected fee payer authenticator");
    }

    txnAuthenticator = new TransactionAuthenticatorFeePayer(
      senderAuthenticator,
      secondarySignersAddresses,
      secondarySignersAuthenticators,
      {
        address: transaction.feePayerAddress,
        authenticator: feePayerAuthenticator,
      },
    );
  } else if (secondarySignersAuthenticators.length > 0) {
    txnAuthenticator = new TransactionAuthenticatorMultiAgent(
      senderAuthenticator,
      secondarySignersAddresses,
      secondarySignersAuthenticators,
    );
  } else {
    txnAuthenticator = new TransactionAuthenticatorSingleSender(senderAuthenticator);
  }

  return new SignedTransaction(args.transaction.rawTransaction, txnAuthenticator).bcsToBytes();
}

/**
 * Derive the raw transaction type - FeePayerRawTransaction or MultiAgentRawTransaction or RawTransaction
 *
 * @param transaction A aptos transaction type
 *
 * @returns FeePayerRawTransaction | MultiAgentRawTransaction | RawTransaction
 */
export function deriveTransactionType(transaction: AnyRawTransaction): AnyRawTransactionInstance {
  if (transaction.feePayerAddress) {
    return new FeePayerRawTransaction(
      transaction.rawTransaction,
      transaction.secondarySignerAddresses ?? [],
      transaction.feePayerAddress,
    );
  }
  if (transaction.secondarySignerAddresses) {
    return new MultiAgentRawTransaction(transaction.rawTransaction, transaction.secondarySignerAddresses);
  }

  return transaction.rawTransaction;
}

export function generateSigningMessage(transaction: AnyRawTransaction): Uint8Array {
  const rawTxn = deriveTransactionType(transaction);
  const hash = sha3Hash.create();

  if (rawTxn instanceof RawTransaction) {
    hash.update(RAW_TRANSACTION_SALT);
  } else if (rawTxn instanceof MultiAgentRawTransaction) {
    hash.update(RAW_TRANSACTION_WITH_DATA_SALT);
  } else if (rawTxn instanceof FeePayerRawTransaction) {
    hash.update(RAW_TRANSACTION_WITH_DATA_SALT);
  } else {
    throw new Error(`Unknown transaction type to sign on: ${rawTxn}`);
  }

  const prefix = hash.digest();

  const body = rawTxn.bcsToBytes();

  const mergedArray = new Uint8Array(prefix.length + body.length);
  mergedArray.set(prefix);
  mergedArray.set(body, prefix.length);

  return mergedArray;
}
