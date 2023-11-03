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

export namespace Coin {
  // let from: AccountAuthenticator | undefined; // &signer
  export type TransferPayloadBCSArguments = {
    to: AccountAddress;
    amount: U64;
  };

  export class Transfer extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "coin";
    public readonly functionName = "transfer";
    public readonly args: TransferPayloadBCSArguments;

    constructor(
      to: AccountAddressInput, // address
      amount: Uint64, // u64
    ) {
      super();
      this.args = {
        to: AccountAddress.fromRelaxed(to),
        amount: new U64(amount),
      };
    }
  }

  // let account: AccountAuthenticator | undefined; // &signer

  export class UpgradeSupply extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "coin";
    public readonly functionName = "upgrade_supply";
    public readonly args = {};

    constructor() {
      super();
      this.args = {};
    }
  }
}
