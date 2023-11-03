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
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";

export namespace TournamentManager {
  // let tournament_creator: AccountAuthenticator | undefined; // &signer
  export type InitializeTournamentPayloadBCSArguments = {
    tournament_name: MoveString;
    max_players: U64;
    num_winners: U64;
    time_between_rounds_secs: U64;
  };

  export class InitializeTournament extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "initialize_tournament";
    public readonly args: InitializeTournamentPayloadBCSArguments;

    constructor(
      tournament_name: string, // 0x1::string::String
      max_players: Uint64, // u64
      num_winners: Uint64, // u64
      time_between_rounds_secs: Uint64, // u64
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
  // let player: AccountAuthenticator | undefined; // &signer
  export type JoinTournamentPayloadBCSArguments = {
    tournament_address: AccountAddress;
    player_name: MoveString;
  };

  export class JoinTournament extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "join_tournament";
    public readonly args: JoinTournamentPayloadBCSArguments;

    constructor(
      tournament_address: AccountAddressInput, // address
      player_name: string, // 0x1::string::String
    ) {
      super();
      this.args = {
        tournament_address: AccountAddress.fromRelaxed(tournament_address),
        player_name: new MoveString(player_name),
      };
    }
  }
  // let tournament_creator: AccountAuthenticator | undefined; // &signer
  export type StartNewRoundPayloadBCSArguments = {
    tournament_address: AccountAddress;
  };

  export class StartNewRound extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "tournament_manager";
    public readonly functionName = "start_new_round";
    public readonly args: StartNewRoundPayloadBCSArguments;

    constructor(
      tournament_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        tournament_address: AccountAddress.fromRelaxed(tournament_address),
      };
    }
  }
}
