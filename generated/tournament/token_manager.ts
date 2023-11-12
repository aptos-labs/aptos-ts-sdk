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
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import {
  ViewFunctionPayloadBuilder,
  EntryFunctionPayloadBuilder,
} from "../../src/bcs/serializable/tx-builder/payloadBuilders";

/**
 *  public fun get_collection_config<>(
 *   )
 **/
export class GetCollectionConfig extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "token_manager";
  public readonly functionName = "get_collection_config";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type GetLastRecordedRoundPayloadMoveArguments = {
  token_obj: ObjectAddress;
};

/**
 *  public fun get_last_recorded_round<>(
 *     token_obj: Object<Token>,
 *   )
 **/
export class GetLastRecordedRound extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "token_manager";
  public readonly functionName = "get_last_recorded_round";
  public readonly args: GetLastRecordedRoundPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    token_obj: ObjectAddress, // Object<Token>
  ) {
    super();
    this.args = {
      token_obj: AccountAddress.fromRelaxed(token_obj),
    };
  }
}
export type GetRoomAddressPayloadMoveArguments = {
  token_obj: ObjectAddress;
};

/**
 *  public fun get_room_address<>(
 *     token_obj: Object<Token>,
 *   )
 **/
export class GetRoomAddress extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "token_manager";
  public readonly functionName = "get_room_address";
  public readonly args: GetRoomAddressPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    token_obj: ObjectAddress, // Object<Token>
  ) {
    super();
    this.args = {
      token_obj: AccountAddress.fromRelaxed(token_obj),
    };
  }
}
