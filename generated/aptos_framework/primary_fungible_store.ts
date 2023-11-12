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

export namespace PrimaryFungibleStore {
  export namespace EntryFunctions {
    export type TransferPayloadMoveArguments = {
      metadata: MoveObject;
      recipient: AccountAddress;
      amount: U64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun transfer<T0: key>(
     *     sender: &signer,
     *     metadata: Object<T0>,
     *     recipient: address,
     *     amount: u64,
     *   )
     **/
    export class Transfer extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "primary_fungible_store";
      public readonly functionName = "transfer";
      public readonly args: TransferPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        sender: Account, // &signer
        metadata: ObjectAddress, // Object<T0>
        recipient: AccountAddressInput, // address
        amount: Uint64, // u64
        typeTags: Array<TypeTagInput>, // T0: key
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          metadata: AccountAddress.fromRelaxed(metadata),
          recipient: AccountAddress.fromRelaxed(recipient),
          amount: new U64(amount),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
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
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          account: AccountAddress.fromRelaxed(account),
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
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
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          account: AccountAddress.fromRelaxed(account),
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type PrimaryStorePayloadMoveArguments = {
      owner: AccountAddressInput;
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun primary_store<T0: key>(
     *     owner: address,
     *     metadata: Object<T0>,
     *   )
     **/
    export class PrimaryStore extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "primary_fungible_store";
      public readonly functionName = "primary_store";
      public readonly args: PrimaryStorePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        owner: AccountAddressInput, // address
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          owner: AccountAddress.fromRelaxed(owner),
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
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
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          owner: AccountAddress.fromRelaxed(owner),
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type PrimaryStoreExistsPayloadMoveArguments = {
      account: AccountAddressInput;
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun primary_store_exists<T0: key>(
     *     account: address,
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
        account: AccountAddressInput, // address
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          account: AccountAddress.fromRelaxed(account),
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
  }
}
