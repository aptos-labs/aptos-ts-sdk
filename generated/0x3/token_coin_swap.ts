// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddress,
  AccountAuthenticator,
  MoveString,
  MoveVector,
  TypeTag,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  Bool,
  AccountAddressInput,
  HexInput,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Uint128,
  Uint256,
} from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";

export namespace TokenCoinSwap {
  // let _token_owner: AccountAuthenticator | undefined; // &signer
  export type ListTokenForSwapPayloadBCSArguments = {
    _creators_address: AccountAddress;
    _collection: MoveString;
    _name: MoveString;
    _property_version: U64;
    _token_amount: U64;
    _min_coin_per_token: U64;
    _locked_until_secs: U64;
  };

  export class ListTokenForSwap extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token_coin_swap";
    public readonly functionName = "list_token_for_swap";
    public readonly args: ListTokenForSwapPayloadBCSArguments;

    constructor(
      _creators_address: AccountAddressInput, // address
      _collection: string, // 0x1::string::String
      _name: string, // 0x1::string::String
      _property_version: Uint64, // u64
      _token_amount: Uint64, // u64
      _min_coin_per_token: Uint64, // u64
      _locked_until_secs: Uint64, // u64
    ) {
      super();
      this.args = {
        _creators_address: AccountAddress.fromRelaxed(_creators_address),
        _collection: new MoveString(_collection),
        _name: new MoveString(_name),
        _property_version: new U64(_property_version),
        _token_amount: new U64(_token_amount),
        _min_coin_per_token: new U64(_min_coin_per_token),
        _locked_until_secs: new U64(_locked_until_secs),
      };
    }
  }
}
