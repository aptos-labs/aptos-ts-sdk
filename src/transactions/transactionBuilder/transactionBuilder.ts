// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file handles the transaction creation lifecycle.
 * It holds different operations to generate a transaction payload, a raw transaction,
 * and a signed transaction that can be simulated, signed and submitted to chain.
 */
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { AptosConfig } from "../../api/aptosConfig";
import { Deserializer } from "../../bcs/deserializer";
import { AccountAddress, Hex, PublicKey } from "../../core";
import { Account } from "../../core/account";
import { AnyPublicKey } from "../../core/crypto/anyPublicKey";
import { AnySignature } from "../../core/crypto/anySignature";
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
  AccountAuthenticatorMultiKey,
  AccountAuthenticatorSingleKey,
} from "../authenticator/account";
import {
  TransactionAuthenticatorEd25519,
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
  MultisigTransactionPayload,
  RawTransaction,
  Script,
  TransactionPayloadEntryFunction,
  TransactionPayloadMultisig,
  TransactionPayloadScript,
} from "../instances";
import { SignedTransaction } from "../instances/signedTransaction";
import {
  InputGenerateTransactionOptions,
  AnyTransactionPayloadInstance,
  AnyRawTransactionInstance,
  InputGenerateFeePayerRawTransactionArgs,
  InputGenerateMultiAgentRawTransactionArgs,
  InputGenerateRawTransactionArgs,
  InputGenerateSingleSignerRawTransactionArgs,
  InputSingleSignerTransaction,
  AnyRawTransaction,
  InputFeePayerTransaction,
  InputMultiAgentTransaction,
  InputScriptData,
  InputSimulateTransactionData,
  EntryFunctionArgumentTypes,
  EntryFunctionABI,
  InputGenerateTransactionPayloadData,
  InputEntryFunctionData,
  InputMultiSigData,
  InputMultiSigDataWithRemoteABI,
  InputEntryFunctionDataWithRemoteABI,
  InputGenerateTransactionPayloadDataWithRemoteABI,
} from "../types";
import { convertArgument, fetchEntryFunctionAbi, standardizeTypeTags } from "./remoteAbi";
import { memoizeAsync } from "../../utils/memoize";
import { HexInput, SigningScheme } from "../../types";
import { getFunctionParts, isScriptDataInput } from "./helpers";

/**
 * We are defining function signatures, each with its specific input and output.
 * These are the possible function signature for our `generateTransactionPayload` function.
 * When we call our `generateTransactionPayload` function with the relevant type properties,
 * Typescript can infer the return type based on the appropriate function overload.
 */
export async function generateTransactionPayload(
  args: InputScriptData & { aptosConfig?: undefined },
): Promise<TransactionPayloadScript>;
export async function generateTransactionPayload(
  args: InputEntryFunctionDataWithRemoteABI,
): Promise<TransactionPayloadEntryFunction>;
export async function generateTransactionPayload(
  args: InputMultiSigDataWithRemoteABI,
): Promise<TransactionPayloadMultisig>;
export async function generateTransactionPayload(
  args: InputGenerateTransactionPayloadDataWithRemoteABI,
): Promise<AnyTransactionPayloadInstance>;

/**
 * Builds a transaction payload based on the data argument and returns
 * a transaction payload - TransactionPayloadScript | TransactionPayloadMultisig | TransactionPayloadEntryFunction
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

  return generateTransactionPayloadWithABI(args, functionAbi);
}

export function generateTransactionPayloadWithABI(
  args: InputEntryFunctionData,
  functionAbi: EntryFunctionABI,
): TransactionPayloadEntryFunction;
export function generateTransactionPayloadWithABI(
  args: InputMultiSigData,
  functionAbi: EntryFunctionABI,
): TransactionPayloadMultisig;
export function generateTransactionPayloadWithABI(
  args: InputGenerateTransactionPayloadData,
  functionAbi: EntryFunctionABI,
): AnyTransactionPayloadInstance;
export function generateTransactionPayloadWithABI(
  args: InputGenerateTransactionPayloadData,
  functionAbi: EntryFunctionABI,
): AnyTransactionPayloadInstance {
  if (isScriptDataInput(args)) {
    return generateTransactionPayloadScript(args);
  }

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
    let multisigAddress: AccountAddress;
    if (typeof args.multisigAddress === "string") {
      multisigAddress = AccountAddress.fromString(args.multisigAddress);
    } else {
      multisigAddress = args.multisigAddress;
    }
    return new TransactionPayloadMultisig(
      new MultiSig(multisigAddress, new MultisigTransactionPayload(entryFunctionPayload)),
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
  sender: HexInput;
  payload: AnyTransactionPayloadInstance;
  options?: InputGenerateTransactionOptions;
}): Promise<RawTransaction> {
  const { aptosConfig, sender, payload, options } = args;

  const getSequenceNumber = options?.accountSequenceNumber
    ? Promise.resolve({ sequence_number: options.accountSequenceNumber })
    : getInfo({ aptosConfig, accountAddress: sender });

  const getChainId = NetworkToChainId[aptosConfig.network]
    ? Promise.resolve({ chain_id: NetworkToChainId[aptosConfig.network] })
    : getLedgerInfo({ aptosConfig });

  const getGasUnitPrice = options?.gasUnitPrice
    ? Promise.resolve({ gas_estimate: options.gasUnitPrice })
    : getGasPriceEstimation({ aptosConfig });

  const [{ sequence_number: sequenceNumber }, { chain_id: chainId }, { gas_estimate: gasEstimate }] = await Promise.all(
    [getSequenceNumber, getChainId, getGasUnitPrice],
  );

  const { maxGasAmount, gasUnitPrice, expireTimestamp } = {
    maxGasAmount: BigInt(DEFAULT_MAX_GAS_AMOUNT),
    gasUnitPrice: BigInt(gasEstimate),
    expireTimestamp: BigInt(Math.floor(Date.now() / 1000) + DEFAULT_TXN_EXP_SEC_FROM_NOW),
    ...options,
  };

  return new RawTransaction(
    AccountAddress.fromHexInput(sender),
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
export async function buildTransaction(
  args: InputGenerateSingleSignerRawTransactionArgs,
): Promise<InputSingleSignerTransaction>;
export async function buildTransaction(
  args: InputGenerateFeePayerRawTransactionArgs,
): Promise<InputFeePayerTransaction>;
export async function buildTransaction(
  args: InputGenerateMultiAgentRawTransactionArgs,
): Promise<InputMultiAgentTransaction>;
export async function buildTransaction(args: InputGenerateRawTransactionArgs): Promise<AnyRawTransaction>;
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
 * @return An Aptos raw transaction type (note that it holds the raw transaction as a bcs serialized data)
 * ```
 * {
 *  rawTransaction: Uint8Array,
 *  secondarySignerAddresses? : Array<AccountAddress>,
 *  feePayerAddress?: AccountAddress
 * }
 * ```
 */
export async function buildTransaction(args: InputGenerateRawTransactionArgs): Promise<AnyRawTransaction> {
  const { aptosConfig, sender, payload, options, secondarySignerAddresses, feePayerAddress } = args;
  // generate raw transaction
  const rawTxn = await generateRawTransaction({
    aptosConfig,
    sender,
    payload,
    options,
  });

  if (feePayerAddress) {
    const signers: Array<AccountAddress> = secondarySignerAddresses
      ? secondarySignerAddresses.map((signer) => AccountAddress.fromHexInput(signer))
      : [];

    return {
      rawTransaction: rawTxn.bcsToBytes(),
      secondarySignerAddresses: signers,
      feePayerAddress: AccountAddress.fromHexInput(feePayerAddress),
    };
  }

  if (secondarySignerAddresses) {
    const signers: Array<AccountAddress> = secondarySignerAddresses.map((signer) =>
      AccountAddress.fromHexInput(signer),
    );

    return {
      rawTransaction: rawTxn.bcsToBytes(),
      secondarySignerAddresses: signers,
    };
  }
  // return the raw transaction
  return { rawTransaction: rawTxn.bcsToBytes() };
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
  const { signerPublicKey, transaction, secondarySignersPublicKeys, feePayerPublicKey } = args;

  const deserializer = new Deserializer(transaction.rawTransaction);
  const deserializedTransaction = RawTransaction.deserialize(deserializer);

  const accountAuthenticator = getAuthenticatorForSimulation(signerPublicKey);
  // fee payer transaction
  if (transaction.feePayerAddress) {
    const transactionToSign = new FeePayerRawTransaction(
      deserializedTransaction,
      transaction.secondarySignerAddresses ?? [],
      transaction.feePayerAddress,
    );

    let secondaryAccountAuthenticators: Array<AccountAuthenticator> = [];
    if (secondarySignersPublicKeys) {
      secondaryAccountAuthenticators = secondarySignersPublicKeys.map((publicKey) =>
        getAuthenticatorForSimulation(publicKey),
      );
    }

    const feePayerAuthenticator = getAuthenticatorForSimulation(feePayerPublicKey!);

    const transactionAuthenticator = new TransactionAuthenticatorFeePayer(
      accountAuthenticator,
      transaction.secondarySignerAddresses ?? [],
      secondaryAccountAuthenticators,
      {
        address: transaction.feePayerAddress,
        authenticator: feePayerAuthenticator,
      },
    );
    return new SignedTransaction(transactionToSign.raw_txn, transactionAuthenticator).bcsToBytes();
  }

  // multi agent transaction
  if (transaction.secondarySignerAddresses) {
    const transactionToSign = new MultiAgentRawTransaction(
      deserializedTransaction,
      transaction.secondarySignerAddresses,
    );

    let secondaryAccountAuthenticators: Array<AccountAuthenticator> = [];

    secondaryAccountAuthenticators = secondarySignersPublicKeys!.map((publicKey) =>
      getAuthenticatorForSimulation(publicKey),
    );

    const transactionAuthenticator = new TransactionAuthenticatorMultiAgent(
      accountAuthenticator,
      transaction.secondarySignerAddresses,
      secondaryAccountAuthenticators,
    );

    return new SignedTransaction(transactionToSign.raw_txn, transactionAuthenticator).bcsToBytes();
  }

  // raw transaction
  let transactionAuthenticator;
  if (accountAuthenticator instanceof AccountAuthenticatorEd25519) {
    transactionAuthenticator = new TransactionAuthenticatorEd25519(
      accountAuthenticator.public_key,
      accountAuthenticator.signature,
    );
  } else if (accountAuthenticator instanceof AccountAuthenticatorSingleKey) {
    transactionAuthenticator = new TransactionAuthenticatorSingleSender(accountAuthenticator);
  } else {
    throw new Error("Invalid public key");
  }
  return new SignedTransaction(deserializedTransaction, transactionAuthenticator).bcsToBytes();
}

export function getAuthenticatorForSimulation(publicKey: PublicKey) {
  // TODO add support for AnyMultiKey
  if (publicKey instanceof AnyPublicKey) {
    if (publicKey.publicKey instanceof Ed25519PublicKey) {
      return new AccountAuthenticatorSingleKey(publicKey, new AnySignature(new Ed25519Signature(new Uint8Array(64))));
    }
    if (publicKey.publicKey instanceof Secp256k1PublicKey) {
      return new AccountAuthenticatorSingleKey(publicKey, new AnySignature(new Secp256k1Signature(new Uint8Array(64))));
    }
  }

  // legacy code
  // TODO add support to legacy multied25519
  return new AccountAuthenticatorEd25519(
    new Ed25519PublicKey(publicKey.toUint8Array()),
    new Ed25519Signature(new Uint8Array(64)),
  );
}

/**
 * Sign a transaction that can later be submitted to chain
 *
 * @param args.signer The signer account to sign the transaction
 * @param args.transaction A aptos transaction type to sign
 *
 * @return The signer AccountAuthenticator
 */
export function sign(args: { signer: Account; transaction: AnyRawTransaction }): AccountAuthenticator {
  const { signer, transaction } = args;

  const transactionToSign = deriveTransactionType(transaction);

  // get the signing message
  const message = getSigningMessage(transactionToSign);

  // account.signMessage
  const signerSignature = signer.sign(message);

  // return account authentication
  switch (signer.signingScheme) {
    case SigningScheme.Ed25519:
      return new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(signer.publicKey.toUint8Array()),
        new Ed25519Signature(signerSignature.toUint8Array()),
      );
    case SigningScheme.SingleKey:
      return new AccountAuthenticatorSingleKey(signer.publicKey as AnyPublicKey, new AnySignature(signerSignature));
    // TODO support MultiEd25519
    default:
      throw new Error(`Cannot sign transaction, signing scheme ${signer.signingScheme} not supported`);
  }
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
export function generateSignedTransaction(args: {
  transaction: AnyRawTransaction;
  senderAuthenticator: AccountAuthenticator;
  secondarySignerAuthenticators?: {
    feePayerAuthenticator?: AccountAuthenticator;
    additionalSignersAuthenticators?: Array<AccountAuthenticator>;
  };
}): Uint8Array {
  const { transaction, senderAuthenticator, secondarySignerAuthenticators } = args;

  const transactionToSubmit = deriveTransactionType(transaction);

  if (secondarySignerAuthenticators) {
    return generateMultiSignersSignedTransaction(
      transactionToSubmit as MultiAgentRawTransaction | FeePayerRawTransaction,
      senderAuthenticator,
      secondarySignerAuthenticators,
    );
  }

  // submit single signer transaction

  // check what instance is accountAuthenticator
  if (senderAuthenticator instanceof AccountAuthenticatorEd25519) {
    const transactionAuthenticator = new TransactionAuthenticatorEd25519(
      senderAuthenticator.public_key,
      senderAuthenticator.signature,
    );
    return new SignedTransaction(transactionToSubmit as RawTransaction, transactionAuthenticator).bcsToBytes();
  }

  if (
    senderAuthenticator instanceof AccountAuthenticatorSingleKey ||
    senderAuthenticator instanceof AccountAuthenticatorMultiKey
  ) {
    const transactionAuthenticator = new TransactionAuthenticatorSingleSender(senderAuthenticator);
    return new SignedTransaction(transactionToSubmit as RawTransaction, transactionAuthenticator).bcsToBytes();
  }

  throw new Error(
    `Cannot generate a signed transaction, ${senderAuthenticator} is not a supported account authentication scheme`,
  );
}

/**
 * Derive the raw transaction type - FeePayerRawTransaction or MultiAgentRawTransaction or RawTransaction
 *
 * @param transaction A aptos transaction type
 *
 * @returns FeePayerRawTransaction | MultiAgentRawTransaction | RawTransaction
 */
export function deriveTransactionType(transaction: AnyRawTransaction): AnyRawTransactionInstance {
  const deserializer = new Deserializer(transaction.rawTransaction);
  const deserializedTransaction = RawTransaction.deserialize(deserializer);

  if (transaction.feePayerAddress) {
    return new FeePayerRawTransaction(
      deserializedTransaction,
      transaction.secondarySignerAddresses ?? [],
      transaction.feePayerAddress,
    );
  }
  if (transaction.secondarySignerAddresses) {
    return new MultiAgentRawTransaction(deserializedTransaction, transaction.secondarySignerAddresses);
  }

  return deserializedTransaction as RawTransaction;
}

/**
 * Generate a multi signers signed transaction that can be submitted to chain
 *
 * @param transaction MultiAgentRawTransaction | FeePayerRawTransaction
 * @param senderAuthenticator The account authenticator of the transaction sender
 * @param secondarySignerAuthenticators The extra signers account Authenticators
 *
 * @returns A SignedTransaction
 */
export function generateMultiSignersSignedTransaction(
  transaction: MultiAgentRawTransaction | FeePayerRawTransaction,
  senderAuthenticator: AccountAuthenticator,
  secondarySignerAuthenticators: {
    feePayerAuthenticator?: AccountAuthenticator;
    additionalSignersAuthenticators?: Array<AccountAuthenticator>;
  },
) {
  if (transaction instanceof FeePayerRawTransaction) {
    if (!secondarySignerAuthenticators.feePayerAuthenticator) {
      throw new Error("Must provide a feePayerAuthenticator argument to generate a signed fee payer transaction");
    }
    const { feePayerAuthenticator, additionalSignersAuthenticators } = secondarySignerAuthenticators;
    const txAuthenticatorFeePayer = new TransactionAuthenticatorFeePayer(
      senderAuthenticator,
      transaction.secondary_signer_addresses,
      additionalSignersAuthenticators ?? [],
      {
        address: transaction.fee_payer_address,
        authenticator: feePayerAuthenticator,
      },
    );
    return new SignedTransaction(transaction.raw_txn, txAuthenticatorFeePayer).bcsToBytes();
  }
  if (transaction instanceof MultiAgentRawTransaction) {
    if (!secondarySignerAuthenticators.additionalSignersAuthenticators) {
      throw new Error(
        "Must provide a additionalSignersAuthenticators argument to generate a signed multi agent transaction",
      );
    }
    const { additionalSignersAuthenticators } = secondarySignerAuthenticators;
    const multiAgentAuthenticator = new TransactionAuthenticatorMultiAgent(
      senderAuthenticator,
      transaction.secondary_signer_addresses,
      additionalSignersAuthenticators ?? [],
    );
    return new SignedTransaction(transaction.raw_txn, multiAgentAuthenticator).bcsToBytes();
  }

  throw new Error(
    `Cannot prepare multi signers transaction to submission, ${typeof transaction} transaction is not supported`,
  );
}

export function getSigningMessage(rawTxn: AnyRawTransactionInstance): Uint8Array {
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
