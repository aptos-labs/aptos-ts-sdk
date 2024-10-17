// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/naming-convention */

import { TransactionAuthenticator } from "../authenticator/transaction";
import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";
import { RawTransaction } from "./rawTransaction";

/**
 * Represents a signed transaction that includes a raw transaction and an authenticator.
 * The authenticator contains a client's public key and the signature of the raw transaction.
 *
 * @see {@link https://aptos.dev/integration/creating-a-signed-transaction | Creating a Signed Transaction}
 * @param raw_txn - The raw transaction to be signed.
 * @param authenticator - Contains a client's public key and the signature of the raw transaction.
 * Authenticator can have three variations: single signature, multi-signature, and multi-agent.
 * @see {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/authenticator.rs} for details.
 * @group Implementation
 * @category Transactions
 */
export class SignedTransaction extends Serializable {
  public readonly raw_txn: RawTransaction;

  public readonly authenticator: TransactionAuthenticator;

  /**
   * Represents a signed transaction that includes a raw transaction and an authenticator.
   * The authenticator contains a client's public key and the signature of the raw transaction,
   * which can be of three types: single signature, multi-signature, and multi-agent.
   *
   * @param raw_txn The raw transaction to be signed.
   * @param authenticator Contains a client's public key and the signature of the raw transaction. The authenticator has 3
   * flavors: single signature, multi-signature and multi-agent.
   * @see {@link https://aptos.dev/integration/creating-a-signed-transaction | Creating a Signed Transaction}
   * @see {@link https://github.com/aptos-labs/aptos-core/blob/main/types/src/transaction/authenticator.rs} for details.
   * @group Implementation
   * @category Transactions
   */
  constructor(raw_txn: RawTransaction, authenticator: TransactionAuthenticator) {
    super();
    this.raw_txn = raw_txn;
    this.authenticator = authenticator;
  }

  /**
   * Serializes the raw transaction and its authenticator using the provided serializer.
   * This function is essential for preparing the transaction data for transmission or storage.
   *
   * @param serializer - The serializer instance used to serialize the transaction and authenticator.
   * @group Implementation
   * @category Transactions
   */
  serialize(serializer: Serializer): void {
    this.raw_txn.serialize(serializer);
    this.authenticator.serialize(serializer);
  }

  /**
   * Deserializes a signed transaction from the provided deserializer.
   * This function allows you to reconstruct a SignedTransaction object from its serialized form, enabling further processing or validation.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Transactions
   */
  static deserialize(deserializer: Deserializer): SignedTransaction {
    const raw_txn = RawTransaction.deserialize(deserializer);
    const authenticator = TransactionAuthenticator.deserialize(deserializer);
    return new SignedTransaction(raw_txn, authenticator);
  }
}
