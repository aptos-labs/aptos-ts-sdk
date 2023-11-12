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

export type CreateGamePayloadMoveArguments = {
  args: MoveVector<MoveString>;
  player_tokens: MoveVector<MoveObject>;
};

/**
 *  public fun create_game<>(
 *     room: &signer,
 *     args: vector<String>,
 *     player_tokens: vector<Object<Token>>,
 *   )
 **/
export class CreateGame extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "create_game";
  public readonly args: CreateGamePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    room: Account, // &signer
    args: Array<string>, // vector<String>
    player_tokens: Array<ObjectAddress>, // vector<Object<Token>>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      args: new MoveVector(args.map((argA) => new MoveString(argA))),
      player_tokens: new MoveVector(player_tokens.map((argA) => AccountAddress.fromRelaxed(argA))),
    };
  }
}
export type RevealAnswerPayloadMoveArguments = {
  game_address: AccountAddress;
  revealed_answer: MoveString;
};

/**
 *  public fun reveal_answer<>(
 *     game_creator: &signer,
 *     game_address: address,
 *     revealed_answer: String,
 *   )
 **/
export class RevealAnswer extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "reveal_answer";
  public readonly args: RevealAnswerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    game_creator: Account, // &signer
    game_address: AccountAddressInput, // address
    revealed_answer: string, // String
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address),
      revealed_answer: new MoveString(revealed_answer),
    };
  }
}
export type AnswerPayloadMoveArguments = {
  player_obj: MoveObject;
  submitted_answer: MoveString;
};

/**
 *  private fun answer<>(
 *     user: &signer,
 *     player_obj: Object<Token>,
 *     submitted_answer: String,
 *   )
 **/
export class Answer extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "answer";
  public readonly args: AnswerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    user: Account, // &signer
    player_obj: ObjectAddress, // Object<Token>
    submitted_answer: string, // String
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      player_obj: AccountAddress.fromRelaxed(player_obj),
      submitted_answer: new MoveString(submitted_answer),
    };
  }
}

export type GetResultsPayloadMoveArguments = {
  game_address: AccountAddressInput;
};

/**
 *  public fun get_results<>(
 *     game_address: address,
 *   )
 **/
export class GetResults extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "get_results";
  public readonly args: GetResultsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    game_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address),
    };
  }
}
export type IsGamePayloadMoveArguments = {
  game_addr: AccountAddressInput;
};

/**
 *  public fun is_game<>(
 *     game_addr: address,
 *   )
 **/
export class IsGame extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "is_game";
  public readonly args: IsGamePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    game_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      game_addr: AccountAddress.fromRelaxed(game_addr),
    };
  }
}
export type IsTriviaPayloadMoveArguments = {
  trivia_addr: AccountAddressInput;
};

/**
 *  public fun is_trivia<>(
 *     trivia_addr: address,
 *   )
 **/
export class IsTrivia extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "is_trivia";
  public readonly args: IsTriviaPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    trivia_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      trivia_addr: AccountAddress.fromRelaxed(trivia_addr),
    };
  }
}
export type ViewGamePayloadMoveArguments = {
  game_addr: AccountAddressInput;
};

/**
 *  public fun view_game<>(
 *     game_addr: address,
 *   )
 **/
export class ViewGame extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "view_game";
  public readonly args: ViewGamePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    game_addr: AccountAddressInput, // address
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

/**
 *  public fun view_player_and_trivia<>(
 *     trivia_player_addr: address,
 *   )
 **/
export class ViewPlayerAndTrivia extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "view_player_and_trivia";
  public readonly args: ViewPlayerAndTriviaPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    trivia_player_addr: AccountAddressInput, // address
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

/**
 *  public fun view_revealed_answer<>(
 *     trivia_addr: address,
 *   )
 **/
export class ViewRevealedAnswer extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "view_revealed_answer";
  public readonly args: ViewRevealedAnswerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    trivia_addr: AccountAddressInput, // address
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

/**
 *  public fun view_trivia<>(
 *     trivia_addr: address,
 *   )
 **/
export class ViewTrivia extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "view_trivia";
  public readonly args: ViewTriviaPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    trivia_addr: AccountAddressInput, // address
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

/**
 *  public fun view_trivia_player<>(
 *     trivia_player_addr: address,
 *   )
 **/
export class ViewTriviaPlayer extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "trivia";
  public readonly functionName = "view_trivia_player";
  public readonly args: ViewTriviaPlayerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    trivia_player_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      trivia_player_addr: AccountAddress.fromRelaxed(trivia_player_addr),
    };
  }
}
