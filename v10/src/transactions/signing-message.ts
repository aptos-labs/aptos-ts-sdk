// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { RAW_TRANSACTION_SALT, RAW_TRANSACTION_WITH_DATA_SALT } from "../core/constants.js";
import { FeePayerRawTransaction, MultiAgentRawTransaction } from "./raw-transaction.js";
import type { AnyRawTransaction, AnyRawTransactionInstance } from "./types.js";

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

  const mergedArray = new Uint8Array(prefix.length + bytes.length);
  mergedArray.set(prefix);
  mergedArray.set(bytes, prefix.length);

  return mergedArray;
}

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
