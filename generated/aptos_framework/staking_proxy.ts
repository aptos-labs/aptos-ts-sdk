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

export namespace StakingProxy {
  export namespace EntryFunctions {
    export type SetOperatorPayloadMoveArguments = {
      old_operator: AccountAddress;
      new_operator: AccountAddress;
    };

    /**
     *  public fun set_operator<>(
     *     owner: &signer,
     *     old_operator: address,
     *     new_operator: address,
     *   )
     **/
    export class SetOperator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_proxy";
      public readonly functionName = "set_operator";
      public readonly args: SetOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        owner: Account, // &signer
        old_operator: AccountAddressInput, // address
        new_operator: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          old_operator: AccountAddress.fromRelaxed(old_operator),
          new_operator: AccountAddress.fromRelaxed(new_operator),
        };
      }
    }
    export type SetStakePoolOperatorPayloadMoveArguments = {
      arg_1: AccountAddress;
    };

    /**
     *  public fun set_stake_pool_operator<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *   )
     **/
    export class SetStakePoolOperator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_proxy";
      public readonly functionName = "set_stake_pool_operator";
      public readonly args: SetStakePoolOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: Account, // &signer
        arg_1: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
        };
      }
    }
    export type SetStakePoolVoterPayloadMoveArguments = {
      arg_1: AccountAddress;
    };

    /**
     *  public fun set_stake_pool_voter<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *   )
     **/
    export class SetStakePoolVoter extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_proxy";
      public readonly functionName = "set_stake_pool_voter";
      public readonly args: SetStakePoolVoterPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: Account, // &signer
        arg_1: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
        };
      }
    }
    export type SetStakingContractOperatorPayloadMoveArguments = {
      arg_1: AccountAddress;
      arg_2: AccountAddress;
    };

    /**
     *  public fun set_staking_contract_operator<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *     arg_2: address,
     *   )
     **/
    export class SetStakingContractOperator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_proxy";
      public readonly functionName = "set_staking_contract_operator";
      public readonly args: SetStakingContractOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: Account, // &signer
        arg_1: AccountAddressInput, // address
        arg_2: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
          arg_2: AccountAddress.fromRelaxed(arg_2),
        };
      }
    }
    export type SetStakingContractVoterPayloadMoveArguments = {
      arg_1: AccountAddress;
      arg_2: AccountAddress;
    };

    /**
     *  public fun set_staking_contract_voter<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *     arg_2: address,
     *   )
     **/
    export class SetStakingContractVoter extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_proxy";
      public readonly functionName = "set_staking_contract_voter";
      public readonly args: SetStakingContractVoterPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: Account, // &signer
        arg_1: AccountAddressInput, // address
        arg_2: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
          arg_2: AccountAddress.fromRelaxed(arg_2),
        };
      }
    }
    export type SetVestingContractOperatorPayloadMoveArguments = {
      arg_1: AccountAddress;
      arg_2: AccountAddress;
    };

    /**
     *  public fun set_vesting_contract_operator<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *     arg_2: address,
     *   )
     **/
    export class SetVestingContractOperator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_proxy";
      public readonly functionName = "set_vesting_contract_operator";
      public readonly args: SetVestingContractOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: Account, // &signer
        arg_1: AccountAddressInput, // address
        arg_2: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
          arg_2: AccountAddress.fromRelaxed(arg_2),
        };
      }
    }
    export type SetVestingContractVoterPayloadMoveArguments = {
      arg_1: AccountAddress;
      arg_2: AccountAddress;
    };

    /**
     *  public fun set_vesting_contract_voter<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *     arg_2: address,
     *   )
     **/
    export class SetVestingContractVoter extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_proxy";
      public readonly functionName = "set_vesting_contract_voter";
      public readonly args: SetVestingContractVoterPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: Account, // &signer
        arg_1: AccountAddressInput, // address
        arg_2: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
          arg_2: AccountAddress.fromRelaxed(arg_2),
        };
      }
    }
    export type SetVoterPayloadMoveArguments = {
      operator: AccountAddress;
      new_voter: AccountAddress;
    };

    /**
     *  public fun set_voter<>(
     *     owner: &signer,
     *     operator: address,
     *     new_voter: address,
     *   )
     **/
    export class SetVoter extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_proxy";
      public readonly functionName = "set_voter";
      public readonly args: SetVoterPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        owner: Account, // &signer
        operator: AccountAddressInput, // address
        new_voter: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          operator: AccountAddress.fromRelaxed(operator),
          new_voter: AccountAddress.fromRelaxed(new_voter),
        };
      }
    }
  }
  export namespace ViewFunctions {}
}
