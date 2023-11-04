
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace RockPaperScissor {
// let player: AccountAuthenticator | undefined; // &signer
export type CommitActionPayloadBCSArguments = {
  game_address: AccountAddress;
  action_hash: MoveVector<U8>;
};

export class CommitAction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0xa7693d83e4436fbac2f7fd478d468aec6386466a9506e6696751c99cb7b4cd44"
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "commit_action";
  public readonly args: CommitActionPayloadBCSArguments;

  constructor(
    game_address: AccountAddressInput, // address
    action_hash: HexInput // vector<u8>
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address),
      action_hash: MoveVector.U8(action_hash),
    };
  }
}

// let room_obj: AccountAuthenticator | undefined; // &signer
export type CreateGamePayloadBCSArguments = {
  player1_address: AccountAddress;
  player2_address: AccountAddress;
  token1_address: AccountAddress;
  token2_address: AccountAddress;
};

export class CreateGame extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0xa7693d83e4436fbac2f7fd478d468aec6386466a9506e6696751c99cb7b4cd44"
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "create_game";
  public readonly args: CreateGamePayloadBCSArguments;

  constructor(
    player1_address: AccountAddressInput, // address
    player2_address: AccountAddressInput, // address
    token1_address: AccountAddressInput, // address
    token2_address: AccountAddressInput // address
  ) {
    super();
    this.args = {
      player1_address: AccountAddress.fromRelaxed(player1_address),
      player2_address: AccountAddress.fromRelaxed(player2_address),
      token1_address: AccountAddress.fromRelaxed(token1_address),
      token2_address: AccountAddress.fromRelaxed(token2_address),
    };
  }
}

export type ResetGamePayloadBCSArguments = {
  game_address: AccountAddress;
};

export class ResetGame extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0xa7693d83e4436fbac2f7fd478d468aec6386466a9506e6696751c99cb7b4cd44"
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "reset_game";
  public readonly args: ResetGamePayloadBCSArguments;

  constructor(
    game_address: AccountAddressInput // address
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address),
    };
  }
}

// let player: AccountAuthenticator | undefined; // &signer
export type VerifyActionPayloadBCSArguments = {
  game_address: AccountAddress;
  action: MoveVector<U8>;
  hash_addition: MoveVector<U8>;
};

export class VerifyAction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0xa7693d83e4436fbac2f7fd478d468aec6386466a9506e6696751c99cb7b4cd44"
  );
  public readonly moduleName = "rock_paper_scissor";
  public readonly functionName = "verify_action";
  public readonly args: VerifyActionPayloadBCSArguments;

  constructor(
    game_address: AccountAddressInput, // address
    action: HexInput, // vector<u8>
    hash_addition: HexInput // vector<u8>
  ) {
    super();
    this.args = {
      game_address: AccountAddress.fromRelaxed(game_address),
      action: MoveVector.U8(action),
      hash_addition: MoveVector.U8(hash_addition),
    };
  }
}


}