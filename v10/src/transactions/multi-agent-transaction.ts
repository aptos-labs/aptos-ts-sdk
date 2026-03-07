// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { AccountAddress } from "../core/account-address.js";
import { RawTransaction } from "./raw-transaction.js";

export class MultiAgentTransaction extends Serializable {
  public rawTransaction: RawTransaction;
  public feePayerAddress?: AccountAddress | undefined;
  public secondarySignerAddresses: AccountAddress[];

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
