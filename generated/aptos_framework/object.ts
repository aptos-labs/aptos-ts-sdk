
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace Object$1 {


// let owner: AccountAuthenticator | undefined; // &signer
export type TransferCallPayloadBCSArguments = {
  object: AccountAddress;
  to: AccountAddress;
};

export class TransferCall extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "object";
  public readonly functionName = "transfer_call";
  public readonly args: TransferCallPayloadBCSArguments;

  constructor(
    object: AccountAddressInput, // address
    to: AccountAddressInput // address
  ) {
    super();
    this.args = {
      object: AccountAddress.fromRelaxed(object),
      to: AccountAddress.fromRelaxed(to),
    };
  }
}




}