// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file handles the generation of the signing message.
 * @group Implementation
 * @category Transactions
 */
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { RAW_TRANSACTION_SALT, RAW_TRANSACTION_WITH_DATA_SALT } from "../../utils/const";
import { FeePayerRawTransaction, MultiAgentRawTransaction } from "../instances";
import { AnyRawTransaction, AnyRawTransactionInstance } from "../types";
import { Serializable } from "../../bcs";

/**
 * Derives the appropriate raw transaction type based on the provided transaction details.
 * This function helps in identifying whether the transaction is a FeePayerRawTransaction,
 * MultiAgentRawTransaction, or a standard RawTransaction.
 *
 * @param transaction - An object representing an Aptos transaction, which may include:
 *   - feePayerAddress - The address of the fee payer (optional).
 *   - secondarySignerAddresses - An array of secondary signer addresses (optional).
 *   - rawTransaction - The raw transaction data.
 *
 * @returns FeePayerRawTransaction | MultiAgentRawTransaction | RawTransaction
 * @group Implementation
 * @category Transactions
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

/**
 * Generates the 'signing message' form of a message to be signed.
 * This function combines a domain separator with the byte representation of the message to create a signing message.
 *
 * @param bytes - The byte representation of the message to be signed and sent to the chain.
 * @param domainSeparator - A domain separator that starts with 'APTOS::'.
 *
 * @returns The Uint8Array of the signing message.
 * @group Implementation
 * @category Transactions
 */
export function generateSigningMessage(bytes: Uint8Array, domainSeparator: string): Uint8Array {
  const hash = sha3Hash.create();

  if (!domainSeparator.startsWith("APTOS::")) {
    throw new Error(`Domain separator needs to start with 'APTOS::'.  Provided - ${domainSeparator}`);
  }

  hash.update(domainSeparator);

  const prefix = hash.digest();

  const body = bytes;

  const mergedArray = new Uint8Array(prefix.length + body.length);
  mergedArray.set(prefix);
  mergedArray.set(body, prefix.length);

  return mergedArray;
}

/**
 * @deprecated
 * Use CryptoHashable instead by having your class implement it and call hash() to get the signing message.
 *
 * Generates the 'signing message' form of a serializable value by serializing it and using the constructor name as the domain
 * separator.
 *
 * @param serializable - An object that has a BCS serialized form.
 *
 * @returns The Uint8Array of the signing message.
 * @group Implementation
 * @category Transactions
 */
export function generateSigningMessageForSerializable(serializable: Serializable): Uint8Array {
  return generateSigningMessage(serializable.bcsToBytes(), `APTOS::${serializable.constructor.name}`);
}

/**
 * Generates the 'signing message' form of a transaction by deriving the type of transaction and applying the appropriate domain
 * separator based on the presence of a fee payer or secondary signers.
 *
 * @param transaction - A transaction that is to be signed, which can include a fee payer address or secondary signer addresses.
 *
 * @returns The Uint8Array of the signing message.
 * @group Implementation
 * @category Transactions
 */
export function generateSigningMessageForTransaction(transaction: AnyRawTransaction): Uint8Array {
  const rawTxn = deriveTransactionType(transaction);
  if (transaction.feePayerAddress) {
    return generateSigningMessage(rawTxn.bcsToBytes(), RAW_TRANSACTION_WITH_DATA_SALT);
  }
  if (transaction.secondarySignerAddresses) {
    return generateSigningMessage(rawTxn.bcsToBytes(), RAW_TRANSACTION_WITH_DATA_SALT);
  }
  return generateSigningMessage(rawTxn.bcsToBytes(), RAW_TRANSACTION_SALT);
}
