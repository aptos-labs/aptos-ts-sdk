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

export namespace RockPaperScissor {
  export type CommitActionPayloadBCSArguments = {
    player: AccountAddress;
    game_address: MoveVector<U8>;
  };

  export class CommitAction extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "commit_action";
    public readonly args: CommitActionPayloadBCSArguments;

    constructor(
      player: AccountAddressInput, // address
      game_address: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        player: AccountAddress.fromRelaxed(player),
        game_address: MoveVector.U8(game_address),
      };
    }
  }
  export type CreateGamePayloadBCSArguments = {
    room_obj: AccountAddress;
    player1_address: AccountAddress;
    player2_address: AccountAddress;
    token1_address: AccountAddress;
  };

  export class CreateGame extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "create_game";
    public readonly args: CreateGamePayloadBCSArguments;

    constructor(
      room_obj: AccountAddressInput, // address
      player1_address: AccountAddressInput, // address
      player2_address: AccountAddressInput, // address
      token1_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        room_obj: AccountAddress.fromRelaxed(room_obj),
        player1_address: AccountAddress.fromRelaxed(player1_address),
        player2_address: AccountAddress.fromRelaxed(player2_address),
        token1_address: AccountAddress.fromRelaxed(token1_address),
      };
    }
  }
  export type ResetGamePayloadBCSArguments = {
    game_address: AccountAddress;
  };

  export class ResetGame extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "reset_game";
    public readonly args: ResetGamePayloadBCSArguments;

    constructor(
      game_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        game_address: AccountAddress.fromRelaxed(game_address),
      };
    }
  }
  export type VerifyActionPayloadBCSArguments = {
    player: AccountAddress;
    game_address: MoveVector<U8>;
    action: MoveVector<U8>;
  };

  export class VerifyAction extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x0a56e8b03118e51cf88140e5e18d1f764e0a1048c23e7c56bd01bd5b76993451",
    );
    public readonly moduleName = "rock_paper_scissor";
    public readonly functionName = "verify_action";
    public readonly args: VerifyActionPayloadBCSArguments;

    constructor(
      player: AccountAddressInput, // address
      game_address: HexInput, // vector<u8>
      action: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        player: AccountAddress.fromRelaxed(player),
        game_address: MoveVector.U8(game_address),
        action: MoveVector.U8(action),
      };
    }
  }
}
