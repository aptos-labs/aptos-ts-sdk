// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { AptosConfig } from "../../../api";
import { AccountAddress } from "../../../core";
import { TransactionPayloadEntryFunction } from "../../../transactions";
import { HexInput } from "../../../types";
import { Network } from "../../../utils/apiEndpoints";
import { Serializable, Serializer } from "../../serializer";
import { TransactionBuilder } from "./transactionBuilder";
import { EntryFunctionArgsField } from "./types";

// Build the payload for them
export abstract class EntryFunctionPayload extends Serializable {
  abstract args: EntryFunctionArgsField;

  abstract toPayload(): TransactionPayloadEntryFunction;

  async toTransactionBuilder(args: {
    sender: HexInput | AccountAddress,
    configOrNetwork: AptosConfig | Network,
  }): Promise<TransactionBuilder> {

  };

  serialize(serializer: Serializer): void {
    Object.keys(this.args).forEach((field) => {
      const value = this.args[field as keyof typeof this.args];
      serializer.serialize(value);
    });
  }
}
