
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0


/* eslint-disable max-len */
import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, Account, InputTypes, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";



export namespace PrimaryFungibleStore {
  export namespace EntryFunctions {
    export type TransferPayloadMoveArguments = {
      arg_1: MoveObject;
      arg_2: AccountAddress;
      arg_3: U64;
    };

    /**
     *  public fun transfer<T0: key>(
     *     arg_0: &signer,
     *     arg_1: Object<T0>,
     *     arg_2: address,
     *     arg_3: u64,
     *   )
     **/
    export class Transfer extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "primary_fungible_store";
      public readonly functionName = "transfer";
      public readonly args: TransferPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        arg_0: Account, // &signer
        arg_1: ObjectAddress, // Object<T0>
        arg_2: AccountAddressInput, // address
        arg_3: Uint64, // u64
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
          arg_2: AccountAddress.fromRelaxed(arg_2),
          arg_3: new U64(arg_3),
        };
      }
    }
  }
  export namespace ViewFunctions {
    export type BalancePayloadMoveArguments = {
      account: AccountAddressInput;
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun balance<T0: key>(
     *     account: address,
     *     metadata: Object<T0>,
     *   )
     **/
    export class Balance extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "primary_fungible_store";
      public readonly functionName = "balance";
      public readonly args: BalancePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        account: AccountAddressInput, // address
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput> // T0: key
      ) {
        super();
        this.args = {
          account: AccountAddress.fromRelaxed(account),
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }
    export type IsFrozenPayloadMoveArguments = {
      account: AccountAddressInput;
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun is_frozen<T0: key>(
     *     account: address,
     *     metadata: Object<T0>,
     *   )
     **/
    export class IsFrozen extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "primary_fungible_store";
      public readonly functionName = "is_frozen";
      public readonly args: IsFrozenPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        account: AccountAddressInput, // address
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput> // T0: key
      ) {
        super();
        this.args = {
          account: AccountAddress.fromRelaxed(account),
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }
    export type PrimaryStorePayloadMoveArguments = {
      arg_0: AccountAddressInput;
      arg_1: ObjectAddress;
    };

    /**
     *  public fun primary_store<T0: key>(
     *     arg_0: address,
     *     arg_1: Object<T0>,
     *   )
     **/
    export class PrimaryStore extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "primary_fungible_store";
      public readonly functionName = "primary_store";
      public readonly args: PrimaryStorePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        arg_0: AccountAddressInput, // address
        arg_1: ObjectAddress // Object<T0>
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
          arg_1: AccountAddress.fromRelaxed(arg_1),
        };
      }
    }
    export type PrimaryStoreAddressPayloadMoveArguments = {
      owner: AccountAddressInput;
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun primary_store_address<T0: key>(
     *     owner: address,
     *     metadata: Object<T0>,
     *   )
     **/
    export class PrimaryStoreAddress extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "primary_fungible_store";
      public readonly functionName = "primary_store_address";
      public readonly args: PrimaryStoreAddressPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        owner: AccountAddressInput, // address
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput> // T0: key
      ) {
        super();
        this.args = {
          owner: AccountAddress.fromRelaxed(owner),
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }
    export type PrimaryStoreExistsPayloadMoveArguments = {
      owner: AccountAddressInput;
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun primary_store_exists<T0: key>(
     *     owner: address,
     *     metadata: Object<T0>,
     *   )
     **/
    export class PrimaryStoreExists extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "primary_fungible_store";
      public readonly functionName = "primary_store_exists";
      public readonly args: PrimaryStoreExistsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        owner: AccountAddressInput, // address
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput> // T0: key
      ) {
        super();
        this.args = {
          owner: AccountAddress.fromRelaxed(owner),
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }
  }
}
