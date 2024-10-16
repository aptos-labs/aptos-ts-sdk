// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/naming-convention */

import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";
import { AccountAddress } from "../../core";
import { RawTransaction } from "./rawTransaction";

/**
 * Represents a multi-agent transaction that can be serialized and deserialized.
 * This transaction includes a raw transaction, optional fee payer address, and multiple secondary signer addresses.
 *
 * @param rawTransaction The raw transaction to be executed.
 * @param secondarySignerAddresses An array of secondary signer addresses involved in the transaction.
 * @param feePayerAddress An optional account address that sponsors the transaction's gas fees.
 */
export class MultiAgentTransaction extends Serializable {
  public rawTransaction: RawTransaction;

  public feePayerAddress?: AccountAddress | undefined;

  public secondarySignerAddresses: AccountAddress[];

  /**
   * Represents a MultiAgentTransaction that can be submitted to the Aptos chain for execution.
   * This class encapsulates the raw transaction data, the secondary signer addresses, and an optional fee payer address.
   *
   * @param rawTransaction The raw transaction data.
   * @param secondarySignerAddresses An array of secondary signer addresses.
   * @param feePayerAddress An optional account address that sponsors the gas fees.
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
   * Serializes the transaction data, including the raw transaction, secondary signer addresses, and fee payer address.
   * This function is essential for preparing the transaction for transmission or storage in a serialized format.
   *
   * @param serializer - The serializer instance used to serialize the transaction data.
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
   * Deserializes a MultiAgentTransaction from the provided deserializer.
   * This function allows you to reconstruct a MultiAgentTransaction object from its serialized form, including any secondary
   * signer addresses and the fee payer address if present.
   *
   * @param deserializer - The deserializer instance used to read the serialized data.
   */
  static deserialize(deserializer: Deserializer): MultiAgentTransaction {
    const rawTransaction = RawTransaction.deserialize(deserializer);

    const secondarySignerAddresses = deserializer.deserializeVector(AccountAddress);

    const feePayerPresent = deserializer.deserializeBool();
    let feePayerAddress;
    if (feePayerPresent) {
      feePayerAddress = AccountAddress.deserialize(deserializer);
    }

    return new MultiAgentTransaction(rawTransaction, secondarySignerAddresses, feePayerAddress);
  }
}
