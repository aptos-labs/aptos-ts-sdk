import { Bool, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../../src";
import { Serializable } from "../bcs";
import { AccountAddress } from "../core";
import { AccountAuthenticator } from "../transactions/authenticator/account";
import { HexInput } from "../types";
import { OptionInput } from "./types";

type MoveObject = AccountAddress
const account0: AccountAuthenticator | undefined; // &signer
const account1: AccountAuthenticator | undefined; // &signer
const account2: AccountAuthenticator | undefined; // &signer
const account3: AccountAuthenticator | undefined; // &signer
const account4: AccountAuthenticator | undefined; // &signer

export class TestEntryFunctionPayload extends Serializable {
    public readonly arg_0: MoveVector<AccountAddress>;  // vector<address>
    public readonly arg_1: Bool;  // bool
    public readonly arg_2: U8;  // u8
    public readonly arg_3: U16;  // u16
    public readonly arg_4: U32;  // u32
    public readonly arg_5: U64;  // u64
    public readonly arg_6: U128;  // u128
    public readonly arg_7: U256;  // u256
    public readonly arg_8: AccountAddress;  // address
    public readonly arg_9: MoveString;  // 0x1::string::String
    public readonly arg_10: MoveObject;  // 0x1::object::Object<0xa6fd6a493279f565dd2ee1afc89686335e9471f3d8702eaab2986c1cc9cdf950::tx_args_module::EmptyResource>
    public readonly arg_11: MoveVector<U8>;  // vector<u8>
    public readonly arg_12: MoveVector<Bool>;  // vector<bool>
    public readonly arg_13: MoveVector<U8>;  // vector<u8>
    public readonly arg_14: MoveVector<U16>;  // vector<u16>
    public readonly arg_15: MoveVector<U32>;  // vector<u32>
    public readonly arg_16: MoveVector<U64>;  // vector<u64>
    public readonly arg_17: MoveVector<U128>;  // vector<u128>
    public readonly arg_18: MoveVector<U256>;  // vector<u256>
    public readonly arg_19: MoveVector<AccountAddress>;  // vector<address>
    public readonly arg_20: MoveVector<MoveString>;  // vector<0x1::string::String>
    public readonly arg_21: MoveVector<MoveObject>;  // vector<0x1::object::Object<0xa6fd6a493279f565dd2ee1afc89686335e9471f3d8702eaab2986c1cc9cdf950::tx_args_module::EmptyResource>>
    public readonly arg_22: MoveOption<U8>;  // 0x1::option::Option<u8>
    public readonly arg_23: MoveOption<Bool>;  // 0x1::option::Option<bool>
    public readonly arg_24: MoveOption<U8>;  // 0x1::option::Option<u8>
    public readonly arg_25: MoveOption<U16>;  // 0x1::option::Option<u16>
    public readonly arg_26: MoveOption<U32>;  // 0x1::option::Option<u32>
    public readonly arg_27: MoveOption<U64>;  // 0x1::option::Option<u64>
    public readonly arg_28: MoveOption<U128>;  // 0x1::option::Option<u128>
    public readonly arg_29: MoveOption<U256>;  // 0x1::option::Option<u256>
    public readonly arg_30: MoveOption<AccountAddress>;  // 0x1::option::Option<address>
    public readonly arg_31: MoveOption<MoveString>;  // 0x1::option::Option<0x1::string::String>
    public readonly arg_32: MoveOption<MoveObject>;  // 0x1::option::Option<0x1::object::Object<0xa6fd6a493279f565dd2ee1afc89686335e9471f3d8702eaab2986c1cc9cdf950::tx_args_module::EmptyResource>>
    public readonly arg_33: MoveVector<MoveVector<MoveVector<MoveVector<U64>>>>;  // vector<vector<vector<vector<u64>>>>
    public readonly arg_34: MoveVector<MoveVector<MoveVector<MoveVector<MoveVector<U64>>>>>;  // vector<vector<vector<vector<vector<u64>>>>>
    public readonly arg_35: MoveOption<U8>;  // 0x1::option::Option<u8>
    public readonly arg_36: MoveOption<MoveVector<U8>>;  // 0x1::option::Option<vector<u8>>
    public readonly arg_37: MoveOption<MoveVector<MoveOption<U64>>>;  // 0x1::option::Option<vector<0x1::option::Option<u64>>>

    constructor(
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
        arg_22: OptionInput<number>;
        arg_23: OptionInput<boolean>;
        arg_24: OptionInput<number>;
        arg_25: OptionInput<number>;
        arg_26: OptionInput<number>;
        arg_27: OptionInput<number | bigint>;
        arg_28: OptionInput<number | bigint>;
        arg_29: OptionInput<number | bigint>;
        arg_30: OptionInput<HexInput | AccountAddress>;
        arg_31: OptionInput<string>;
        arg_32: OptionInput<HexInput | AccountAddress>;
        arg_33: Array<Array<Array<Array<number | bigint>>>>;
        arg_34: Array<Array<Array<Array<Array<number | bigint>>>>>;
        arg_35: OptionInput<number>;
        arg_36: OptionInput<Array<number>>;
        arg_37: OptionInput<Array<OptionInput<number | bigint>>>;
    ) {
        super();
        this.arg_0 = arg_0;
        this.arg_1 = arg_1;
        this.arg_2 = arg_2;
        this.arg_3 = arg_3;
        this.arg_4 = arg_4;
        this.arg_5 = arg_5;
        this.arg_6 = arg_6;
        this.arg_7 = arg_7;
        this.arg_8 = arg_8;
        this.arg_9 = arg_9;
        this.arg_10 = arg_10;
        this.arg_11 = arg_11;
        this.arg_12 = arg_12;
        this.arg_13 = arg_13;
        this.arg_14 = arg_14;
        this.arg_15 = arg_15;
        this.arg_16 = arg_16;
        this.arg_17 = arg_17;
        this.arg_18 = arg_18;
        this.arg_19 = arg_19;
        this.arg_20 = arg_20;
        this.arg_21 = arg_21;
        this.arg_22 = arg_22;
        this.arg_23 = arg_23;
        this.arg_24 = arg_24;
        this.arg_25 = arg_25;
        this.arg_26 = arg_26;
        this.arg_27 = arg_27;
        this.arg_28 = arg_28;
        this.arg_29 = arg_29;
        this.arg_30 = arg_30;
        this.arg_31 = arg_31;
        this.arg_32 = arg_32;
        this.arg_33 = arg_33;
        this.arg_34 = arg_34;
        this.arg_35 = arg_35;
        this.arg_36 = arg_36;
        this.arg_37 = arg_37;
    }
}