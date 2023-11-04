
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace AptosToken {



// let creator: AccountAuthenticator | undefined; // &signer
export type CreateCollectionPayloadBCSArguments = {
  description: MoveString;
  max_supply: U64;
  name: MoveString;
  uri: MoveString;
  mutable_description: Bool;
  mutable_royalty: Bool;
  mutable_uri: Bool;
  mutable_token_description: Bool;
  mutable_token_name: Bool;
  mutable_token_properties: Bool;
  mutable_token_uri: Bool;
  tokens_burnable_by_creator: Bool;
  tokens_freezable_by_creator: Bool;
  royalty_numerator: U64;
  royalty_denominator: U64;
};

export class CreateCollection extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "create_collection";
  public readonly args: CreateCollectionPayloadBCSArguments;

  constructor(
    description: string, // 0x1::string::String
    max_supply: Uint64, // u64
    name: string, // 0x1::string::String
    uri: string, // 0x1::string::String
    mutable_description: boolean, // bool
    mutable_royalty: boolean, // bool
    mutable_uri: boolean, // bool
    mutable_token_description: boolean, // bool
    mutable_token_name: boolean, // bool
    mutable_token_properties: boolean, // bool
    mutable_token_uri: boolean, // bool
    tokens_burnable_by_creator: boolean, // bool
    tokens_freezable_by_creator: boolean, // bool
    royalty_numerator: Uint64, // u64
    royalty_denominator: Uint64 // u64
  ) {
    super();
    this.args = {
      description: new MoveString(description),
      max_supply: new U64(max_supply),
      name: new MoveString(name),
      uri: new MoveString(uri),
      mutable_description: new Bool(mutable_description),
      mutable_royalty: new Bool(mutable_royalty),
      mutable_uri: new Bool(mutable_uri),
      mutable_token_description: new Bool(mutable_token_description),
      mutable_token_name: new Bool(mutable_token_name),
      mutable_token_properties: new Bool(mutable_token_properties),
      mutable_token_uri: new Bool(mutable_token_uri),
      tokens_burnable_by_creator: new Bool(tokens_burnable_by_creator),
      tokens_freezable_by_creator: new Bool(tokens_freezable_by_creator),
      royalty_numerator: new U64(royalty_numerator),
      royalty_denominator: new U64(royalty_denominator),
    };
  }
}


// let creator: AccountAuthenticator | undefined; // &signer
export type MintPayloadBCSArguments = {
  collection: MoveString;
  description: MoveString;
  name: MoveString;
  uri: MoveString;
  property_keys: MoveVector<MoveString>;
  property_types: MoveVector<MoveString>;
  property_values: MoveVector<MoveVector<U8>>;
};

export class Mint extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "mint";
  public readonly args: MintPayloadBCSArguments;

  constructor(
    collection: string, // 0x1::string::String
    description: string, // 0x1::string::String
    name: string, // 0x1::string::String
    uri: string, // 0x1::string::String
    property_keys: Array<string>, // vector<0x1::string::String>
    property_types: Array<string>, // vector<0x1::string::String>
    property_values: Array<HexInput> // vector<vector<u8>>
  ) {
    super();
    this.args = {
      collection: new MoveString(collection),
      description: new MoveString(description),
      name: new MoveString(name),
      uri: new MoveString(uri),
      property_keys: new MoveVector(
        property_keys.map((argA) => new MoveString(argA))
      ),
      property_types: new MoveVector(
        property_types.map((argA) => new MoveString(argA))
      ),
      property_values: new MoveVector(
        property_values.map((argA) => MoveVector.U8(argA))
      ),
    };
  }
}

// let creator: AccountAuthenticator | undefined; // &signer
export type MintSoulBoundPayloadBCSArguments = {
  collection: MoveString;
  description: MoveString;
  name: MoveString;
  uri: MoveString;
  property_keys: MoveVector<MoveString>;
  property_types: MoveVector<MoveString>;
  property_values: MoveVector<MoveVector<U8>>;
  soul_bound_to: AccountAddress;
};

export class MintSoulBound extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "mint_soul_bound";
  public readonly args: MintSoulBoundPayloadBCSArguments;

  constructor(
    collection: string, // 0x1::string::String
    description: string, // 0x1::string::String
    name: string, // 0x1::string::String
    uri: string, // 0x1::string::String
    property_keys: Array<string>, // vector<0x1::string::String>
    property_types: Array<string>, // vector<0x1::string::String>
    property_values: Array<HexInput>, // vector<vector<u8>>
    soul_bound_to: AccountAddressInput // address
  ) {
    super();
    this.args = {
      collection: new MoveString(collection),
      description: new MoveString(description),
      name: new MoveString(name),
      uri: new MoveString(uri),
      property_keys: new MoveVector(
        property_keys.map((argA) => new MoveString(argA))
      ),
      property_types: new MoveVector(
        property_types.map((argA) => new MoveString(argA))
      ),
      property_values: new MoveVector(
        property_values.map((argA) => MoveVector.U8(argA))
      ),
      soul_bound_to: AccountAddress.fromRelaxed(soul_bound_to),
    };
  }
}












}