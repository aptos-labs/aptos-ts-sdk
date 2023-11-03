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

export namespace TournamentManager {
  export type InitializeTournamentPayloadBCSArguments = {
    tournament_creator: MoveString;
    tournament_name: U64;
    max_players: U64;
    num_winners: U64;
  };

  export class InitializeTournament extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "initialize_tournament";
    public readonly args: InitializeTournamentPayloadBCSArguments;

    constructor(
      tournament_creator: string, // 0x1::string::String
      tournament_name: Uint64, // u64
      max_players: Uint64, // u64
      num_winners: Uint64, // u64
    ) {
      super();
      this.args = {
        tournament_creator: new MoveString(tournament_creator),
        tournament_name: new U64(tournament_name),
        max_players: new U64(max_players),
        num_winners: new U64(num_winners),
      };
    }
  }
  export type JoinTournamentPayloadBCSArguments = {
    player: AccountAddress;
    tournament_address: MoveString;
  };

  export class JoinTournament extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "join_tournament";
    public readonly args: JoinTournamentPayloadBCSArguments;

    constructor(
      player: AccountAddressInput, // address
      tournament_address: string, // 0x1::string::String
    ) {
      super();
      this.args = {
        player: AccountAddress.fromRelaxed(player),
        tournament_address: new MoveString(tournament_address),
      };
    }
  }
  export type StartNewRoundPayloadBCSArguments = {
    tournament_creator: AccountAddress;
  };

  export class StartNewRound extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "start_new_round";
    public readonly args: StartNewRoundPayloadBCSArguments;

    constructor(
      tournament_creator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        tournament_creator: AccountAddress.fromRelaxed(tournament_creator),
      };
    }
  }
}
