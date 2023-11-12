
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0


/* eslint-disable max-len */
import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, Account, InputTypes, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";



export namespace Token {
  export namespace EntryFunctions {
    export type BurnPayloadMoveArguments = {
      creators_address: AccountAddress;
      collection: MoveString;
      name: MoveString;
      property_version: U64;
      amount: U64;
    };

    /**
     *  public fun burn<>(
     *     owner: &signer,
     *     creators_address: address,
     *     collection: String,
     *     name: String,
     *     property_version: u64,
     *     amount: u64,
     *   )
     **/
    export class Burn extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "burn";
      public readonly args: BurnPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        owner: Account, // &signer
        creators_address: AccountAddressInput, // address
        collection: string, // String
        name: string, // String
        property_version: Uint64, // u64
        amount: Uint64, // u64
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          creators_address: AccountAddress.fromRelaxed(creators_address),
          collection: new MoveString(collection),
          name: new MoveString(name),
          property_version: new U64(property_version),
          amount: new U64(amount),
        };
      }
    }
    export type BurnByCreatorPayloadMoveArguments = {
      owner: AccountAddress;
      collection: MoveString;
      name: MoveString;
      property_version: U64;
      amount: U64;
    };

    /**
     *  public fun burn_by_creator<>(
     *     creator: &signer,
     *     owner: address,
     *     collection: String,
     *     name: String,
     *     property_version: u64,
     *     amount: u64,
     *   )
     **/
    export class BurnByCreator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "burn_by_creator";
      public readonly args: BurnByCreatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        creator: Account, // &signer
        owner: AccountAddressInput, // address
        collection: string, // String
        name: string, // String
        property_version: Uint64, // u64
        amount: Uint64, // u64
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          owner: AccountAddress.fromRelaxed(owner),
          collection: new MoveString(collection),
          name: new MoveString(name),
          property_version: new U64(property_version),
          amount: new U64(amount),
        };
      }
    }
    export type CreateCollectionScriptPayloadMoveArguments = {
      name: MoveString;
      description: MoveString;
      uri: MoveString;
      maximum: U64;
      mutate_setting: MoveVector<Bool>;
    };

    /**
     *  public fun create_collection_script<>(
     *     creator: &signer,
     *     name: String,
     *     description: String,
     *     uri: String,
     *     maximum: u64,
     *     mutate_setting: vector<bool>,
     *   )
     **/
    export class CreateCollectionScript extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "create_collection_script";
      public readonly args: CreateCollectionScriptPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        creator: Account, // &signer
        name: string, // String
        description: string, // String
        uri: string, // String
        maximum: Uint64, // u64
        mutate_setting: Array<boolean>, // vector<bool>
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          name: new MoveString(name),
          description: new MoveString(description),
          uri: new MoveString(uri),
          maximum: new U64(maximum),
          mutate_setting: new MoveVector(
            mutate_setting.map((argA) => new Bool(argA))
          ),
        };
      }
    }
    export type CreateTokenScriptPayloadMoveArguments = {
      collection: MoveString;
      name: MoveString;
      description: MoveString;
      balance: U64;
      maximum: U64;
      uri: MoveString;
      royalty_payee_address: AccountAddress;
      royalty_points_denominator: U64;
      royalty_points_numerator: U64;
      mutate_setting: MoveVector<Bool>;
      property_keys: MoveVector<MoveString>;
      property_values: MoveVector<MoveVector<U8>>;
      property_types: MoveVector<MoveString>;
    };

    /**
     *  public fun create_token_script<>(
     *     account: &signer,
     *     collection: String,
     *     name: String,
     *     description: String,
     *     balance: u64,
     *     maximum: u64,
     *     uri: String,
     *     royalty_payee_address: address,
     *     royalty_points_denominator: u64,
     *     royalty_points_numerator: u64,
     *     mutate_setting: vector<bool>,
     *     property_keys: vector<0x1::string::String>,
     *     property_values: vector<vector<u8>>,
     *     property_types: vector<0x1::string::String>,
     *   )
     **/
    export class CreateTokenScript extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "create_token_script";
      public readonly args: CreateTokenScriptPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        collection: string, // String
        name: string, // String
        description: string, // String
        balance: Uint64, // u64
        maximum: Uint64, // u64
        uri: string, // String
        royalty_payee_address: AccountAddressInput, // address
        royalty_points_denominator: Uint64, // u64
        royalty_points_numerator: Uint64, // u64
        mutate_setting: Array<boolean>, // vector<bool>
        property_keys: Array<string>, // vector<0x1::string::String>
        property_values: Array<HexInput>, // vector<vector<u8>>
        property_types: Array<string>, // vector<0x1::string::String>
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          collection: new MoveString(collection),
          name: new MoveString(name),
          description: new MoveString(description),
          balance: new U64(balance),
          maximum: new U64(maximum),
          uri: new MoveString(uri),
          royalty_payee_address: AccountAddress.fromRelaxed(
            royalty_payee_address
          ),
          royalty_points_denominator: new U64(royalty_points_denominator),
          royalty_points_numerator: new U64(royalty_points_numerator),
          mutate_setting: new MoveVector(
            mutate_setting.map((argA) => new Bool(argA))
          ),
          property_keys: new MoveVector(
            property_keys.map((argA) => new MoveString(argA))
          ),
          property_values: new MoveVector(
            property_values.map((argA) => MoveVector.U8(argA))
          ),
          property_types: new MoveVector(
            property_types.map((argA) => new MoveString(argA))
          ),
        };
      }
    }
    export type DirectTransferScriptPayloadMoveArguments = {
      creators_address: AccountAddress;
      collection: MoveString;
      name: MoveString;
      property_version: U64;
      amount: U64;
    };

    /**
     *  public fun direct_transfer_script<>(
     *     sender: &signer,
     *     receiver: &signer,
     *     creators_address: address,
     *     collection: String,
     *     name: String,
     *     property_version: u64,
     *     amount: u64,
     *   )
     **/
    export class DirectTransferScript extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "direct_transfer_script";
      public readonly args: DirectTransferScriptPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        sender: Account, // &signer
        receiver: Account, // &signer
        creators_address: AccountAddressInput, // address
        collection: string, // String
        name: string, // String
        property_version: Uint64, // u64
        amount: Uint64, // u64
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          creators_address: AccountAddress.fromRelaxed(creators_address),
          collection: new MoveString(collection),
          name: new MoveString(name),
          property_version: new U64(property_version),
          amount: new U64(amount),
        };
      }
    }

    /**
     *  public fun initialize_token_script<>(
     *     _account: &signer,
     *   )
     **/
    export class InitializeTokenScript extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "initialize_token_script";
      public readonly args = {};
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor() {
        super();
        this.args = {};
      }
    }
    export type MintScriptPayloadMoveArguments = {
      token_data_address: AccountAddress;
      collection: MoveString;
      name: MoveString;
      amount: U64;
    };

    /**
     *  public fun mint_script<>(
     *     account: &signer,
     *     token_data_address: address,
     *     collection: String,
     *     name: String,
     *     amount: u64,
     *   )
     **/
    export class MintScript extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "mint_script";
      public readonly args: MintScriptPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        token_data_address: AccountAddressInput, // address
        collection: string, // String
        name: string, // String
        amount: Uint64, // u64
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          token_data_address: AccountAddress.fromRelaxed(token_data_address),
          collection: new MoveString(collection),
          name: new MoveString(name),
          amount: new U64(amount),
        };
      }
    }
    export type MutateTokenPropertiesPayloadMoveArguments = {
      token_owner: AccountAddress;
      creator: AccountAddress;
      collection_name: MoveString;
      token_name: MoveString;
      token_property_version: U64;
      amount: U64;
      keys: MoveVector<MoveString>;
      values: MoveVector<MoveVector<U8>>;
      types: MoveVector<MoveString>;
    };

    /**
     *  public fun mutate_token_properties<>(
     *     account: &signer,
     *     token_owner: address,
     *     creator: address,
     *     collection_name: String,
     *     token_name: String,
     *     token_property_version: u64,
     *     amount: u64,
     *     keys: vector<0x1::string::String>,
     *     values: vector<vector<u8>>,
     *     types: vector<0x1::string::String>,
     *   )
     **/
    export class MutateTokenProperties extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "mutate_token_properties";
      public readonly args: MutateTokenPropertiesPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        token_owner: AccountAddressInput, // address
        creator: AccountAddressInput, // address
        collection_name: string, // String
        token_name: string, // String
        token_property_version: Uint64, // u64
        amount: Uint64, // u64
        keys: Array<string>, // vector<0x1::string::String>
        values: Array<HexInput>, // vector<vector<u8>>
        types: Array<string>, // vector<0x1::string::String>
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          token_owner: AccountAddress.fromRelaxed(token_owner),
          creator: AccountAddress.fromRelaxed(creator),
          collection_name: new MoveString(collection_name),
          token_name: new MoveString(token_name),
          token_property_version: new U64(token_property_version),
          amount: new U64(amount),
          keys: new MoveVector(keys.map((argA) => new MoveString(argA))),
          values: new MoveVector(values.map((argA) => MoveVector.U8(argA))),
          types: new MoveVector(types.map((argA) => new MoveString(argA))),
        };
      }
    }
    export type OptInDirectTransferPayloadMoveArguments = {
      opt_in: Bool;
    };

    /**
     *  public fun opt_in_direct_transfer<>(
     *     account: &signer,
     *     opt_in: bool,
     *   )
     **/
    export class OptInDirectTransfer extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "opt_in_direct_transfer";
      public readonly args: OptInDirectTransferPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        opt_in: boolean, // bool
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          opt_in: new Bool(opt_in),
        };
      }
    }
    export type TransferWithOptInPayloadMoveArguments = {
      creator: AccountAddress;
      collection_name: MoveString;
      token_name: MoveString;
      token_property_version: U64;
      to: AccountAddress;
      amount: U64;
    };

    /**
     *  public fun transfer_with_opt_in<>(
     *     from: &signer,
     *     creator: address,
     *     collection_name: String,
     *     token_name: String,
     *     token_property_version: u64,
     *     to: address,
     *     amount: u64,
     *   )
     **/
    export class TransferWithOptIn extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "transfer_with_opt_in";
      public readonly args: TransferWithOptInPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        from: Account, // &signer
        creator: AccountAddressInput, // address
        collection_name: string, // String
        token_name: string, // String
        token_property_version: Uint64, // u64
        to: AccountAddressInput, // address
        amount: Uint64, // u64
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          creator: AccountAddress.fromRelaxed(creator),
          collection_name: new MoveString(collection_name),
          token_name: new MoveString(token_name),
          token_property_version: new U64(token_property_version),
          to: AccountAddress.fromRelaxed(to),
          amount: new U64(amount),
        };
      }
    }
  }
  export namespace ViewFunctions {
    export type GetCollectionMutabilityConfigPayloadMoveArguments = {
      creator: AccountAddressInput;
      collection_name: string;
    };

    /**
     *  public fun get_collection_mutability_config<>(
     *     creator: address,
     *     collection_name: String,
     *   )
     **/
    export class GetCollectionMutabilityConfig extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
      public readonly moduleName = "token";
      public readonly functionName = "get_collection_mutability_config";
      public readonly args: GetCollectionMutabilityConfigPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        creator: AccountAddressInput, // address
        collection_name: string // String
      ) {
        super();
        this.args = {
          creator: AccountAddress.fromRelaxed(creator),
          collection_name: collection_name,
        };
      }
    }
  }
}
