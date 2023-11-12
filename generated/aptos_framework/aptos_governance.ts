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

export type AddApprovedScriptHashScriptPayloadMoveArguments = {
  proposal_id: U64;
};

/**
 *  public fun add_approved_script_hash_script<>(
 *     proposal_id: u64,
 *   )
 **/
export class AddApprovedScriptHashScript extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "add_approved_script_hash_script";
  public readonly args: AddApprovedScriptHashScriptPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    proposal_id: Uint64, // u64
  ) {
    super();
    this.args = {
      proposal_id: new U64(proposal_id),
    };
  }
}
export type CreateProposalPayloadMoveArguments = {
  stake_pool: AccountAddress;
  execution_hash: MoveVector<U8>;
  metadata_location: MoveVector<U8>;
  metadata_hash: MoveVector<U8>;
};

/**
 *  public fun create_proposal<>(
 *     proposer: &signer,
 *     stake_pool: address,
 *     execution_hash: vector<u8>,
 *     metadata_location: vector<u8>,
 *     metadata_hash: vector<u8>,
 *   )
 **/
export class CreateProposal extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "create_proposal";
  public readonly args: CreateProposalPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // proposer: &signer,
    stake_pool: AccountAddressInput, // address
    execution_hash: HexInput, // vector<u8>
    metadata_location: HexInput, // vector<u8>
    metadata_hash: HexInput, // vector<u8>
  ) {
    super();
    this.args = {
      stake_pool: AccountAddress.fromRelaxed(stake_pool),
      execution_hash: MoveVector.U8(execution_hash),
      metadata_location: MoveVector.U8(metadata_location),
      metadata_hash: MoveVector.U8(metadata_hash),
    };
  }
}
export type CreateProposalV2PayloadMoveArguments = {
  stake_pool: AccountAddress;
  execution_hash: MoveVector<U8>;
  metadata_location: MoveVector<U8>;
  metadata_hash: MoveVector<U8>;
  is_multi_step_proposal: Bool;
};

/**
 *  public fun create_proposal_v2<>(
 *     proposer: &signer,
 *     stake_pool: address,
 *     execution_hash: vector<u8>,
 *     metadata_location: vector<u8>,
 *     metadata_hash: vector<u8>,
 *     is_multi_step_proposal: bool,
 *   )
 **/
export class CreateProposalV2 extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "create_proposal_v2";
  public readonly args: CreateProposalV2PayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // proposer: &signer,
    stake_pool: AccountAddressInput, // address
    execution_hash: HexInput, // vector<u8>
    metadata_location: HexInput, // vector<u8>
    metadata_hash: HexInput, // vector<u8>
    is_multi_step_proposal: boolean, // bool
  ) {
    super();
    this.args = {
      stake_pool: AccountAddress.fromRelaxed(stake_pool),
      execution_hash: MoveVector.U8(execution_hash),
      metadata_location: MoveVector.U8(metadata_location),
      metadata_hash: MoveVector.U8(metadata_hash),
      is_multi_step_proposal: new Bool(is_multi_step_proposal),
    };
  }
}
export type PartialVotePayloadMoveArguments = {
  stake_pool: AccountAddress;
  proposal_id: U64;
  voting_power: U64;
  should_pass: Bool;
};

/**
 *  public fun partial_vote<>(
 *     voter: &signer,
 *     stake_pool: address,
 *     proposal_id: u64,
 *     voting_power: u64,
 *     should_pass: bool,
 *   )
 **/
export class PartialVote extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "partial_vote";
  public readonly args: PartialVotePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // voter: &signer,
    stake_pool: AccountAddressInput, // address
    proposal_id: Uint64, // u64
    voting_power: Uint64, // u64
    should_pass: boolean, // bool
  ) {
    super();
    this.args = {
      stake_pool: AccountAddress.fromRelaxed(stake_pool),
      proposal_id: new U64(proposal_id),
      voting_power: new U64(voting_power),
      should_pass: new Bool(should_pass),
    };
  }
}
export type VotePayloadMoveArguments = {
  stake_pool: AccountAddress;
  proposal_id: U64;
  should_pass: Bool;
};

/**
 *  public fun vote<>(
 *     voter: &signer,
 *     stake_pool: address,
 *     proposal_id: u64,
 *     should_pass: bool,
 *   )
 **/
export class Vote extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "vote";
  public readonly args: VotePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // voter: &signer,
    stake_pool: AccountAddressInput, // address
    proposal_id: Uint64, // u64
    should_pass: boolean, // bool
  ) {
    super();
    this.args = {
      stake_pool: AccountAddress.fromRelaxed(stake_pool),
      proposal_id: new U64(proposal_id),
      should_pass: new Bool(should_pass),
    };
  }
}

/**
 *  public fun get_min_voting_threshold<>(
 *   )
 **/
export class GetMinVotingThreshold extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "get_min_voting_threshold";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type GetRemainingVotingPowerPayloadMoveArguments = {
  stake_pool: string;
  proposal_id: string;
};

/**
 *  public fun get_remaining_voting_power<>(
 *     stake_pool: address,
 *     proposal_id: u64,
 *   )
 **/
export class GetRemainingVotingPower extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "get_remaining_voting_power";
  public readonly args: GetRemainingVotingPowerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    stake_pool: AccountAddressInput, // address
    proposal_id: Uint64, // u64
  ) {
    super();
    this.args = {
      stake_pool: AccountAddress.fromRelaxed(stake_pool).toString(),
      proposal_id: BigInt(proposal_id).toString(),
    };
  }
}

/**
 *  public fun get_required_proposer_stake<>(
 *   )
 **/
export class GetRequiredProposerStake extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "get_required_proposer_stake";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}

/**
 *  public fun get_voting_duration_secs<>(
 *   )
 **/
export class GetVotingDurationSecs extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "get_voting_duration_secs";
  public readonly args = {};
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor() {
    super();
    this.args = {};
  }
}
export type GetVotingPowerPayloadMoveArguments = {
  pool_address: string;
};

/**
 *  public fun get_voting_power<>(
 *     pool_address: address,
 *   )
 **/
export class GetVotingPower extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "get_voting_power";
  public readonly args: GetVotingPowerPayloadMoveArguments;
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
export type HasEntirelyVotedPayloadMoveArguments = {
  stake_pool: string;
  proposal_id: string;
};

/**
 *  public fun has_entirely_voted<>(
 *     stake_pool: address,
 *     proposal_id: u64,
 *   )
 **/
export class HasEntirelyVoted extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "aptos_governance";
  public readonly functionName = "has_entirely_voted";
  public readonly args: HasEntirelyVotedPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    stake_pool: AccountAddressInput, // address
    proposal_id: Uint64, // u64
  ) {
    super();
    this.args = {
      stake_pool: AccountAddress.fromRelaxed(stake_pool).toString(),
      proposal_id: BigInt(proposal_id).toString(),
    };
  }
}
