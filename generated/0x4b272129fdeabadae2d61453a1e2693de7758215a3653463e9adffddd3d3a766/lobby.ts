
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export type ObjectAddress = AccountAddressInput;


export namespace Lobby {
  export type GetCurrentPlayerObjectsIndexingPayloadMoveArguments = {
    tournament_addr: AccountAddressInput;
  };

  export class GetCurrentPlayerObjectsIndexing extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "lobby";
    public readonly functionName = "get_current_player_objects_indexing";
    public readonly args: GetCurrentPlayerObjectsIndexingPayloadMoveArguments;
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
  export type GetNumCurrentPlayerAlivePayloadMoveArguments = {
    tournament_addr: AccountAddressInput;
  };

  export class GetNumCurrentPlayerAlive extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "lobby";
    public readonly functionName = "get_num_current_player_alive";
    public readonly args: GetNumCurrentPlayerAlivePayloadMoveArguments;
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
  export type GetNumPlayersLeftPayloadMoveArguments = {
    tournament_addr: AccountAddressInput;
  };

  export class GetNumPlayersLeft extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "lobby";
    public readonly functionName = "get_num_players_left";
    public readonly args: GetNumPlayersLeftPayloadMoveArguments;
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
  export type GetNumRoomsPayloadMoveArguments = {
    tournament_addr: AccountAddressInput;
  };

  export class GetNumRooms extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "lobby";
    public readonly functionName = "get_num_rooms";
    public readonly args: GetNumRoomsPayloadMoveArguments;
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
  export type GetPlayersByRoomPayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class GetPlayersByRoom extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "lobby";
    public readonly functionName = "get_players_by_room";
    public readonly args: GetPlayersByRoomPayloadMoveArguments;
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
  export type GetRoomsPayloadMoveArguments = {
    tournament_addr: AccountAddressInput;
  };

  export class GetRooms extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "lobby";
    public readonly functionName = "get_rooms";
    public readonly args: GetRoomsPayloadMoveArguments;
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
  export type LobbyExistsPayloadMoveArguments = {
    tournament_addr: AccountAddressInput;
  };

  export class LobbyExists extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "lobby";
    public readonly functionName = "lobby_exists";
    public readonly args: LobbyExistsPayloadMoveArguments;
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
  export type RoomExistsPayloadMoveArguments = {
    room_addr: AccountAddressInput;
  };

  export class RoomExists extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "lobby";
    public readonly functionName = "room_exists";
    public readonly args: RoomExistsPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      room_addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        room_addr: AccountAddress.fromRelaxed(room_addr),
      };
    }
  }
}
