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

/**
 *  public fun is_genesis<>(
 *   )
 **/
export class IsGenesis extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "chain_status";
  public readonly functionName = "is_genesis";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}

/**
 *  public fun is_operating<>(
 *   )
 **/
export class IsOperating extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "chain_status";
  public readonly functionName = "is_operating";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
