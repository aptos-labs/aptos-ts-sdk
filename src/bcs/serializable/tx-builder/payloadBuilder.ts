// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress } from "../../../core";
import {
  EntryFunction,
  EntryFunctionArgumentTypes,
  Identifier,
  ModuleId,
  TransactionPayloadEntryFunction,
} from "../../../transactions";
import { Serializable, Serializer } from "../../serializer";

export abstract class EntryFunctionPayloadBuilder extends Serializable {
  public abstract readonly moduleAddress: AccountAddress;
  public abstract readonly moduleName: string;
  public abstract readonly functionName: string;
  public abstract readonly args: {};

  toPayload(): TransactionPayloadEntryFunction {
    const entryFunction = new EntryFunction(
      new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
      new Identifier(this.functionName),
      [],
      this.argsToArray(),
    );
    return new TransactionPayloadEntryFunction(entryFunction);
  }

  argsToArray(): Array<EntryFunctionArgumentTypes> {
    return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
  }

  serialize(serializer: Serializer): void {
    this.toPayload().serialize(serializer);
  }
}
