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

export namespace AptosAccount {
  // let source: AccountAuthenticator | undefined; // &signer
  export type BatchTransferPayloadBCSArguments = {
    recipients: MoveVector<AccountAddress>;
    amounts: MoveVector<U64>;
  };

  export class BatchTransfer extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "batch_transfer";
    public readonly args: BatchTransferPayloadBCSArguments;

    constructor(
      recipients: Array<AccountAddressInput>, // vector<address>
      amounts: Array<Uint64>, // vector<u64>
    ) {
      super();
      this.args = {
        recipients: new MoveVector(recipients.map((argA) => AccountAddress.fromRelaxed(argA))),
        amounts: new MoveVector(amounts.map((argA) => new U64(argA))),
      };
    }
  }
  // let from: AccountAuthenticator | undefined; // &signer
  export type BatchTransferCoinsPayloadBCSArguments = {
    recipients: MoveVector<AccountAddress>;
    amounts: MoveVector<U64>;
  };

  export class BatchTransferCoins extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "batch_transfer_coins";
    public readonly args: BatchTransferCoinsPayloadBCSArguments;

    constructor(
      recipients: Array<AccountAddressInput>, // vector<address>
      amounts: Array<Uint64>, // vector<u64>
    ) {
      super();
      this.args = {
        recipients: new MoveVector(recipients.map((argA) => AccountAddress.fromRelaxed(argA))),
        amounts: new MoveVector(amounts.map((argA) => new U64(argA))),
      };
    }
  }
  export type CreateAccountPayloadBCSArguments = {
    auth_key: AccountAddress;
  };

  export class CreateAccount extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "create_account";
    public readonly args: CreateAccountPayloadBCSArguments;

    constructor(
      auth_key: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        auth_key: AccountAddress.fromRelaxed(auth_key),
      };
    }
  }
  // let account: AccountAuthenticator | undefined; // &signer
  export type SetAllowDirectCoinTransfersPayloadBCSArguments = {
    allow: Bool;
  };

  export class SetAllowDirectCoinTransfers extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "set_allow_direct_coin_transfers";
    public readonly args: SetAllowDirectCoinTransfersPayloadBCSArguments;

    constructor(
      allow: boolean, // bool
    ) {
      super();
      this.args = {
        allow: new Bool(allow),
      };
    }
  }
  // let source: AccountAuthenticator | undefined; // &signer
  export type TransferPayloadBCSArguments = {
    recipients: AccountAddress;
    amounts: U64;
  };

  export class Transfer extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "transfer";
    public readonly args: TransferPayloadBCSArguments;

    constructor(
      recipients: AccountAddressInput, // address
      amounts: Uint64, // u64
    ) {
      super();
      this.args = {
        recipients: AccountAddress.fromRelaxed(recipients),
        amounts: new U64(amounts),
      };
    }
  }
  // let from: AccountAuthenticator | undefined; // &signer
  export type TransferCoinsPayloadBCSArguments = {
    recipients: AccountAddress;
    amounts: U64;
  };

  export class TransferCoins extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "transfer_coins";
    public readonly args: TransferCoinsPayloadBCSArguments;

    constructor(
      recipients: AccountAddressInput, // address
      amounts: Uint64, // u64
    ) {
      super();
      this.args = {
        recipients: AccountAddress.fromRelaxed(recipients),
        amounts: new U64(amounts),
      };
    }
  }
}
