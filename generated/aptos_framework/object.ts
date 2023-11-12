
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0


/* eslint-disable max-len */
import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, Account, InputTypes, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";



export namespace Object {
  export namespace EntryFunctions {
    export type BurnPayloadMoveArguments = {
      object: MoveObject;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun burn<T0: key>(
     *     owner: &signer,
     *     object: Object<T0>,
     *   )
     **/
    export class Burn extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "object";
      public readonly functionName = "burn";
      public readonly args: BurnPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        owner: Account, // &signer
        object: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          object: AccountAddress.fromRelaxed(object),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }

    export type TransferCallPayloadMoveArguments = {
      object: AccountAddress;
      to: AccountAddress;
    };

    /**
     *  public fun transfer_call<>(
     *     owner: &signer,
     *     object: address,
     *     to: address,
     *   )
     **/
    export class TransferCall extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "object";
      public readonly functionName = "transfer_call";
      public readonly args: TransferCallPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        owner: Account, // &signer
        object: AccountAddressInput, // address
        to: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          object: AccountAddress.fromRelaxed(object),
          to: AccountAddress.fromRelaxed(to),
        };
      }
    }
    export type TransferToObjectPayloadMoveArguments = {
      object: MoveObject;
      to: MoveObject;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun transfer_to_object<T0: key, T1: key>(
     *     owner: &signer,
     *     object: Object<T0>,
     *     to: Object<T1>,
     *   )
     **/
    export class TransferToObject extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "object";
      public readonly functionName = "transfer_to_object";
      public readonly args: TransferToObjectPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key, T1: key

      constructor(
        owner: Account, // &signer
        object: ObjectAddress, // Object<T0>
        to: ObjectAddress, // Object<T1>
        typeTags: Array<TypeTagInput>, // T0: key, T1: key
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          object: AccountAddress.fromRelaxed(object),
          to: AccountAddress.fromRelaxed(to),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }
    export type UnburnPayloadMoveArguments = {
      object: MoveObject;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun unburn<T0: key>(
     *     original_owner: &signer,
     *     object: Object<T0>,
     *   )
     **/
    export class Unburn extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "object";
      public readonly functionName = "unburn";
      public readonly args: UnburnPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        original_owner: Account, // &signer
        object: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput>, // T0: key
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          object: AccountAddress.fromRelaxed(object),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }
  }
  export namespace ViewFunctions {
    export type IsBurntPayloadMoveArguments = {
      object: ObjectAddress;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun is_burnt<T0: key>(
     *     object: Object<T0>,
     *   )
     **/
    export class IsBurnt extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "object";
      public readonly functionName = "is_burnt";
      public readonly args: IsBurntPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; // T0: key

      constructor(
        object: ObjectAddress, // Object<T0>
        typeTags: Array<TypeTagInput> // T0: key
      ) {
        super();
        this.args = {
          object: AccountAddress.fromRelaxed(object),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }
  }
}
