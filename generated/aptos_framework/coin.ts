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

export type TransferPayloadMoveArguments = {
  to: AccountAddress;
  amount: U64;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun transfer<>(
 *     from: &signer,
 *     to: address,
 *     amount: u64,
 *   )
 **/
export class Transfer extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "transfer";
  public readonly args: TransferPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // from: &signer,
    to: AccountAddressInput, // address
    amount: Uint64, // u64
    typeTags: Array<TypeTagInput>, //
  ) {
    super();
    this.args = {
      to: AccountAddress.fromRelaxed(to),
      amount: new U64(amount),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}

/**
 *  public fun upgrade_supply<>(
 *     account: &signer,
 *   )
 **/
export class UpgradeSupply extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "upgrade_supply";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}

export type BalancePayloadMoveArguments = {
  owner: string;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun balance<>(
 *     owner: address,
 *   )
 **/
export class Balance extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "balance";
  public readonly args: BalancePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    owner: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>, //
  ) {
    super();
    this.args = {
      owner: AccountAddress.fromRelaxed(owner).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}

/**
 *  public fun decimals<>(
 *   )
 **/
export class Decimals extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "decimals";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type IsAccountRegisteredPayloadMoveArguments = {
  account_addr: string;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun is_account_registered<>(
 *     account_addr: address,
 *   )
 **/
export class IsAccountRegistered extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "is_account_registered";
  public readonly args: IsAccountRegisteredPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    account_addr: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>, //
  ) {
    super();
    this.args = {
      account_addr: AccountAddress.fromRelaxed(account_addr).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}

/**
 *  public fun is_coin_initialized<>(
 *   )
 **/
export class IsCoinInitialized extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "is_coin_initialized";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type IsCoinStoreFrozenPayloadMoveArguments = {
  account_addr: string;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun is_coin_store_frozen<>(
 *     account_addr: address,
 *   )
 **/
export class IsCoinStoreFrozen extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "is_coin_store_frozen";
  public readonly args: IsCoinStoreFrozenPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    account_addr: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>, //
  ) {
    super();
    this.args = {
      account_addr: AccountAddress.fromRelaxed(account_addr).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}

/**
 *  public fun name<>(
 *   )
 **/
export class Name extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "name";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}

/**
 *  public fun supply<>(
 *   )
 **/
export class Supply extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "supply";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}

/**
 *  public fun symbol<>(
 *   )
 **/
export class Symbol extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "coin";
  public readonly functionName = "symbol";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
