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

export namespace AptosCoin {
  // let account: AccountAuthenticator | undefined; // &signer

  export class ClaimMintCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_coin";
    public readonly functionName = "claim_mint_capability";
    public readonly args = {};

    constructor() {
      super();
      this.args = {};
    }
  }
  // let account: AccountAuthenticator | undefined; // signer
  export type DelegateMintCapabilityPayloadBCSArguments = {
    to: AccountAddress;
  };

  export class DelegateMintCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_coin";
    public readonly functionName = "delegate_mint_capability";
    public readonly args: DelegateMintCapabilityPayloadBCSArguments;

    constructor(
      to: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        to: AccountAddress.fromRelaxed(to),
      };
    }
  }
  // let arg_0: AccountAuthenticator | undefined; // &signer
  export type MintPayloadBCSArguments = {
    arg_1: AccountAddress;
    arg_2: U64;
  };

  export class Mint extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_coin";
    public readonly functionName = "mint";
    public readonly args: MintPayloadBCSArguments;

    constructor(
      arg_1: AccountAddressInput, // address
      arg_2: Uint64, // u64
    ) {
      super();
      this.args = {
        arg_1: AccountAddress.fromRelaxed(arg_1),
        arg_2: new U64(arg_2),
      };
    }
  }
}
