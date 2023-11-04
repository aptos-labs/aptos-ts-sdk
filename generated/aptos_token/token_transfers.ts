
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace TokenTransfers {
// let sender: AccountAuthenticator | undefined; // signer
export type CancelOfferScriptPayloadBCSArguments = {
  receiver: AccountAddress;
  creator: AccountAddress;
  collection: MoveString;
  name: MoveString;
  property_version: U64;
};

export class CancelOfferScript extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
  public readonly moduleName = "token_transfers";
  public readonly functionName = "cancel_offer_script";
  public readonly args: CancelOfferScriptPayloadBCSArguments;

  constructor(
    receiver: AccountAddressInput, // address
    creator: AccountAddressInput, // address
    collection: string, // 0x1::string::String
    name: string, // 0x1::string::String
    property_version: Uint64 // u64
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

// let receiver: AccountAuthenticator | undefined; // signer
export type ClaimScriptPayloadBCSArguments = {
  sender: AccountAddress;
  creator: AccountAddress;
  collection: MoveString;
  name: MoveString;
  property_version: U64;
};

export class ClaimScript extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
  public readonly moduleName = "token_transfers";
  public readonly functionName = "claim_script";
  public readonly args: ClaimScriptPayloadBCSArguments;

  constructor(
    sender: AccountAddressInput, // address
    creator: AccountAddressInput, // address
    collection: string, // 0x1::string::String
    name: string, // 0x1::string::String
    property_version: Uint64 // u64
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

// let sender: AccountAuthenticator | undefined; // signer
export type OfferScriptPayloadBCSArguments = {
  receiver: AccountAddress;
  creator: AccountAddress;
  collection: MoveString;
  name: MoveString;
  property_version: U64;
  amount: U64;
};

export class OfferScript extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
  public readonly moduleName = "token_transfers";
  public readonly functionName = "offer_script";
  public readonly args: OfferScriptPayloadBCSArguments;

  constructor(
    receiver: AccountAddressInput, // address
    creator: AccountAddressInput, // address
    collection: string, // 0x1::string::String
    name: string, // 0x1::string::String
    property_version: Uint64, // u64
    amount: Uint64 // u64
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


}