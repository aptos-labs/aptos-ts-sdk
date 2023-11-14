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

export type EndMatchmakingPayloadMoveArguments = {
  round_address: AccountAddress;
};

/**
 *  public fun end_matchmaking(
 *     owner: &signer,
 *     round_address: address,
 *   )
 **/
export class EndMatchmaking extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "round";
  public readonly functionName = "end_matchmaking";
  public readonly args: EndMatchmakingPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // owner: &signer,
    round_address: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>,
  ) {
    super();
    this.args = {
      round_address: AccountAddress.fromRelaxed(round_address),
    };
    this.typeTags = typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag));
  }
}
export type EndPlayPayloadMoveArguments = {
  round_address: AccountAddress;
};

/**
 *  public fun end_play(
 *     owner: &signer,
 *     round_address: address,
 *   )
 **/
export class EndPlay extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "round";
  public readonly functionName = "end_play";
  public readonly args: EndPlayPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // owner: &signer,
    round_address: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>,
  ) {
    super();
    this.args = {
      round_address: AccountAddress.fromRelaxed(round_address),
    };
    this.typeTags = typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag));
  }
}
export type StartPlayPayloadMoveArguments = {
  round_address: AccountAddress;
};

/**
 *  public fun start_play(
 *     owner: &signer,
 *     round_address: address,
 *   )
 **/
export class StartPlay extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "round";
  public readonly functionName = "start_play";
  public readonly args: StartPlayPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    // owner: &signer,
    round_address: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>,
  ) {
    super();
    this.args = {
      round_address: AccountAddress.fromRelaxed(round_address),
    };
    this.typeTags = typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag));
  }
}

export type CanPlayerJoinPayloadMoveArguments = {
  round_address: string;
};

/**
 *  public fun can_player_join(
 *     round_address: address,
 *   )
 **/
export class CanPlayerJoin extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "round";
  public readonly functionName = "can_player_join";
  public readonly args: CanPlayerJoinPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    round_address: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>,
  ) {
    super();
    this.args = {
      round_address: AccountAddress.fromRelaxed(round_address).toString(),
    };
    this.typeTags = typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag));
  }
}
export type IsPlayAllowedPayloadMoveArguments = {
  round_address: string;
};

/**
 *  public fun is_play_allowed(
 *     round_address: address,
 *   )
 **/
export class IsPlayAllowed extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "round";
  public readonly functionName = "is_play_allowed";
  public readonly args: IsPlayAllowedPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    round_address: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>,
  ) {
    super();
    this.args = {
      round_address: AccountAddress.fromRelaxed(round_address).toString(),
    };
    this.typeTags = typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag));
  }
}
export type RoundIsPausedPayloadMoveArguments = {
  round_address: string;
};

/**
 *  public fun round_is_paused(
 *     round_address: address,
 *   )
 **/
export class RoundIsPaused extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x74007b85705153d40b88f994876fd2f7e12204f79527b44f71e69a9d34644f18",
  );
  public readonly moduleName = "round";
  public readonly functionName = "round_is_paused";
  public readonly args: RoundIsPausedPayloadMoveArguments;
  public readonly typeTags: Array<TypeTag> = [];

  constructor(
    round_address: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>,
  ) {
    super();
    this.args = {
      round_address: AccountAddress.fromRelaxed(round_address).toString(),
    };
    this.typeTags = typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag));
  }
}
