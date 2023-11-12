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

export namespace ManagedCoin {
  export namespace EntryFunctions {
    export type BurnPayloadMoveArguments = {
      amount: U64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun burn<>(
     *     account: &signer,
     *     amount: u64,
     *   )
     **/
    export class Burn extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "managed_coin";
      public readonly functionName = "burn";
      public readonly args: BurnPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        amount: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          amount: new U64(amount),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type InitializePayloadMoveArguments = {
      name: MoveVector<U8>;
      symbol: MoveVector<U8>;
      decimals: U8;
      monitor_supply: Bool;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun initialize<>(
     *     account: &signer,
     *     name: vector<u8>,
     *     symbol: vector<u8>,
     *     decimals: u8,
     *     monitor_supply: bool,
     *   )
     **/
    export class Initialize extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "managed_coin";
      public readonly functionName = "initialize";
      public readonly args: InitializePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        name: HexInput, // vector<u8>
        symbol: HexInput, // vector<u8>
        decimals: Uint8, // u8
        monitor_supply: boolean, // bool
        typeTags: Array<TypeTagInput>, //
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          name: MoveVector.U8(name),
          symbol: MoveVector.U8(symbol),
          decimals: new U8(decimals),
          monitor_supply: new Bool(monitor_supply),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type MintPayloadMoveArguments = {
      dst_addr: AccountAddress;
      amount: U64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun mint<>(
     *     account: &signer,
     *     dst_addr: address,
     *     amount: u64,
     *   )
     **/
    export class Mint extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "managed_coin";
      public readonly functionName = "mint";
      public readonly args: MintPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        dst_addr: AccountAddressInput, // address
        amount: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          dst_addr: AccountAddress.fromRelaxed(dst_addr),
          amount: new U64(amount),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }

    /**
     *  public fun register<>(
     *     account: &signer,
     *   )
     **/
    export class Register extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "managed_coin";
      public readonly functionName = "register";
      public readonly args = {};
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor() {
        super();
        this.args = {};
      }
    }
  }
  export namespace ViewFunctions {}
}
