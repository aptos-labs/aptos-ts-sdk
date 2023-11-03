// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { AptosConfig } from "../../../api";
import { AccountAddress } from "../../../core";
import { EntryFunctionArgumentTypes, TransactionPayload, TransactionPayloadEntryFunction } from "../../../transactions";
import { HexInput } from "../../../types";
import { Network } from "../../../utils/apiEndpoints";
import { Serializable, Serializer } from "../../serializer";
import { TransactionBuilder } from "./transactionBuilder";
import { EntryFunctionArgsField } from "./types";

// Build the payload for them
export abstract class TransactionPayloadSubmitter {
  abstract args: EntryFunctionArgsField;
  public readonly transactionBuilder: TransactionBuilder;

  constructor(transactionBuilder: TransactionBuilder) {
    this.transactionBuilder = transactionBuilder;
  }

  abstract toPayload(): TransactionPayload;

  argsToArray(): Array<EntryFunctionArgumentTypes> {
    return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
  }

  serialize(serializer: Serializer): void {
    this.toPayload().serialize(serializer);
  }
}

// export abstract class SingleSignerTransactionPayloadHelper extends AnyTransactionPayload {
//   constructor(sender: AccountAddress, configOrNetwork: AptosConfig | Network) {
//     super();

//   }
// }
