// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { RawTransaction } from "./raw-transaction.js";

export class SimpleTransaction extends Serializable {
  public rawTransaction: RawTransaction;
  public feePayerAddress?: AccountAddress | undefined;
  // Used for type discrimination vs MultiAgentTransaction
  public readonly secondarySignerAddresses: undefined;

  constructor(rawTransaction: RawTransaction, feePayerAddress?: AccountAddress) {
    super();
    this.rawTransaction = rawTransaction;
    this.feePayerAddress = feePayerAddress;
  }

  serialize(serializer: Serializer): void {
    this.rawTransaction.serialize(serializer);
    if (this.feePayerAddress === undefined) {
      serializer.serializeBool(false);
    } else {
      serializer.serializeBool(true);
      this.feePayerAddress.serialize(serializer);
    }
  }

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
