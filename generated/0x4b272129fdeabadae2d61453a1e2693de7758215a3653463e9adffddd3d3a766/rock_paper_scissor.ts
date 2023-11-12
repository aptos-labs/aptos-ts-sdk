
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export type ObjectAddress = AccountAddressInput;


export namespace RockPaperScissor {
  // let player: AccountAuthenticator; // &signer
  export type CommitActionPayloadMoveArguments = {
    player_obj: MoveObject;
    action_hash: MoveVector<U8>;
  };

  export class CommitAction extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "commit_action";
    public readonly args: CommitActionPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      // player: &signer,
      player_obj: ObjectAddress, // 0x1::object::Object<0x4::token::Token>
      action_hash: HexInput // vector<u8>
    ) {
      super();
      this.args = {
        player_obj: AccountAddress.fromRelaxed(player_obj),
        action_hash: MoveVector.U8(action_hash),
      };
    }
  }
  // let room_obj: AccountAuthenticator; // &signer
  export type CreateGamePayloadMoveArguments = {
    tokens: MoveVector<MoveObject>;
  };

  export class CreateGame extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "create_game";
    public readonly args: CreateGamePayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      // room_obj: &signer,
      tokens: Array<ObjectAddress> // vector<0x1::object::Object<0x4::token::Token>>
    ) {
      super();
      this.args = {
        tokens: new MoveVector(
          tokens.map((argA) => AccountAddress.fromRelaxed(argA))
        ),
      };
    }
  }
  // let player: AccountAuthenticator; // &signer
  export type VerifyActionPayloadMoveArguments = {
    player_obj: MoveObject;
    action: MoveVector<U8>;
    hash_addition: MoveVector<U8>;
  };

  export class VerifyAction extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "verify_action";
    public readonly args: VerifyActionPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      // player: &signer,
      player_obj: ObjectAddress, // 0x1::object::Object<0x4::token::Token>
      action: HexInput, // vector<u8>
      hash_addition: HexInput // vector<u8>
    ) {
      super();
      this.args = {
        player_obj: AccountAddress.fromRelaxed(player_obj),
        action: MoveVector.U8(action),
        hash_addition: MoveVector.U8(hash_addition),
      };
    }
  }

  export type GameStatusPayloadMoveArguments = {
    player_address: AccountAddressInput;
  };

  export class GameStatus extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "game_status";
    public readonly args: GameStatusPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      player_address: AccountAddressInput // address
    ) {
      super();
      this.args = {
        player_address: AccountAddress.fromRelaxed(player_address),
      };
    }
  }
  export type GetGameAddressPayloadMoveArguments = {
    creator_address: AccountAddressInput;
    seed: HexInput;
  };

  export class GetGameAddress extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "get_game_address";
    public readonly args: GetGameAddressPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      creator_address: AccountAddressInput, // address
      seed: HexInput // vector<u8>
    ) {
      super();
      this.args = {
        creator_address: AccountAddress.fromRelaxed(creator_address),
        seed: Hex.fromHexInput(seed),
      };
    }
  }
  export type GetGameAddressForPlayerPayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class GetGameAddressForPlayer extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "get_game_address_for_player";
    public readonly args: GetGameAddressForPlayerPayloadMoveArguments;
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
  export type GetPlayerRpsStatePayloadMoveArguments = {
    player_token: ObjectAddress;
  };

  export class GetPlayerRpsState extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "get_player_rps_state";
    public readonly args: GetPlayerRpsStatePayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      player_token: ObjectAddress // 0x1::object::Object<0x4::token::Token>
    ) {
      super();
      this.args = {
        player_token: AccountAddress.fromRelaxed(player_token),
      };
    }
  }
  export type GetResultsPayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class GetResults extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "get_results";
    public readonly args: GetResultsPayloadMoveArguments;
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
  export type GetResultsAsPlayersPayloadMoveArguments = {
    game_address: AccountAddressInput;
  };

  export class GetResultsAsPlayers extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "get_results_as_players";
    public readonly args: GetResultsAsPlayersPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      game_address: AccountAddressInput // address
    ) {
      super();
      this.args = {
        game_address: AccountAddress.fromRelaxed(game_address),
      };
    }
  }
  export type GetResultsForcePayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class GetResultsForce extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "get_results_force";
    public readonly args: GetResultsForcePayloadMoveArguments;
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
  export type IsGameCommittedPayloadMoveArguments = {
    game_address: AccountAddressInput;
  };

  export class IsGameCommitted extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "is_game_committed";
    public readonly args: IsGameCommittedPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      game_address: AccountAddressInput // address
    ) {
      super();
      this.args = {
        game_address: AccountAddress.fromRelaxed(game_address),
      };
    }
  }
  export type IsGameCompletePayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class IsGameComplete extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "is_game_complete";
    public readonly args: IsGameCompletePayloadMoveArguments;
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
  export type PlayerExistsPayloadMoveArguments = {
    addr: AccountAddressInput;
  };

  export class PlayerExists extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "player_exists";
    public readonly args: PlayerExistsPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        addr: AccountAddress.fromRelaxed(addr),
      };
    }
  }
  export type ViewGamePayloadMoveArguments = {
    game_address: AccountAddressInput;
  };

  export class ViewGame extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "view_game";
    public readonly args: ViewGamePayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      game_address: AccountAddressInput // address
    ) {
      super();
      this.args = {
        game_address: AccountAddress.fromRelaxed(game_address),
      };
    }
  }
}
