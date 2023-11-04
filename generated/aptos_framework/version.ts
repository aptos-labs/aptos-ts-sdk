
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace Version {
// let account: AccountAuthenticator | undefined; // &signer
export type SetVersionPayloadBCSArguments = {
  major: U64;
};

export class SetVersion extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "version";
  public readonly functionName = "set_version";
  public readonly args: SetVersionPayloadBCSArguments;

  constructor(
    major: Uint64 // u64
  ) {
    super();
    this.args = {
      major: new U64(major),
    };
  }
}


}