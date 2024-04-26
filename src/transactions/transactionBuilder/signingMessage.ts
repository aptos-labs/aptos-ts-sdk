// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file handles the transaction creation lifecycle.
 * It holds different operations to generate a transaction payload, a raw transaction,
 * and a signed transaction that can be simulated, signed and submitted to chain.
 */
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { RAW_TRANSACTION_SALT, RAW_TRANSACTION_WITH_DATA_SALT } from "../../utils/const";
import { FeePayerRawTransaction, MultiAgentRawTransaction, RawTransaction } from "../instances";
import { AnyRawTransaction, AnyRawTransactionInstance } from "../types";
import { Serializable } from "../../bcs";

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

export function generateSigningMessageForSerializable(obj: Serializable): Uint8Array {
  return generateSigningMessage(obj.bcsToBytes(), obj.constructor.name);
}

export function generateSigningMessageForTransaction(transaction: AnyRawTransaction): Uint8Array {
  const rawTxn = deriveTransactionType(transaction);
  if (rawTxn instanceof RawTransaction) {
    return generateSigningMessage(rawTxn.bcsToBytes(), RAW_TRANSACTION_SALT);
  }
  if (rawTxn instanceof MultiAgentRawTransaction || rawTxn instanceof FeePayerRawTransaction) {
    return generateSigningMessage(rawTxn.bcsToBytes(), RAW_TRANSACTION_WITH_DATA_SALT);
  }
  throw new Error(`Unknown transaction type to sign on: ${rawTxn}`);
}
