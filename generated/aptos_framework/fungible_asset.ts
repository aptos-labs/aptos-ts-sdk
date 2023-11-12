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

export namespace FungibleAsset {
  export namespace EntryFunctions {}
  export namespace ViewFunctions {
    export type BalancePayloadMoveArguments = {
      store: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun balance<T0: key>(
     *     store: Object<T0>,
     *   )
     **/
    export class Balance extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "fungible_asset";
      public readonly functionName = "balance";
      public readonly args: BalancePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        store: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          store: AccountAddress.fromRelaxed(store),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type DecimalsPayloadMoveArguments = {
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun decimals<T0: key>(
     *     metadata: Object<T0>,
     *   )
     **/
    export class Decimals extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "fungible_asset";
      public readonly functionName = "decimals";
      public readonly args: DecimalsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type IsFrozenPayloadMoveArguments = {
      store: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun is_frozen<T0: key>(
     *     store: Object<T0>,
     *   )
     **/
    export class IsFrozen extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "fungible_asset";
      public readonly functionName = "is_frozen";
      public readonly args: IsFrozenPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        store: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          store: AccountAddress.fromRelaxed(store),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type MaximumPayloadMoveArguments = {
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun maximum<T0: key>(
     *     metadata: Object<T0>,
     *   )
     **/
    export class Maximum extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "fungible_asset";
      public readonly functionName = "maximum";
      public readonly args: MaximumPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type NamePayloadMoveArguments = {
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun name<T0: key>(
     *     metadata: Object<T0>,
     *   )
     **/
    export class Name extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "fungible_asset";
      public readonly functionName = "name";
      public readonly args: NamePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type StoreExistsPayloadMoveArguments = {
      store: AccountAddressInput;
    };

    /**
     *  public fun store_exists<>(
     *     store: address,
     *   )
     **/
    export class StoreExists extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "fungible_asset";
      public readonly functionName = "store_exists";
      public readonly args: StoreExistsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        store: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          store: AccountAddress.fromRelaxed(store),
        };
      }
    }
    export type StoreMetadataPayloadMoveArguments = {
      store: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun store_metadata<T0: key>(
     *     store: Object<T0>,
     *   )
     **/
    export class StoreMetadata extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "fungible_asset";
      public readonly functionName = "store_metadata";
      public readonly args: StoreMetadataPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        store: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          store: AccountAddress.fromRelaxed(store),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type SupplyPayloadMoveArguments = {
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun supply<T0: key>(
     *     metadata: Object<T0>,
     *   )
     **/
    export class Supply extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "fungible_asset";
      public readonly functionName = "supply";
      public readonly args: SupplyPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type SymbolPayloadMoveArguments = {
      metadata: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun symbol<T0: key>(
     *     metadata: Object<T0>,
     *   )
     **/
    export class Symbol extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "fungible_asset";
      public readonly functionName = "symbol";
      public readonly args: SymbolPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        metadata: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
      ) {
        super();
        this.args = {
          metadata: AccountAddress.fromRelaxed(metadata),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
  }
}
