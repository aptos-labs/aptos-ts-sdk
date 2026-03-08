// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { RawTransaction } from "./raw-transaction.js";

/**
 * A high-level wrapper around a transaction that requires multiple signers.
 *
 * `MultiAgentTransaction` extends the single-sender model by requiring one or more
 * secondary signers to co-sign the transaction.  It also supports an optional fee payer
 * that sponsors the gas costs.
 *
 * This is the preferred type for cross-account operations such as atomic swaps or actions
 * that require authorization from multiple parties.
 *
 * @example
 * ```typescript
 * // Multi-agent transaction without a fee payer
 * const multiAgentTxn = new MultiAgentTransaction(rawTransaction, [secondaryAddress]);
 *
 * // Multi-agent transaction with a fee payer
 * const sponsoredMultiAgentTxn = new MultiAgentTransaction(
 *   rawTransaction,
 *   [secondaryAddress],
 *   feePayerAddress,
 * );
 * ```
 */
export class MultiAgentTransaction extends Serializable {
  /** The underlying unsigned transaction. */
  public rawTransaction: RawTransaction;

  /**
   * Address of the fee payer account, if this is a sponsored transaction.
   *
   * When `undefined` the sender pays their own gas fees.
   */
  public feePayerAddress?: AccountAddress | undefined;

  /** Ordered list of secondary signer addresses that must co-sign this transaction. */
  public secondarySignerAddresses: AccountAddress[];

  /**
   * Creates a new `MultiAgentTransaction`.
   *
   * @param rawTransaction - The core unsigned transaction to wrap.
   * @param secondarySignerAddresses - Addresses of the accounts that must co-sign.
   * @param feePayerAddress - Optional address of the account that will pay gas fees.
   */
  constructor(
    rawTransaction: RawTransaction,
    secondarySignerAddresses: AccountAddress[],
    feePayerAddress?: AccountAddress,
  ) {
    super();
    this.rawTransaction = rawTransaction;
    this.feePayerAddress = feePayerAddress;
    this.secondarySignerAddresses = secondarySignerAddresses;
  }

  /**
   * Serializes this transaction to BCS bytes.
   *
   * The format is:
   * `rawTransaction | secondarySignerAddresses[] | bool(feePayerPresent) [| feePayerAddress]`.
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.rawTransaction.serialize(serializer);
    serializer.serializeVector<AccountAddress>(this.secondarySignerAddresses);
    if (this.feePayerAddress === undefined) {
      serializer.serializeBool(false);
    } else {
      serializer.serializeBool(true);
      this.feePayerAddress.serialize(serializer);
    }
  }

  /**
   * Deserializes a `MultiAgentTransaction` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `MultiAgentTransaction` instance.
   */
  static deserialize(deserializer: Deserializer): MultiAgentTransaction {
    const rawTransaction = RawTransaction.deserialize(deserializer);
    const secondarySignerAddresses = deserializer.deserializeVector(AccountAddress);
    const feePayerPresent = deserializer.deserializeBool();
    let feePayerAddress: AccountAddress | undefined;
    if (feePayerPresent) {
      feePayerAddress = AccountAddress.deserialize(deserializer);
    }
    return new MultiAgentTransaction(rawTransaction, secondarySignerAddresses, feePayerAddress);
  }
}
