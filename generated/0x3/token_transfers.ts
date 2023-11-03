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
  EntryFunctionPayloadBuilder,
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

export namespace TokenTransfers {
  export type CancelOfferScriptPayloadBCSArguments = {
    sender: AccountAddress;
    receiver: AccountAddress;
    creator: MoveString;
    collection: MoveString;
    name: U64;
  };

  export class CancelOfferScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token_transfers";
    public readonly functionName = "cancel_offer_script";
    public readonly args: CancelOfferScriptPayloadBCSArguments;

    constructor(
      sender: AccountAddressInput, // address
      receiver: AccountAddressInput, // address
      creator: string, // 0x1::string::String
      collection: string, // 0x1::string::String
      name: Uint64, // u64
    ) {
      super();
      this.args = {
        sender: AccountAddress.fromRelaxed(sender),
        receiver: AccountAddress.fromRelaxed(receiver),
        creator: new MoveString(creator),
        collection: new MoveString(collection),
        name: new U64(name),
      };
    }
  }
  export type ClaimScriptPayloadBCSArguments = {
    receiver: AccountAddress;
    sender: AccountAddress;
    creator: MoveString;
    collection: MoveString;
    name: U64;
  };

  export class ClaimScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token_transfers";
    public readonly functionName = "claim_script";
    public readonly args: ClaimScriptPayloadBCSArguments;

    constructor(
      receiver: AccountAddressInput, // address
      sender: AccountAddressInput, // address
      creator: string, // 0x1::string::String
      collection: string, // 0x1::string::String
      name: Uint64, // u64
    ) {
      super();
      this.args = {
        receiver: AccountAddress.fromRelaxed(receiver),
        sender: AccountAddress.fromRelaxed(sender),
        creator: new MoveString(creator),
        collection: new MoveString(collection),
        name: new U64(name),
      };
    }
  }
  export type OfferScriptPayloadBCSArguments = {
    sender: AccountAddress;
    receiver: AccountAddress;
    creator: MoveString;
    collection: MoveString;
    name: U64;
    property_version: U64;
  };

  export class OfferScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token_transfers";
    public readonly functionName = "offer_script";
    public readonly args: OfferScriptPayloadBCSArguments;

    constructor(
      sender: AccountAddressInput, // address
      receiver: AccountAddressInput, // address
      creator: string, // 0x1::string::String
      collection: string, // 0x1::string::String
      name: Uint64, // u64
      property_version: Uint64, // u64
    ) {
      super();
      this.args = {
        sender: AccountAddress.fromRelaxed(sender),
        receiver: AccountAddress.fromRelaxed(receiver),
        creator: new MoveString(creator),
        collection: new MoveString(collection),
        name: new U64(name),
        property_version: new U64(property_version),
      };
    }
  }
}
