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

export namespace StakingContract {
  export namespace EntryFunctions {
    export type AddStakePayloadMoveArguments = {
      operator: AccountAddress;
      amount: U64;
    };

    /**
     *  public fun add_stake<>(
     *     staker: &signer,
     *     operator: address,
     *     amount: u64,
     *   )
     **/
    export class AddStake extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "add_stake";
      public readonly args: AddStakePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: Account, // &signer
        operator: AccountAddressInput, // address
        amount: Uint64, // u64
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          operator: AccountAddress.fromRelaxed(operator),
          amount: new U64(amount),
        };
      }
    }
    export type CreateStakingContractPayloadMoveArguments = {
      arg_1: AccountAddress;
      arg_2: AccountAddress;
      arg_3: U64;
      arg_4: U64;
      arg_5: MoveVector<U8>;
    };

    /**
     *  public fun create_staking_contract<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *     arg_2: address,
     *     arg_3: u64,
     *     arg_4: u64,
     *     arg_5: vector<u8>,
     *   )
     **/
    export class CreateStakingContract extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "create_staking_contract";
      public readonly args: CreateStakingContractPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: Account, // &signer
        arg_1: AccountAddressInput, // address
        arg_2: AccountAddressInput, // address
        arg_3: Uint64, // u64
        arg_4: Uint64, // u64
        arg_5: HexInput, // vector<u8>
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
          arg_2: AccountAddress.fromRelaxed(arg_2),
          arg_3: new U64(arg_3),
          arg_4: new U64(arg_4),
          arg_5: MoveVector.U8(arg_5),
        };
      }
    }
    export type DistributePayloadMoveArguments = {
      arg_0: AccountAddress;
      arg_1: AccountAddress;
    };

    /**
     *  public fun distribute<>(
     *     arg_0: address,
     *     arg_1: address,
     *   )
     **/
    export class Distribute extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "distribute";
      public readonly args: DistributePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        arg_1: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
          arg_1: AccountAddress.fromRelaxed(arg_1),
        };
      }
    }
    export type RequestCommissionPayloadMoveArguments = {
      staker: AccountAddress;
      operator: AccountAddress;
    };

    /**
     *  public fun request_commission<>(
     *     account: &signer,
     *     staker: address,
     *     operator: address,
     *   )
     **/
    export class RequestCommission extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "request_commission";
      public readonly args: RequestCommissionPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        staker: AccountAddressInput, // address
        operator: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          staker: AccountAddress.fromRelaxed(staker),
          operator: AccountAddress.fromRelaxed(operator),
        };
      }
    }
    export type ResetLockupPayloadMoveArguments = {
      operator: AccountAddress;
    };

    /**
     *  public fun reset_lockup<>(
     *     staker: &signer,
     *     operator: address,
     *   )
     **/
    export class ResetLockup extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "reset_lockup";
      public readonly args: ResetLockupPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: Account, // &signer
        operator: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          operator: AccountAddress.fromRelaxed(operator),
        };
      }
    }
    export type SetBeneficiaryForOperatorPayloadMoveArguments = {
      new_beneficiary: AccountAddress;
    };

    /**
     *  public fun set_beneficiary_for_operator<>(
     *     operator: &signer,
     *     new_beneficiary: address,
     *   )
     **/
    export class SetBeneficiaryForOperator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "set_beneficiary_for_operator";
      public readonly args: SetBeneficiaryForOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        operator: Account, // &signer
        new_beneficiary: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          new_beneficiary: AccountAddress.fromRelaxed(new_beneficiary),
        };
      }
    }
    export type SwitchOperatorPayloadMoveArguments = {
      arg_1: AccountAddress;
      arg_2: AccountAddress;
      arg_3: U64;
    };

    /**
     *  public fun switch_operator<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *     arg_2: address,
     *     arg_3: u64,
     *   )
     **/
    export class SwitchOperator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "switch_operator";
      public readonly args: SwitchOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: Account, // &signer
        arg_1: AccountAddressInput, // address
        arg_2: AccountAddressInput, // address
        arg_3: Uint64, // u64
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_1: AccountAddress.fromRelaxed(arg_1),
          arg_2: AccountAddress.fromRelaxed(arg_2),
          arg_3: new U64(arg_3),
        };
      }
    }
    export type SwitchOperatorWithSameCommissionPayloadMoveArguments = {
      old_operator: AccountAddress;
      new_operator: AccountAddress;
    };

    /**
     *  public fun switch_operator_with_same_commission<>(
     *     staker: &signer,
     *     old_operator: address,
     *     new_operator: address,
     *   )
     **/
    export class SwitchOperatorWithSameCommission extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "switch_operator_with_same_commission";
      public readonly args: SwitchOperatorWithSameCommissionPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: Account, // &signer
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
    export type UnlockRewardsPayloadMoveArguments = {
      operator: AccountAddress;
    };

    /**
     *  public fun unlock_rewards<>(
     *     staker: &signer,
     *     operator: address,
     *   )
     **/
    export class UnlockRewards extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "unlock_rewards";
      public readonly args: UnlockRewardsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: Account, // &signer
        operator: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          operator: AccountAddress.fromRelaxed(operator),
        };
      }
    }
    export type UnlockStakePayloadMoveArguments = {
      operator: AccountAddress;
      amount: U64;
    };

    /**
     *  public fun unlock_stake<>(
     *     staker: &signer,
     *     operator: address,
     *     amount: u64,
     *   )
     **/
    export class UnlockStake extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "unlock_stake";
      public readonly args: UnlockStakePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: Account, // &signer
        operator: AccountAddressInput, // address
        amount: Uint64, // u64
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          operator: AccountAddress.fromRelaxed(operator),
          amount: new U64(amount),
        };
      }
    }
    export type UpdateCommisionPayloadMoveArguments = {
      operator: AccountAddress;
      new_commission_percentage: U64;
    };

    /**
     *  public fun update_commision<>(
     *     staker: &signer,
     *     operator: address,
     *     new_commission_percentage: u64,
     *   )
     **/
    export class UpdateCommision extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "update_commision";
      public readonly args: UpdateCommisionPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: Account, // &signer
        operator: AccountAddressInput, // address
        new_commission_percentage: Uint64, // u64
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          operator: AccountAddress.fromRelaxed(operator),
          new_commission_percentage: new U64(new_commission_percentage),
        };
      }
    }
    export type UpdateVoterPayloadMoveArguments = {
      operator: AccountAddress;
      new_voter: AccountAddress;
    };

    /**
     *  public fun update_voter<>(
     *     staker: &signer,
     *     operator: address,
     *     new_voter: address,
     *   )
     **/
    export class UpdateVoter extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "update_voter";
      public readonly args: UpdateVoterPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: Account, // &signer
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
  export namespace ViewFunctions {
    export type BeneficiaryForOperatorPayloadMoveArguments = {
      operator: AccountAddressInput;
    };

    /**
     *  public fun beneficiary_for_operator<>(
     *     operator: address,
     *   )
     **/
    export class BeneficiaryForOperator extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "beneficiary_for_operator";
      public readonly args: BeneficiaryForOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        operator: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          operator: AccountAddress.fromRelaxed(operator),
        };
      }
    }
    export type CommissionPercentagePayloadMoveArguments = {
      staker: AccountAddressInput;
      operator: AccountAddressInput;
    };

    /**
     *  public fun commission_percentage<>(
     *     staker: address,
     *     operator: address,
     *   )
     **/
    export class CommissionPercentage extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "commission_percentage";
      public readonly args: CommissionPercentagePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: AccountAddressInput, // address
        operator: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          staker: AccountAddress.fromRelaxed(staker),
          operator: AccountAddress.fromRelaxed(operator),
        };
      }
    }
    export type GetExpectedStakePoolAddressPayloadMoveArguments = {
      staker: AccountAddressInput;
      operator: AccountAddressInput;
      contract_creation_seed: HexInput;
    };

    /**
     *  public fun get_expected_stake_pool_address<>(
     *     staker: address,
     *     operator: address,
     *     contract_creation_seed: vector<u8>,
     *   )
     **/
    export class GetExpectedStakePoolAddress extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "get_expected_stake_pool_address";
      public readonly args: GetExpectedStakePoolAddressPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: AccountAddressInput, // address
        operator: AccountAddressInput, // address
        contract_creation_seed: HexInput, // vector<u8>
      ) {
        super();
        this.args = {
          staker: AccountAddress.fromRelaxed(staker),
          operator: AccountAddress.fromRelaxed(operator),
          contract_creation_seed: Hex.fromHexInput(contract_creation_seed),
        };
      }
    }
    export type LastRecordedPrincipalPayloadMoveArguments = {
      staker: AccountAddressInput;
      operator: AccountAddressInput;
    };

    /**
     *  public fun last_recorded_principal<>(
     *     staker: address,
     *     operator: address,
     *   )
     **/
    export class LastRecordedPrincipal extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "last_recorded_principal";
      public readonly args: LastRecordedPrincipalPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: AccountAddressInput, // address
        operator: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          staker: AccountAddress.fromRelaxed(staker),
          operator: AccountAddress.fromRelaxed(operator),
        };
      }
    }
    export type PendingDistributionCountsPayloadMoveArguments = {
      staker: AccountAddressInput;
      operator: AccountAddressInput;
    };

    /**
     *  public fun pending_distribution_counts<>(
     *     staker: address,
     *     operator: address,
     *   )
     **/
    export class PendingDistributionCounts extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "pending_distribution_counts";
      public readonly args: PendingDistributionCountsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: AccountAddressInput, // address
        operator: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          staker: AccountAddress.fromRelaxed(staker),
          operator: AccountAddress.fromRelaxed(operator),
        };
      }
    }
    export type StakePoolAddressPayloadMoveArguments = {
      staker: AccountAddressInput;
      operator: AccountAddressInput;
    };

    /**
     *  public fun stake_pool_address<>(
     *     staker: address,
     *     operator: address,
     *   )
     **/
    export class StakePoolAddress extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "stake_pool_address";
      public readonly args: StakePoolAddressPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: AccountAddressInput, // address
        operator: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          staker: AccountAddress.fromRelaxed(staker),
          operator: AccountAddress.fromRelaxed(operator),
        };
      }
    }
    export type StakingContractAmountsPayloadMoveArguments = {
      staker: AccountAddressInput;
      operator: AccountAddressInput;
    };

    /**
     *  public fun staking_contract_amounts<>(
     *     staker: address,
     *     operator: address,
     *   )
     **/
    export class StakingContractAmounts extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "staking_contract_amounts";
      public readonly args: StakingContractAmountsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        staker: AccountAddressInput, // address
        operator: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          staker: AccountAddress.fromRelaxed(staker),
          operator: AccountAddress.fromRelaxed(operator),
        };
      }
    }
    export type StakingContractExistsPayloadMoveArguments = {
      arg_0: AccountAddressInput;
      arg_1: AccountAddressInput;
    };

    /**
     *  public fun staking_contract_exists<>(
     *     arg_0: address,
     *     arg_1: address,
     *   )
     **/
    export class StakingContractExists extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "staking_contract";
      public readonly functionName = "staking_contract_exists";
      public readonly args: StakingContractExistsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        arg_1: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
          arg_1: AccountAddress.fromRelaxed(arg_1),
        };
      }
    }
  }
}
