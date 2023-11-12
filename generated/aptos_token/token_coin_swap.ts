// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */
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
  Account,
} from "../../src";
import {
  EntryFunctionArgumentTypes,
  InputTypes,
  AccountAddressInput,
  Hex,
  HexInput,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Uint128,
  Uint256,
  parseTypeTag,
} from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { Option, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import {
  ViewFunctionPayloadBuilder,
  EntryFunctionPayloadBuilder,
} from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export type ListTokenForSwapPayloadMoveArguments = {
  _creators_address: AccountAddress;
  _collection: MoveString;
  _name: MoveString;
  _property_version: U64;
  _token_amount: U64;
  _min_coin_per_token: U64;
  _locked_until_secs: U64;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun list_token_for_swap<>(
 *     _token_owner: &signer,
 *     _creators_address: address,
 *     _collection: String,
 *     _name: String,
 *     _property_version: u64,
 *     _token_amount: u64,
 *     _min_coin_per_token: u64,
 *     _locked_until_secs: u64,
 *   )
 **/
export class ListTokenForSwap extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
  public readonly moduleName = "token_coin_swap";
  public readonly functionName = "list_token_for_swap";
  public readonly args: ListTokenForSwapPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    _token_owner: Account, // &signer
    _creators_address: AccountAddressInput, // address
    _collection: string, // String
    _name: string, // String
    _property_version: Uint64, // u64
    _token_amount: Uint64, // u64
    _min_coin_per_token: Uint64, // u64
    _locked_until_secs: Uint64, // u64
    typeTags: Array<TypeTagInput>, //
    feePayer?: Account, // optional fee payer account to sponsor the transaction
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
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
