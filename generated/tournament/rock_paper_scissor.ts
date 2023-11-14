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

export type CommitActionPayloadMoveArguments = {
  game_address: AccountAddress;
  action_hash: MoveVector<U8>;
};

/**
 *  public fun commit_action(
 *     player: &signer,
 *     game_address: address,
 *     action_hash: vector<u8>,
 *   )
 **/
export class CommitAction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "commit_action";
  public readonly args: CommitActionPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // player: &signer,
    game_address: AccountAddressInput, // address
    action_hash: HexInput, // vector<u8>
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address),
      action_hash: MoveVector.U8(action_hash),
    };
  }
}
export type VerifyActionPayloadMoveArguments = {
  game_address: AccountAddress;
  action: MoveVector<U8>;
  hash_addition: MoveVector<U8>;
};

/**
 *  public fun verify_action(
 *     player: &signer,
 *     game_address: address,
 *     action: vector<u8>,
 *     hash_addition: vector<u8>,
 *   )
 **/
export class VerifyAction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "verify_action";
  public readonly args: VerifyActionPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // player: &signer,
    game_address: AccountAddressInput, // address
    action: HexInput, // vector<u8>
    hash_addition: HexInput, // vector<u8>
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address),
      action: MoveVector.U8(action),
      hash_addition: MoveVector.U8(hash_addition),
    };
  }
}

export type GameStatusPayloadMoveArguments = {
  player_address: string;
  game_address: string;
};

/**
 *  public fun game_status(
 *     player_address: address,
 *     game_address: address,
 *   )
 **/
export class GameStatus extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "game_status";
  public readonly args: GameStatusPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    player_address: AccountAddressInput, // address
    game_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      player_address: AccountAddress.fromRelaxed(player_address).toString(),
      game_address: AccountAddress.fromRelaxed(game_address).toString(),
    };
  }
}
export type GetGameAddressPayloadMoveArguments = {
  creator_address: string;
  seed: HexInput;
};

/**
 *  public fun get_game_address(
 *     creator_address: address,
 *     seed: vector<u8>,
 *   )
 **/
export class GetGameAddress extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "get_game_address";
  public readonly args: GetGameAddressPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    creator_address: AccountAddressInput, // address
    seed: HexInput, // vector<u8>
  ) {
    super();
    this.args = {
      creator_address: AccountAddress.fromRelaxed(creator_address).toString(),
      seed: Hex.fromHexInput(seed).toString(),
    };
  }
}
export type GetPlayerRpsStatePayloadMoveArguments = {
  room_address: string;
};

/**
 *  public fun get_player_rps_state(
 *     room_address: address,
 *   )
 **/
export class GetPlayerRpsState extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "get_player_rps_state";
  public readonly args: GetPlayerRpsStatePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    room_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      room_address: AccountAddress.fromRelaxed(room_address).toString(),
    };
  }
}
export type GetResultsPayloadMoveArguments = {
  game_address: string;
};

/**
 *  public fun get_results(
 *     game_address: address,
 *   )
 **/
export class GetResults extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "get_results";
  public readonly args: GetResultsPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    game_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address).toString(),
    };
  }
}
export type GetResultsAsPlayersPayloadMoveArguments = {
  game_address: string;
};

/**
 *  public fun get_results_as_players(
 *     game_address: address,
 *   )
 **/
export class GetResultsAsPlayers extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "get_results_as_players";
  public readonly args: GetResultsAsPlayersPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    game_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address).toString(),
    };
  }
}
export type GetResultsForcePayloadMoveArguments = {
  game_address: string;
};

/**
 *  public fun get_results_force(
 *     game_address: address,
 *   )
 **/
export class GetResultsForce extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "get_results_force";
  public readonly args: GetResultsForcePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    game_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address).toString(),
    };
  }
}
export type IsGameCommittedPayloadMoveArguments = {
  game_address: string;
};

/**
 *  public fun is_game_committed(
 *     game_address: address,
 *   )
 **/
export class IsGameCommitted extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "is_game_committed";
  public readonly args: IsGameCommittedPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    game_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address).toString(),
    };
  }
}
export type IsGameCompletePayloadMoveArguments = {
  game_address: string;
};

/**
 *  public fun is_game_complete(
 *     game_address: address,
 *   )
 **/
export class IsGameComplete extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "is_game_complete";
  public readonly args: IsGameCompletePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    game_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address).toString(),
    };
  }
}
export type ViewGamePayloadMoveArguments = {
  room_address: string;
};

/**
 *  public fun view_game(
 *     room_address: address,
 *   )
 **/
export class ViewGame extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "view_game";
  public readonly args: ViewGamePayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    room_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      room_address: AccountAddress.fromRelaxed(room_address).toString(),
    };
  }
}
