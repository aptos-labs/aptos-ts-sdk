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
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";

export namespace ResourceAccount {
  // let origin: AccountAuthenticator | undefined; // &signer
  export type CreateResourceAccountPayloadBCSArguments = {
    seed: MoveVector<U8>;
    optional_auth_key: MoveVector<U8>;
  };

  export class CreateResourceAccount extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "resource_account";
    public readonly functionName = "create_resource_account";
    public readonly args: CreateResourceAccountPayloadBCSArguments;

    constructor(
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
  // let origin: AccountAuthenticator | undefined; // &signer
  export type CreateResourceAccountAndFundPayloadBCSArguments = {
    seed: MoveVector<U8>;
    optional_auth_key: MoveVector<U8>;
    fund_amount: U64;
  };

  export class CreateResourceAccountAndFund extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "resource_account";
    public readonly functionName = "create_resource_account_and_fund";
    public readonly args: CreateResourceAccountAndFundPayloadBCSArguments;

    constructor(
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
  // let origin: AccountAuthenticator | undefined; // &signer
  export type CreateResourceAccountAndPublishPackagePayloadBCSArguments = {
    seed: MoveVector<U8>;
    metadata_serialized: MoveVector<U8>;
    code: MoveVector<MoveVector<U8>>;
  };

  export class CreateResourceAccountAndPublishPackage extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "resource_account";
    public readonly functionName = "create_resource_account_and_publish_package";
    public readonly args: CreateResourceAccountAndPublishPackagePayloadBCSArguments;

    constructor(
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
}
