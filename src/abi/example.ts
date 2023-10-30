/* eslint-disable max-len */
import { Bool, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "..";
import { Serializable, Serializer } from "../bcs";
import { AccountAddress } from "../core";
import { AnyNumber, HexInput } from "../types";
import { OneOrNone } from "./types";

type MoveObject = AccountAddress;

const addressFromAny = (address: HexInput | AccountAddress): AccountAddress => {
  if (address instanceof AccountAddress) {
    return address;
  }
  return AccountAddress.fromHexInputRelaxed(address);
};
export namespace TxArgsModule {
  export type PrivateArgumentsSerializableArgs = {
    arg_0: Bool;
    arg_1: U8;
    arg_2: U16;
    arg_3: U32;
    arg_4: U64;
    arg_5: U128;
    arg_6: U256;
    arg_7: AccountAddress;
    arg_8: MoveString;
    arg_9: MoveObject;
    arg_10: MoveVector<U8>;
    arg_11: MoveVector<Bool>;
    arg_12: MoveVector<U8>;
    arg_13: MoveVector<U16>;
    arg_14: MoveVector<U32>;
    arg_15: MoveVector<U64>;
    arg_16: MoveVector<U128>;
    arg_17: MoveVector<U256>;
    arg_18: MoveVector<AccountAddress>;
    arg_19: MoveVector<MoveString>;
    arg_20: MoveVector<MoveObject>;
    arg_21: MoveVector<U8>;
    arg_22: MoveVector<Bool>;
    arg_23: MoveVector<U8>;
    arg_24: MoveVector<U16>;
    arg_25: MoveVector<U32>;
    arg_26: MoveVector<U64>;
    arg_27: MoveVector<U128>;
    arg_28: MoveVector<U256>;
    arg_29: MoveVector<AccountAddress>;
    arg_30: MoveVector<MoveString>;
    arg_31: MoveVector<MoveObject>;
  };

  export class PrivateArguments extends Serializable {
    public readonly args: PrivateArgumentsSerializableArgs;

    constructor(args: {
      arg_0: boolean; // bool
      arg_1: number; // u8
      arg_2: number; // u16
      arg_3: number; // u32
      arg_4: AnyNumber; // u64
      arg_5: AnyNumber; // u128
      arg_6: AnyNumber; // u256
      arg_7: HexInput | AccountAddress; // address
      arg_8: string; // 0x1::string::String
      arg_9: HexInput | AccountAddress; // 0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>
      arg_10: Array<number>; // vector<u8>
      arg_11: Array<boolean>; // vector<bool>
      arg_12: Array<number>; // vector<u8>
      arg_13: Array<number>; // vector<u16>
      arg_14: Array<number>; // vector<u32>
      arg_15: Array<AnyNumber>; // vector<u64>
      arg_16: Array<AnyNumber>; // vector<u128>
      arg_17: Array<AnyNumber>; // vector<u256>
      arg_18: Array<HexInput | AccountAddress>; // vector<address>
      arg_19: Array<string>; // vector<0x1::string::String>
      arg_20: Array<HexInput | AccountAddress>; // vector<0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>>
      arg_21: OneOrNone<number>; // 0x1::option::Option<u8>
      arg_22: OneOrNone<boolean>; // 0x1::option::Option<bool>
      arg_23: OneOrNone<number>; // 0x1::option::Option<u8>
      arg_24: OneOrNone<number>; // 0x1::option::Option<u16>
      arg_25: OneOrNone<number>; // 0x1::option::Option<u32>
      arg_26: OneOrNone<AnyNumber>; // 0x1::option::Option<u64>
      arg_27: OneOrNone<AnyNumber>; // 0x1::option::Option<u128>
      arg_28: OneOrNone<AnyNumber>; // 0x1::option::Option<u256>
      arg_29: OneOrNone<HexInput | AccountAddress>; // 0x1::option::Option<address>
      arg_30: OneOrNone<string>; // 0x1::option::Option<0x1::string::String>
      arg_31: OneOrNone<HexInput | AccountAddress>; // 0x1::option::Option<0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>>
    }) {
      super();
      this.args = {
        arg_0: new Bool(args.arg_0),
        arg_1: new U8(args.arg_1),
        arg_2: new U16(args.arg_2),
        arg_3: new U32(args.arg_3),
        arg_4: new U64(args.arg_4),
        arg_5: new U128(args.arg_5),
        arg_6: new U256(args.arg_6),
        arg_7: new AccountAddress(addressFromAny(args.arg_7)),
        arg_8: new MoveString(args.arg_8),
        arg_9: new AccountAddress(addressFromAny(args.arg_9)),
        arg_10: new MoveVector(args.arg_10.map((argA) => new U8(argA))),
        arg_11: new MoveVector(args.arg_11.map((argA) => new Bool(argA))),
        arg_12: new MoveVector(args.arg_12.map((argA) => new U8(argA))),
        arg_13: new MoveVector(args.arg_13.map((argA) => new U16(argA))),
        arg_14: new MoveVector(args.arg_14.map((argA) => new U32(argA))),
        arg_15: new MoveVector(args.arg_15.map((argA) => new U64(argA))),
        arg_16: new MoveVector(args.arg_16.map((argA) => new U128(argA))),
        arg_17: new MoveVector(args.arg_17.map((argA) => new U256(argA))),
        arg_18: new MoveVector(args.arg_18.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_19: new MoveVector(args.arg_19.map((argA) => new MoveString(argA))),
        arg_20: new MoveVector(args.arg_20.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_21: new MoveVector(args.arg_21.map((argA) => new U8(argA))),
        arg_22: new MoveVector(args.arg_22.map((argA) => new Bool(argA))),
        arg_23: new MoveVector(args.arg_23.map((argA) => new U8(argA))),
        arg_24: new MoveVector(args.arg_24.map((argA) => new U16(argA))),
        arg_25: new MoveVector(args.arg_25.map((argA) => new U32(argA))),
        arg_26: new MoveVector(args.arg_26.map((argA) => new U64(argA))),
        arg_27: new MoveVector(args.arg_27.map((argA) => new U128(argA))),
        arg_28: new MoveVector(args.arg_28.map((argA) => new U256(argA))),
        arg_29: new MoveVector(args.arg_29.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_30: new MoveVector(args.arg_30.map((argA) => new MoveString(argA))),
        arg_31: new MoveVector(args.arg_31.map((argA) => new AccountAddress(addressFromAny(argA)))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type PublicArgumentsSerializableArgs = {
    arg_0: Bool;
    arg_1: U8;
    arg_2: U16;
    arg_3: U32;
    arg_4: U64;
    arg_5: U128;
    arg_6: U256;
    arg_7: AccountAddress;
    arg_8: MoveString;
    arg_9: MoveObject;
    arg_10: MoveVector<U8>;
    arg_11: MoveVector<Bool>;
    arg_12: MoveVector<U8>;
    arg_13: MoveVector<U16>;
    arg_14: MoveVector<U32>;
    arg_15: MoveVector<U64>;
    arg_16: MoveVector<U128>;
    arg_17: MoveVector<U256>;
    arg_18: MoveVector<AccountAddress>;
    arg_19: MoveVector<MoveString>;
    arg_20: MoveVector<MoveObject>;
    arg_21: MoveVector<U8>;
    arg_22: MoveVector<Bool>;
    arg_23: MoveVector<U8>;
    arg_24: MoveVector<U16>;
    arg_25: MoveVector<U32>;
    arg_26: MoveVector<U64>;
    arg_27: MoveVector<U128>;
    arg_28: MoveVector<U256>;
    arg_29: MoveVector<AccountAddress>;
    arg_30: MoveVector<MoveString>;
    arg_31: MoveVector<MoveObject>;
  };

  export class PublicArguments extends Serializable {
    public readonly args: PublicArgumentsSerializableArgs;

    constructor(args: {
      arg_0: boolean; // bool
      arg_1: number; // u8
      arg_2: number; // u16
      arg_3: number; // u32
      arg_4: AnyNumber; // u64
      arg_5: AnyNumber; // u128
      arg_6: AnyNumber; // u256
      arg_7: HexInput | AccountAddress; // address
      arg_8: string; // 0x1::string::String
      arg_9: HexInput | AccountAddress; // 0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>
      arg_10: Array<number>; // vector<u8>
      arg_11: Array<boolean>; // vector<bool>
      arg_12: Array<number>; // vector<u8>
      arg_13: Array<number>; // vector<u16>
      arg_14: Array<number>; // vector<u32>
      arg_15: Array<AnyNumber>; // vector<u64>
      arg_16: Array<AnyNumber>; // vector<u128>
      arg_17: Array<AnyNumber>; // vector<u256>
      arg_18: Array<HexInput | AccountAddress>; // vector<address>
      arg_19: Array<string>; // vector<0x1::string::String>
      arg_20: Array<HexInput | AccountAddress>; // vector<0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>>
      arg_21: OneOrNone<number>; // 0x1::option::Option<u8>
      arg_22: OneOrNone<boolean>; // 0x1::option::Option<bool>
      arg_23: OneOrNone<number>; // 0x1::option::Option<u8>
      arg_24: OneOrNone<number>; // 0x1::option::Option<u16>
      arg_25: OneOrNone<number>; // 0x1::option::Option<u32>
      arg_26: OneOrNone<AnyNumber>; // 0x1::option::Option<u64>
      arg_27: OneOrNone<AnyNumber>; // 0x1::option::Option<u128>
      arg_28: OneOrNone<AnyNumber>; // 0x1::option::Option<u256>
      arg_29: OneOrNone<HexInput | AccountAddress>; // 0x1::option::Option<address>
      arg_30: OneOrNone<string>; // 0x1::option::Option<0x1::string::String>
      arg_31: OneOrNone<HexInput | AccountAddress>; // 0x1::option::Option<0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>>
    }) {
      super();
      this.args = {
        arg_0: new Bool(args.arg_0),
        arg_1: new U8(args.arg_1),
        arg_2: new U16(args.arg_2),
        arg_3: new U32(args.arg_3),
        arg_4: new U64(args.arg_4),
        arg_5: new U128(args.arg_5),
        arg_6: new U256(args.arg_6),
        arg_7: new AccountAddress(addressFromAny(args.arg_7)),
        arg_8: new MoveString(args.arg_8),
        arg_9: new AccountAddress(addressFromAny(args.arg_9)),
        arg_10: new MoveVector(args.arg_10.map((argA) => new U8(argA))),
        arg_11: new MoveVector(args.arg_11.map((argA) => new Bool(argA))),
        arg_12: new MoveVector(args.arg_12.map((argA) => new U8(argA))),
        arg_13: new MoveVector(args.arg_13.map((argA) => new U16(argA))),
        arg_14: new MoveVector(args.arg_14.map((argA) => new U32(argA))),
        arg_15: new MoveVector(args.arg_15.map((argA) => new U64(argA))),
        arg_16: new MoveVector(args.arg_16.map((argA) => new U128(argA))),
        arg_17: new MoveVector(args.arg_17.map((argA) => new U256(argA))),
        arg_18: new MoveVector(args.arg_18.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_19: new MoveVector(args.arg_19.map((argA) => new MoveString(argA))),
        arg_20: new MoveVector(args.arg_20.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_21: new MoveVector(args.arg_21.map((argA) => new U8(argA))),
        arg_22: new MoveVector(args.arg_22.map((argA) => new Bool(argA))),
        arg_23: new MoveVector(args.arg_23.map((argA) => new U8(argA))),
        arg_24: new MoveVector(args.arg_24.map((argA) => new U16(argA))),
        arg_25: new MoveVector(args.arg_25.map((argA) => new U32(argA))),
        arg_26: new MoveVector(args.arg_26.map((argA) => new U64(argA))),
        arg_27: new MoveVector(args.arg_27.map((argA) => new U128(argA))),
        arg_28: new MoveVector(args.arg_28.map((argA) => new U256(argA))),
        arg_29: new MoveVector(args.arg_29.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_30: new MoveVector(args.arg_30.map((argA) => new MoveString(argA))),
        arg_31: new MoveVector(args.arg_31.map((argA) => new AccountAddress(addressFromAny(argA)))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type PublicArgumentsMultipleSignersSerializableArgs = {
    arg_0: MoveVector<AccountAddress>;
    arg_1: Bool;
    arg_2: U8;
    arg_3: U16;
    arg_4: U32;
    arg_5: U64;
    arg_6: U128;
    arg_7: U256;
    arg_8: AccountAddress;
    arg_9: MoveString;
    arg_10: MoveObject;
    arg_11: MoveVector<U8>;
    arg_12: MoveVector<Bool>;
    arg_13: MoveVector<U8>;
    arg_14: MoveVector<U16>;
    arg_15: MoveVector<U32>;
    arg_16: MoveVector<U64>;
    arg_17: MoveVector<U128>;
    arg_18: MoveVector<U256>;
    arg_19: MoveVector<AccountAddress>;
    arg_20: MoveVector<MoveString>;
    arg_21: MoveVector<MoveObject>;
    arg_22: MoveVector<U8>;
    arg_23: MoveVector<Bool>;
    arg_24: MoveVector<U8>;
    arg_25: MoveVector<U16>;
    arg_26: MoveVector<U32>;
    arg_27: MoveVector<U64>;
    arg_28: MoveVector<U128>;
    arg_29: MoveVector<U256>;
    arg_30: MoveVector<AccountAddress>;
    arg_31: MoveVector<MoveString>;
    arg_32: MoveVector<MoveObject>;
  };

  export class PublicArgumentsMultipleSigners extends Serializable {
    public readonly args: PublicArgumentsMultipleSignersSerializableArgs;

    constructor(args: {
      arg_0: Array<HexInput | AccountAddress>; // vector<address>
      arg_1: boolean; // bool
      arg_2: number; // u8
      arg_3: number; // u16
      arg_4: number; // u32
      arg_5: AnyNumber; // u64
      arg_6: AnyNumber; // u128
      arg_7: AnyNumber; // u256
      arg_8: HexInput | AccountAddress; // address
      arg_9: string; // 0x1::string::String
      arg_10: HexInput | AccountAddress; // 0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>
      arg_11: Array<number>; // vector<u8>
      arg_12: Array<boolean>; // vector<bool>
      arg_13: Array<number>; // vector<u8>
      arg_14: Array<number>; // vector<u16>
      arg_15: Array<number>; // vector<u32>
      arg_16: Array<AnyNumber>; // vector<u64>
      arg_17: Array<AnyNumber>; // vector<u128>
      arg_18: Array<AnyNumber>; // vector<u256>
      arg_19: Array<HexInput | AccountAddress>; // vector<address>
      arg_20: Array<string>; // vector<0x1::string::String>
      arg_21: Array<HexInput | AccountAddress>; // vector<0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>>
      arg_22: OneOrNone<number>; // 0x1::option::Option<u8>
      arg_23: OneOrNone<boolean>; // 0x1::option::Option<bool>
      arg_24: OneOrNone<number>; // 0x1::option::Option<u8>
      arg_25: OneOrNone<number>; // 0x1::option::Option<u16>
      arg_26: OneOrNone<number>; // 0x1::option::Option<u32>
      arg_27: OneOrNone<AnyNumber>; // 0x1::option::Option<u64>
      arg_28: OneOrNone<AnyNumber>; // 0x1::option::Option<u128>
      arg_29: OneOrNone<AnyNumber>; // 0x1::option::Option<u256>
      arg_30: OneOrNone<HexInput | AccountAddress>; // 0x1::option::Option<address>
      arg_31: OneOrNone<string>; // 0x1::option::Option<0x1::string::String>
      arg_32: OneOrNone<HexInput | AccountAddress>; // 0x1::option::Option<0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>>
    }) {
      super();
      this.args = {
        arg_0: new MoveVector(args.arg_0.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_1: new Bool(args.arg_1),
        arg_2: new U8(args.arg_2),
        arg_3: new U16(args.arg_3),
        arg_4: new U32(args.arg_4),
        arg_5: new U64(args.arg_5),
        arg_6: new U128(args.arg_6),
        arg_7: new U256(args.arg_7),
        arg_8: new AccountAddress(addressFromAny(args.arg_8)),
        arg_9: new MoveString(args.arg_9),
        arg_10: new AccountAddress(addressFromAny(args.arg_10)),
        arg_11: new MoveVector(args.arg_11.map((argA) => new U8(argA))),
        arg_12: new MoveVector(args.arg_12.map((argA) => new Bool(argA))),
        arg_13: new MoveVector(args.arg_13.map((argA) => new U8(argA))),
        arg_14: new MoveVector(args.arg_14.map((argA) => new U16(argA))),
        arg_15: new MoveVector(args.arg_15.map((argA) => new U32(argA))),
        arg_16: new MoveVector(args.arg_16.map((argA) => new U64(argA))),
        arg_17: new MoveVector(args.arg_17.map((argA) => new U128(argA))),
        arg_18: new MoveVector(args.arg_18.map((argA) => new U256(argA))),
        arg_19: new MoveVector(args.arg_19.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_20: new MoveVector(args.arg_20.map((argA) => new MoveString(argA))),
        arg_21: new MoveVector(args.arg_21.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_22: new MoveVector(args.arg_22.map((argA) => new U8(argA))),
        arg_23: new MoveVector(args.arg_23.map((argA) => new Bool(argA))),
        arg_24: new MoveVector(args.arg_24.map((argA) => new U8(argA))),
        arg_25: new MoveVector(args.arg_25.map((argA) => new U16(argA))),
        arg_26: new MoveVector(args.arg_26.map((argA) => new U32(argA))),
        arg_27: new MoveVector(args.arg_27.map((argA) => new U64(argA))),
        arg_28: new MoveVector(args.arg_28.map((argA) => new U128(argA))),
        arg_29: new MoveVector(args.arg_29.map((argA) => new U256(argA))),
        arg_30: new MoveVector(args.arg_30.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_31: new MoveVector(args.arg_31.map((argA) => new MoveString(argA))),
        arg_32: new MoveVector(args.arg_32.map((argA) => new AccountAddress(addressFromAny(argA)))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export type PublicArgumentsOneSignerSerializableArgs = {
    arg_0: AccountAddress;
    arg_1: Bool;
    arg_2: U8;
    arg_3: U16;
    arg_4: U32;
    arg_5: U64;
    arg_6: U128;
    arg_7: U256;
    arg_8: AccountAddress;
    arg_9: MoveString;
    arg_10: MoveObject;
    arg_11: MoveVector<U8>;
    arg_12: MoveVector<Bool>;
    arg_13: MoveVector<U8>;
    arg_14: MoveVector<U16>;
    arg_15: MoveVector<U32>;
    arg_16: MoveVector<U64>;
    arg_17: MoveVector<U128>;
    arg_18: MoveVector<U256>;
    arg_19: MoveVector<AccountAddress>;
    arg_20: MoveVector<MoveString>;
    arg_21: MoveVector<MoveObject>;
    arg_22: MoveVector<U8>;
    arg_23: MoveVector<Bool>;
    arg_24: MoveVector<U8>;
    arg_25: MoveVector<U16>;
    arg_26: MoveVector<U32>;
    arg_27: MoveVector<U64>;
    arg_28: MoveVector<U128>;
    arg_29: MoveVector<U256>;
    arg_30: MoveVector<AccountAddress>;
    arg_31: MoveVector<MoveString>;
    arg_32: MoveVector<MoveObject>;
  };

  export class PublicArgumentsOneSigner extends Serializable {
    public readonly args: PublicArgumentsOneSignerSerializableArgs;

    constructor(args: {
      arg_0: HexInput | AccountAddress; // address
      arg_1: boolean; // bool
      arg_2: number; // u8
      arg_3: number; // u16
      arg_4: number; // u32
      arg_5: AnyNumber; // u64
      arg_6: AnyNumber; // u128
      arg_7: AnyNumber; // u256
      arg_8: HexInput | AccountAddress; // address
      arg_9: string; // 0x1::string::String
      arg_10: HexInput | AccountAddress; // 0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>
      arg_11: Array<number>; // vector<u8>
      arg_12: Array<boolean>; // vector<bool>
      arg_13: Array<number>; // vector<u8>
      arg_14: Array<number>; // vector<u16>
      arg_15: Array<number>; // vector<u32>
      arg_16: Array<AnyNumber>; // vector<u64>
      arg_17: Array<AnyNumber>; // vector<u128>
      arg_18: Array<AnyNumber>; // vector<u256>
      arg_19: Array<HexInput | AccountAddress>; // vector<address>
      arg_20: Array<string>; // vector<0x1::string::String>
      arg_21: Array<HexInput | AccountAddress>; // vector<0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>>
      arg_22: OneOrNone<number>; // 0x1::option::Option<u8>
      arg_23: OneOrNone<boolean>; // 0x1::option::Option<bool>
      arg_24: OneOrNone<number>; // 0x1::option::Option<u8>
      arg_25: OneOrNone<number>; // 0x1::option::Option<u16>
      arg_26: OneOrNone<number>; // 0x1::option::Option<u32>
      arg_27: OneOrNone<AnyNumber>; // 0x1::option::Option<u64>
      arg_28: OneOrNone<AnyNumber>; // 0x1::option::Option<u128>
      arg_29: OneOrNone<AnyNumber>; // 0x1::option::Option<u256>
      arg_30: OneOrNone<HexInput | AccountAddress>; // 0x1::option::Option<address>
      arg_31: OneOrNone<string>; // 0x1::option::Option<0x1::string::String>
      arg_32: OneOrNone<HexInput | AccountAddress>; // 0x1::option::Option<0x1::object::Object<0xc0c0af1999354a76df150d56e49f14d7aa343f8b08bf2e045c7c4df078b55b46::tx_args_module::EmptyResource>>
    }) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressFromAny(args.arg_0)),
        arg_1: new Bool(args.arg_1),
        arg_2: new U8(args.arg_2),
        arg_3: new U16(args.arg_3),
        arg_4: new U32(args.arg_4),
        arg_5: new U64(args.arg_5),
        arg_6: new U128(args.arg_6),
        arg_7: new U256(args.arg_7),
        arg_8: new AccountAddress(addressFromAny(args.arg_8)),
        arg_9: new MoveString(args.arg_9),
        arg_10: new AccountAddress(addressFromAny(args.arg_10)),
        arg_11: new MoveVector(args.arg_11.map((argA) => new U8(argA))),
        arg_12: new MoveVector(args.arg_12.map((argA) => new Bool(argA))),
        arg_13: new MoveVector(args.arg_13.map((argA) => new U8(argA))),
        arg_14: new MoveVector(args.arg_14.map((argA) => new U16(argA))),
        arg_15: new MoveVector(args.arg_15.map((argA) => new U32(argA))),
        arg_16: new MoveVector(args.arg_16.map((argA) => new U64(argA))),
        arg_17: new MoveVector(args.arg_17.map((argA) => new U128(argA))),
        arg_18: new MoveVector(args.arg_18.map((argA) => new U256(argA))),
        arg_19: new MoveVector(args.arg_19.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_20: new MoveVector(args.arg_20.map((argA) => new MoveString(argA))),
        arg_21: new MoveVector(args.arg_21.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_22: new MoveVector(args.arg_22.map((argA) => new U8(argA))),
        arg_23: new MoveVector(args.arg_23.map((argA) => new Bool(argA))),
        arg_24: new MoveVector(args.arg_24.map((argA) => new U8(argA))),
        arg_25: new MoveVector(args.arg_25.map((argA) => new U16(argA))),
        arg_26: new MoveVector(args.arg_26.map((argA) => new U32(argA))),
        arg_27: new MoveVector(args.arg_27.map((argA) => new U64(argA))),
        arg_28: new MoveVector(args.arg_28.map((argA) => new U128(argA))),
        arg_29: new MoveVector(args.arg_29.map((argA) => new U256(argA))),
        arg_30: new MoveVector(args.arg_30.map((argA) => new AccountAddress(addressFromAny(argA)))),
        arg_31: new MoveVector(args.arg_31.map((argA) => new MoveString(argA))),
        arg_32: new MoveVector(args.arg_32.map((argA) => new AccountAddress(addressFromAny(argA)))),
      };
    }

    serialize(serializer: Serializer): void {
      Object.keys(this.args).forEach((field) => {
        const value = this.args[field as keyof typeof this.args];
        serializer.serialize(value);
      });
    }
  }
  export class TypeTags extends Serializable {
    // eslint-disable-next-line
    serialize(_serializer: Serializer): void {}
  }
}

// const arg_377 = args.arg_37.map((arg) => {
//     return new MoveVector(arg.map((arg) => {
//         return MoveOption.U64(arg[0]);
//     }));
// });

// const arg_3777 = args.arg_37?.map((optionArg) => {
//     return MoveOption.U64(optionArg?.at(0));
// });
// const arg_37_converted = new MoveOption(arg_37.values[0]);
// this.args.arg_37 = arg_37_converted;
