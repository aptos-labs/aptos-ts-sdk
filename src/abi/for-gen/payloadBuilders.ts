// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Aptos,
  Account,
  AccountAddress,
  EntryFunction,
  EntryFunctionArgumentTypes,
  Identifier,
  ModuleId,
  MultiSig,
  MultisigTransactionPayload,
  TransactionPayloadEntryFunction,
  TransactionPayloadMultisig,
  TypeTag,
  buildTransaction,
  LedgerVersion,
  MoveValue,
  UserTransactionResponse,
  InputViewRequestData,
  WaitForTransactionOptions,
  Serializable,
  Serializer,
} from "../../";

export abstract class EntryFunctionPayloadBuilder extends Serializable {
  public abstract readonly moduleAddress: AccountAddress;
  public abstract readonly moduleName: string;
  public abstract readonly functionName: string;
  public abstract readonly args: any;
  public abstract readonly typeTags: Array<TypeTag>;

  toPayload(multisigAddress?: AccountAddress): TransactionPayloadEntryFunction | TransactionPayloadMultisig {
    const entryFunction = new EntryFunction(
      new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
      new Identifier(this.functionName),
      this.typeTags,
      this.argsToArray(),
    );
    const entryFunctionPayload = new TransactionPayloadEntryFunction(entryFunction);
    if (multisigAddress) {
      const multisigPayload = new MultisigTransactionPayload(entryFunction);
      return new TransactionPayloadMultisig(new MultiSig(multisigAddress, multisigPayload));
    }
    return entryFunctionPayload;
  }

  // You can only submit a regular transaction with this function.
  // if you wish to submit this payload as a multisig transaction for `multisig_account.move`, please use the `submitMultisig` function.
  // TODO: Add `submitMultisig` function
  async submit(args: {
    signer: Account;
    aptos: Aptos;
    options?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { signer, aptos, options } = args;
    const rawTransaction = await buildTransaction({
      aptosConfig: aptos.config,
      sender: signer.accountAddress,
      payload: this.toPayload(),
      // TODO: Add support for feepayer transactions
      // /feePayerAddress: options?.feePayerAddress,
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({
      signer: signer,
      transaction: rawTransaction,
    });
    const userTransactionResponse = await aptos.waitForTransaction({
      transactionHash: pendingTransaction.hash,
      options,
    });
    return userTransactionResponse as UserTransactionResponse;
  }

  argsToArray(): Array<EntryFunctionArgumentTypes> {
    return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
  }

  serialize(serializer: Serializer): void {
    this.toPayload().serialize(serializer);
  }
}

// TODO: Allow for users to store/serialize arguments as BCS classes or JSON/simple entry function argument types
export abstract class ViewFunctionPayloadBuilder {
  public abstract readonly moduleAddress: AccountAddress;
  public abstract readonly moduleName: string;
  public abstract readonly functionName: string;
  public abstract readonly args: any;
  public abstract readonly typeTags: Array<TypeTag>;

  toPayload(): InputViewRequestData {
    return {
      function: `${this.moduleAddress.toString()}::${this.moduleName}::${this.functionName}`,
      typeArguments: this.typeTags.map((type) => type.toString() as `0x${string}::${string}::${string}`),
      functionArguments: this.argsToArray(),
    };
  }

  // TODO: Add support for typed responses, so you know what the view function is returning.
  // this will likely be as if not more complicated than the ability to know a struct type from ABIs
  // Perhaps for now, we could do something where any field (except for the outermost one) that's a non-primitive Move type would just be `viewResult: MoveValue`
  // AKA:
  // struct MyViewRequest {
  //    field_1: u64,
  //    field_2: bool,
  //    field_3: MyOtherStruct,
  // }
  //      would be:
  // struct MyViewResponse {
  //    field_1: u64,
  //    field_2: bool,
  //    field_3: MoveValue,
  // }
  async submit(args: { aptos: Aptos; options?: LedgerVersion }): Promise<MoveValue> {
    const { aptos, options } = args;
    const viewRequest = await aptos.view({
      payload: this.toPayload(),
      options,
    });
    // TODO: Fix/inspect why view requests always return an array with the first value as the response data
    if (viewRequest.length > 1) {
      console.warn(`View request returned more than one value`, viewRequest);
    }
    return viewRequest[0];
  }

  argsToArray(): Array<MoveValue> {
    return Object.keys(this.args).map((field) => {
      const val = this.args[field as keyof typeof this.args];
      if (val instanceof Uint8Array) {
        return Array.from(val);
      }
      if (val instanceof AccountAddress) {
        return val.toString();
      }
      if (val instanceof BigInt || typeof val === "bigint") {
        return val.toString();
      }
      return val;
    });
  }
}
