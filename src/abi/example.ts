import { Bool, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../../src";
import { Serializable } from "../bcs";
import { AccountAddress } from "../core";
import { AccountAuthenticator } from "../transactions/authenticator/account";
import { HexInput } from "../types";
import { OptionInput } from "./types";

type Array$1<T> = OptionInput<T>;
type MoveObject = AccountAddress
let account0: AccountAuthenticator | undefined; // &signer
let account1: AccountAuthenticator | undefined; // &signer
let account2: AccountAuthenticator | undefined; // &signer
let account3: AccountAuthenticator | undefined; // &signer
let account4: AccountAuthenticator | undefined; // &signer

export class TestEntryFunctionPayload extends Serializable {
    public readonly args: {
        arg_0: MoveVector<AccountAddress>,  // vector<address>
        arg_1: Bool,  // bool
        arg_2: U8,  // u8
        arg_3: U16,  // u16
        arg_4: U32,  // u32
        arg_5: U64,  // u64
        arg_6: U128,  // u128
        arg_7: U256,  // u256
        arg_8: AccountAddress,  // address
        arg_9: MoveString,  // 0x1::string::String
        arg_10: MoveObject,  // 0x1::object::Object<0x575456ad7b4926779e5ad81165a7bc0c225d75aa3f326394e24530d1f1c4740f::tx_args_module::EmptyResource>
        arg_11: MoveVector<U8>,  // vector<u8>
        arg_12: MoveVector<Bool>,  // vector<bool>
        arg_13: MoveVector<U8>,  // vector<u8>
        arg_14: MoveVector<U16>,  // vector<u16>
        arg_15: MoveVector<U32>,  // vector<u32>
        arg_16: MoveVector<U64>,  // vector<u64>
        arg_17: MoveVector<U128>,  // vector<u128>
        arg_18: MoveVector<U256>,  // vector<u256>
        arg_19: MoveVector<AccountAddress>,  // vector<address>
        arg_20: MoveVector<MoveString>,  // vector<0x1::string::String>
        arg_21: MoveVector<MoveObject>,  // vector<0x1::object::Object<0x575456ad7b4926779e5ad81165a7bc0c225d75aa3f326394e24530d1f1c4740f::tx_args_module::EmptyResource>>
        arg_22: MoveOption<U8>,  // 0x1::option::Option<u8>
        arg_23: MoveOption<Bool>,  // 0x1::option::Option<bool>
        arg_24: MoveOption<U8>,  // 0x1::option::Option<u8>
        arg_25: MoveOption<U16>,  // 0x1::option::Option<u16>
        arg_26: MoveOption<U32>,  // 0x1::option::Option<u32>
        arg_27: MoveOption<U64>,  // 0x1::option::Option<u64>
        arg_28: MoveOption<U128>,  // 0x1::option::Option<u128>
        arg_29: MoveOption<U256>,  // 0x1::option::Option<u256>
        arg_30: MoveOption<AccountAddress>,  // 0x1::option::Option<address>
        arg_31: MoveOption<MoveString>,  // 0x1::option::Option<0x1::string::String>
        arg_32: MoveOption<MoveObject>,  // 0x1::option::Option<0x1::object::Object<0x575456ad7b4926779e5ad81165a7bc0c225d75aa3f326394e24530d1f1c4740f::tx_args_module::EmptyResource>>
        arg_33: MoveVector<MoveVector<MoveVector<MoveVector<U64>>>>,  // vector<vector<vector<vector<u64>>>>
        arg_34: MoveVector<MoveVector<MoveVector<MoveVector<MoveVector<U64>>>>>,  // vector<vector<vector<vector<vector<u64>>>>>
        arg_35: MoveOption<U8>,  // 0x1::option::Option<u8>
        arg_36: MoveOption<MoveVector<U8>>;  // 0x1::option::Option<vector<u8>>
        arg_37: MoveOption<MoveVector<MoveOption<U64>>>;  // 0x1::option::Option<vector<0x1::option::Option<u64>>>
    };

    constructor( args: {
        arg_0: Array<HexInput | AccountAddress>;
        arg_1: boolean;
        arg_2: number;
        arg_3: number;
        arg_4: number;
        arg_5: number | bigint;
        arg_6: number | bigint;
        arg_7: number | bigint;
        arg_8: HexInput | AccountAddress;
        arg_9: string;
        arg_10: HexInput | AccountAddress;
        arg_11: Array<number>;
        arg_12: Array<boolean>;
        arg_13: Array<number>;
        arg_14: Array<number>;
        arg_15: Array<number>;
        arg_16: Array<number | bigint>;
        arg_17: Array<number | bigint>;
        arg_18: Array<number | bigint>;
        arg_19: Array<HexInput | AccountAddress>;
        arg_20: Array<string>;
        arg_21: Array<HexInput | AccountAddress>;
        arg_22: Array$1<number>;
        arg_23: Array$1<boolean>;
        arg_24: Array$1<number>;
        arg_25: Array$1<number>;
        arg_26: Array$1<number>;
        arg_27: Array$1<number | bigint>;
        arg_28: Array$1<number | bigint>;
        arg_29: Array$1<number | bigint>;
        arg_30: Array$1<HexInput | AccountAddress>;
        arg_31: Array$1<string>;
        arg_32: Array$1<HexInput | AccountAddress>;
        arg_33: Array<Array<Array<Array<number | bigint>>>>;
        arg_34: Array<Array<Array<Array<Array<number | bigint>>>>>;
        arg_35: Array$1<number>;
        arg_36: Array$1<Array<number>>;
        arg_37: Array$1<Array<Array$1<number | bigint>>>;
    }) {
        super();
        const arg_37 = args.arg_37.map((arg) => {
            return arg.map((arg) => {
                return arg.map((arg) => {
                    return arg;
                });
            });
        });
    }
}