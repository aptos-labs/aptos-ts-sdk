// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import type { Deserializer } from "../bcs/deserializer.js";
import { Serializable, type Serializer } from "../bcs/serializer.js";
import { TransactionAuthenticator } from "./authenticator.js";
import { RawTransaction } from "./raw-transaction.js";

export class SignedTransaction extends Serializable {
  public readonly raw_txn: RawTransaction;
  public readonly authenticator: TransactionAuthenticator;

  constructor(raw_txn: RawTransaction, authenticator: TransactionAuthenticator) {
    super();
    this.raw_txn = raw_txn;
    this.authenticator = authenticator;
  }

  serialize(serializer: Serializer): void {
    this.raw_txn.serialize(serializer);
    this.authenticator.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): SignedTransaction {
    const raw_txn = RawTransaction.deserialize(deserializer);
    const authenticator = TransactionAuthenticator.deserialize(deserializer);
    return new SignedTransaction(raw_txn, authenticator);
  }
}
