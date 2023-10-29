import {
  Bool,
  MoveObject,
  MoveOption,
  MoveString,
  MoveVector,
  Serializable,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
} from "../bcs";
import { Account, AccountAddress } from "../core";
import { AnyNumber, HexInput } from "../types";

export type OptionInput<T> = [T] | [] | null | undefined;

export class AllMoveTypes extends Serializable {
  public readonly arg1: Bool;
  public readonly arg2: U8;
  public readonly arg3: U16;
  public readonly arg4: U32;
  public readonly arg5: U64;
  public readonly arg6: U128;
  public readonly arg7: U256;
  public readonly arg8: AccountAddress;
  public readonly arg9: MoveString;
  public readonly arg10: MoveVector<Bool>;
  public readonly arg11: MoveVector<U8>;
  public readonly arg12: MoveVector<U16>;
  public readonly arg13: MoveVector<U32>;
  public readonly arg14: MoveVector<U64>;
  public readonly arg15: MoveVector<U128>;
  public readonly arg16: MoveVector<U256>;
  public readonly arg17: MoveVector<AccountAddress>;
  public readonly arg18: MoveVector<MoveString>;
  public readonly arg19: MoveVector<MoveObject>;
  public readonly arg20: MoveOption<Bool>;
  public readonly arg21: MoveOption<U8>;
  public readonly arg22: MoveOption<U16>;
  public readonly arg23: MoveOption<U32>;
  public readonly arg24: MoveOption<U64>;
  public readonly arg25: MoveOption<U128>;
  public readonly arg26: MoveOption<U256>;
  public readonly arg27: MoveOption<AccountAddress>;
  public readonly arg28: MoveOption<MoveString>;
  public readonly arg29: MoveOption<MoveObject>;
  // public readonly arg30: MoveVector<MoveOption<MoveOption<MoveVector<U64>>>>;

  constructor(
    arg1: boolean,
    arg2: number,
    arg3: number,
    arg4: number,
    arg5: AnyNumber,
    arg6: AnyNumber,
    arg7: AnyNumber,
    arg8: HexInput | AccountAddress,
    arg9: string,
    arg10: Array<boolean>,
    arg11: Array<number>,
    arg12: Array<number>,
    arg13: Array<number>,
    arg14: Array<AnyNumber>,
    arg15: Array<AnyNumber>,
    arg16: Array<AnyNumber>,
    arg17: Array<HexInput | AccountAddress>,
    arg18: Array<string>,
    arg19: Array<HexInput | AccountAddress>,
    arg20: OptionInput<boolean>,
    arg21: OptionInput<number>,
    arg22: OptionInput<number>,
    arg23: OptionInput<number>,
    arg24: OptionInput<AnyNumber>,
    arg25: OptionInput<AnyNumber>,
    arg26: OptionInput<AnyNumber>,
    arg27: OptionInput<AccountAddress>,
    arg28: OptionInput<string>,
    arg29: OptionInput<MoveObject>,
    // arg30: Array<OptionInput<OptionInput<Array<AnyNumber>>>>,
  ) {
    super();
    this.arg1 = new Bool(arg1);
    this.arg2 = new U8(arg2);
    this.arg3 = new U16(arg3);
    this.arg4 = new U32(arg4);
    this.arg5 = new U64(arg5);
    this.arg6 = new U128(arg6);
    this.arg7 = new U256(arg7);
    this.arg8 = new AccountAddress(arg8 instanceof AccountAddress ? arg8 : AccountAddress.fromHexInputRelaxed(arg8));
    this.arg9 = new MoveString(arg9);
    this.arg10 = MoveVector.Bool(arg10);
    this.arg11 = MoveVector.U8(arg11);
    this.arg12 = MoveVector.U16(arg12);
    this.arg13 = MoveVector.U32(arg13);
    this.arg14 = MoveVector.U64(arg14);
    this.arg15 = MoveVector.U128(arg15);
    this.arg16 = MoveVector.U256(arg16);
    this.arg17 = MoveVector.AccountAddress(arg17);
    this.arg18 = MoveVector.MoveString(arg18);
    this.arg19 = MoveVector.MoveObject(arg19);
    this.arg20 = MoveOption.Bool(Array.isArray(arg20) ? arg20[0] : arg20);
    this.arg21 = MoveOption.U8(Array.isArray(arg21) ? arg21[0] : arg21);
    this.arg22 = MoveOption.U16(Array.isArray(arg22) ? arg22[0] : arg22);
    this.arg23 = MoveOption.U32(Array.isArray(arg23) ? arg23[0] : arg23);
    this.arg24 = MoveOption.U64(Array.isArray(arg24) ? arg24[0] : arg24);
    this.arg25 = MoveOption.U128(Array.isArray(arg25) ? arg25[0] : arg25);
    this.arg26 = MoveOption.U256(Array.isArray(arg26) ? arg26[0] : arg26);
    this.arg27 = new MoveOption<AccountAddress>(Array.isArray(arg27) ? arg27[0] : arg27);
    this.arg28 = new MoveOption<MoveString>(arg28);
    this.arg29 = new MoveOption<MoveObject>(Array.isArray(arg29) ? arg29[0] : arg29);
    // this.arg30 = new MoveVector<MoveOption<MoveOption<MoveVector<U64>>>>(arg30);
  }
}
