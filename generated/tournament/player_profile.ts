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
} from "@aptos-labs/ts-sdk";
import { EntryFunctionArgumentTypes, AccountAddressInput, Hex, HexInput, parseTypeTag } from "@aptos-labs/ts-sdk";
import {
  InputTypes,
  Option,
  MoveObject,
  ObjectAddress,
  TypeTagInput,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Uint128,
  Uint256,
} from "../types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../payloadBuilders";

export type ViewPlayerProfilePayloadMoveArguments = {
  player_profile_address: string;
};

/**
 *  public fun view_player_profile(
 *     player_profile_address: address,
 *   )
 **/
export class ViewPlayerProfile extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "player_profile";
  public readonly functionName = "view_player_profile";
  public readonly args: ViewPlayerProfilePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    player_profile_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      player_profile_address: AccountAddress.fromRelaxed(player_profile_address).toString(),
    };
  }
}
