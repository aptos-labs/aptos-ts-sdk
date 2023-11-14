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

export type EndTournamentPayloadMoveArguments = {
  tournament_address: AccountAddress;
};

/**
 *  public fun end_tournament(
 *     caller: &signer,
 *     tournament_address: address,
 *   )
 **/
export class EndTournament extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "end_tournament";
  public readonly args: EndTournamentPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // caller: &signer,
    tournament_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address),
    };
  }
}
export type InitializeTournamentPayloadMoveArguments = {
  tournament_name: MoveString;
  max_players: U64;
  max_num_winners: U64;
  admin_address: MoveVector<AccountAddress>;
};

/**
 *  public fun initialize_tournament(
 *     tournament_creator: &signer,
 *     tournament_name: String,
 *     max_players: u64,
 *     max_num_winners: u64,
 *     admin_address: Option<address>,
 *   )
 **/
export class InitializeTournament extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "initialize_tournament";
  public readonly args: InitializeTournamentPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // tournament_creator: &signer,
    tournament_name: string, // String
    max_players: Uint64, // u64
    max_num_winners: Uint64, // u64
    admin_address: Option<AccountAddressInput>, // Option<address>
  ) {
    super();
    this.args = {
      tournament_name: new MoveString(tournament_name),
      max_players: new U64(max_players),
      max_num_winners: new U64(max_num_winners),
      admin_address: new MoveVector(admin_address.map((argA) => AccountAddress.fromRelaxed(argA))),
    };
  }
}
export type JoinTournamentPayloadMoveArguments = {
  tournament_address: AccountAddress;
  player_name: MoveString;
};

/**
 *  public fun join_tournament(
 *     player: &signer,
 *     tournament_address: address,
 *     player_name: String,
 *   )
 **/
export class JoinTournament extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "join_tournament";
  public readonly args: JoinTournamentPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // player: &signer,
    tournament_address: AccountAddressInput, // address
    player_name: string, // String
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address),
      player_name: new MoveString(player_name),
    };
  }
}
export type SetTournamentJoinablePayloadMoveArguments = {
  tournament_address: AccountAddress;
};

/**
 *  public fun set_tournament_joinable(
 *     caller: &signer,
 *     tournament_address: address,
 *   )
 **/
export class SetTournamentJoinable extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "set_tournament_joinable";
  public readonly args: SetTournamentJoinablePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // caller: &signer,
    tournament_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address),
    };
  }
}
export type SetTournamentNotJoinablePayloadMoveArguments = {
  tournament_address: AccountAddress;
};

/**
 *  public fun set_tournament_not_joinable(
 *     caller: &signer,
 *     tournament_address: address,
 *   )
 **/
export class SetTournamentNotJoinable extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "set_tournament_not_joinable";
  public readonly args: SetTournamentNotJoinablePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // caller: &signer,
    tournament_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address),
    };
  }
}

export type GetCurrentGameModulePayloadMoveArguments = {
  tournament_address: string;
};

/**
 *  public fun get_current_game_module(
 *     tournament_address: address,
 *   )
 **/
export class GetCurrentGameModule extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_current_game_module";
  public readonly args: GetCurrentGameModulePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    tournament_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address).toString(),
    };
  }
}
export type GetMaxNumWinnersPayloadMoveArguments = {
  tournament_director_addr: string;
};

/**
 *  public fun get_max_num_winners(
 *     tournament_director_addr: address,
 *   )
 **/
export class GetMaxNumWinners extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_max_num_winners";
  public readonly args: GetMaxNumWinnersPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    tournament_director_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_director_addr: AccountAddress.fromRelaxed(tournament_director_addr).toString(),
    };
  }
}
export type GetMaxPlayersPayloadMoveArguments = {
  tournament_director_addr: string;
};

/**
 *  public fun get_max_players(
 *     tournament_director_addr: address,
 *   )
 **/
export class GetMaxPlayers extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_max_players";
  public readonly args: GetMaxPlayersPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    tournament_director_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_director_addr: AccountAddress.fromRelaxed(tournament_director_addr).toString(),
    };
  }
}
export type GetNumPlayerJoinedPayloadMoveArguments = {
  tournament_director_addr: string;
};

/**
 *  public fun get_num_player_joined(
 *     tournament_director_addr: address,
 *   )
 **/
export class GetNumPlayerJoined extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_num_player_joined";
  public readonly args: GetNumPlayerJoinedPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    tournament_director_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_director_addr: AccountAddress.fromRelaxed(tournament_director_addr).toString(),
    };
  }
}
export type GetRoundAddressPayloadMoveArguments = {
  tournament_address: string;
};

/**
 *  public fun get_round_address(
 *     tournament_address: address,
 *   )
 **/
export class GetRoundAddress extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_round_address";
  public readonly args: GetRoundAddressPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    tournament_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_address: AccountAddress.fromRelaxed(tournament_address).toString(),
    };
  }
}
export type GetTournamentStatePayloadMoveArguments = {
  tournament_addr: string;
};

/**
 *  public fun get_tournament_state(
 *     tournament_addr: address,
 *   )
 **/
export class GetTournamentState extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "tournament_manager";
  public readonly functionName = "get_tournament_state";
  public readonly args: GetTournamentStatePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    tournament_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_addr: AccountAddress.fromRelaxed(tournament_addr).toString(),
    };
  }
}
