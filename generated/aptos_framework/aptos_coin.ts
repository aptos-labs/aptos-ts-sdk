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
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import {
  ViewFunctionPayloadBuilder,
  EntryFunctionPayloadBuilder,
} from "../../src/bcs/serializable/tx-builder/payloadBuilders";

/**
 *  public fun claim_mint_capability<>(
 *     account: &signer,
 *   )
 **/
export class ClaimMintCapability extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_coin";
  public readonly functionName = "claim_mint_capability";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type DelegateMintCapabilityPayloadMoveArguments = {
  to: AccountAddress;
};

/**
 *  public fun delegate_mint_capability<>(
 *     account: signer,
 *     to: address,
 *   )
 **/
export class DelegateMintCapability extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_coin";
  public readonly functionName = "delegate_mint_capability";
  public readonly args: DelegateMintCapabilityPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    account: Account, // signer
    to: AccountAddressInput, // address
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      to: AccountAddress.fromRelaxed(to),
    };
  }
}
export type MintPayloadMoveArguments = {
  dst_addr: AccountAddress;
  amount: U64;
};

/**
 *  public fun mint<>(
 *     account: &signer,
 *     dst_addr: address,
 *     amount: u64,
 *   )
 **/
export class Mint extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_coin";
  public readonly functionName = "mint";
  public readonly args: MintPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    account: Account, // &signer
    dst_addr: AccountAddressInput, // address
    amount: Uint64, // u64
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      dst_addr: AccountAddress.fromRelaxed(dst_addr),
      amount: new U64(amount),
    };
  }
}
