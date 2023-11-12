
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0


/* eslint-disable max-len */
import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, Account, InputTypes, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";



export namespace AptosAccount {
  export namespace EntryFunctions {
    export type BatchTransferPayloadMoveArguments = {
      recipients: MoveVector<AccountAddress>;
      amounts: MoveVector<U64>;
    };

    /**
     *  public fun batch_transfer<>(
     *     source: &signer,
     *     recipients: vector<address>,
     *     amounts: vector<u64>,
     *   )
     **/
    export class BatchTransfer extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_account";
      public readonly functionName = "batch_transfer";
      public readonly args: BatchTransferPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        source: Account, // &signer
        recipients: Array<AccountAddressInput>, // vector<address>
        amounts: Array<Uint64>, // vector<u64>
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          recipients: new MoveVector(
            recipients.map((argA) => AccountAddress.fromRelaxed(argA))
          ),
          amounts: new MoveVector(amounts.map((argA) => new U64(argA))),
        };
      }
    }
    export type BatchTransferCoinsPayloadMoveArguments = {
      recipients: MoveVector<AccountAddress>;
      amounts: MoveVector<U64>;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun batch_transfer_coins<>(
     *     from: &signer,
     *     recipients: vector<address>,
     *     amounts: vector<u64>,
     *   )
     **/
    export class BatchTransferCoins extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_account";
      public readonly functionName = "batch_transfer_coins";
      public readonly args: BatchTransferCoinsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        from: Account, // &signer
        recipients: Array<AccountAddressInput>, // vector<address>
        amounts: Array<Uint64>, // vector<u64>
        typeTags: Array<TypeTagInput>, //
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          recipients: new MoveVector(
            recipients.map((argA) => AccountAddress.fromRelaxed(argA))
          ),
          amounts: new MoveVector(amounts.map((argA) => new U64(argA))),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }
    export type CreateAccountPayloadMoveArguments = {
      auth_key: AccountAddress;
    };

    /**
     *  public fun create_account<>(
     *     auth_key: address,
     *   )
     **/
    export class CreateAccount extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_account";
      public readonly functionName = "create_account";
      public readonly args: CreateAccountPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        auth_key: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          auth_key: AccountAddress.fromRelaxed(auth_key),
        };
      }
    }
    export type SetAllowDirectCoinTransfersPayloadMoveArguments = {
      allow: Bool;
    };

    /**
     *  public fun set_allow_direct_coin_transfers<>(
     *     account: &signer,
     *     allow: bool,
     *   )
     **/
    export class SetAllowDirectCoinTransfers extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_account";
      public readonly functionName = "set_allow_direct_coin_transfers";
      public readonly args: SetAllowDirectCoinTransfersPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        allow: boolean, // bool
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          allow: new Bool(allow),
        };
      }
    }
    export type TransferPayloadMoveArguments = {
      recipients: AccountAddress;
      amounts: U64;
    };

    /**
     *  public fun transfer<>(
     *     source: &signer,
     *     recipients: address,
     *     amounts: u64,
     *   )
     **/
    export class Transfer extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_account";
      public readonly functionName = "transfer";
      public readonly args: TransferPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        source: Account, // &signer
        recipients: AccountAddressInput, // address
        amounts: Uint64, // u64
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          recipients: AccountAddress.fromRelaxed(recipients),
          amounts: new U64(amounts),
        };
      }
    }
    export type TransferCoinsPayloadMoveArguments = {
      recipients: AccountAddress;
      amounts: U64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun transfer_coins<>(
     *     from: &signer,
     *     recipients: address,
     *     amounts: u64,
     *   )
     **/
    export class TransferCoins extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_account";
      public readonly functionName = "transfer_coins";
      public readonly args: TransferCoinsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        from: Account, // &signer
        recipients: AccountAddressInput, // address
        amounts: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          recipients: AccountAddress.fromRelaxed(recipients),
          amounts: new U64(amounts),
          typeTags: typeTags.map((typeTag) =>
            typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
          ),
        };
      }
    }
  }
  export namespace ViewFunctions {
    export type CanReceiveDirectCoinTransfersPayloadMoveArguments = {
      arg_0: AccountAddressInput;
    };

    /**
     *  public fun can_receive_direct_coin_transfers<>(
     *     arg_0: address,
     *   )
     **/
    export class CanReceiveDirectCoinTransfers extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "aptos_account";
      public readonly functionName = "can_receive_direct_coin_transfers";
      public readonly args: CanReceiveDirectCoinTransfersPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput // address
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
        };
      }
    }
  }
}
