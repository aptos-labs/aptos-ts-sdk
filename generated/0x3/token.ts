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

export namespace Token {
  // let owner: AccountAuthenticator | undefined; // &signer
  export type BurnPayloadBCSArguments = {
    creators_address: AccountAddress;
    collection: MoveString;
    name: MoveString;
    property_version: U64;
    amount: U64;
  };

  export class Burn extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "burn";
    public readonly args: BurnPayloadBCSArguments;

    constructor(
      creators_address: AccountAddressInput, // address
      collection: string, // 0x1::string::String
      name: string, // 0x1::string::String
      property_version: Uint64, // u64
      amount: Uint64, // u64
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
  // let creator: AccountAuthenticator | undefined; // &signer
  export type BurnByCreatorPayloadBCSArguments = {
    owner: AccountAddress;
    collection: MoveString;
    name: MoveString;
    property_version: U64;
    amount: U64;
  };

  export class BurnByCreator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "burn_by_creator";
    public readonly args: BurnByCreatorPayloadBCSArguments;

    constructor(
      owner: AccountAddressInput, // address
      collection: string, // 0x1::string::String
      name: string, // 0x1::string::String
      property_version: Uint64, // u64
      amount: Uint64, // u64
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
  // let creator: AccountAuthenticator | undefined; // &signer
  export type CreateCollectionScriptPayloadBCSArguments = {
    name: MoveString;
    description: MoveString;
    uri: MoveString;
    maximum: U64;
    mutate_setting: MoveVector<Bool>;
  };

  export class CreateCollectionScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "create_collection_script";
    public readonly args: CreateCollectionScriptPayloadBCSArguments;

    constructor(
      name: string, // 0x1::string::String
      description: string, // 0x1::string::String
      uri: string, // 0x1::string::String
      maximum: Uint64, // u64
      mutate_setting: Array<boolean>, // vector<bool>
    ) {
      super();
      this.args = {
        name: new MoveString(name),
        description: new MoveString(description),
        uri: new MoveString(uri),
        maximum: new U64(maximum),
        mutate_setting: new MoveVector(mutate_setting.map((argA) => new Bool(argA))),
      };
    }
  }
  // let account: AccountAuthenticator | undefined; // &signer
  export type CreateTokenScriptPayloadBCSArguments = {
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

  export class CreateTokenScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "create_token_script";
    public readonly args: CreateTokenScriptPayloadBCSArguments;

    constructor(
      collection: string, // 0x1::string::String
      name: string, // 0x1::string::String
      description: string, // 0x1::string::String
      balance: Uint64, // u64
      maximum: Uint64, // u64
      uri: string, // 0x1::string::String
      royalty_payee_address: AccountAddressInput, // address
      royalty_points_denominator: Uint64, // u64
      royalty_points_numerator: Uint64, // u64
      mutate_setting: Array<boolean>, // vector<bool>
      property_keys: Array<string>, // vector<0x1::string::String>
      property_values: Array<HexInput>, // vector<vector<u8>>
      property_types: Array<string>, // vector<0x1::string::String>
    ) {
      super();
      this.args = {
        collection: new MoveString(collection),
        name: new MoveString(name),
        description: new MoveString(description),
        balance: new U64(balance),
        maximum: new U64(maximum),
        uri: new MoveString(uri),
        royalty_payee_address: AccountAddress.fromRelaxed(royalty_payee_address),
        royalty_points_denominator: new U64(royalty_points_denominator),
        royalty_points_numerator: new U64(royalty_points_numerator),
        mutate_setting: new MoveVector(mutate_setting.map((argA) => new Bool(argA))),
        property_keys: new MoveVector(property_keys.map((argA) => new MoveString(argA))),
        property_values: new MoveVector(property_values.map((argA) => MoveVector.U8(argA))),
        property_types: new MoveVector(property_types.map((argA) => new MoveString(argA))),
      };
    }
  }
  // let sender: AccountAuthenticator | undefined; // &signer
  // let receiver: AccountAuthenticator | undefined; // &signer
  export type DirectTransferScriptPayloadBCSArguments = {
    creators_address: AccountAddress;
    collection: MoveString;
    name: MoveString;
    property_version: U64;
    amount: U64;
  };

  export class DirectTransferScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "direct_transfer_script";
    public readonly args: DirectTransferScriptPayloadBCSArguments;

    constructor(
      creators_address: AccountAddressInput, // address
      collection: string, // 0x1::string::String
      name: string, // 0x1::string::String
      property_version: Uint64, // u64
      amount: Uint64, // u64
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
  // let _account: AccountAuthenticator | undefined; // &signer

  export class InitializeTokenScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "initialize_token_script";
    public readonly args = {};

    constructor() {
      super();
      this.args = {};
    }
  }
  // let account: AccountAuthenticator | undefined; // &signer
  export type MintScriptPayloadBCSArguments = {
    token_data_address: AccountAddress;
    collection: MoveString;
    name: MoveString;
    amount: U64;
  };

  export class MintScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "mint_script";
    public readonly args: MintScriptPayloadBCSArguments;

    constructor(
      token_data_address: AccountAddressInput, // address
      collection: string, // 0x1::string::String
      name: string, // 0x1::string::String
      amount: Uint64, // u64
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
  // let account: AccountAuthenticator | undefined; // &signer
  export type MutateTokenPropertiesPayloadBCSArguments = {
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

  export class MutateTokenProperties extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "mutate_token_properties";
    public readonly args: MutateTokenPropertiesPayloadBCSArguments;

    constructor(
      token_owner: AccountAddressInput, // address
      creator: AccountAddressInput, // address
      collection_name: string, // 0x1::string::String
      token_name: string, // 0x1::string::String
      token_property_version: Uint64, // u64
      amount: Uint64, // u64
      keys: Array<string>, // vector<0x1::string::String>
      values: Array<HexInput>, // vector<vector<u8>>
      types: Array<string>, // vector<0x1::string::String>
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
  // let account: AccountAuthenticator | undefined; // &signer
  export type OptInDirectTransferPayloadBCSArguments = {
    opt_in: Bool;
  };

  export class OptInDirectTransfer extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "opt_in_direct_transfer";
    public readonly args: OptInDirectTransferPayloadBCSArguments;

    constructor(
      opt_in: boolean, // bool
    ) {
      super();
      this.args = {
        opt_in: new Bool(opt_in),
      };
    }
  }
  // let from: AccountAuthenticator | undefined; // &signer
  export type TransferWithOptInPayloadBCSArguments = {
    creator: AccountAddress;
    collection_name: MoveString;
    token_name: MoveString;
    token_property_version: U64;
    to: AccountAddress;
    amount: U64;
  };

  export class TransferWithOptIn extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "transfer_with_opt_in";
    public readonly args: TransferWithOptInPayloadBCSArguments;

    constructor(
      creator: AccountAddressInput, // address
      collection_name: string, // 0x1::string::String
      token_name: string, // 0x1::string::String
      token_property_version: Uint64, // u64
      to: AccountAddressInput, // address
      amount: Uint64, // u64
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
