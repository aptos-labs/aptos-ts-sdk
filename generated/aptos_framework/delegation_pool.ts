
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace DelegationPool {
// let delegator: AccountAuthenticator | undefined; // &signer
export type AddStakePayloadBCSArguments = {
  pool_address: AccountAddress;
  amount: U64;
};

export class AddStake extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "add_stake";
  public readonly args: AddStakePayloadBCSArguments;

  constructor(
    pool_address: AccountAddressInput, // address
    amount: Uint64 // u64
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address),
      amount: new U64(amount),
    };
  }
}

// let voter: AccountAuthenticator | undefined; // &signer
export type CreateProposalPayloadBCSArguments = {
  pool_address: AccountAddress;
  execution_hash: MoveVector<U8>;
  metadata_location: MoveVector<U8>;
  metadata_hash: MoveVector<U8>;
  is_multi_step_proposal: Bool;
};

export class CreateProposal extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "create_proposal";
  public readonly args: CreateProposalPayloadBCSArguments;

  constructor(
    pool_address: AccountAddressInput, // address
    execution_hash: HexInput, // vector<u8>
    metadata_location: HexInput, // vector<u8>
    metadata_hash: HexInput, // vector<u8>
    is_multi_step_proposal: boolean // bool
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

// let delegator: AccountAuthenticator | undefined; // &signer
export type DelegateVotingPowerPayloadBCSArguments = {
  pool_address: AccountAddress;
  new_voter: AccountAddress;
};

export class DelegateVotingPower extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "delegate_voting_power";
  public readonly args: DelegateVotingPowerPayloadBCSArguments;

  constructor(
    pool_address: AccountAddressInput, // address
    new_voter: AccountAddressInput // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address),
      new_voter: AccountAddress.fromRelaxed(new_voter),
    };
  }
}

export type EnablePartialGovernanceVotingPayloadBCSArguments = {
  arg_0: AccountAddress;
};

export class EnablePartialGovernanceVoting extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "enable_partial_governance_voting";
  public readonly args: EnablePartialGovernanceVotingPayloadBCSArguments;

  constructor(
    arg_0: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_0: AccountAddress.fromRelaxed(arg_0),
    };
  }
}

// let owner: AccountAuthenticator | undefined; // &signer
export type InitializeDelegationPoolPayloadBCSArguments = {
  operator_commission_percentage: U64;
  delegation_pool_creation_seed: MoveVector<U8>;
};

export class InitializeDelegationPool extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "initialize_delegation_pool";
  public readonly args: InitializeDelegationPoolPayloadBCSArguments;

  constructor(
    operator_commission_percentage: Uint64, // u64
    delegation_pool_creation_seed: HexInput // vector<u8>
  ) {
    super();
    this.args = {
      operator_commission_percentage: new U64(operator_commission_percentage),
      delegation_pool_creation_seed: MoveVector.U8(
        delegation_pool_creation_seed
      ),
    };
  }
}

// let delegator: AccountAuthenticator | undefined; // &signer
export type ReactivateStakePayloadBCSArguments = {
  pool_address: AccountAddress;
  amount: U64;
};

export class ReactivateStake extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "reactivate_stake";
  public readonly args: ReactivateStakePayloadBCSArguments;

  constructor(
    pool_address: AccountAddressInput, // address
    amount: Uint64 // u64
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address),
      amount: new U64(amount),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type SetDelegatedVoterPayloadBCSArguments = {
  arg_1: AccountAddress;
};

export class SetDelegatedVoter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "set_delegated_voter";
  public readonly args: SetDelegatedVoterPayloadBCSArguments;

  constructor(
    arg_1: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_1: AccountAddress.fromRelaxed(arg_1),
    };
  }
}

// let owner: AccountAuthenticator | undefined; // &signer
export type SetOperatorPayloadBCSArguments = {
  new_operator: AccountAddress;
};

export class SetOperator extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "set_operator";
  public readonly args: SetOperatorPayloadBCSArguments;

  constructor(
    new_operator: AccountAddressInput // address
  ) {
    super();
    this.args = {
      new_operator: AccountAddress.fromRelaxed(new_operator),
    };
  }
}

export type SynchronizeDelegationPoolPayloadBCSArguments = {
  arg_0: AccountAddress;
};

export class SynchronizeDelegationPool extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "synchronize_delegation_pool";
  public readonly args: SynchronizeDelegationPoolPayloadBCSArguments;

  constructor(
    arg_0: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_0: AccountAddress.fromRelaxed(arg_0),
    };
  }
}

// let delegator: AccountAuthenticator | undefined; // &signer
export type UnlockPayloadBCSArguments = {
  pool_address: AccountAddress;
  amount: U64;
};

export class Unlock extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "unlock";
  public readonly args: UnlockPayloadBCSArguments;

  constructor(
    pool_address: AccountAddressInput, // address
    amount: Uint64 // u64
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address),
      amount: new U64(amount),
    };
  }
}

// let voter: AccountAuthenticator | undefined; // &signer
export type VotePayloadBCSArguments = {
  pool_address: AccountAddress;
  proposal_id: U64;
  voting_power: U64;
  should_pass: Bool;
};

export class Vote extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "vote";
  public readonly args: VotePayloadBCSArguments;

  constructor(
    pool_address: AccountAddressInput, // address
    proposal_id: Uint64, // u64
    voting_power: Uint64, // u64
    should_pass: boolean // bool
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

// let delegator: AccountAuthenticator | undefined; // &signer
export type WithdrawPayloadBCSArguments = {
  pool_address: AccountAddress;
  amount: U64;
};

export class Withdraw extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "delegation_pool";
  public readonly functionName = "withdraw";
  public readonly args: WithdrawPayloadBCSArguments;

  constructor(
    pool_address: AccountAddressInput, // address
    amount: Uint64 // u64
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address),
      amount: new U64(amount),
    };
  }
}


}