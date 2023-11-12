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

export type InitializeTournamentPayloadMoveArguments = {
  tournament_name: MoveString;
  max_players: U64;
  num_winners: U64;
  time_between_rounds_secs: U64;
};

/**
 *  public fun initialize_tournament<>(
 *     tournament_creator: &signer,
 *     tournament_name: String,
 *     max_players: u64,
 *     num_winners: u64,
 *     time_between_rounds_secs: u64,
 *   )
 **/
export class InitializeTournament extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "initialize_tournament";
  public readonly args: InitializeTournamentPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    tournament_creator: Account, // &signer
    tournament_name: string, // String
    max_players: Uint64, // u64
    num_winners: Uint64, // u64
    time_between_rounds_secs: Uint64, // u64
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      tournament_name: new MoveString(tournament_name),
      max_players: new U64(max_players),
      num_winners: new U64(num_winners),
      time_between_rounds_secs: new U64(time_between_rounds_secs),
    };
  }
}
export type JoinTournamentPayloadMoveArguments = {
  tournament_address: AccountAddress;
  player_name: MoveString;
};

/**
 *  public fun join_tournament<>(
 *     player: &signer,
 *     tournament_address: address,
 *     player_name: String,
 *   )
 **/
export class JoinTournament extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "join_tournament";
  public readonly args: JoinTournamentPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    player: Account, // &signer
    tournament_address: AccountAddressInput, // address
    player_name: string, // String
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address),
      player_name: new MoveString(player_name),
    };
  }
}
export type StartNewRoundPayloadMoveArguments = {
  tournament_address: AccountAddress;
  game_params: MoveVector<MoveString>;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun start_new_round<>(
 *     tournament_creator: &signer,
 *     tournament_address: address,
 *     game_params: vector<String>,
 *   )
 **/
export class StartNewRound extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "start_new_round";
  public readonly args: StartNewRoundPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    tournament_creator: Account, // &signer
    tournament_address: AccountAddressInput, // address
    game_params: Array<string>, // vector<String>
    typeTags: Array<TypeTagInput>, //
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address),
      game_params: new MoveVector(game_params.map((argA) => new MoveString(argA))),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}

/**
 *  public fun get_collection_config<>(
 *   )
 **/
export class GetCollectionConfig extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_collection_config";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type GetCurrentRoundTypePayloadMoveArguments = {
  tournament_addr: AccountAddressInput;
};

/**
 *  public fun get_current_round_type<>(
 *     tournament_addr: address,
 *   )
 **/
export class GetCurrentRoundType extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_current_round_type";
  public readonly args: GetCurrentRoundTypePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    tournament_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_addr: AccountAddress.fromRelaxed(tournament_addr),
    };
  }
}
export type GetMaxPlayersPayloadMoveArguments = {
  tournament_director_addr: AccountAddressInput;
};

/**
 *  public fun get_max_players<>(
 *     tournament_director_addr: address,
 *   )
 **/
export class GetMaxPlayers extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_max_players";
  public readonly args: GetMaxPlayersPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    tournament_director_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_director_addr: AccountAddress.fromRelaxed(tournament_director_addr),
    };
  }
}
export type GetNumPlayerJoinedPayloadMoveArguments = {
  tournament_director_addr: AccountAddressInput;
};

/**
 *  public fun get_num_player_joined<>(
 *     tournament_director_addr: address,
 *   )
 **/
export class GetNumPlayerJoined extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_num_player_joined";
  public readonly args: GetNumPlayerJoinedPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    tournament_director_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_director_addr: AccountAddress.fromRelaxed(tournament_director_addr),
    };
  }
}
export type GetNumWinnersPayloadMoveArguments = {
  tournament_director_addr: AccountAddressInput;
};

/**
 *  public fun get_num_winners<>(
 *     tournament_director_addr: address,
 *   )
 **/
export class GetNumWinners extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_num_winners";
  public readonly args: GetNumWinnersPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    tournament_director_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_director_addr: AccountAddress.fromRelaxed(tournament_director_addr),
    };
  }
}
export type GetTournamentStatePayloadMoveArguments = {
  tournament_addr: AccountAddressInput;
};

/**
 *  public fun get_tournament_state<>(
 *     tournament_addr: address,
 *   )
 **/
export class GetTournamentState extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_tournament_state";
  public readonly args: GetTournamentStatePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    tournament_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_addr: AccountAddress.fromRelaxed(tournament_addr),
    };
  }
}
