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
} from "../../src";
import {
  EntryFunctionArgumentTypes,
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
import { Option, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import {
  ViewFunctionPayloadBuilder,
  EntryFunctionPayloadBuilder,
} from "../../src/bcs/serializable/tx-builder/payloadBuilders";

export type PublicArgumentsPayloadMoveArguments = {
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

/**
 *  public fun public_arguments<>(
 *     _account_1: &signer,
 *     arg_bool: bool,
 *     arg_u8: u8,
 *     arg_u16: u16,
 *     arg_u32: u32,
 *     arg_u64: u64,
 *     arg_u128: u128,
 *     arg_u256: u256,
 *     arg_address: address,
 *     arg_string: String,
 *     arg_object: Object<args_test_suite::tx_args_module::EmptyResource>,
 *     vector_empty: vector<u8>,
 *     vector_bool: vector<bool>,
 *     vector_u8: vector<u8>,
 *     vector_u16: vector<u16>,
 *     vector_u32: vector<u32>,
 *     vector_u64: vector<u64>,
 *     vector_u128: vector<u128>,
 *     vector_u256: vector<u256>,
 *     vector_address: vector<address>,
 *     vector_string: vector<String>,
 *     vector_object: vector<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *     option_empty: Option<u8>,
 *     option_bool: Option<bool>,
 *     option_u8: Option<u8>,
 *     option_u16: Option<u16>,
 *     option_u32: Option<u32>,
 *     option_u64: Option<u64>,
 *     option_u128: Option<u128>,
 *     option_u256: Option<u256>,
 *     option_address: Option<address>,
 *     option_string: Option<String>,
 *     option_object: Option<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *   )
 **/
export class PublicArguments extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "public_arguments";
  public readonly args: PublicArgumentsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // _account_1: &signer,
    arg_bool: boolean, // bool
    arg_u8: Uint8, // u8
    arg_u16: Uint16, // u16
    arg_u32: Uint32, // u32
    arg_u64: Uint64, // u64
    arg_u128: Uint128, // u128
    arg_u256: Uint256, // u256
    arg_address: AccountAddressInput, // address
    arg_string: string, // String
    arg_object: ObjectAddress, // Object<args_test_suite::tx_args_module::EmptyResource>
    vector_empty: HexInput, // vector<u8>
    vector_bool: Array<boolean>, // vector<bool>
    vector_u8: HexInput, // vector<u8>
    vector_u16: Array<Uint16>, // vector<u16>
    vector_u32: Array<Uint32>, // vector<u32>
    vector_u64: Array<Uint64>, // vector<u64>
    vector_u128: Array<Uint128>, // vector<u128>
    vector_u256: Array<Uint256>, // vector<u256>
    vector_address: Array<AccountAddressInput>, // vector<address>
    vector_string: Array<string>, // vector<String>
    vector_object: Array<ObjectAddress>, // vector<Object<args_test_suite::tx_args_module::EmptyResource>>
    option_empty: Option<Uint8>, // Option<u8>
    option_bool: Option<boolean>, // Option<bool>
    option_u8: Option<Uint8>, // Option<u8>
    option_u16: Option<Uint16>, // Option<u16>
    option_u32: Option<Uint32>, // Option<u32>
    option_u64: Option<Uint64>, // Option<u64>
    option_u128: Option<Uint128>, // Option<u128>
    option_u256: Option<Uint256>, // Option<u256>
    option_address: Option<AccountAddressInput>, // Option<address>
    option_string: Option<string>, // Option<String>
    option_object: Option<ObjectAddress>, // Option<Object<args_test_suite::tx_args_module::EmptyResource>>
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
export type PublicArgumentsMultipleSignersPayloadMoveArguments = {
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

/**
 *  public fun public_arguments_multiple_signers<>(
 *     account_1: &signer,
 *     account_2: signer,
 *     account_3: &signer,
 *     account_4: signer,
 *     account_5: &signer,
 *     signer_addresses: vector<address>,
 *     arg_bool: bool,
 *     arg_u8: u8,
 *     arg_u16: u16,
 *     arg_u32: u32,
 *     arg_u64: u64,
 *     arg_u128: u128,
 *     arg_u256: u256,
 *     arg_address: address,
 *     arg_string: String,
 *     arg_object: Object<args_test_suite::tx_args_module::EmptyResource>,
 *     vector_empty: vector<u8>,
 *     vector_bool: vector<bool>,
 *     vector_u8: vector<u8>,
 *     vector_u16: vector<u16>,
 *     vector_u32: vector<u32>,
 *     vector_u64: vector<u64>,
 *     vector_u128: vector<u128>,
 *     vector_u256: vector<u256>,
 *     vector_address: vector<address>,
 *     vector_string: vector<String>,
 *     vector_object: vector<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *     option_empty: Option<u8>,
 *     option_bool: Option<bool>,
 *     option_u8: Option<u8>,
 *     option_u16: Option<u16>,
 *     option_u32: Option<u32>,
 *     option_u64: Option<u64>,
 *     option_u128: Option<u128>,
 *     option_u256: Option<u256>,
 *     option_address: Option<address>,
 *     option_string: Option<String>,
 *     option_object: Option<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *   )
 **/
export class PublicArgumentsMultipleSigners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "public_arguments_multiple_signers";
  public readonly args: PublicArgumentsMultipleSignersPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // account_1: &signer,
    // account_2: signer,
    // account_3: &signer,
    // account_4: signer,
    // account_5: &signer,
    signer_addresses: Array<AccountAddressInput>, // vector<address>
    arg_bool: boolean, // bool
    arg_u8: Uint8, // u8
    arg_u16: Uint16, // u16
    arg_u32: Uint32, // u32
    arg_u64: Uint64, // u64
    arg_u128: Uint128, // u128
    arg_u256: Uint256, // u256
    arg_address: AccountAddressInput, // address
    arg_string: string, // String
    arg_object: ObjectAddress, // Object<args_test_suite::tx_args_module::EmptyResource>
    vector_empty: HexInput, // vector<u8>
    vector_bool: Array<boolean>, // vector<bool>
    vector_u8: HexInput, // vector<u8>
    vector_u16: Array<Uint16>, // vector<u16>
    vector_u32: Array<Uint32>, // vector<u32>
    vector_u64: Array<Uint64>, // vector<u64>
    vector_u128: Array<Uint128>, // vector<u128>
    vector_u256: Array<Uint256>, // vector<u256>
    vector_address: Array<AccountAddressInput>, // vector<address>
    vector_string: Array<string>, // vector<String>
    vector_object: Array<ObjectAddress>, // vector<Object<args_test_suite::tx_args_module::EmptyResource>>
    option_empty: Option<Uint8>, // Option<u8>
    option_bool: Option<boolean>, // Option<bool>
    option_u8: Option<Uint8>, // Option<u8>
    option_u16: Option<Uint16>, // Option<u16>
    option_u32: Option<Uint32>, // Option<u32>
    option_u64: Option<Uint64>, // Option<u64>
    option_u128: Option<Uint128>, // Option<u128>
    option_u256: Option<Uint256>, // Option<u256>
    option_address: Option<AccountAddressInput>, // Option<address>
    option_string: Option<string>, // Option<String>
    option_object: Option<ObjectAddress>, // Option<Object<args_test_suite::tx_args_module::EmptyResource>>
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

/**
 *  public fun type_tags<>(
 *   )
 **/
export class TypeTags extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "type_tags";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type TypeTagsForArgsPayloadMoveArguments = {
  _a: EntryFunctionArgumentTypes;
  _b: EntryFunctionArgumentTypes;
  _c: EntryFunctionArgumentTypes;
  _d: EntryFunctionArgumentTypes;
  _e: MoveObject;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun type_tags_for_args<T0: drop>(
 *     _a: T0,
 *     _b: T1,
 *     _c: T2,
 *     _d: T3,
 *     _e: Object<T4>,
 *   )
 **/
export class TypeTagsForArgs extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "type_tags_for_args";
  public readonly args: TypeTagsForArgsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: drop

  constructor(
    _a: EntryFunctionArgumentTypes, // T0
    _b: EntryFunctionArgumentTypes, // T1
    _c: EntryFunctionArgumentTypes, // T2
    _d: EntryFunctionArgumentTypes, // T3
    _e: ObjectAddress, // Object<T4>
    typeTags: Array<TypeTagInput>, // T0: drop
  ) {
    super();
    this.args = {
      _a: _a,
      _b: _b,
      _c: _c,
      _d: _d,
      _e: AccountAddress.fromRelaxed(_e),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type ComplexArgumentsPayloadMoveArguments = {
  deeply_nested_1: MoveVector<MoveVector<U8>>;
  deeply_nested_2: MoveVector<MoveVector<MoveString>>;
  deeply_nested_3: MoveVector<MoveVector<MoveVector<MoveString>>>;
  deeply_nested_4: MoveVector<MoveVector<MoveVector<MoveVector<MoveString>>>>;
};

/**
 *  private fun complex_arguments<>(
 *     deeply_nested_1: vector<vector<u8>>,
 *     deeply_nested_2: vector<vector<String>>,
 *     deeply_nested_3: vector<Option<vector<String>>>,
 *     deeply_nested_4: vector<vector<Option<vector<String>>>>,
 *   )
 **/
export class ComplexArguments extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "complex_arguments";
  public readonly args: ComplexArgumentsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    deeply_nested_1: Array<HexInput>, // vector<vector<u8>>
    deeply_nested_2: Array<Array<string>>, // vector<vector<String>>
    deeply_nested_3: Array<Option<Array<string>>>, // vector<Option<vector<String>>>
    deeply_nested_4: Array<Array<Option<Array<string>>>>, // vector<vector<Option<vector<String>>>>
  ) {
    super();
    this.args = {
      deeply_nested_1: new MoveVector(deeply_nested_1.map((argA) => MoveVector.U8(argA))),
      deeply_nested_2: new MoveVector(
        deeply_nested_2.map((argA) => new MoveVector(argA.map((argB) => new MoveString(argB)))),
      ),
      deeply_nested_3: new MoveVector(
        deeply_nested_3.map(
          (argA) => new MoveVector(argA.map((argB) => new MoveVector(argB.map((argC) => new MoveString(argC))))),
        ),
      ),
      deeply_nested_4: new MoveVector(
        deeply_nested_4.map(
          (argA) =>
            new MoveVector(
              argA.map(
                (argB) => new MoveVector(argB.map((argC) => new MoveVector(argC.map((argD) => new MoveString(argD))))),
              ),
            ),
        ),
      ),
    };
  }
}
export type PrivateArgumentsPayloadMoveArguments = {
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

/**
 *  private fun private_arguments<>(
 *     account_1: &signer,
 *     arg_bool: bool,
 *     arg_u8: u8,
 *     arg_u16: u16,
 *     arg_u32: u32,
 *     arg_u64: u64,
 *     arg_u128: u128,
 *     arg_u256: u256,
 *     arg_address: address,
 *     arg_string: String,
 *     arg_object: Object<args_test_suite::tx_args_module::EmptyResource>,
 *     vector_empty: vector<u8>,
 *     vector_bool: vector<bool>,
 *     vector_u8: vector<u8>,
 *     vector_u16: vector<u16>,
 *     vector_u32: vector<u32>,
 *     vector_u64: vector<u64>,
 *     vector_u128: vector<u128>,
 *     vector_u256: vector<u256>,
 *     vector_address: vector<address>,
 *     vector_string: vector<String>,
 *     vector_object: vector<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *     option_empty: Option<u8>,
 *     option_bool: Option<bool>,
 *     option_u8: Option<u8>,
 *     option_u16: Option<u16>,
 *     option_u32: Option<u32>,
 *     option_u64: Option<u64>,
 *     option_u128: Option<u128>,
 *     option_u256: Option<u256>,
 *     option_address: Option<address>,
 *     option_string: Option<String>,
 *     option_object: Option<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *   )
 **/
export class PrivateArguments extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "private_arguments";
  public readonly args: PrivateArgumentsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // account_1: &signer,
    arg_bool: boolean, // bool
    arg_u8: Uint8, // u8
    arg_u16: Uint16, // u16
    arg_u32: Uint32, // u32
    arg_u64: Uint64, // u64
    arg_u128: Uint128, // u128
    arg_u256: Uint256, // u256
    arg_address: AccountAddressInput, // address
    arg_string: string, // String
    arg_object: ObjectAddress, // Object<args_test_suite::tx_args_module::EmptyResource>
    vector_empty: HexInput, // vector<u8>
    vector_bool: Array<boolean>, // vector<bool>
    vector_u8: HexInput, // vector<u8>
    vector_u16: Array<Uint16>, // vector<u16>
    vector_u32: Array<Uint32>, // vector<u32>
    vector_u64: Array<Uint64>, // vector<u64>
    vector_u128: Array<Uint128>, // vector<u128>
    vector_u256: Array<Uint256>, // vector<u256>
    vector_address: Array<AccountAddressInput>, // vector<address>
    vector_string: Array<string>, // vector<String>
    vector_object: Array<ObjectAddress>, // vector<Object<args_test_suite::tx_args_module::EmptyResource>>
    option_empty: Option<Uint8>, // Option<u8>
    option_bool: Option<boolean>, // Option<bool>
    option_u8: Option<Uint8>, // Option<u8>
    option_u16: Option<Uint16>, // Option<u16>
    option_u32: Option<Uint32>, // Option<u32>
    option_u64: Option<Uint64>, // Option<u64>
    option_u128: Option<Uint128>, // Option<u128>
    option_u256: Option<Uint256>, // Option<u256>
    option_address: Option<AccountAddressInput>, // Option<address>
    option_string: Option<string>, // Option<String>
    option_object: Option<ObjectAddress>, // Option<Object<args_test_suite::tx_args_module::EmptyResource>>
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
export type PrivateArgumentsMultipleSignersPayloadMoveArguments = {
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

/**
 *  private fun private_arguments_multiple_signers<>(
 *     account_1: &signer,
 *     account_2: signer,
 *     account_3: &signer,
 *     account_4: signer,
 *     account_5: &signer,
 *     signer_addresses: vector<address>,
 *     arg_bool: bool,
 *     arg_u8: u8,
 *     arg_u16: u16,
 *     arg_u32: u32,
 *     arg_u64: u64,
 *     arg_u128: u128,
 *     arg_u256: u256,
 *     arg_address: address,
 *     arg_string: String,
 *     arg_object: Object<args_test_suite::tx_args_module::EmptyResource>,
 *     vector_empty: vector<u8>,
 *     vector_bool: vector<bool>,
 *     vector_u8: vector<u8>,
 *     vector_u16: vector<u16>,
 *     vector_u32: vector<u32>,
 *     vector_u64: vector<u64>,
 *     vector_u128: vector<u128>,
 *     vector_u256: vector<u256>,
 *     vector_address: vector<address>,
 *     vector_string: vector<String>,
 *     vector_object: vector<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *     option_empty: Option<u8>,
 *     option_bool: Option<bool>,
 *     option_u8: Option<u8>,
 *     option_u16: Option<u16>,
 *     option_u32: Option<u32>,
 *     option_u64: Option<u64>,
 *     option_u128: Option<u128>,
 *     option_u256: Option<u256>,
 *     option_address: Option<address>,
 *     option_string: Option<String>,
 *     option_object: Option<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *   )
 **/
export class PrivateArgumentsMultipleSigners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "private_arguments_multiple_signers";
  public readonly args: PrivateArgumentsMultipleSignersPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // account_1: &signer,
    // account_2: signer,
    // account_3: &signer,
    // account_4: signer,
    // account_5: &signer,
    signer_addresses: Array<AccountAddressInput>, // vector<address>
    arg_bool: boolean, // bool
    arg_u8: Uint8, // u8
    arg_u16: Uint16, // u16
    arg_u32: Uint32, // u32
    arg_u64: Uint64, // u64
    arg_u128: Uint128, // u128
    arg_u256: Uint256, // u256
    arg_address: AccountAddressInput, // address
    arg_string: string, // String
    arg_object: ObjectAddress, // Object<args_test_suite::tx_args_module::EmptyResource>
    vector_empty: HexInput, // vector<u8>
    vector_bool: Array<boolean>, // vector<bool>
    vector_u8: HexInput, // vector<u8>
    vector_u16: Array<Uint16>, // vector<u16>
    vector_u32: Array<Uint32>, // vector<u32>
    vector_u64: Array<Uint64>, // vector<u64>
    vector_u128: Array<Uint128>, // vector<u128>
    vector_u256: Array<Uint256>, // vector<u256>
    vector_address: Array<AccountAddressInput>, // vector<address>
    vector_string: Array<string>, // vector<String>
    vector_object: Array<ObjectAddress>, // vector<Object<args_test_suite::tx_args_module::EmptyResource>>
    option_empty: Option<Uint8>, // Option<u8>
    option_bool: Option<boolean>, // Option<bool>
    option_u8: Option<Uint8>, // Option<u8>
    option_u16: Option<Uint16>, // Option<u16>
    option_u32: Option<Uint32>, // Option<u32>
    option_u64: Option<Uint64>, // Option<u64>
    option_u128: Option<Uint128>, // Option<u128>
    option_u256: Option<Uint256>, // Option<u256>
    option_address: Option<AccountAddressInput>, // Option<address>
    option_string: Option<string>, // Option<String>
    option_object: Option<ObjectAddress>, // Option<Object<args_test_suite::tx_args_module::EmptyResource>>
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

/**
 *  public fun get_expected_vector_string<>(
 *   )
 **/
export class GetExpectedVectorString extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "get_expected_vector_string";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}

/**
 *  public fun get_test_object_addresses<>(
 *   )
 **/
export class GetTestObjectAddresses extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "get_test_object_addresses";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}

/**
 *  public fun get_test_objects<>(
 *   )
 **/
export class GetTestObjects extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "get_test_objects";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type ViewAllArgumentsPayloadMoveArguments = {
  arg_bool: boolean;
  arg_u8: Uint8;
  arg_u16: Uint16;
  arg_u32: Uint32;
  arg_u64: string;
  arg_u128: string;
  arg_u256: string;
  arg_address: string;
  arg_string: string;
  arg_object: ObjectAddress;
  vector_empty: HexInput;
  vector_bool: Array<boolean>;
  vector_u8: HexInput;
  vector_u16: Array<Uint16>;
  vector_u32: Array<Uint32>;
  vector_u64: Array<string>;
  vector_u128: Array<string>;
  vector_u256: Array<string>;
  vector_address: Array<string>;
  vector_string: Array<string>;
  vector_object: Array<ObjectAddress>;
  option_empty: Array<Uint8>;
  option_bool: Array<boolean>;
  option_u8: Array<Uint8>;
  option_u16: Array<Uint16>;
  option_u32: Array<Uint32>;
  option_u64: Array<string>;
  option_u128: Array<string>;
  option_u256: Array<string>;
  option_address: Array<string>;
  option_string: Array<string>;
  option_object: Array<ObjectAddress>;
};

/**
 *  public fun view_all_arguments<>(
 *     arg_bool: bool,
 *     arg_u8: u8,
 *     arg_u16: u16,
 *     arg_u32: u32,
 *     arg_u64: u64,
 *     arg_u128: u128,
 *     arg_u256: u256,
 *     arg_address: address,
 *     arg_string: String,
 *     arg_object: Object<args_test_suite::tx_args_module::EmptyResource>,
 *     vector_empty: vector<u8>,
 *     vector_bool: vector<bool>,
 *     vector_u8: vector<u8>,
 *     vector_u16: vector<u16>,
 *     vector_u32: vector<u32>,
 *     vector_u64: vector<u64>,
 *     vector_u128: vector<u128>,
 *     vector_u256: vector<u256>,
 *     vector_address: vector<address>,
 *     vector_string: vector<String>,
 *     vector_object: vector<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *     option_empty: Option<u8>,
 *     option_bool: Option<bool>,
 *     option_u8: Option<u8>,
 *     option_u16: Option<u16>,
 *     option_u32: Option<u32>,
 *     option_u64: Option<u64>,
 *     option_u128: Option<u128>,
 *     option_u256: Option<u256>,
 *     option_address: Option<address>,
 *     option_string: Option<String>,
 *     option_object: Option<Object<args_test_suite::tx_args_module::EmptyResource>>,
 *   )
 **/
export class ViewAllArguments extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed(
    "0x2cca48b8b0d7f77ef28bfd608883c599680c5b8db8192c5e3baaae1aee45114c",
  );
  public readonly moduleName = "tx_args_module";
  public readonly functionName = "view_all_arguments";
  public readonly args: ViewAllArgumentsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    arg_bool: boolean, // bool
    arg_u8: Uint8, // u8
    arg_u16: Uint16, // u16
    arg_u32: Uint32, // u32
    arg_u64: Uint64, // u64
    arg_u128: Uint128, // u128
    arg_u256: Uint256, // u256
    arg_address: AccountAddressInput, // address
    arg_string: string, // String
    arg_object: ObjectAddress, // Object<args_test_suite::tx_args_module::EmptyResource>
    vector_empty: HexInput, // vector<u8>
    vector_bool: Array<boolean>, // vector<bool>
    vector_u8: HexInput, // vector<u8>
    vector_u16: Array<Uint16>, // vector<u16>
    vector_u32: Array<Uint32>, // vector<u32>
    vector_u64: Array<Uint64>, // vector<u64>
    vector_u128: Array<Uint128>, // vector<u128>
    vector_u256: Array<Uint256>, // vector<u256>
    vector_address: Array<AccountAddressInput>, // vector<address>
    vector_string: Array<string>, // vector<String>
    vector_object: Array<ObjectAddress>, // vector<Object<args_test_suite::tx_args_module::EmptyResource>>
    option_empty: Option<Uint8>, // Option<u8>
    option_bool: Option<boolean>, // Option<bool>
    option_u8: Option<Uint8>, // Option<u8>
    option_u16: Option<Uint16>, // Option<u16>
    option_u32: Option<Uint32>, // Option<u32>
    option_u64: Option<Uint64>, // Option<u64>
    option_u128: Option<Uint128>, // Option<u128>
    option_u256: Option<Uint256>, // Option<u256>
    option_address: Option<AccountAddressInput>, // Option<address>
    option_string: Option<string>, // Option<String>
    option_object: Option<ObjectAddress>, // Option<Object<args_test_suite::tx_args_module::EmptyResource>>
  ) {
    super();
    this.args = {
      arg_bool: arg_bool,
      arg_u8: arg_u8,
      arg_u16: arg_u16,
      arg_u32: arg_u32,
      arg_u64: BigInt(arg_u64).toString(),
      arg_u128: BigInt(arg_u128).toString(),
      arg_u256: BigInt(arg_u256).toString(),
      arg_address: AccountAddress.fromRelaxed(arg_address).toString(),
      arg_string: arg_string,
      arg_object: AccountAddress.fromRelaxed(arg_object).toString(),
      vector_empty: Hex.fromHexInput(vector_empty).toString(),
      vector_bool: vector_bool.map((argA) => argA),
      vector_u8: Hex.fromHexInput(vector_u8).toString(),
      vector_u16: vector_u16.map((argA) => argA),
      vector_u32: vector_u32.map((argA) => argA),
      vector_u64: vector_u64.map((argA) => BigInt(argA).toString()),
      vector_u128: vector_u128.map((argA) => BigInt(argA).toString()),
      vector_u256: vector_u256.map((argA) => BigInt(argA).toString()),
      vector_address: vector_address.map((argA) => AccountAddress.fromRelaxed(argA).toString()),
      vector_string: vector_string.map((argA) => argA),
      vector_object: vector_object.map((argA) => AccountAddress.fromRelaxed(argA).toString()),
      option_empty: option_empty.map((argA) => argA),
      option_bool: option_bool.map((argA) => argA),
      option_u8: option_u8.map((argA) => argA),
      option_u16: option_u16.map((argA) => argA),
      option_u32: option_u32.map((argA) => argA),
      option_u64: option_u64.map((argA) => BigInt(argA).toString()),
      option_u128: option_u128.map((argA) => BigInt(argA).toString()),
      option_u256: option_u256.map((argA) => BigInt(argA).toString()),
      option_address: option_address.map((argA) => AccountAddress.fromRelaxed(argA).toString()),
      option_string: option_string.map((argA) => argA),
      option_object: option_object.map((argA) => AccountAddress.fromRelaxed(argA).toString()),
    };
  }
}
