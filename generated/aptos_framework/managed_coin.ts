
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace ManagedCoin {
// let account: AccountAuthenticator | undefined; // &signer
export type BurnPayloadBCSArguments = {
  amount: U64;
};

export class Burn extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "managed_coin";
  public readonly functionName = "burn";
  public readonly args: BurnPayloadBCSArguments;

  constructor(
    amount: Uint64 // u64
  ) {
    super();
    this.args = {
      amount: new U64(amount),
    };
  }
}

// let account: AccountAuthenticator | undefined; // &signer
export type InitializePayloadBCSArguments = {
  name: MoveVector<U8>;
  symbol: MoveVector<U8>;
  decimals: U8;
  monitor_supply: Bool;
};

export class Initialize extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "managed_coin";
  public readonly functionName = "initialize";
  public readonly args: InitializePayloadBCSArguments;

  constructor(
    name: HexInput, // vector<u8>
    symbol: HexInput, // vector<u8>
    decimals: Uint8, // u8
    monitor_supply: boolean // bool
  ) {
    super();
    this.args = {
      name: MoveVector.U8(name),
      symbol: MoveVector.U8(symbol),
      decimals: new U8(decimals),
      monitor_supply: new Bool(monitor_supply),
    };
  }
}

// let account: AccountAuthenticator | undefined; // &signer
export type MintPayloadBCSArguments = {
  dst_addr: AccountAddress;
  amount: U64;
};

export class Mint extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "managed_coin";
  public readonly functionName = "mint";
  public readonly args: MintPayloadBCSArguments;

  constructor(
    dst_addr: AccountAddressInput, // address
    amount: Uint64 // u64
  ) {
    super();
    this.args = {
      dst_addr: AccountAddress.fromRelaxed(dst_addr),
      amount: new U64(amount),
    };
  }
}

// let account: AccountAuthenticator | undefined; // &signer

export class Register extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "managed_coin";
  public readonly functionName = "register";
  public readonly args = {};

  constructor() {
    super();
    this.args = {};
  }
}


}