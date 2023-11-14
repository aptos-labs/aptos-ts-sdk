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
import {
  EntryFunctionArgumentTypes,
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
} from "@aptos-labs/ts-sdk";
import { InputTypes, Option, MoveObject, ObjectAddress, TypeTagInput } from "../types";
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
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
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
