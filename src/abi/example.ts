// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */
import {
  Bool,
  EntryFunction,
  EntryFunctionArgumentTypes,
  Identifier,
  ModuleId,
  MoveString,
  MoveVector,
  TransactionPayloadEntryFunction,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
} from "..";
import { Serializable, Serializer } from "../bcs";
import { AccountAddress } from "../core";
import { HexInput, Uint8, Uint64 } from "../types";
import { OneOrNone } from "./types";
import { addressBytes } from "./utils";

type MoveObject = AccountAddress;

export namespace TxArgsModule {
  export type PrivateArgumentsSerializableArgs = {
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

  export class PrivateArguments extends Serializable {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c",
    );
    public readonly moduleName = "tx_args_module";
    public readonly functionName = "private_arguments";
    public readonly args: PrivateArgumentsSerializableArgs;

    constructor(
      arg_bool: boolean, // bool
      arg_u8: Uint8, // u8
      arg_u16: Uint16, // u16
      arg_u32: Uint32, // u32
      arg_u64: Uint64, // u64
      arg_u128: Uint128, // u128
      arg_u256: Uint256, // u256
      arg_address: HexInput | AccountAddress, // address
      arg_string: string, // 0x1::string::String
      arg_object: HexInput | AccountAddress, // 0x1::object::Object<0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c::tx_args_module::EmptyResource>
      vector_empty: Array<Uint8>, // vector<u8>
      vector_bool: Array<boolean>, // vector<bool>
      vector_u8: Array<Uint8>, // vector<u8>
      vector_u16: Array<Uint16>, // vector<u16>
      vector_u32: Array<Uint32>, // vector<u32>
      vector_u64: Array<Uint64>, // vector<u64>
      vector_u128: Array<Uint128>, // vector<u128>
      vector_u256: Array<Uint256>, // vector<u256>
      vector_address: Array<HexInput | AccountAddress>, // vector<address>
      vector_string: Array<string>, // vector<0x1::string::String>
      vector_object: Array<HexInput | AccountAddress>, // vector<0x1::object::Object<0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c::tx_args_module::EmptyResource>>
      option_empty: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_bool: OneOrNone<boolean>, // 0x1::option::Option<bool>
      option_u8: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_u16: OneOrNone<Uint16>, // 0x1::option::Option<u16>
      option_u32: OneOrNone<Uint32>, // 0x1::option::Option<u32>
      option_u64: OneOrNone<Uint64>, // 0x1::option::Option<u64>
      option_u128: OneOrNone<Uint128>, // 0x1::option::Option<u128>
      option_u256: OneOrNone<Uint256>, // 0x1::option::Option<u256>
      option_address: OneOrNone<HexInput | AccountAddress>, // 0x1::option::Option<address>
      option_string: OneOrNone<string>, // 0x1::option::Option<0x1::string::String>
      option_object: OneOrNone<HexInput | AccountAddress>, // 0x1::option::Option<0x1::object::Object<0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c::tx_args_module::EmptyResource>>
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
        arg_address: new AccountAddress(addressBytes(arg_address)),
        arg_string: new MoveString(arg_string),
        arg_object: new AccountAddress(addressBytes(arg_object)),
        vector_empty: new MoveVector(vector_empty.map((argA) => new U8(argA))),
        vector_bool: new MoveVector(vector_bool.map((argA) => new Bool(argA))),
        vector_u8: new MoveVector(vector_u8.map((argA) => new U8(argA))),
        vector_u16: new MoveVector(vector_u16.map((argA) => new U16(argA))),
        vector_u32: new MoveVector(vector_u32.map((argA) => new U32(argA))),
        vector_u64: new MoveVector(vector_u64.map((argA) => new U64(argA))),
        vector_u128: new MoveVector(vector_u128.map((argA) => new U128(argA))),
        vector_u256: new MoveVector(vector_u256.map((argA) => new U256(argA))),
        vector_address: new MoveVector(vector_address.map((argA) => new AccountAddress(addressBytes(argA)))),
        vector_string: new MoveVector(vector_string.map((argA) => new MoveString(argA))),
        vector_object: new MoveVector(vector_object.map((argA) => new AccountAddress(addressBytes(argA)))),
        option_empty: new MoveVector(option_empty.map((argA) => new U8(argA))),
        option_bool: new MoveVector(option_bool.map((argA) => new Bool(argA))),
        option_u8: new MoveVector(option_u8.map((argA) => new U8(argA))),
        option_u16: new MoveVector(option_u16.map((argA) => new U16(argA))),
        option_u32: new MoveVector(option_u32.map((argA) => new U32(argA))),
        option_u64: new MoveVector(option_u64.map((argA) => new U64(argA))),
        option_u128: new MoveVector(option_u128.map((argA) => new U128(argA))),
        option_u256: new MoveVector(option_u256.map((argA) => new U256(argA))),
        option_address: new MoveVector(option_address.map((argA) => new AccountAddress(addressBytes(argA)))),
        option_string: new MoveVector(option_string.map((argA) => new MoveString(argA))),
        option_object: new MoveVector(option_object.map((argA) => new AccountAddress(addressBytes(argA)))),
      };
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray(),
      );
      return new TransactionPayloadEntryFunction(entryFunction);
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach((arg) => {
        serializer.serialize(arg);
      });
    }
  }

  export type PublicArgumentsMultipleSignersSerializableArgs = {
    account_1: MoveVector<AccountAddress>;
    account_2: Bool;
    account_3: U8;
    account_4: U16;
    account_5: U32;
    signer_addresses: U64;
    arg_bool: U128;
    arg_u8: U256;
    arg_u16: AccountAddress;
    arg_u32: MoveString;
    arg_u64: MoveObject;
    arg_u128: MoveVector<U8>;
    arg_u256: MoveVector<Bool>;
    arg_address: MoveVector<U8>;
    arg_string: MoveVector<U16>;
    arg_object: MoveVector<U32>;
    vector_empty: MoveVector<U64>;
    vector_bool: MoveVector<U128>;
    vector_u8: MoveVector<U256>;
    vector_u16: MoveVector<AccountAddress>;
    vector_u32: MoveVector<MoveString>;
    vector_u64: MoveVector<MoveObject>;
    vector_u128: MoveVector<U8>;
    vector_u256: MoveVector<Bool>;
    vector_address: MoveVector<U8>;
    vector_string: MoveVector<U16>;
    vector_object: MoveVector<U32>;
    option_empty: MoveVector<U64>;
    option_bool: MoveVector<U128>;
    option_u8: MoveVector<U256>;
    option_u16: MoveVector<AccountAddress>;
    option_u32: MoveVector<MoveString>;
    option_u64: MoveVector<MoveObject>;
  };

  export class PublicArgumentsMultipleSigners extends Serializable {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c",
    );
    public readonly moduleName = "tx_args_module";
    public readonly functionName = "public_arguments_multiple_signers";
    public readonly args: PublicArgumentsMultipleSignersSerializableArgs;

    constructor(
      account_1: Array<HexInput | AccountAddress>, // vector<address>
      account_2: boolean, // bool
      account_3: Uint8, // u8
      account_4: Uint16, // u16
      account_5: Uint32, // u32
      signer_addresses: Uint64, // u64
      arg_bool: Uint128, // u128
      arg_u8: Uint256, // u256
      arg_u16: HexInput | AccountAddress, // address
      arg_u32: string, // 0x1::string::String
      arg_u64: HexInput | AccountAddress, // 0x1::object::Object<0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c::tx_args_module::EmptyResource>
      arg_u128: Array<Uint8>, // vector<u8>
      arg_u256: Array<boolean>, // vector<bool>
      arg_address: Array<Uint8>, // vector<u8>
      arg_string: Array<Uint16>, // vector<u16>
      arg_object: Array<Uint32>, // vector<u32>
      vector_empty: Array<Uint64>, // vector<u64>
      vector_bool: Array<Uint128>, // vector<u128>
      vector_u8: Array<Uint256>, // vector<u256>
      vector_u16: Array<HexInput | AccountAddress>, // vector<address>
      vector_u32: Array<string>, // vector<0x1::string::String>
      vector_u64: Array<HexInput | AccountAddress>, // vector<0x1::object::Object<0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c::tx_args_module::EmptyResource>>
      vector_u128: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      vector_u256: OneOrNone<boolean>, // 0x1::option::Option<bool>
      vector_address: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      vector_string: OneOrNone<Uint16>, // 0x1::option::Option<u16>
      vector_object: OneOrNone<Uint32>, // 0x1::option::Option<u32>
      option_empty: OneOrNone<Uint64>, // 0x1::option::Option<u64>
      option_bool: OneOrNone<Uint128>, // 0x1::option::Option<u128>
      option_u8: OneOrNone<Uint256>, // 0x1::option::Option<u256>
      option_u16: OneOrNone<HexInput | AccountAddress>, // 0x1::option::Option<address>
      option_u32: OneOrNone<string>, // 0x1::option::Option<0x1::string::String>
      option_u64: OneOrNone<HexInput | AccountAddress>, // 0x1::option::Option<0x1::object::Object<0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c::tx_args_module::EmptyResource>>
    ) {
      super();
      this.args = {
        account_1: new MoveVector(account_1.map((argA) => new AccountAddress(addressBytes(argA)))),
        account_2: new Bool(account_2),
        account_3: new U8(account_3),
        account_4: new U16(account_4),
        account_5: new U32(account_5),
        signer_addresses: new U64(signer_addresses),
        arg_bool: new U128(arg_bool),
        arg_u8: new U256(arg_u8),
        arg_u16: new AccountAddress(addressBytes(arg_u16)),
        arg_u32: new MoveString(arg_u32),
        arg_u64: new AccountAddress(addressBytes(arg_u64)),
        arg_u128: new MoveVector(arg_u128.map((argA) => new U8(argA))),
        arg_u256: new MoveVector(arg_u256.map((argA) => new Bool(argA))),
        arg_address: new MoveVector(arg_address.map((argA) => new U8(argA))),
        arg_string: new MoveVector(arg_string.map((argA) => new U16(argA))),
        arg_object: new MoveVector(arg_object.map((argA) => new U32(argA))),
        vector_empty: new MoveVector(vector_empty.map((argA) => new U64(argA))),
        vector_bool: new MoveVector(vector_bool.map((argA) => new U128(argA))),
        vector_u8: new MoveVector(vector_u8.map((argA) => new U256(argA))),
        vector_u16: new MoveVector(vector_u16.map((argA) => new AccountAddress(addressBytes(argA)))),
        vector_u32: new MoveVector(vector_u32.map((argA) => new MoveString(argA))),
        vector_u64: new MoveVector(vector_u64.map((argA) => new AccountAddress(addressBytes(argA)))),
        vector_u128: new MoveVector(vector_u128.map((argA) => new U8(argA))),
        vector_u256: new MoveVector(vector_u256.map((argA) => new Bool(argA))),
        vector_address: new MoveVector(vector_address.map((argA) => new U8(argA))),
        vector_string: new MoveVector(vector_string.map((argA) => new U16(argA))),
        vector_object: new MoveVector(vector_object.map((argA) => new U32(argA))),
        option_empty: new MoveVector(option_empty.map((argA) => new U64(argA))),
        option_bool: new MoveVector(option_bool.map((argA) => new U128(argA))),
        option_u8: new MoveVector(option_u8.map((argA) => new U256(argA))),
        option_u16: new MoveVector(option_u16.map((argA) => new AccountAddress(addressBytes(argA)))),
        option_u32: new MoveVector(option_u32.map((argA) => new MoveString(argA))),
        option_u64: new MoveVector(option_u64.map((argA) => new AccountAddress(addressBytes(argA)))),
      };
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray(),
      );
      return new TransactionPayloadEntryFunction(entryFunction);
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach((arg) => {
        serializer.serialize(arg);
      });
    }
  }
  export type PublicArgumentsOneSignerSerializableArgs = {
    account_1: AccountAddress;
    signer_address: Bool;
    arg_bool: U8;
    arg_u8: U16;
    arg_u16: U32;
    arg_u32: U64;
    arg_u64: U128;
    arg_u128: U256;
    arg_u256: AccountAddress;
    arg_address: MoveString;
    arg_string: MoveObject;
    arg_object: MoveVector<U8>;
    vector_empty: MoveVector<Bool>;
    vector_bool: MoveVector<U8>;
    vector_u8: MoveVector<U16>;
    vector_u16: MoveVector<U32>;
    vector_u32: MoveVector<U64>;
    vector_u64: MoveVector<U128>;
    vector_u128: MoveVector<U256>;
    vector_u256: MoveVector<AccountAddress>;
    vector_address: MoveVector<MoveString>;
    vector_string: MoveVector<MoveObject>;
    vector_object: MoveVector<U8>;
    option_empty: MoveVector<Bool>;
    option_bool: MoveVector<U8>;
    option_u8: MoveVector<U16>;
    option_u16: MoveVector<U32>;
    option_u32: MoveVector<U64>;
    option_u64: MoveVector<U128>;
    option_u128: MoveVector<U256>;
    option_u256: MoveVector<AccountAddress>;
    option_address: MoveVector<MoveString>;
    option_string: MoveVector<MoveObject>;
  };

  export class PublicArgumentsOneSigner extends Serializable {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c",
    );
    public readonly moduleName = "tx_args_module";
    public readonly functionName = "public_arguments_one_signer";
    public readonly args: PublicArgumentsOneSignerSerializableArgs;

    constructor(
      account_1: HexInput | AccountAddress, // address
      signer_address: boolean, // bool
      arg_bool: Uint8, // u8
      arg_u8: Uint16, // u16
      arg_u16: Uint32, // u32
      arg_u32: Uint64, // u64
      arg_u64: Uint128, // u128
      arg_u128: Uint256, // u256
      arg_u256: HexInput | AccountAddress, // address
      arg_address: string, // 0x1::string::String
      arg_string: HexInput | AccountAddress, // 0x1::object::Object<0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c::tx_args_module::EmptyResource>
      arg_object: Array<Uint8>, // vector<u8>
      vector_empty: Array<boolean>, // vector<bool>
      vector_bool: Array<Uint8>, // vector<u8>
      vector_u8: Array<Uint16>, // vector<u16>
      vector_u16: Array<Uint32>, // vector<u32>
      vector_u32: Array<Uint64>, // vector<u64>
      vector_u64: Array<Uint128>, // vector<u128>
      vector_u128: Array<Uint256>, // vector<u256>
      vector_u256: Array<HexInput | AccountAddress>, // vector<address>
      vector_address: Array<string>, // vector<0x1::string::String>
      vector_string: Array<HexInput | AccountAddress>, // vector<0x1::object::Object<0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c::tx_args_module::EmptyResource>>
      vector_object: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_empty: OneOrNone<boolean>, // 0x1::option::Option<bool>
      option_bool: OneOrNone<Uint8>, // 0x1::option::Option<u8>
      option_u8: OneOrNone<Uint16>, // 0x1::option::Option<u16>
      option_u16: OneOrNone<Uint32>, // 0x1::option::Option<u32>
      option_u32: OneOrNone<Uint64>, // 0x1::option::Option<u64>
      option_u64: OneOrNone<Uint128>, // 0x1::option::Option<u128>
      option_u128: OneOrNone<Uint256>, // 0x1::option::Option<u256>
      option_u256: OneOrNone<HexInput | AccountAddress>, // 0x1::option::Option<address>
      option_address: OneOrNone<string>, // 0x1::option::Option<0x1::string::String>
      option_string: OneOrNone<HexInput | AccountAddress>, // 0x1::option::Option<0x1::object::Object<0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c::tx_args_module::EmptyResource>>
    ) {
      super();
      this.args = {
        account_1: new AccountAddress(addressBytes(account_1)),
        signer_address: new Bool(signer_address),
        arg_bool: new U8(arg_bool),
        arg_u8: new U16(arg_u8),
        arg_u16: new U32(arg_u16),
        arg_u32: new U64(arg_u32),
        arg_u64: new U128(arg_u64),
        arg_u128: new U256(arg_u128),
        arg_u256: new AccountAddress(addressBytes(arg_u256)),
        arg_address: new MoveString(arg_address),
        arg_string: new AccountAddress(addressBytes(arg_string)),
        arg_object: new MoveVector(arg_object.map((argA) => new U8(argA))),
        vector_empty: new MoveVector(vector_empty.map((argA) => new Bool(argA))),
        vector_bool: new MoveVector(vector_bool.map((argA) => new U8(argA))),
        vector_u8: new MoveVector(vector_u8.map((argA) => new U16(argA))),
        vector_u16: new MoveVector(vector_u16.map((argA) => new U32(argA))),
        vector_u32: new MoveVector(vector_u32.map((argA) => new U64(argA))),
        vector_u64: new MoveVector(vector_u64.map((argA) => new U128(argA))),
        vector_u128: new MoveVector(vector_u128.map((argA) => new U256(argA))),
        vector_u256: new MoveVector(vector_u256.map((argA) => new AccountAddress(addressBytes(argA)))),
        vector_address: new MoveVector(vector_address.map((argA) => new MoveString(argA))),
        vector_string: new MoveVector(vector_string.map((argA) => new AccountAddress(addressBytes(argA)))),
        vector_object: new MoveVector(vector_object.map((argA) => new U8(argA))),
        option_empty: new MoveVector(option_empty.map((argA) => new Bool(argA))),
        option_bool: new MoveVector(option_bool.map((argA) => new U8(argA))),
        option_u8: new MoveVector(option_u8.map((argA) => new U16(argA))),
        option_u16: new MoveVector(option_u16.map((argA) => new U32(argA))),
        option_u32: new MoveVector(option_u32.map((argA) => new U64(argA))),
        option_u64: new MoveVector(option_u64.map((argA) => new U128(argA))),
        option_u128: new MoveVector(option_u128.map((argA) => new U256(argA))),
        option_u256: new MoveVector(option_u256.map((argA) => new AccountAddress(addressBytes(argA)))),
        option_address: new MoveVector(option_address.map((argA) => new MoveString(argA))),
        option_string: new MoveVector(option_string.map((argA) => new AccountAddress(addressBytes(argA)))),
      };
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray(),
      );
      return new TransactionPayloadEntryFunction(entryFunction);
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
    }

    serialize(serializer: Serializer): void {
      const args = this.argsToArray();
      args.forEach((arg) => {
        serializer.serialize(arg);
      });
    }
  }

  export class TypeTags extends Serializable {
    public readonly moduleAddress = AccountAddress.fromRelaxed(
      "0x5fc6a85c6d2db2e2ffff0eb449d05f8ca5ccc16858e6d6595fc625a43366aa7c",
    );
    public readonly moduleName = "tx_args_module";
    public readonly functionName = "type_tags";

    constructor() {
      super();
    }

    toPayload(): TransactionPayloadEntryFunction {
      const entryFunction = new EntryFunction(
        new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
        new Identifier(this.functionName),
        [],
        this.argsToArray(),
      );
      return new TransactionPayloadEntryFunction(entryFunction);
    }

    argsToArray(): Array<EntryFunctionArgumentTypes> {
      return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
    }
    // eslint-disable-next-line
    serialize(_serializer: Serializer): void {}
  }
}
