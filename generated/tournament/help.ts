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
} from "../../src";
import {
  EntryFunctionArgumentTypes,
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
import { Option, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import {
  ViewFunctionPayloadBuilder,
  EntryFunctionPayloadBuilder,
} from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export type GetCurrentRoundTypePayloadMoveArguments = {
  tournament_addr: AccountAddressInput;
};

/**
 *  public fun get_current_round_type<>(
 *     tournament_addr: address,
 *   )
 **/
export class GetCurrentRoundType extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x4b272129fdeabadae2d61453a1e2693de7758215a3653463e9adffddd3d3a766",
  );
  public readonly moduleName = "help";
  public readonly functionName = "get_current_round_type";
  public readonly args: GetCurrentRoundTypePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    tournament_addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      tournament_addr: AccountAddress.fromRelaxed(tournament_addr),
    };
  }
}
