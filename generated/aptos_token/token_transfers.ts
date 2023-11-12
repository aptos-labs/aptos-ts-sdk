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

export type CancelOfferScriptPayloadMoveArguments = {
  receiver: AccountAddress;
  creator: AccountAddress;
  collection: MoveString;
  name: MoveString;
  property_version: U64;
};

/**
 *  public fun cancel_offer_script<>(
 *     sender: signer,
 *     receiver: address,
 *     creator: address,
 *     collection: String,
 *     name: String,
 *     property_version: u64,
 *   )
 **/
export class CancelOfferScript extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
  public readonly moduleName = "token_transfers";
  public readonly functionName = "cancel_offer_script";
  public readonly args: CancelOfferScriptPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // sender: signer,
    receiver: AccountAddressInput, // address
    creator: AccountAddressInput, // address
    collection: string, // String
    name: string, // String
    property_version: Uint64, // u64
  ) {
    super();
    this.args = {
      receiver: AccountAddress.fromRelaxed(receiver),
      creator: AccountAddress.fromRelaxed(creator),
      collection: new MoveString(collection),
      name: new MoveString(name),
      property_version: new U64(property_version),
    };
  }
}
export type ClaimScriptPayloadMoveArguments = {
  sender: AccountAddress;
  creator: AccountAddress;
  collection: MoveString;
  name: MoveString;
  property_version: U64;
};

/**
 *  public fun claim_script<>(
 *     receiver: signer,
 *     sender: address,
 *     creator: address,
 *     collection: String,
 *     name: String,
 *     property_version: u64,
 *   )
 **/
export class ClaimScript extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
  public readonly moduleName = "token_transfers";
  public readonly functionName = "claim_script";
  public readonly args: ClaimScriptPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // receiver: signer,
    sender: AccountAddressInput, // address
    creator: AccountAddressInput, // address
    collection: string, // String
    name: string, // String
    property_version: Uint64, // u64
  ) {
    super();
    this.args = {
      sender: AccountAddress.fromRelaxed(sender),
      creator: AccountAddress.fromRelaxed(creator),
      collection: new MoveString(collection),
      name: new MoveString(name),
      property_version: new U64(property_version),
    };
  }
}
export type OfferScriptPayloadMoveArguments = {
  receiver: AccountAddress;
  creator: AccountAddress;
  collection: MoveString;
  name: MoveString;
  property_version: U64;
  amount: U64;
};

/**
 *  public fun offer_script<>(
 *     sender: signer,
 *     receiver: address,
 *     creator: address,
 *     collection: String,
 *     name: String,
 *     property_version: u64,
 *     amount: u64,
 *   )
 **/
export class OfferScript extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
  public readonly moduleName = "token_transfers";
  public readonly functionName = "offer_script";
  public readonly args: OfferScriptPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // sender: signer,
    receiver: AccountAddressInput, // address
    creator: AccountAddressInput, // address
    collection: string, // String
    name: string, // String
    property_version: Uint64, // u64
    amount: Uint64, // u64
  ) {
    super();
    this.args = {
      receiver: AccountAddress.fromRelaxed(receiver),
      creator: AccountAddress.fromRelaxed(creator),
      collection: new MoveString(collection),
      name: new MoveString(name),
      property_version: new U64(property_version),
      amount: new U64(amount),
    };
  }
}
