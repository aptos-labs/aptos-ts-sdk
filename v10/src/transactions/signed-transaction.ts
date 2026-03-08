// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { TransactionAuthenticator } from "./authenticator.js";
import { RawTransaction } from "./raw-transaction.js";

/**
 * A fully signed transaction ready for submission to the Aptos network.
 *
 * `SignedTransaction` pairs a {@link RawTransaction} with a {@link TransactionAuthenticator}
 * that proves the sender (and any co-signers) have authorized the transaction.  This is the
 * final form produced by the signing step in the build → sign → submit workflow.
 *
 * @example
 * ```typescript
 * const signedTxn = new SignedTransaction(rawTxn, authenticator);
 * const bytes = signedTxn.bcsToBytes();
 * // Submit `bytes` to the Aptos REST API
 * ```
 */
export class SignedTransaction extends Serializable {
  /** The unsigned transaction that was signed. */
  public readonly raw_txn: RawTransaction;

  /** The cryptographic proof that the transaction was authorized by the sender. */
  public readonly authenticator: TransactionAuthenticator;

  /**
   * Creates a new `SignedTransaction`.
   *
   * @param raw_txn - The unsigned transaction to sign.
   * @param authenticator - The authenticator produced by signing the transaction.
   */
  constructor(raw_txn: RawTransaction, authenticator: TransactionAuthenticator) {
    super();
    this.raw_txn = raw_txn;
    this.authenticator = authenticator;
  }

  /**
   * Serializes this signed transaction to BCS bytes (raw transaction followed by authenticator).
   *
   * @param serializer - The BCS serializer to write into.
   */
  serialize(serializer: Serializer): void {
    this.raw_txn.serialize(serializer);
    this.authenticator.serialize(serializer);
  }

  /**
   * Deserializes a `SignedTransaction` from BCS bytes.
   *
   * @param deserializer - The BCS deserializer to read from.
   * @returns A new `SignedTransaction` instance.
   */
  static deserialize(deserializer: Deserializer): SignedTransaction {
    const raw_txn = RawTransaction.deserialize(deserializer);
    const authenticator = TransactionAuthenticator.deserialize(deserializer);
    return new SignedTransaction(raw_txn, authenticator);
  }
}
