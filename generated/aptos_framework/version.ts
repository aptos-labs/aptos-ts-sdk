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

export type SetVersionPayloadMoveArguments = {
  major: U64;
};

/**
 *  public fun set_version<>(
 *     account: &signer,
 *     major: u64,
 *   )
 **/
export class SetVersion extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "version";
  public readonly functionName = "set_version";
  public readonly args: SetVersionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    account: Account, // &signer
    major: Uint64, // u64
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      major: new U64(major),
    };
  }
}
