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

export namespace AptosGovernance {
  export type AddApprovedScriptHashScriptPayloadBCSArguments = {
    proposal_id: U64;
  };

  export class AddApprovedScriptHashScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "add_approved_script_hash_script";
    public readonly args: AddApprovedScriptHashScriptPayloadBCSArguments;

    constructor(
      proposal_id: Uint64, // u64
    ) {
      super();
      this.args = {
        proposal_id: new U64(proposal_id),
      };
    }
  }
  // let proposer: AccountAuthenticator | undefined; // &signer
  export type CreateProposalPayloadBCSArguments = {
    stake_pool: AccountAddress;
    execution_hash: MoveVector<U8>;
    metadata_location: MoveVector<U8>;
    metadata_hash: MoveVector<U8>;
  };

  export class CreateProposal extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "create_proposal";
    public readonly args: CreateProposalPayloadBCSArguments;

    constructor(
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
  // let arg_0: AccountAuthenticator | undefined; // &signer
  export type CreateProposalV2PayloadBCSArguments = {
    arg_1: AccountAddress;
    arg_2: MoveVector<U8>;
    arg_3: MoveVector<U8>;
    arg_4: MoveVector<U8>;
    arg_5: Bool;
  };

  export class CreateProposalV2 extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "create_proposal_v2";
    public readonly args: CreateProposalV2PayloadBCSArguments;

    constructor(
      arg_1: AccountAddressInput, // address
      arg_2: HexInput, // vector<u8>
      arg_3: HexInput, // vector<u8>
      arg_4: HexInput, // vector<u8>
      arg_5: boolean, // bool
    ) {
      super();
      this.args = {
        arg_1: AccountAddress.fromRelaxed(arg_1),
        arg_2: MoveVector.U8(arg_2),
        arg_3: MoveVector.U8(arg_3),
        arg_4: MoveVector.U8(arg_4),
        arg_5: new Bool(arg_5),
      };
    }
  }
  // let voter: AccountAuthenticator | undefined; // &signer
  export type PartialVotePayloadBCSArguments = {
    stake_pool: AccountAddress;
    proposal_id: U64;
    voting_power: U64;
    should_pass: Bool;
  };

  export class PartialVote extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "partial_vote";
    public readonly args: PartialVotePayloadBCSArguments;

    constructor(
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
  // let voter: AccountAuthenticator | undefined; // &signer
  export type VotePayloadBCSArguments = {
    stake_pool: AccountAddress;
    proposal_id: U64;
    should_pass: Bool;
  };

  export class Vote extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "vote";
    public readonly args: VotePayloadBCSArguments;

    constructor(
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
}
