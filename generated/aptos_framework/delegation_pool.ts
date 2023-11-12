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

export namespace DelegationPool {
  export namespace EntryFunctions {
    export type AddStakePayloadMoveArguments = {
      pool_address: AccountAddress;
      amount: U64;
    };

    /**
     *  public fun add_stake<>(
     *     delegator: &signer,
     *     pool_address: address,
     *     amount: u64,
     *   )
     **/
    export class AddStake extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "add_stake";
      public readonly args: AddStakePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        delegator: Account, // &signer
        pool_address: AccountAddressInput, // address
        amount: Uint64, // u64
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          amount: new U64(amount),
        };
      }
    }
    export type CreateProposalPayloadMoveArguments = {
      pool_address: AccountAddress;
      execution_hash: MoveVector<U8>;
      metadata_location: MoveVector<U8>;
      metadata_hash: MoveVector<U8>;
      is_multi_step_proposal: Bool;
    };

    /**
     *  public fun create_proposal<>(
     *     voter: &signer,
     *     pool_address: address,
     *     execution_hash: vector<u8>,
     *     metadata_location: vector<u8>,
     *     metadata_hash: vector<u8>,
     *     is_multi_step_proposal: bool,
     *   )
     **/
    export class CreateProposal extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "create_proposal";
      public readonly args: CreateProposalPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voter: Account, // &signer
        pool_address: AccountAddressInput, // address
        execution_hash: HexInput, // vector<u8>
        metadata_location: HexInput, // vector<u8>
        metadata_hash: HexInput, // vector<u8>
        is_multi_step_proposal: boolean, // bool
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          execution_hash: MoveVector.U8(execution_hash),
          metadata_location: MoveVector.U8(metadata_location),
          metadata_hash: MoveVector.U8(metadata_hash),
          is_multi_step_proposal: new Bool(is_multi_step_proposal),
        };
      }
    }
    export type DelegateVotingPowerPayloadMoveArguments = {
      pool_address: AccountAddress;
      new_voter: AccountAddress;
    };

    /**
     *  public fun delegate_voting_power<>(
     *     delegator: &signer,
     *     pool_address: address,
     *     new_voter: address,
     *   )
     **/
    export class DelegateVotingPower extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "delegate_voting_power";
      public readonly args: DelegateVotingPowerPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        delegator: Account, // &signer
        pool_address: AccountAddressInput, // address
        new_voter: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          new_voter: AccountAddress.fromRelaxed(new_voter),
        };
      }
    }
    export type EnablePartialGovernanceVotingPayloadMoveArguments = {
      arg_0: AccountAddress;
    };

    /**
     *  public fun enable_partial_governance_voting<>(
     *     arg_0: address,
     *   )
     **/
    export class EnablePartialGovernanceVoting extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "enable_partial_governance_voting";
      public readonly args: EnablePartialGovernanceVotingPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
        };
      }
    }
    export type InitializeDelegationPoolPayloadMoveArguments = {
      operator_commission_percentage: U64;
      delegation_pool_creation_seed: MoveVector<U8>;
    };

    /**
     *  public fun initialize_delegation_pool<>(
     *     owner: &signer,
     *     operator_commission_percentage: u64,
     *     delegation_pool_creation_seed: vector<u8>,
     *   )
     **/
    export class InitializeDelegationPool extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "initialize_delegation_pool";
      public readonly args: InitializeDelegationPoolPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        owner: Account, // &signer
        operator_commission_percentage: Uint64, // u64
        delegation_pool_creation_seed: HexInput, // vector<u8>
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          operator_commission_percentage: new U64(operator_commission_percentage),
          delegation_pool_creation_seed: MoveVector.U8(delegation_pool_creation_seed),
        };
      }
    }
    export type ReactivateStakePayloadMoveArguments = {
      pool_address: AccountAddress;
      amount: U64;
    };

    /**
     *  public fun reactivate_stake<>(
     *     delegator: &signer,
     *     pool_address: address,
     *     amount: u64,
     *   )
     **/
    export class ReactivateStake extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "reactivate_stake";
      public readonly args: ReactivateStakePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        delegator: Account, // &signer
        pool_address: AccountAddressInput, // address
        amount: Uint64, // u64
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          amount: new U64(amount),
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
      public readonly moduleName = "delegation_pool";
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
    export type SetDelegatedVoterPayloadMoveArguments = {
      arg_1: AccountAddress;
    };

    /**
     *  public fun set_delegated_voter<>(
     *     arg_0: &signer,
     *     arg_1: address,
     *   )
     **/
    export class SetDelegatedVoter extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "set_delegated_voter";
      public readonly args: SetDelegatedVoterPayloadMoveArguments;
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
    export type SetOperatorPayloadMoveArguments = {
      new_operator: AccountAddress;
    };

    /**
     *  public fun set_operator<>(
     *     owner: &signer,
     *     new_operator: address,
     *   )
     **/
    export class SetOperator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "set_operator";
      public readonly args: SetOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        owner: Account, // &signer
        new_operator: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          new_operator: AccountAddress.fromRelaxed(new_operator),
        };
      }
    }
    export type SynchronizeDelegationPoolPayloadMoveArguments = {
      arg_0: AccountAddress;
    };

    /**
     *  public fun synchronize_delegation_pool<>(
     *     arg_0: address,
     *   )
     **/
    export class SynchronizeDelegationPool extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "synchronize_delegation_pool";
      public readonly args: SynchronizeDelegationPoolPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
        };
      }
    }
    export type UnlockPayloadMoveArguments = {
      pool_address: AccountAddress;
      amount: U64;
    };

    /**
     *  public fun unlock<>(
     *     delegator: &signer,
     *     pool_address: address,
     *     amount: u64,
     *   )
     **/
    export class Unlock extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "unlock";
      public readonly args: UnlockPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        delegator: Account, // &signer
        pool_address: AccountAddressInput, // address
        amount: Uint64, // u64
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          amount: new U64(amount),
        };
      }
    }
    export type VotePayloadMoveArguments = {
      pool_address: AccountAddress;
      proposal_id: U64;
      voting_power: U64;
      should_pass: Bool;
    };

    /**
     *  public fun vote<>(
     *     voter: &signer,
     *     pool_address: address,
     *     proposal_id: u64,
     *     voting_power: u64,
     *     should_pass: bool,
     *   )
     **/
    export class Vote extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "vote";
      public readonly args: VotePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voter: Account, // &signer
        pool_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        voting_power: Uint64, // u64
        should_pass: boolean, // bool
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          proposal_id: new U64(proposal_id),
          voting_power: new U64(voting_power),
          should_pass: new Bool(should_pass),
        };
      }
    }
    export type WithdrawPayloadMoveArguments = {
      pool_address: AccountAddress;
      amount: U64;
    };

    /**
     *  public fun withdraw<>(
     *     delegator: &signer,
     *     pool_address: address,
     *     amount: u64,
     *   )
     **/
    export class Withdraw extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "withdraw";
      public readonly args: WithdrawPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        delegator: Account, // &signer
        pool_address: AccountAddressInput, // address
        amount: Uint64, // u64
        feePayer?: Account, // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          amount: new U64(amount),
        };
      }
    }
  }
  export namespace ViewFunctions {
    export type BeneficiaryForOperatorPayloadMoveArguments = {
      arg_0: AccountAddressInput;
    };

    /**
     *  public fun beneficiary_for_operator<>(
     *     arg_0: address,
     *   )
     **/
    export class BeneficiaryForOperator extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "beneficiary_for_operator";
      public readonly args: BeneficiaryForOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
        };
      }
    }
    export type CalculateAndUpdateDelegatorVoterPayloadMoveArguments = {
      pool_address: AccountAddressInput;
      delegator_address: AccountAddressInput;
    };

    /**
     *  public fun calculate_and_update_delegator_voter<>(
     *     pool_address: address,
     *     delegator_address: address,
     *   )
     **/
    export class CalculateAndUpdateDelegatorVoter extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "calculate_and_update_delegator_voter";
      public readonly args: CalculateAndUpdateDelegatorVoterPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
        delegator_address: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          delegator_address: AccountAddress.fromRelaxed(delegator_address),
        };
      }
    }
    export type CalculateAndUpdateRemainingVotingPowerPayloadMoveArguments = {
      pool_address: AccountAddressInput;
      voter_address: AccountAddressInput;
      proposal_id: Uint64;
    };

    /**
     *  public fun calculate_and_update_remaining_voting_power<>(
     *     pool_address: address,
     *     voter_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class CalculateAndUpdateRemainingVotingPower extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "calculate_and_update_remaining_voting_power";
      public readonly args: CalculateAndUpdateRemainingVotingPowerPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
        voter_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          voter_address: AccountAddress.fromRelaxed(voter_address),
          proposal_id: proposal_id,
        };
      }
    }
    export type CalculateAndUpdateVoterTotalVotingPowerPayloadMoveArguments = {
      pool_address: AccountAddressInput;
      voter: AccountAddressInput;
    };

    /**
     *  public fun calculate_and_update_voter_total_voting_power<>(
     *     pool_address: address,
     *     voter: address,
     *   )
     **/
    export class CalculateAndUpdateVoterTotalVotingPower extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "calculate_and_update_voter_total_voting_power";
      public readonly args: CalculateAndUpdateVoterTotalVotingPowerPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
        voter: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          voter: AccountAddress.fromRelaxed(voter),
        };
      }
    }
    export type CanWithdrawPendingInactivePayloadMoveArguments = {
      pool_address: AccountAddressInput;
    };

    /**
     *  public fun can_withdraw_pending_inactive<>(
     *     pool_address: address,
     *   )
     **/
    export class CanWithdrawPendingInactive extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "can_withdraw_pending_inactive";
      public readonly args: CanWithdrawPendingInactivePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
        };
      }
    }
    export type DelegationPoolExistsPayloadMoveArguments = {
      addr: AccountAddressInput;
    };

    /**
     *  public fun delegation_pool_exists<>(
     *     addr: address,
     *   )
     **/
    export class DelegationPoolExists extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "delegation_pool_exists";
      public readonly args: DelegationPoolExistsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          addr: AccountAddress.fromRelaxed(addr),
        };
      }
    }
    export type GetAddStakeFeePayloadMoveArguments = {
      pool_address: AccountAddressInput;
      amount: Uint64;
    };

    /**
     *  public fun get_add_stake_fee<>(
     *     pool_address: address,
     *     amount: u64,
     *   )
     **/
    export class GetAddStakeFee extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "get_add_stake_fee";
      public readonly args: GetAddStakeFeePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
        amount: Uint64, // u64
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          amount: amount,
        };
      }
    }
    export type GetDelegationPoolStakePayloadMoveArguments = {
      pool_address: AccountAddressInput;
    };

    /**
     *  public fun get_delegation_pool_stake<>(
     *     pool_address: address,
     *   )
     **/
    export class GetDelegationPoolStake extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "get_delegation_pool_stake";
      public readonly args: GetDelegationPoolStakePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
        };
      }
    }
    export type GetExpectedStakePoolAddressPayloadMoveArguments = {
      owner: AccountAddressInput;
      delegation_pool_creation_seed: HexInput;
    };

    /**
     *  public fun get_expected_stake_pool_address<>(
     *     owner: address,
     *     delegation_pool_creation_seed: vector<u8>,
     *   )
     **/
    export class GetExpectedStakePoolAddress extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "get_expected_stake_pool_address";
      public readonly args: GetExpectedStakePoolAddressPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        owner: AccountAddressInput, // address
        delegation_pool_creation_seed: HexInput, // vector<u8>
      ) {
        super();
        this.args = {
          owner: AccountAddress.fromRelaxed(owner),
          delegation_pool_creation_seed: Hex.fromHexInput(delegation_pool_creation_seed),
        };
      }
    }
    export type GetOwnedPoolAddressPayloadMoveArguments = {
      owner: AccountAddressInput;
    };

    /**
     *  public fun get_owned_pool_address<>(
     *     owner: address,
     *   )
     **/
    export class GetOwnedPoolAddress extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "get_owned_pool_address";
      public readonly args: GetOwnedPoolAddressPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        owner: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          owner: AccountAddress.fromRelaxed(owner),
        };
      }
    }
    export type GetPendingWithdrawalPayloadMoveArguments = {
      pool_address: AccountAddressInput;
      delegator_address: AccountAddressInput;
    };

    /**
     *  public fun get_pending_withdrawal<>(
     *     pool_address: address,
     *     delegator_address: address,
     *   )
     **/
    export class GetPendingWithdrawal extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "get_pending_withdrawal";
      public readonly args: GetPendingWithdrawalPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
        delegator_address: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
          delegator_address: AccountAddress.fromRelaxed(delegator_address),
        };
      }
    }
    export type GetStakePayloadMoveArguments = {
      arg_0: AccountAddressInput;
      arg_1: AccountAddressInput;
    };

    /**
     *  public fun get_stake<>(
     *     arg_0: address,
     *     arg_1: address,
     *   )
     **/
    export class GetStake extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "get_stake";
      public readonly args: GetStakePayloadMoveArguments;
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
    export type ObservedLockupCyclePayloadMoveArguments = {
      pool_address: AccountAddressInput;
    };

    /**
     *  public fun observed_lockup_cycle<>(
     *     pool_address: address,
     *   )
     **/
    export class ObservedLockupCycle extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "observed_lockup_cycle";
      public readonly args: ObservedLockupCyclePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
        };
      }
    }
    export type OperatorCommissionPercentagePayloadMoveArguments = {
      pool_address: AccountAddressInput;
    };

    /**
     *  public fun operator_commission_percentage<>(
     *     pool_address: address,
     *   )
     **/
    export class OperatorCommissionPercentage extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "operator_commission_percentage";
      public readonly args: OperatorCommissionPercentagePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
        };
      }
    }
    export type OwnerCapExistsPayloadMoveArguments = {
      addr: AccountAddressInput;
    };

    /**
     *  public fun owner_cap_exists<>(
     *     addr: address,
     *   )
     **/
    export class OwnerCapExists extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "owner_cap_exists";
      public readonly args: OwnerCapExistsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        addr: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          addr: AccountAddress.fromRelaxed(addr),
        };
      }
    }
    export type PartialGovernanceVotingEnabledPayloadMoveArguments = {
      pool_address: AccountAddressInput;
    };

    /**
     *  public fun partial_governance_voting_enabled<>(
     *     pool_address: address,
     *   )
     **/
    export class PartialGovernanceVotingEnabled extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "partial_governance_voting_enabled";
      public readonly args: PartialGovernanceVotingEnabledPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
        };
      }
    }
    export type ShareholdersCountActivePoolPayloadMoveArguments = {
      pool_address: AccountAddressInput;
    };

    /**
     *  public fun shareholders_count_active_pool<>(
     *     pool_address: address,
     *   )
     **/
    export class ShareholdersCountActivePool extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "delegation_pool";
      public readonly functionName = "shareholders_count_active_pool";
      public readonly args: ShareholdersCountActivePoolPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        pool_address: AccountAddressInput, // address
      ) {
        super();
        this.args = {
          pool_address: AccountAddress.fromRelaxed(pool_address),
        };
      }
    }
  }
}
