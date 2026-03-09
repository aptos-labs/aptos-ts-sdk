// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { sha3_256 as sha3Hash } from "@noble/hashes/sha3.js";
import { RAW_TRANSACTION_SALT, RAW_TRANSACTION_WITH_DATA_SALT } from "../core/constants.js";
import { FeePayerRawTransaction, MultiAgentRawTransaction } from "./raw-transaction.js";
import type { AnyRawTransaction, AnyRawTransactionInstance } from "./types.js";

/**
 * Derives the appropriate low-level raw transaction instance from a high-level transaction
 * wrapper.
 *
 * The Aptos protocol requires different BCS-encoded structures depending on whether the
 * transaction has secondary signers or a fee payer.  This helper inspects the wrapper and
 * returns:
 * - A {@link FeePayerRawTransaction} when `feePayerAddress` is set.
 * - A {@link MultiAgentRawTransaction} when `secondarySignerAddresses` is set.
 * - The bare {@link RawTransaction} otherwise.
 *
 * @param transaction - The high-level transaction wrapper to inspect.
 * @returns The corresponding low-level BCS-serializable transaction instance.
 *
 * @example
 * ```typescript
 * const rawTxnInstance = deriveTransactionType(simpleTransaction);
 * const bytes = rawTxnInstance.bcsToBytes();
 * ```
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

const textEncoder = new TextEncoder();
const domainSeparatorCache = new Map<string, Uint8Array>();

/**
 * Constructs an Aptos-prefixed signing message from arbitrary bytes and a domain separator.
 *
 * The signing message is:
 * ```
 * SHA3-256(domainSeparator) || bytes
 * ```
 *
 * The SHA3-256 hash of the domain separator acts as a fixed-length domain prefix that
 * prevents cross-protocol signature reuse.  All Aptos domain separators must begin with
 * `"APTOS::"`.
 *
 * @param bytes - The raw BCS-serialized payload bytes to sign.
 * @param domainSeparator - An `"APTOS::"`-prefixed string that uniquely identifies the
 *   signing context (e.g. `"APTOS::RawTransaction"`).
 * @returns The combined byte array `SHA3-256(domainSeparator) || bytes`.
 * @throws Error if `domainSeparator` does not start with `"APTOS::"`.
 *
 * @example
 * ```typescript
 * const message = generateSigningMessage(rawTxnBytes, "APTOS::RawTransaction");
 * const signature = privateKey.sign(message);
 * ```
 */
export function generateSigningMessage(bytes: Uint8Array, domainSeparator: string): Uint8Array {
  if (!domainSeparator.startsWith("APTOS::")) {
    throw new Error(`Domain separator needs to start with 'APTOS::'.  Provided - ${domainSeparator}`);
  }

  let prefix = domainSeparatorCache.get(domainSeparator);
  if (prefix === undefined) {
    prefix = sha3Hash.create().update(textEncoder.encode(domainSeparator)).digest();
    domainSeparatorCache.set(domainSeparator, prefix);
  }

  const mergedArray = new Uint8Array(prefix.length + bytes.length);
  mergedArray.set(prefix);
  mergedArray.set(bytes, prefix.length);

  return mergedArray;
}

/**
 * Generates the signing message for a high-level transaction wrapper.
 *
 * This is the primary entry point for computing the bytes that must be signed when
 * authorizing an Aptos transaction.  It:
 * 1. Calls {@link deriveTransactionType} to obtain the correct low-level BCS structure.
 * 2. Selects the appropriate domain separator:
 *    - `RAW_TRANSACTION_WITH_DATA_SALT` for fee-payer or multi-agent transactions.
 *    - `RAW_TRANSACTION_SALT` for plain single-sender transactions.
 * 3. Calls {@link generateSigningMessage} with the serialized bytes and chosen separator.
 *
 * @param transaction - The high-level transaction wrapper to generate a signing message for.
 * @returns The signing message bytes that every required signer must sign.
 *
 * @example
 * ```typescript
 * const signingMessage = generateSigningMessageForTransaction(simpleTransaction);
 * const signature = account.sign(signingMessage);
 * ```
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
