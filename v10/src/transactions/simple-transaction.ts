// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { RawTransaction } from "./raw-transaction.js";

/**
 * A high-level wrapper around a single-sender transaction, optionally with a fee payer.
 *
 * `SimpleTransaction` is the most common transaction type used in the SDK.  It encapsulates a
 * {@link RawTransaction} and, when present, the address of an account that will sponsor the
 * gas fees.  Use {@link MultiAgentTransaction} when the transaction requires additional
 * secondary signers.
 *
 * The `secondarySignerAddresses` property is always `undefined` on this class and serves as a
 * discriminant against `MultiAgentTransaction` in union type checks.
 *
 * @example
 * ```typescript
 * // Simple transaction without a fee payer
 * const simpleTxn = new SimpleTransaction(rawTransaction);
 *
 * // Simple transaction with a fee payer (sponsored transaction)
 * const sponsoredTxn = new SimpleTransaction(rawTransaction, feePayerAddress);
 * ```
 */
export class SimpleTransaction extends Serializable {
  /** The underlying unsigned transaction. */
  public rawTransaction: RawTransaction;

  /**
   * Address of the fee payer account, if this is a sponsored transaction.
   *
   * When `undefined` the sender pays their own gas fees.
   */
  public feePayerAddress?: AccountAddress | undefined;

  /**
   * Always `undefined` on `SimpleTransaction`.
   *
   * This property exists solely to discriminate `SimpleTransaction` from
   * `MultiAgentTransaction` in union type checks without a runtime `instanceof` test.
   */
  // Used for type discrimination vs MultiAgentTransaction
  public readonly secondarySignerAddresses: undefined;

  /**
   * Creates a new `SimpleTransaction`.
   *
   * @param rawTransaction - The core unsigned transaction to wrap.
   * @param feePayerAddress - Optional address of the account that will pay gas fees.
   */
  constructor(rawTransaction: RawTransaction, feePayerAddress?: AccountAddress) {
    super();
    this.rawTransaction = rawTransaction;
    this.feePayerAddress = feePayerAddress;
  }

  /**
   * Serializes this transaction to BCS bytes.
   *
   * The format is: `rawTransaction | bool(feePayerPresent) [| feePayerAddress]`.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.rawTransaction.serialize(serializer);
    if (this.feePayerAddress === undefined) {
      serializer.serializeBool(false);
    } else {
      serializer.serializeBool(true);
      this.feePayerAddress.serialize(serializer);
    }
  }

  /**
   * Deserializes a `SimpleTransaction` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `SimpleTransaction` instance.
   */
  static deserialize(deserializer: Deserializer): SimpleTransaction {
    const rawTransaction = RawTransaction.deserialize(deserializer);
    const feePayerPresent = deserializer.deserializeBool();
    let feePayerAddress: AccountAddress | undefined;
    if (feePayerPresent) {
      feePayerAddress = AccountAddress.deserialize(deserializer);
    }
    return new SimpleTransaction(rawTransaction, feePayerAddress);
  }
}
