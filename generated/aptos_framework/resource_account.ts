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

export type CreateResourceAccountPayloadMoveArguments = {
  seed: MoveVector<U8>;
  optional_auth_key: MoveVector<U8>;
};

/**
 *  public fun create_resource_account<>(
 *     origin: &signer,
 *     seed: vector<u8>,
 *     optional_auth_key: vector<u8>,
 *   )
 **/
export class CreateResourceAccount extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "resource_account";
  public readonly functionName = "create_resource_account";
  public readonly args: CreateResourceAccountPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // origin: &signer,
    seed: HexInput, // vector<u8>
    optional_auth_key: HexInput, // vector<u8>
  ) {
    super();
    this.args = {
      seed: MoveVector.U8(seed),
      optional_auth_key: MoveVector.U8(optional_auth_key),
    };
  }
}
export type CreateResourceAccountAndFundPayloadMoveArguments = {
  seed: MoveVector<U8>;
  optional_auth_key: MoveVector<U8>;
  fund_amount: U64;
};

/**
 *  public fun create_resource_account_and_fund<>(
 *     origin: &signer,
 *     seed: vector<u8>,
 *     optional_auth_key: vector<u8>,
 *     fund_amount: u64,
 *   )
 **/
export class CreateResourceAccountAndFund extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "resource_account";
  public readonly functionName = "create_resource_account_and_fund";
  public readonly args: CreateResourceAccountAndFundPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // origin: &signer,
    seed: HexInput, // vector<u8>
    optional_auth_key: HexInput, // vector<u8>
    fund_amount: Uint64, // u64
  ) {
    super();
    this.args = {
      seed: MoveVector.U8(seed),
      optional_auth_key: MoveVector.U8(optional_auth_key),
      fund_amount: new U64(fund_amount),
    };
  }
}
export type CreateResourceAccountAndPublishPackagePayloadMoveArguments = {
  seed: MoveVector<U8>;
  metadata_serialized: MoveVector<U8>;
  code: MoveVector<MoveVector<U8>>;
};

/**
 *  public fun create_resource_account_and_publish_package<>(
 *     origin: &signer,
 *     seed: vector<u8>,
 *     metadata_serialized: vector<u8>,
 *     code: vector<vector<u8>>,
 *   )
 **/
export class CreateResourceAccountAndPublishPackage extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "resource_account";
  public readonly functionName = "create_resource_account_and_publish_package";
  public readonly args: CreateResourceAccountAndPublishPackagePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // origin: &signer,
    seed: HexInput, // vector<u8>
    metadata_serialized: HexInput, // vector<u8>
    code: Array<HexInput>, // vector<vector<u8>>
  ) {
    super();
    this.args = {
      seed: MoveVector.U8(seed),
      metadata_serialized: MoveVector.U8(metadata_serialized),
      code: new MoveVector(code.map((argA) => MoveVector.U8(argA))),
    };
  }
}
