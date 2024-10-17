// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/naming-convention */

import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";
import { AccountAddress } from "../../core";
import { RawTransaction } from "./rawTransaction";

/**
 * Represents a simple transaction type that can be submitted to the Aptos chain for execution.
 *
 * This transaction type is designed for a single signer and includes metadata such as the Raw Transaction
 * and an optional sponsor Account Address to cover gas fees.
 *
 * @param rawTransaction - The Raw Transaction.
 * @param feePayerAddress - The optional sponsor Account Address.
 * @group Implementation
 * @category Transactions
 */
export class SimpleTransaction extends Serializable {
  public rawTransaction: RawTransaction;

  public feePayerAddress?: AccountAddress | undefined;

  // We don't really need it, we add it for type checking we do
  // throughout the SDK
  public readonly secondarySignerAddresses: undefined;

  /**
   * SimpleTransaction represents a transaction signed by a single account that
   * can be submitted to the Aptos chain for execution.
   *
   * @param rawTransaction The Raw Transaction.
   * @param feePayerAddress The optional sponsor Account Address to pay the gas fees.
   * @group Implementation
   * @category Transactions
   */
  constructor(rawTransaction: RawTransaction, feePayerAddress?: AccountAddress) {
    super();
    this.rawTransaction = rawTransaction;
    this.feePayerAddress = feePayerAddress;
  }

  /**
   * Serializes the transaction data using the provided serializer.
   * This function ensures that the raw transaction and fee payer address are properly serialized for further processing.
   *
   * @param serializer - The serializer instance used to serialize the transaction data.
   * @group Implementation
   * @category Transactions
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
   * Deserializes a SimpleTransaction from the given deserializer.
   * This function helps in reconstructing a SimpleTransaction object from its serialized form.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   * @group Implementation
   * @category Transactions
   */
  static deserialize(deserializer: Deserializer): SimpleTransaction {
    const rawTransaction = RawTransaction.deserialize(deserializer);
    const feePayerPresent = deserializer.deserializeBool();
    let feePayerAddress;
    if (feePayerPresent) {
      feePayerAddress = AccountAddress.deserialize(deserializer);
    }

    return new SimpleTransaction(rawTransaction, feePayerAddress);
  }
}
