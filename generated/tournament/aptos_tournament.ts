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
import { InputTypes, Option, MoveObject, ObjectAddress, TypeTagInput } from "../types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../payloadBuilders";

export type AddPlayersToGamePayloadMoveArguments = {
  tournament_address: AccountAddress;
  players: MoveVector<MoveObject>;
};

/**
 *  public fun add_players_to_game(
 *     caller: &signer,
 *     tournament_address: address,
 *     players: vector<Object<Token>>,
 *   )
 **/
export class AddPlayersToGame extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "aptos_tournament";
  public readonly functionName = "add_players_to_game";
  public readonly args: AddPlayersToGamePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // caller: &signer,
    tournament_address: AccountAddressInput, // address
    players: Array<ObjectAddress>, // vector<Object<Token>>
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address),
      players: new MoveVector(players.map((argA) => AccountAddress.fromRelaxed(argA))),
    };
  }
}
export type SetAdminSignerPayloadMoveArguments = {
  admin_address: AccountAddress;
};

/**
 *  public fun set_admin_signer(
 *     caller: &signer,
 *     admin_address: address,
 *   )
 **/
export class SetAdminSigner extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "aptos_tournament";
  public readonly functionName = "set_admin_signer";
  public readonly args: SetAdminSignerPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // caller: &signer,
    admin_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      admin_address: AccountAddress.fromRelaxed(admin_address),
    };
  }
}
export type StartNewRoundPayloadMoveArguments = {
  tournament_address: AccountAddress;
};

/**
 *  public fun start_new_round(
 *     caller: &signer,
 *     tournament_address: address,
 *   )
 **/
export class StartNewRound extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "aptos_tournament";
  public readonly functionName = "start_new_round";
  public readonly args: StartNewRoundPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // caller: &signer,
    tournament_address: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>,
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address),
    };
    this.typeTags = typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag));
  }
}
