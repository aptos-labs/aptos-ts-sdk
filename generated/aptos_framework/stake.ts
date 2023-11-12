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

export type AddStakePayloadMoveArguments = {
  amount: U64;
};

/**
 *  public fun add_stake<>(
 *     owner: &signer,
 *     amount: u64,
 *   )
 **/
export class AddStake extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "add_stake";
  public readonly args: AddStakePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // owner: &signer,
    amount: Uint64, // u64
  ) {
    super();
    this.args = {
      amount: new U64(amount),
    };
  }
}

/**
 *  public fun increase_lockup<>(
 *     owner: &signer,
 *   )
 **/
export class IncreaseLockup extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "increase_lockup";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type InitializeStakeOwnerPayloadMoveArguments = {
  initial_stake_amount: U64;
  operator: AccountAddress;
  voter: AccountAddress;
};

/**
 *  public fun initialize_stake_owner<>(
 *     owner: &signer,
 *     initial_stake_amount: u64,
 *     operator: address,
 *     voter: address,
 *   )
 **/
export class InitializeStakeOwner extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "initialize_stake_owner";
  public readonly args: InitializeStakeOwnerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // owner: &signer,
    initial_stake_amount: Uint64, // u64
    operator: AccountAddressInput, // address
    voter: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      initial_stake_amount: new U64(initial_stake_amount),
      operator: AccountAddress.fromRelaxed(operator),
      voter: AccountAddress.fromRelaxed(voter),
    };
  }
}
export type InitializeValidatorPayloadMoveArguments = {
  consensus_pubkey: MoveVector<U8>;
  proof_of_possession: MoveVector<U8>;
  network_addresses: MoveVector<U8>;
  fullnode_addresses: MoveVector<U8>;
};

/**
 *  public fun initialize_validator<>(
 *     account: &signer,
 *     consensus_pubkey: vector<u8>,
 *     proof_of_possession: vector<u8>,
 *     network_addresses: vector<u8>,
 *     fullnode_addresses: vector<u8>,
 *   )
 **/
export class InitializeValidator extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "initialize_validator";
  public readonly args: InitializeValidatorPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // account: &signer,
    consensus_pubkey: HexInput, // vector<u8>
    proof_of_possession: HexInput, // vector<u8>
    network_addresses: HexInput, // vector<u8>
    fullnode_addresses: HexInput, // vector<u8>
  ) {
    super();
    this.args = {
      consensus_pubkey: MoveVector.U8(consensus_pubkey),
      proof_of_possession: MoveVector.U8(proof_of_possession),
      network_addresses: MoveVector.U8(network_addresses),
      fullnode_addresses: MoveVector.U8(fullnode_addresses),
    };
  }
}
export type JoinValidatorSetPayloadMoveArguments = {
  pool_address: AccountAddress;
};

/**
 *  public fun join_validator_set<>(
 *     operator: &signer,
 *     pool_address: address,
 *   )
 **/
export class JoinValidatorSet extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "join_validator_set";
  public readonly args: JoinValidatorSetPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // operator: &signer,
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address),
    };
  }
}
export type LeaveValidatorSetPayloadMoveArguments = {
  pool_address: AccountAddress;
};

/**
 *  public fun leave_validator_set<>(
 *     operator: &signer,
 *     pool_address: address,
 *   )
 **/
export class LeaveValidatorSet extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "leave_validator_set";
  public readonly args: LeaveValidatorSetPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // operator: &signer,
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address),
    };
  }
}
export type ReactivateStakePayloadMoveArguments = {
  amount: U64;
};

/**
 *  public fun reactivate_stake<>(
 *     owner: &signer,
 *     amount: u64,
 *   )
 **/
export class ReactivateStake extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "reactivate_stake";
  public readonly args: ReactivateStakePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // owner: &signer,
    amount: Uint64, // u64
  ) {
    super();
    this.args = {
      amount: new U64(amount),
    };
  }
}
export type RotateConsensusKeyPayloadMoveArguments = {
  pool_address: AccountAddress;
  new_consensus_pubkey: MoveVector<U8>;
  proof_of_possession: MoveVector<U8>;
};

/**
 *  public fun rotate_consensus_key<>(
 *     operator: &signer,
 *     pool_address: address,
 *     new_consensus_pubkey: vector<u8>,
 *     proof_of_possession: vector<u8>,
 *   )
 **/
export class RotateConsensusKey extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "rotate_consensus_key";
  public readonly args: RotateConsensusKeyPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // operator: &signer,
    pool_address: AccountAddressInput, // address
    new_consensus_pubkey: HexInput, // vector<u8>
    proof_of_possession: HexInput, // vector<u8>
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address),
      new_consensus_pubkey: MoveVector.U8(new_consensus_pubkey),
      proof_of_possession: MoveVector.U8(proof_of_possession),
    };
  }
}
export type SetDelegatedVoterPayloadMoveArguments = {
  new_voter: AccountAddress;
};

/**
 *  public fun set_delegated_voter<>(
 *     owner: &signer,
 *     new_voter: address,
 *   )
 **/
export class SetDelegatedVoter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "set_delegated_voter";
  public readonly args: SetDelegatedVoterPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // owner: &signer,
    new_voter: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      new_voter: AccountAddress.fromRelaxed(new_voter),
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
  public readonly moduleName = "stake";
  public readonly functionName = "set_operator";
  public readonly args: SetOperatorPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // owner: &signer,
    new_operator: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      new_operator: AccountAddress.fromRelaxed(new_operator),
    };
  }
}
export type UnlockPayloadMoveArguments = {
  amount: U64;
};

/**
 *  public fun unlock<>(
 *     owner: &signer,
 *     amount: u64,
 *   )
 **/
export class Unlock extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "unlock";
  public readonly args: UnlockPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // owner: &signer,
    amount: Uint64, // u64
  ) {
    super();
    this.args = {
      amount: new U64(amount),
    };
  }
}
export type UpdateNetworkAndFullnodeAddressesPayloadMoveArguments = {
  pool_address: AccountAddress;
  new_network_addresses: MoveVector<U8>;
  new_fullnode_addresses: MoveVector<U8>;
};

/**
 *  public fun update_network_and_fullnode_addresses<>(
 *     operator: &signer,
 *     pool_address: address,
 *     new_network_addresses: vector<u8>,
 *     new_fullnode_addresses: vector<u8>,
 *   )
 **/
export class UpdateNetworkAndFullnodeAddresses extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "update_network_and_fullnode_addresses";
  public readonly args: UpdateNetworkAndFullnodeAddressesPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // operator: &signer,
    pool_address: AccountAddressInput, // address
    new_network_addresses: HexInput, // vector<u8>
    new_fullnode_addresses: HexInput, // vector<u8>
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address),
      new_network_addresses: MoveVector.U8(new_network_addresses),
      new_fullnode_addresses: MoveVector.U8(new_fullnode_addresses),
    };
  }
}
export type WithdrawPayloadMoveArguments = {
  withdraw_amount: U64;
};

/**
 *  public fun withdraw<>(
 *     owner: &signer,
 *     withdraw_amount: u64,
 *   )
 **/
export class Withdraw extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "withdraw";
  public readonly args: WithdrawPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // owner: &signer,
    withdraw_amount: Uint64, // u64
  ) {
    super();
    this.args = {
      withdraw_amount: new U64(withdraw_amount),
    };
  }
}

export type GetCurrentEpochProposalCountsPayloadMoveArguments = {
  validator_index: string;
};

/**
 *  public fun get_current_epoch_proposal_counts<>(
 *     validator_index: u64,
 *   )
 **/
export class GetCurrentEpochProposalCounts extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_current_epoch_proposal_counts";
  public readonly args: GetCurrentEpochProposalCountsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    validator_index: Uint64, // u64
  ) {
    super();
    this.args = {
      validator_index: BigInt(validator_index).toString(),
    };
  }
}
export type GetCurrentEpochVotingPowerPayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_current_epoch_voting_power<>(
 *     pool_address: address,
 *   )
 **/
export class GetCurrentEpochVotingPower extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_current_epoch_voting_power";
  public readonly args: GetCurrentEpochVotingPowerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address).toString(),
    };
  }
}
export type GetDelegatedVoterPayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_delegated_voter<>(
 *     pool_address: address,
 *   )
 **/
export class GetDelegatedVoter extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_delegated_voter";
  public readonly args: GetDelegatedVoterPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address).toString(),
    };
  }
}
export type GetLockupSecsPayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_lockup_secs<>(
 *     pool_address: address,
 *   )
 **/
export class GetLockupSecs extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_lockup_secs";
  public readonly args: GetLockupSecsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address).toString(),
    };
  }
}
export type GetOperatorPayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_operator<>(
 *     pool_address: address,
 *   )
 **/
export class GetOperator extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_operator";
  public readonly args: GetOperatorPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address).toString(),
    };
  }
}
export type GetRemainingLockupSecsPayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_remaining_lockup_secs<>(
 *     pool_address: address,
 *   )
 **/
export class GetRemainingLockupSecs extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_remaining_lockup_secs";
  public readonly args: GetRemainingLockupSecsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address).toString(),
    };
  }
}
export type GetStakePayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_stake<>(
 *     pool_address: address,
 *   )
 **/
export class GetStake extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_stake";
  public readonly args: GetStakePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address).toString(),
    };
  }
}
export type GetValidatorConfigPayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_validator_config<>(
 *     pool_address: address,
 *   )
 **/
export class GetValidatorConfig extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_validator_config";
  public readonly args: GetValidatorConfigPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address).toString(),
    };
  }
}
export type GetValidatorIndexPayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_validator_index<>(
 *     pool_address: address,
 *   )
 **/
export class GetValidatorIndex extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_validator_index";
  public readonly args: GetValidatorIndexPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address).toString(),
    };
  }
}
export type GetValidatorStatePayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_validator_state<>(
 *     pool_address: address,
 *   )
 **/
export class GetValidatorState extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "get_validator_state";
  public readonly args: GetValidatorStatePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    pool_address: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      pool_address: AccountAddress.fromRelaxed(pool_address).toString(),
    };
  }
}
export type StakePoolExistsPayloadMoveArguments = {
  addr: string;
};

/**
 *  public fun stake_pool_exists<>(
 *     addr: address,
 *   )
 **/
export class StakePoolExists extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "stake";
  public readonly functionName = "stake_pool_exists";
  public readonly args: StakePoolExistsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    addr: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      addr: AccountAddress.fromRelaxed(addr).toString(),
    };
  }
}
