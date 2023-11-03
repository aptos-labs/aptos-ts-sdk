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
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";

export namespace TxArgsModule {
  export type PrivateArgumentsPayloadBCSArguments = {
    arg_bool: Bool;
    arg_u8: U8;
    arg_u16: U16;
    arg_u32: U32;
    arg_u64: U64;
    arg_u128: U128;
    arg_u256: U256;
    arg_address: AccountAddress;
    arg_string: MoveString;
    arg_object: MoveObject;
    vector_empty: MoveVector<U8>;
    vector_bool: MoveVector<Bool>;
    vector_u8: MoveVector<U8>;
    vector_u16: MoveVector<U16>;
    vector_u32: MoveVector<U32>;
    vector_u64: MoveVector<U64>;
    vector_u128: MoveVector<U128>;
    vector_u256: MoveVector<U256>;
    vector_address: MoveVector<AccountAddress>;
    vector_string: MoveVector<MoveString>;
    vector_object: MoveVector<MoveObject>;
    option_empty: MoveVector<U8>;
    option_bool: MoveVector<Bool>;
    option_u8: MoveVector<U8>;
    option_u16: MoveVector<U16>;
    option_u32: MoveVector<U32>;
    option_u64: MoveVector<U64>;
    option_u128: MoveVector<U128>;
    option_u256: MoveVector<U256>;
    option_address: MoveVector<AccountAddress>;
    option_string: MoveVector<MoveString>;
    option_object: MoveVector<MoveObject>;
  };

  export class PrivateArguments extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899",
    );
    public readonly moduleName = "tx_args_module";
    public readonly functionName = "private_arguments";
    public readonly args: PrivateArgumentsPayloadBCSArguments;

    constructor(
      arg_bool: boolean, // bool
      arg_u8: Uint8, // u8
      arg_u16: Uint16, // u16
      arg_u32: Uint32, // u32
      arg_u64: Uint64, // u64
      arg_u128: Uint128, // u128
      arg_u256: Uint256, // u256
      arg_address: AccountAddressInput, // address
      arg_string: string, // 0x1::string::String
      arg_object: AccountAddressInput, // 0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>
      vector_empty: HexInput, // vector<u8>
      vector_bool: Array<boolean>, // vector<bool>
      vector_u8: HexInput, // vector<u8>
      vector_u16: Array<Uint16>, // vector<u16>
      vector_u32: Array<Uint32>, // vector<u32>
      vector_u64: Array<Uint64>, // vector<u64>
      vector_u128: Array<Uint128>, // vector<u128>
      vector_u256: Array<Uint256>, // vector<u256>
      vector_address: Array<AccountAddressInput>, // vector<address>
      vector_string: Array<string>, // vector<0x1::string::String>
      vector_object: Array<AccountAddressInput>, // vector<0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>>
      option_empty: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_bool: OneOrNone<boolean>, // 0x1::option::Option<bool>
      option_u8: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_u16: OneOrNone<Uint16>, // 0x1::option::Option<u16>
      option_u32: OneOrNone<Uint32>, // 0x1::option::Option<u32>
      option_u64: OneOrNone<Uint64>, // 0x1::option::Option<u64>
      option_u128: OneOrNone<Uint128>, // 0x1::option::Option<u128>
      option_u256: OneOrNone<Uint256>, // 0x1::option::Option<u256>
      option_address: OneOrNone<AccountAddressInput>, // 0x1::option::Option<address>
      option_string: OneOrNone<string>, // 0x1::option::Option<0x1::string::String>
      option_object: OneOrNone<AccountAddressInput>, // 0x1::option::Option<0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>>
    ) {
      super();
      this.args = {
        arg_bool: new Bool(arg_bool),
        arg_u8: new U8(arg_u8),
        arg_u16: new U16(arg_u16),
        arg_u32: new U32(arg_u32),
        arg_u64: new U64(arg_u64),
        arg_u128: new U128(arg_u128),
        arg_u256: new U256(arg_u256),
        arg_address: AccountAddress.fromRelaxed(arg_address),
        arg_string: new MoveString(arg_string),
        arg_object: AccountAddress.fromRelaxed(arg_object),
        vector_empty: MoveVector.U8(vector_empty),
        vector_bool: new MoveVector(vector_bool.map((argA) => new Bool(argA))),
        vector_u8: MoveVector.U8(vector_u8),
        vector_u16: new MoveVector(vector_u16.map((argA) => new U16(argA))),
        vector_u32: new MoveVector(vector_u32.map((argA) => new U32(argA))),
        vector_u64: new MoveVector(vector_u64.map((argA) => new U64(argA))),
        vector_u128: new MoveVector(vector_u128.map((argA) => new U128(argA))),
        vector_u256: new MoveVector(vector_u256.map((argA) => new U256(argA))),
        vector_address: new MoveVector(vector_address.map((argA) => AccountAddress.fromRelaxed(argA))),
        vector_string: new MoveVector(vector_string.map((argA) => new MoveString(argA))),
        vector_object: new MoveVector(vector_object.map((argA) => AccountAddress.fromRelaxed(argA))),
        option_empty: new MoveVector(option_empty.map((argA) => new U8(argA))),
        option_bool: new MoveVector(option_bool.map((argA) => new Bool(argA))),
        option_u8: new MoveVector(option_u8.map((argA) => new U8(argA))),
        option_u16: new MoveVector(option_u16.map((argA) => new U16(argA))),
        option_u32: new MoveVector(option_u32.map((argA) => new U32(argA))),
        option_u64: new MoveVector(option_u64.map((argA) => new U64(argA))),
        option_u128: new MoveVector(option_u128.map((argA) => new U128(argA))),
        option_u256: new MoveVector(option_u256.map((argA) => new U256(argA))),
        option_address: new MoveVector(option_address.map((argA) => AccountAddress.fromRelaxed(argA))),
        option_string: new MoveVector(option_string.map((argA) => new MoveString(argA))),
        option_object: new MoveVector(option_object.map((argA) => AccountAddress.fromRelaxed(argA))),
      };
    }
  }

  // let account_1: AccountAuthenticator | undefined; // &signer
  // let account_2: AccountAuthenticator | undefined; // &signer
  // let account_3: AccountAuthenticator | undefined; // &signer
  // let account_4: AccountAuthenticator | undefined; // &signer
  // let account_5: AccountAuthenticator | undefined; // &signer
  export type PublicArgumentsMultipleSignersPayloadBCSArguments = {
    signer_addresses: MoveVector<AccountAddress>;
    arg_bool: Bool;
    arg_u8: U8;
    arg_u16: U16;
    arg_u32: U32;
    arg_u64: U64;
    arg_u128: U128;
    arg_u256: U256;
    arg_address: AccountAddress;
    arg_string: MoveString;
    arg_object: MoveObject;
    vector_empty: MoveVector<U8>;
    vector_bool: MoveVector<Bool>;
    vector_u8: MoveVector<U8>;
    vector_u16: MoveVector<U16>;
    vector_u32: MoveVector<U32>;
    vector_u64: MoveVector<U64>;
    vector_u128: MoveVector<U128>;
    vector_u256: MoveVector<U256>;
    vector_address: MoveVector<AccountAddress>;
    vector_string: MoveVector<MoveString>;
    vector_object: MoveVector<MoveObject>;
    option_empty: MoveVector<U8>;
    option_bool: MoveVector<Bool>;
    option_u8: MoveVector<U8>;
    option_u16: MoveVector<U16>;
    option_u32: MoveVector<U32>;
    option_u64: MoveVector<U64>;
    option_u128: MoveVector<U128>;
    option_u256: MoveVector<U256>;
    option_address: MoveVector<AccountAddress>;
    option_string: MoveVector<MoveString>;
    option_object: MoveVector<MoveObject>;
  };

  export class PublicArgumentsMultipleSigners extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899",
    );
    public readonly moduleName = "tx_args_module";
    public readonly functionName = "public_arguments_multiple_signers";
    public readonly args: PublicArgumentsMultipleSignersPayloadBCSArguments;

    constructor(
      signer_addresses: Array<AccountAddressInput>, // vector<address>
      arg_bool: boolean, // bool
      arg_u8: Uint8, // u8
      arg_u16: Uint16, // u16
      arg_u32: Uint32, // u32
      arg_u64: Uint64, // u64
      arg_u128: Uint128, // u128
      arg_u256: Uint256, // u256
      arg_address: AccountAddressInput, // address
      arg_string: string, // 0x1::string::String
      arg_object: AccountAddressInput, // 0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>
      vector_empty: HexInput, // vector<u8>
      vector_bool: Array<boolean>, // vector<bool>
      vector_u8: HexInput, // vector<u8>
      vector_u16: Array<Uint16>, // vector<u16>
      vector_u32: Array<Uint32>, // vector<u32>
      vector_u64: Array<Uint64>, // vector<u64>
      vector_u128: Array<Uint128>, // vector<u128>
      vector_u256: Array<Uint256>, // vector<u256>
      vector_address: Array<AccountAddressInput>, // vector<address>
      vector_string: Array<string>, // vector<0x1::string::String>
      vector_object: Array<AccountAddressInput>, // vector<0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>>
      option_empty: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_bool: OneOrNone<boolean>, // 0x1::option::Option<bool>
      option_u8: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_u16: OneOrNone<Uint16>, // 0x1::option::Option<u16>
      option_u32: OneOrNone<Uint32>, // 0x1::option::Option<u32>
      option_u64: OneOrNone<Uint64>, // 0x1::option::Option<u64>
      option_u128: OneOrNone<Uint128>, // 0x1::option::Option<u128>
      option_u256: OneOrNone<Uint256>, // 0x1::option::Option<u256>
      option_address: OneOrNone<AccountAddressInput>, // 0x1::option::Option<address>
      option_string: OneOrNone<string>, // 0x1::option::Option<0x1::string::String>
      option_object: OneOrNone<AccountAddressInput>, // 0x1::option::Option<0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>>
    ) {
      super();
      this.args = {
        signer_addresses: new MoveVector(signer_addresses.map((argA) => AccountAddress.fromRelaxed(argA))),
        arg_bool: new Bool(arg_bool),
        arg_u8: new U8(arg_u8),
        arg_u16: new U16(arg_u16),
        arg_u32: new U32(arg_u32),
        arg_u64: new U64(arg_u64),
        arg_u128: new U128(arg_u128),
        arg_u256: new U256(arg_u256),
        arg_address: AccountAddress.fromRelaxed(arg_address),
        arg_string: new MoveString(arg_string),
        arg_object: AccountAddress.fromRelaxed(arg_object),
        vector_empty: MoveVector.U8(vector_empty),
        vector_bool: new MoveVector(vector_bool.map((argA) => new Bool(argA))),
        vector_u8: MoveVector.U8(vector_u8),
        vector_u16: new MoveVector(vector_u16.map((argA) => new U16(argA))),
        vector_u32: new MoveVector(vector_u32.map((argA) => new U32(argA))),
        vector_u64: new MoveVector(vector_u64.map((argA) => new U64(argA))),
        vector_u128: new MoveVector(vector_u128.map((argA) => new U128(argA))),
        vector_u256: new MoveVector(vector_u256.map((argA) => new U256(argA))),
        vector_address: new MoveVector(vector_address.map((argA) => AccountAddress.fromRelaxed(argA))),
        vector_string: new MoveVector(vector_string.map((argA) => new MoveString(argA))),
        vector_object: new MoveVector(vector_object.map((argA) => AccountAddress.fromRelaxed(argA))),
        option_empty: new MoveVector(option_empty.map((argA) => new U8(argA))),
        option_bool: new MoveVector(option_bool.map((argA) => new Bool(argA))),
        option_u8: new MoveVector(option_u8.map((argA) => new U8(argA))),
        option_u16: new MoveVector(option_u16.map((argA) => new U16(argA))),
        option_u32: new MoveVector(option_u32.map((argA) => new U32(argA))),
        option_u64: new MoveVector(option_u64.map((argA) => new U64(argA))),
        option_u128: new MoveVector(option_u128.map((argA) => new U128(argA))),
        option_u256: new MoveVector(option_u256.map((argA) => new U256(argA))),
        option_address: new MoveVector(option_address.map((argA) => AccountAddress.fromRelaxed(argA))),
        option_string: new MoveVector(option_string.map((argA) => new MoveString(argA))),
        option_object: new MoveVector(option_object.map((argA) => AccountAddress.fromRelaxed(argA))),
      };
    }
  }
  // let account_1: AccountAuthenticator | undefined; // &signer
  export type PublicArgumentsOneSignerPayloadBCSArguments = {
    signer_address: AccountAddress;
    arg_bool: Bool;
    arg_u8: U8;
    arg_u16: U16;
    arg_u32: U32;
    arg_u64: U64;
    arg_u128: U128;
    arg_u256: U256;
    arg_address: AccountAddress;
    arg_string: MoveString;
    arg_object: MoveObject;
    vector_empty: MoveVector<U8>;
    vector_bool: MoveVector<Bool>;
    vector_u8: MoveVector<U8>;
    vector_u16: MoveVector<U16>;
    vector_u32: MoveVector<U32>;
    vector_u64: MoveVector<U64>;
    vector_u128: MoveVector<U128>;
    vector_u256: MoveVector<U256>;
    vector_address: MoveVector<AccountAddress>;
    vector_string: MoveVector<MoveString>;
    vector_object: MoveVector<MoveObject>;
    option_empty: MoveVector<U8>;
    option_bool: MoveVector<Bool>;
    option_u8: MoveVector<U8>;
    option_u16: MoveVector<U16>;
    option_u32: MoveVector<U32>;
    option_u64: MoveVector<U64>;
    option_u128: MoveVector<U128>;
    option_u256: MoveVector<U256>;
    option_address: MoveVector<AccountAddress>;
    option_string: MoveVector<MoveString>;
    option_object: MoveVector<MoveObject>;
  };

  export class PublicArgumentsOneSigner extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899",
    );
    public readonly moduleName = "tx_args_module";
    public readonly functionName = "public_arguments_one_signer";
    public readonly args: PublicArgumentsOneSignerPayloadBCSArguments;

    constructor(
      signer_address: AccountAddressInput, // address
      arg_bool: boolean, // bool
      arg_u8: Uint8, // u8
      arg_u16: Uint16, // u16
      arg_u32: Uint32, // u32
      arg_u64: Uint64, // u64
      arg_u128: Uint128, // u128
      arg_u256: Uint256, // u256
      arg_address: AccountAddressInput, // address
      arg_string: string, // 0x1::string::String
      arg_object: AccountAddressInput, // 0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>
      vector_empty: HexInput, // vector<u8>
      vector_bool: Array<boolean>, // vector<bool>
      vector_u8: HexInput, // vector<u8>
      vector_u16: Array<Uint16>, // vector<u16>
      vector_u32: Array<Uint32>, // vector<u32>
      vector_u64: Array<Uint64>, // vector<u64>
      vector_u128: Array<Uint128>, // vector<u128>
      vector_u256: Array<Uint256>, // vector<u256>
      vector_address: Array<AccountAddressInput>, // vector<address>
      vector_string: Array<string>, // vector<0x1::string::String>
      vector_object: Array<AccountAddressInput>, // vector<0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>>
      option_empty: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_bool: OneOrNone<boolean>, // 0x1::option::Option<bool>
      option_u8: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_u16: OneOrNone<Uint16>, // 0x1::option::Option<u16>
      option_u32: OneOrNone<Uint32>, // 0x1::option::Option<u32>
      option_u64: OneOrNone<Uint64>, // 0x1::option::Option<u64>
      option_u128: OneOrNone<Uint128>, // 0x1::option::Option<u128>
      option_u256: OneOrNone<Uint256>, // 0x1::option::Option<u256>
      option_address: OneOrNone<AccountAddressInput>, // 0x1::option::Option<address>
      option_string: OneOrNone<string>, // 0x1::option::Option<0x1::string::String>
      option_object: OneOrNone<AccountAddressInput>, // 0x1::option::Option<0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>>
    ) {
      super();
      this.args = {
        signer_address: AccountAddress.fromRelaxed(signer_address),
        arg_bool: new Bool(arg_bool),
        arg_u8: new U8(arg_u8),
        arg_u16: new U16(arg_u16),
        arg_u32: new U32(arg_u32),
        arg_u64: new U64(arg_u64),
        arg_u128: new U128(arg_u128),
        arg_u256: new U256(arg_u256),
        arg_address: AccountAddress.fromRelaxed(arg_address),
        arg_string: new MoveString(arg_string),
        arg_object: AccountAddress.fromRelaxed(arg_object),
        vector_empty: MoveVector.U8(vector_empty),
        vector_bool: new MoveVector(vector_bool.map((argA) => new Bool(argA))),
        vector_u8: MoveVector.U8(vector_u8),
        vector_u16: new MoveVector(vector_u16.map((argA) => new U16(argA))),
        vector_u32: new MoveVector(vector_u32.map((argA) => new U32(argA))),
        vector_u64: new MoveVector(vector_u64.map((argA) => new U64(argA))),
        vector_u128: new MoveVector(vector_u128.map((argA) => new U128(argA))),
        vector_u256: new MoveVector(vector_u256.map((argA) => new U256(argA))),
        vector_address: new MoveVector(vector_address.map((argA) => AccountAddress.fromRelaxed(argA))),
        vector_string: new MoveVector(vector_string.map((argA) => new MoveString(argA))),
        vector_object: new MoveVector(vector_object.map((argA) => AccountAddress.fromRelaxed(argA))),
        option_empty: new MoveVector(option_empty.map((argA) => new U8(argA))),
        option_bool: new MoveVector(option_bool.map((argA) => new Bool(argA))),
        option_u8: new MoveVector(option_u8.map((argA) => new U8(argA))),
        option_u16: new MoveVector(option_u16.map((argA) => new U16(argA))),
        option_u32: new MoveVector(option_u32.map((argA) => new U32(argA))),
        option_u64: new MoveVector(option_u64.map((argA) => new U64(argA))),
        option_u128: new MoveVector(option_u128.map((argA) => new U128(argA))),
        option_u256: new MoveVector(option_u256.map((argA) => new U256(argA))),
        option_address: new MoveVector(option_address.map((argA) => AccountAddress.fromRelaxed(argA))),
        option_string: new MoveVector(option_string.map((argA) => new MoveString(argA))),
        option_object: new MoveVector(option_object.map((argA) => AccountAddress.fromRelaxed(argA))),
      };
    }
  }

  export class TypeTags extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899",
    );
    public readonly moduleName = "tx_args_module";
    public readonly functionName = "type_tags";
    public readonly args = {};

    constructor() {
      super();
      this.args = {};
    }
  }
  export type PrivateArgumentsPayloadBCSArguments = {
    arg_bool: Bool;
    arg_u8: U8;
    arg_u16: U16;
    arg_u32: U32;
    arg_u64: U64;
    arg_u128: U128;
    arg_u256: U256;
    arg_address: AccountAddress;
    arg_string: MoveString;
    arg_object: MoveObject;
    vector_empty: MoveVector<U8>;
    vector_bool: MoveVector<Bool>;
    vector_u8: MoveVector<U8>;
    vector_u16: MoveVector<U16>;
    vector_u32: MoveVector<U32>;
    vector_u64: MoveVector<U64>;
    vector_u128: MoveVector<U128>;
    vector_u256: MoveVector<U256>;
    vector_address: MoveVector<AccountAddress>;
    vector_string: MoveVector<MoveString>;
    vector_object: MoveVector<MoveObject>;
    option_empty: MoveVector<U8>;
    option_bool: MoveVector<Bool>;
    option_u8: MoveVector<U8>;
    option_u16: MoveVector<U16>;
    option_u32: MoveVector<U32>;
    option_u64: MoveVector<U64>;
    option_u128: MoveVector<U128>;
    option_u256: MoveVector<U256>;
    option_address: MoveVector<AccountAddress>;
    option_string: MoveVector<MoveString>;
    option_object: MoveVector<MoveObject>;
  };

  export class PrivateArguments extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899",
    );
    public readonly moduleName = "tx_args_module";
    public readonly functionName = "private_arguments";
    public readonly args: PrivateArgumentsPayloadBCSArguments;

    constructor(
      arg_bool: boolean, // bool
      arg_u8: Uint8, // u8
      arg_u16: Uint16, // u16
      arg_u32: Uint32, // u32
      arg_u64: Uint64, // u64
      arg_u128: Uint128, // u128
      arg_u256: Uint256, // u256
      arg_address: AccountAddressInput, // address
      arg_string: string, // 0x1::string::String
      arg_object: AccountAddressInput, // 0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>
      vector_empty: HexInput, // vector<u8>
      vector_bool: Array<boolean>, // vector<bool>
      vector_u8: HexInput, // vector<u8>
      vector_u16: Array<Uint16>, // vector<u16>
      vector_u32: Array<Uint32>, // vector<u32>
      vector_u64: Array<Uint64>, // vector<u64>
      vector_u128: Array<Uint128>, // vector<u128>
      vector_u256: Array<Uint256>, // vector<u256>
      vector_address: Array<AccountAddressInput>, // vector<address>
      vector_string: Array<string>, // vector<0x1::string::String>
      vector_object: Array<AccountAddressInput>, // vector<0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>>
      option_empty: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_bool: OneOrNone<boolean>, // 0x1::option::Option<bool>
      option_u8: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_u16: OneOrNone<Uint16>, // 0x1::option::Option<u16>
      option_u32: OneOrNone<Uint32>, // 0x1::option::Option<u32>
      option_u64: OneOrNone<Uint64>, // 0x1::option::Option<u64>
      option_u128: OneOrNone<Uint128>, // 0x1::option::Option<u128>
      option_u256: OneOrNone<Uint256>, // 0x1::option::Option<u256>
      option_address: OneOrNone<AccountAddressInput>, // 0x1::option::Option<address>
      option_string: OneOrNone<string>, // 0x1::option::Option<0x1::string::String>
      option_object: OneOrNone<AccountAddressInput>, // 0x1::option::Option<0x1::object::Object<0x65ff60648b72a8c85e0106f384f5e5e24cbf7de9fe74ef4af49390727623f899::tx_args_module::EmptyResource>>
    ) {
      super();
      this.args = {
        arg_bool: new Bool(arg_bool),
        arg_u8: new U8(arg_u8),
        arg_u16: new U16(arg_u16),
        arg_u32: new U32(arg_u32),
        arg_u64: new U64(arg_u64),
        arg_u128: new U128(arg_u128),
        arg_u256: new U256(arg_u256),
        arg_address: AccountAddress.fromRelaxed(arg_address),
        arg_string: new MoveString(arg_string),
        arg_object: AccountAddress.fromRelaxed(arg_object),
        vector_empty: MoveVector.U8(vector_empty),
        vector_bool: new MoveVector(vector_bool.map((argA) => new Bool(argA))),
        vector_u8: MoveVector.U8(vector_u8),
        vector_u16: new MoveVector(vector_u16.map((argA) => new U16(argA))),
        vector_u32: new MoveVector(vector_u32.map((argA) => new U32(argA))),
        vector_u64: new MoveVector(vector_u64.map((argA) => new U64(argA))),
        vector_u128: new MoveVector(vector_u128.map((argA) => new U128(argA))),
        vector_u256: new MoveVector(vector_u256.map((argA) => new U256(argA))),
        vector_address: new MoveVector(vector_address.map((argA) => AccountAddress.fromRelaxed(argA))),
        vector_string: new MoveVector(vector_string.map((argA) => new MoveString(argA))),
        vector_object: new MoveVector(vector_object.map((argA) => AccountAddress.fromRelaxed(argA))),
        option_empty: new MoveVector(option_empty.map((argA) => new U8(argA))),
        option_bool: new MoveVector(option_bool.map((argA) => new Bool(argA))),
        option_u8: new MoveVector(option_u8.map((argA) => new U8(argA))),
        option_u16: new MoveVector(option_u16.map((argA) => new U16(argA))),
        option_u32: new MoveVector(option_u32.map((argA) => new U32(argA))),
        option_u64: new MoveVector(option_u64.map((argA) => new U64(argA))),
        option_u128: new MoveVector(option_u128.map((argA) => new U128(argA))),
        option_u256: new MoveVector(option_u256.map((argA) => new U256(argA))),
        option_address: new MoveVector(option_address.map((argA) => AccountAddress.fromRelaxed(argA))),
        option_string: new MoveVector(option_string.map((argA) => new MoveString(argA))),
        option_object: new MoveVector(option_object.map((argA) => AccountAddress.fromRelaxed(argA))),
      };
    }
  }
}
