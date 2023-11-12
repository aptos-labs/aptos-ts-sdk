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

export namespace AptosCoin {
  export namespace EntryFunctions {
    /**
     *  public fun claim_mint_capability<>(
     *     account: &signer,
     *   )
     **/
    export class ClaimMintCapability extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_coin";
      public readonly functionName = "claim_mint_capability";
      public readonly args = {};
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor() {
        super();
        this.args = {};
      }
    }
    export type DelegateMintCapabilityPayloadMoveArguments = {
      to: AccountAddress;
    };

    /**
     *  public fun delegate_mint_capability<>(
     *     account: signer,
     *     to: address,
     *   )
     **/
    export class DelegateMintCapability extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_coin";
      public readonly functionName = "delegate_mint_capability";
      public readonly args: DelegateMintCapabilityPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // signer
        to: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          to: AccountAddress.fromRelaxed(to),
        };
      }
    }
    export type MintPayloadMoveArguments = {
      arg_1: AccountAddress;
      arg_2: U64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun mint<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *     arg_2: u64,
     *   )
     **/
    export class Mint extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_coin";
      public readonly functionName = "mint";
      public readonly args: MintPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: Account, // &signer
        arg_1: AccountAddressInput, // address
        arg_2: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
          arg_2: new U64(arg_2),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
  }
  export namespace ViewFunctions {}
}
