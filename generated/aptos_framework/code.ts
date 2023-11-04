
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace Code {
// let owner: AccountAuthenticator | undefined; // &signer
export type PublishPackageTxnPayloadBCSArguments = {
  metadata_serialized: MoveVector<U8>;
  code: MoveVector<MoveVector<U8>>;
};

export class PublishPackageTxn extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "code";
  public readonly functionName = "publish_package_txn";
  public readonly args: PublishPackageTxnPayloadBCSArguments;

  constructor(
    metadata_serialized: HexInput, // vector<u8>
    code: Array<HexInput> // vector<vector<u8>>
  ) {
    super();
    this.args = {
      metadata_serialized: MoveVector.U8(metadata_serialized),
      code: new MoveVector(code.map((argA) => MoveVector.U8(argA))),
    };
  }
}


}