
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export type ObjectAddress = AccountAddressInput;


export namespace AddressLookup {
  export type GetNamedAddressPayloadMoveArguments = {
    name: string;
  };

  export class GetNamedAddress extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "address_lookup";
    public readonly functionName = "get_named_address";
    public readonly args: GetNamedAddressPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      name: string // 0x1::string::String
    ) {
      super();
      this.args = {
        name: name,
      };
    }
  }
}
