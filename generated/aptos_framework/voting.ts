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

export namespace Voting {
  export namespace EntryFunctions {}
  export namespace ViewFunctions {
    export type GetEarlyResolutionVoteThresholdPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_early_resolution_vote_threshold<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class GetEarlyResolutionVoteThreshold extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_early_resolution_vote_threshold";
      public readonly args: GetEarlyResolutionVoteThresholdPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetExecutionHashPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_execution_hash<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class GetExecutionHash extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_execution_hash";
      public readonly args: GetExecutionHashPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetMinVoteThresholdPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_min_vote_threshold<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class GetMinVoteThreshold extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_min_vote_threshold";
      public readonly args: GetMinVoteThresholdPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetProposalCreationSecsPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_proposal_creation_secs<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class GetProposalCreationSecs extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_proposal_creation_secs";
      public readonly args: GetProposalCreationSecsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetProposalExpirationSecsPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_proposal_expiration_secs<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class GetProposalExpirationSecs extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_proposal_expiration_secs";
      public readonly args: GetProposalExpirationSecsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetProposalMetadataPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_proposal_metadata<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class GetProposalMetadata extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_proposal_metadata";
      public readonly args: GetProposalMetadataPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetProposalMetadataValuePayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      metadata_key: string;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_proposal_metadata_value<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *     metadata_key: String,
     *   )
     **/
    export class GetProposalMetadataValue extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_proposal_metadata_value";
      public readonly args: GetProposalMetadataValuePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        metadata_key: string, // String
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          metadata_key: metadata_key,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetProposalStatePayloadMoveArguments = {
      arg_0: AccountAddressInput;
      arg_1: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_proposal_state<>(
     *     arg_0: address,
     *     arg_1: u64,
     *   )
     **/
    export class GetProposalState extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_proposal_state";
      public readonly args: GetProposalStatePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        arg_1: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
          arg_1: arg_1,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetProposerPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_proposer<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class GetProposer extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_proposer";
      public readonly args: GetProposerPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetResolutionTimeSecsPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_resolution_time_secs<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class GetResolutionTimeSecs extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_resolution_time_secs";
      public readonly args: GetResolutionTimeSecsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type GetVotesPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun get_votes<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class GetVotes extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "get_votes";
      public readonly args: GetVotesPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type IsMultiStepProposalInExecutionPayloadMoveArguments = {
      arg_0: AccountAddressInput;
      arg_1: Uint64;
    };

    /**
     *  public fun is_multi_step_proposal_in_execution<>(
     *     arg_0: address,
     *     arg_1: u64,
     *   )
     **/
    export class IsMultiStepProposalInExecution extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "is_multi_step_proposal_in_execution";
      public readonly args: IsMultiStepProposalInExecutionPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        arg_1: Uint64, // u64
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
          arg_1: arg_1,
        };
      }
    }
    export type IsResolvedPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun is_resolved<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class IsResolved extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "is_resolved";
      public readonly args: IsResolvedPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type IsVotingClosedPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      proposal_id: Uint64;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun is_voting_closed<>(
     *     voting_forum_address: address,
     *     proposal_id: u64,
     *   )
     **/
    export class IsVotingClosed extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "is_voting_closed";
      public readonly args: IsVotingClosedPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        proposal_id: Uint64, // u64
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          proposal_id: proposal_id,
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
    export type NextProposalIdPayloadMoveArguments = {
      voting_forum_address: AccountAddressInput;
      typeTags: Array<TypeTag>;
    };

    /**
     *  public fun next_proposal_id<>(
     *     voting_forum_address: address,
     *   )
     **/
    export class NextProposalId extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "voting";
      public readonly functionName = "next_proposal_id";
      public readonly args: NextProposalIdPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        voting_forum_address: AccountAddressInput, // address
        typeTags: Array<TypeTagInput>, //
      ) {
        super();
        this.args = {
          voting_forum_address: AccountAddress.fromRelaxed(voting_forum_address),
          typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
        };
      }
    }
  }
}
