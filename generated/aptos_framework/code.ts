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

export namespace Code {
  export namespace EntryFunctions {
    export type PublishPackageTxnPayloadMoveArguments = {
      metadata_serialized: MoveVector<U8>;
      code: MoveVector<MoveVector<U8>>;
    };

    /**
     *  public fun publish_package_txn<>(
     *     owner: &signer,
     *     metadata_serialized: vector<u8>,
     *     code: vector<vector<u8>>,
     *   )
     **/
    export class PublishPackageTxn extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "code";
      public readonly functionName = "publish_package_txn";
      public readonly args: PublishPackageTxnPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        owner: Account, // &signer
        metadata_serialized: HexInput, // vector<u8>
        code: Array<HexInput>, // vector<vector<u8>>
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          metadata_serialized: MoveVector.U8(metadata_serialized),
          code: new MoveVector(code.map((argA) => MoveVector.U8(argA))),
        };
      }
    }
  }
  export namespace ViewFunctions {}
}
