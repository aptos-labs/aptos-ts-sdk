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
  EntryFunctionPayloadBuilder,
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

export namespace Token {
  export type BurnPayloadBCSArguments = {
    owner: AccountAddress;
    creators_address: MoveString;
    collection: MoveString;
    name: U64;
    property_version: U64;
  };

  export class Burn extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "burn";
    public readonly args: BurnPayloadBCSArguments;

    constructor(
      owner: AccountAddressInput, // address
      creators_address: string, // 0x1::string::String
      collection: string, // 0x1::string::String
      name: Uint64, // u64
      property_version: Uint64, // u64
    ) {
      super();
      this.args = {
        owner: AccountAddress.fromRelaxed(owner),
        creators_address: new MoveString(creators_address),
        collection: new MoveString(collection),
        name: new U64(name),
        property_version: new U64(property_version),
      };
    }
  }
  export type BurnByCreatorPayloadBCSArguments = {
    creator: AccountAddress;
    owner: MoveString;
    collection: MoveString;
    name: U64;
    property_version: U64;
  };

  export class BurnByCreator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "burn_by_creator";
    public readonly args: BurnByCreatorPayloadBCSArguments;

    constructor(
      creator: AccountAddressInput, // address
      owner: string, // 0x1::string::String
      collection: string, // 0x1::string::String
      name: Uint64, // u64
      property_version: Uint64, // u64
    ) {
      super();
      this.args = {
        creator: AccountAddress.fromRelaxed(creator),
        owner: new MoveString(owner),
        collection: new MoveString(collection),
        name: new U64(name),
        property_version: new U64(property_version),
      };
    }
  }
  export type CreateCollectionScriptPayloadBCSArguments = {
    creator: MoveString;
    name: MoveString;
    description: MoveString;
    uri: U64;
    maximum: MoveVector<Bool>;
  };

  export class CreateCollectionScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "create_collection_script";
    public readonly args: CreateCollectionScriptPayloadBCSArguments;

    constructor(
      creator: string, // 0x1::string::String
      name: string, // 0x1::string::String
      description: string, // 0x1::string::String
      uri: Uint64, // u64
      maximum: Array<boolean>, // vector<bool>
    ) {
      super();
      this.args = {
        creator: new MoveString(creator),
        name: new MoveString(name),
        description: new MoveString(description),
        uri: new U64(uri),
        maximum: new MoveVector(maximum.map((argA) => new Bool(argA))),
      };
    }
  }
  export type CreateTokenScriptPayloadBCSArguments = {
    account: MoveString;
    collection: MoveString;
    name: MoveString;
    description: U64;
    balance: U64;
    maximum: MoveString;
    uri: AccountAddress;
    royalty_payee_address: U64;
    royalty_points_denominator: U64;
    royalty_points_numerator: MoveVector<Bool>;
    mutate_setting: MoveVector<MoveString>;
    property_keys: MoveVector<MoveVector<U8>>;
    property_values: MoveVector<MoveString>;
  };

  export class CreateTokenScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "create_token_script";
    public readonly args: CreateTokenScriptPayloadBCSArguments;

    constructor(
      account: string, // 0x1::string::String
      collection: string, // 0x1::string::String
      name: string, // 0x1::string::String
      description: Uint64, // u64
      balance: Uint64, // u64
      maximum: string, // 0x1::string::String
      uri: AccountAddressInput, // address
      royalty_payee_address: Uint64, // u64
      royalty_points_denominator: Uint64, // u64
      royalty_points_numerator: Array<boolean>, // vector<bool>
      mutate_setting: Array<string>, // vector<0x1::string::String>
      property_keys: Array<HexInput>, // vector<vector<u8>>
      property_values: Array<string>, // vector<0x1::string::String>
    ) {
      super();
      this.args = {
        account: new MoveString(account),
        collection: new MoveString(collection),
        name: new MoveString(name),
        description: new U64(description),
        balance: new U64(balance),
        maximum: new MoveString(maximum),
        uri: AccountAddress.fromRelaxed(uri),
        royalty_payee_address: new U64(royalty_payee_address),
        royalty_points_denominator: new U64(royalty_points_denominator),
        royalty_points_numerator: new MoveVector(royalty_points_numerator.map((argA) => new Bool(argA))),
        mutate_setting: new MoveVector(mutate_setting.map((argA) => new MoveString(argA))),
        property_keys: new MoveVector(property_keys.map((argA) => MoveVector.U8(argA))),
        property_values: new MoveVector(property_values.map((argA) => new MoveString(argA))),
      };
    }
  }
  export type DirectTransferScriptPayloadBCSArguments = {
    sender: AccountAddress;
    receiver: MoveString;
    creators_address: MoveString;
    collection: U64;
    name: U64;
  };

  export class DirectTransferScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "direct_transfer_script";
    public readonly args: DirectTransferScriptPayloadBCSArguments;

    constructor(
      sender: AccountAddressInput, // address
      receiver: string, // 0x1::string::String
      creators_address: string, // 0x1::string::String
      collection: Uint64, // u64
      name: Uint64, // u64
    ) {
      super();
      this.args = {
        sender: AccountAddress.fromRelaxed(sender),
        receiver: new MoveString(receiver),
        creators_address: new MoveString(creators_address),
        collection: new U64(collection),
        name: new U64(name),
      };
    }
  }

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
  export type MintScriptPayloadBCSArguments = {
    account: AccountAddress;
    token_data_address: MoveString;
    collection: MoveString;
    name: U64;
  };

  export class MintScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "mint_script";
    public readonly args: MintScriptPayloadBCSArguments;

    constructor(
      account: AccountAddressInput, // address
      token_data_address: string, // 0x1::string::String
      collection: string, // 0x1::string::String
      name: Uint64, // u64
    ) {
      super();
      this.args = {
        account: AccountAddress.fromRelaxed(account),
        token_data_address: new MoveString(token_data_address),
        collection: new MoveString(collection),
        name: new U64(name),
      };
    }
  }
  export type MutateTokenPropertiesPayloadBCSArguments = {
    account: AccountAddress;
    token_owner: AccountAddress;
    creator: MoveString;
    collection_name: MoveString;
    token_name: U64;
    token_property_version: U64;
    amount: MoveVector<MoveString>;
    keys: MoveVector<MoveVector<U8>>;
    values: MoveVector<MoveString>;
  };

  export class MutateTokenProperties extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "mutate_token_properties";
    public readonly args: MutateTokenPropertiesPayloadBCSArguments;

    constructor(
      account: AccountAddressInput, // address
      token_owner: AccountAddressInput, // address
      creator: string, // 0x1::string::String
      collection_name: string, // 0x1::string::String
      token_name: Uint64, // u64
      token_property_version: Uint64, // u64
      amount: Array<string>, // vector<0x1::string::String>
      keys: Array<HexInput>, // vector<vector<u8>>
      values: Array<string>, // vector<0x1::string::String>
    ) {
      super();
      this.args = {
        account: AccountAddress.fromRelaxed(account),
        token_owner: AccountAddress.fromRelaxed(token_owner),
        creator: new MoveString(creator),
        collection_name: new MoveString(collection_name),
        token_name: new U64(token_name),
        token_property_version: new U64(token_property_version),
        amount: new MoveVector(amount.map((argA) => new MoveString(argA))),
        keys: new MoveVector(keys.map((argA) => MoveVector.U8(argA))),
        values: new MoveVector(values.map((argA) => new MoveString(argA))),
      };
    }
  }
  export type OptInDirectTransferPayloadBCSArguments = {
    account: Bool;
  };

  export class OptInDirectTransfer extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "opt_in_direct_transfer";
    public readonly args: OptInDirectTransferPayloadBCSArguments;

    constructor(
      account: boolean, // bool
    ) {
      super();
      this.args = {
        account: new Bool(account),
      };
    }
  }
  export type TransferWithOptInPayloadBCSArguments = {
    from: AccountAddress;
    creator: MoveString;
    collection_name: MoveString;
    token_name: U64;
    token_property_version: AccountAddress;
    to: U64;
  };

  export class TransferWithOptIn extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x3");
    public readonly moduleName = "token";
    public readonly functionName = "transfer_with_opt_in";
    public readonly args: TransferWithOptInPayloadBCSArguments;

    constructor(
      from: AccountAddressInput, // address
      creator: string, // 0x1::string::String
      collection_name: string, // 0x1::string::String
      token_name: Uint64, // u64
      token_property_version: AccountAddressInput, // address
      to: Uint64, // u64
    ) {
      super();
      this.args = {
        from: AccountAddress.fromRelaxed(from),
        creator: new MoveString(creator),
        collection_name: new MoveString(collection_name),
        token_name: new U64(token_name),
        token_property_version: AccountAddress.fromRelaxed(token_property_version),
        to: new U64(to),
      };
    }
  }
}
