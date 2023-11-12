
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export type ObjectAddress = AccountAddressInput;


export namespace TournamentManager {
  // let tournament_creator: AccountAuthenticator; // &signer
  export type InitializeTournamentPayloadMoveArguments = {
    tournament_name: MoveString;
    max_players: U64;
    num_winners: U64;
    time_between_rounds_secs: U64;
  };

  export class InitializeTournament extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "initialize_tournament";
    public readonly args: InitializeTournamentPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      // tournament_creator: &signer,
      tournament_name: string, // 0x1::string::String
      max_players: Uint64, // u64
      num_winners: Uint64, // u64
      time_between_rounds_secs: Uint64 // u64
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
  // let player: AccountAuthenticator; // &signer
  export type JoinTournamentPayloadMoveArguments = {
    tournament_address: AccountAddress;
    player_name: MoveString;
  };

  export class JoinTournament extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "join_tournament";
    public readonly args: JoinTournamentPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      // player: &signer,
      tournament_address: AccountAddressInput, // address
      player_name: string // 0x1::string::String
    ) {
      super();
      this.args = {
        tournament_address: AccountAddress.fromRelaxed(tournament_address),
        player_name: new MoveString(player_name),
      };
    }
  }
  // let tournament_creator: AccountAuthenticator; // &signer
  export type StartNewRoundPayloadMoveArguments = {
    tournament_address: AccountAddress;
    game_params: MoveVector<MoveString>;
    typeTags: Array<string | TypeTag>;
  };

  export class StartNewRound extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "start_new_round";
    public readonly args: StartNewRoundPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      // tournament_creator: &signer,
      tournament_address: AccountAddressInput, // address
      game_params: Array<string>, // vector<0x1::string::String>
      typeTags: Array<string | TypeTag> // ... fun start_new_round<T> (...)
    ) {
      super();
      this.args = {
        tournament_address: AccountAddress.fromRelaxed(tournament_address),
        game_params: new MoveVector(
          game_params.map((argA) => new MoveString(argA))
        ),
        typeTags: typeTags.map((typeTag) =>
          typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
        ),
      };
    }
  }

  export class GetCollectionConfig extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "get_collection_config";
    public readonly args = {};
    public readonly typeArgs: Array<TypeTag> = [];

    constructor() {
      super();
      this.args = {};
    }
  }
  export type GetCurrentRoundTypePayloadMoveArguments = {
    tournament_addr: AccountAddressInput;
  };

  export class GetCurrentRoundType extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "get_current_round_type";
    public readonly args: GetCurrentRoundTypePayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      tournament_addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        tournament_addr: AccountAddress.fromRelaxed(tournament_addr),
      };
    }
  }
  export type GetMaxPlayersPayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class GetMaxPlayers extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "get_max_players";
    public readonly args: GetMaxPlayersPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      arg_0: AccountAddressInput // address
    ) {
      super();
      this.args = {
        arg_0: AccountAddress.fromRelaxed(arg_0),
      };
    }
  }
  export type GetNumPlayerJoinedPayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class GetNumPlayerJoined extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "get_num_player_joined";
    public readonly args: GetNumPlayerJoinedPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      arg_0: AccountAddressInput // address
    ) {
      super();
      this.args = {
        arg_0: AccountAddress.fromRelaxed(arg_0),
      };
    }
  }
  export type GetNumWinnersPayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class GetNumWinners extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "get_num_winners";
    public readonly args: GetNumWinnersPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      arg_0: AccountAddressInput // address
    ) {
      super();
      this.args = {
        arg_0: AccountAddress.fromRelaxed(arg_0),
      };
    }
  }
  export type GetTournamentStatePayloadMoveArguments = {
    tournament_addr: AccountAddressInput;
  };

  export class GetTournamentState extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "get_tournament_state";
    public readonly args: GetTournamentStatePayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      tournament_addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        tournament_addr: AccountAddress.fromRelaxed(tournament_addr),
      };
    }
  }
}
