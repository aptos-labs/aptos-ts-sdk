
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export type ObjectAddress = AccountAddressInput;


export namespace Trivia {
  // let room: AccountAuthenticator; // &signer
  export type CreateGamePayloadMoveArguments = {
    args: MoveVector<MoveString>;
    player_tokens: MoveVector<MoveObject>;
  };

  export class CreateGame extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "trivia";
    public readonly functionName = "create_game";
    public readonly args: CreateGamePayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      // room: &signer,
      args: Array<string>, // vector<0x1::string::String>
      player_tokens: Array<ObjectAddress> // vector<0x1::object::Object<0x4::token::Token>>
    ) {
      super();
      this.args = {
        args: new MoveVector(args.map((argA) => new MoveString(argA))),
        player_tokens: new MoveVector(
          player_tokens.map((argA) => AccountAddress.fromRelaxed(argA))
        ),
      };
    }
  }

  export type GetResultsPayloadMoveArguments = {
    game_address: AccountAddressInput;
  };

  export class GetResults extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "trivia";
    public readonly functionName = "get_results";
    public readonly args: GetResultsPayloadMoveArguments;
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
  export type IsGamePayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class IsGame extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "trivia";
    public readonly functionName = "is_game";
    public readonly args: IsGamePayloadMoveArguments;
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
  export type IsTriviaPayloadMoveArguments = {
    arg_0: AccountAddressInput;
  };

  export class IsTrivia extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "trivia";
    public readonly functionName = "is_trivia";
    public readonly args: IsTriviaPayloadMoveArguments;
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
  export type ViewGamePayloadMoveArguments = {
    game_addr: AccountAddressInput;
  };

  export class ViewGame extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "trivia";
    public readonly functionName = "view_game";
    public readonly args: ViewGamePayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      game_addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        game_addr: AccountAddress.fromRelaxed(game_addr),
      };
    }
  }
  export type ViewPlayerAndTriviaPayloadMoveArguments = {
    trivia_player_addr: AccountAddressInput;
  };

  export class ViewPlayerAndTrivia extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "trivia";
    public readonly functionName = "view_player_and_trivia";
    public readonly args: ViewPlayerAndTriviaPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      trivia_player_addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        trivia_player_addr: AccountAddress.fromRelaxed(trivia_player_addr),
      };
    }
  }
  export type ViewRevealedAnswerPayloadMoveArguments = {
    trivia_addr: AccountAddressInput;
  };

  export class ViewRevealedAnswer extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "trivia";
    public readonly functionName = "view_revealed_answer";
    public readonly args: ViewRevealedAnswerPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      trivia_addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        trivia_addr: AccountAddress.fromRelaxed(trivia_addr),
      };
    }
  }
  export type ViewTriviaPayloadMoveArguments = {
    trivia_addr: AccountAddressInput;
  };

  export class ViewTrivia extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "trivia";
    public readonly functionName = "view_trivia";
    public readonly args: ViewTriviaPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      trivia_addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        trivia_addr: AccountAddress.fromRelaxed(trivia_addr),
      };
    }
  }
  export type ViewTriviaPlayerPayloadMoveArguments = {
    trivia_player_addr: AccountAddressInput;
  };

  export class ViewTriviaPlayer extends ViewFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766"
    );
    public readonly moduleName = "trivia";
    public readonly functionName = "view_trivia_player";
    public readonly args: ViewTriviaPlayerPayloadMoveArguments;
    public readonly typeArgs: Array<TypeTag> = [];

    constructor(
      trivia_player_addr: AccountAddressInput // address
    ) {
      super();
      this.args = {
        trivia_player_addr: AccountAddress.fromRelaxed(trivia_player_addr),
      };
    }
  }
}
