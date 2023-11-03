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

export namespace Stake {
  // let arg_0: AccountAuthenticator | undefined; // &signer
  export type AddStakePayloadBCSArguments = {
    arg_1: U64;
  };

  export class AddStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "add_stake";
    public readonly args: AddStakePayloadBCSArguments;

    constructor(
      arg_1: Uint64, // u64
    ) {
      super();
      this.args = {
        arg_1: new U64(arg_1),
      };
    }
  }
  // let owner: AccountAuthenticator | undefined; // &signer

  export class IncreaseLockup extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "increase_lockup";
    public readonly args = {};

    constructor() {
      super();
      this.args = {};
    }
  }
  // let owner: AccountAuthenticator | undefined; // &signer
  export type InitializeStakeOwnerPayloadBCSArguments = {
    initial_stake_amount: U64;
    operator: AccountAddress;
    voter: AccountAddress;
  };

  export class InitializeStakeOwner extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "initialize_stake_owner";
    public readonly args: InitializeStakeOwnerPayloadBCSArguments;

    constructor(
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
  // let account: AccountAuthenticator | undefined; // &signer
  export type InitializeValidatorPayloadBCSArguments = {
    consensus_pubkey: MoveVector<U8>;
    proof_of_possession: MoveVector<U8>;
    network_addresses: MoveVector<U8>;
    fullnode_addresses: MoveVector<U8>;
  };

  export class InitializeValidator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "initialize_validator";
    public readonly args: InitializeValidatorPayloadBCSArguments;

    constructor(
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
  // let arg_0: AccountAuthenticator | undefined; // &signer
  export type JoinValidatorSetPayloadBCSArguments = {
    arg_1: AccountAddress;
  };

  export class JoinValidatorSet extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "join_validator_set";
    public readonly args: JoinValidatorSetPayloadBCSArguments;

    constructor(
      arg_1: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_1: AccountAddress.fromRelaxed(arg_1),
      };
    }
  }
  // let operator: AccountAuthenticator | undefined; // &signer
  export type LeaveValidatorSetPayloadBCSArguments = {
    pool_address: AccountAddress;
  };

  export class LeaveValidatorSet extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "leave_validator_set";
    public readonly args: LeaveValidatorSetPayloadBCSArguments;

    constructor(
      pool_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        pool_address: AccountAddress.fromRelaxed(pool_address),
      };
    }
  }
  // let owner: AccountAuthenticator | undefined; // &signer
  export type ReactivateStakePayloadBCSArguments = {
    amount: U64;
  };

  export class ReactivateStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "reactivate_stake";
    public readonly args: ReactivateStakePayloadBCSArguments;

    constructor(
      amount: Uint64, // u64
    ) {
      super();
      this.args = {
        amount: new U64(amount),
      };
    }
  }
  // let operator: AccountAuthenticator | undefined; // &signer
  export type RotateConsensusKeyPayloadBCSArguments = {
    pool_address: AccountAddress;
    new_consensus_pubkey: MoveVector<U8>;
    proof_of_possession: MoveVector<U8>;
  };

  export class RotateConsensusKey extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "rotate_consensus_key";
    public readonly args: RotateConsensusKeyPayloadBCSArguments;

    constructor(
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
  // let arg_0: AccountAuthenticator | undefined; // &signer
  export type SetDelegatedVoterPayloadBCSArguments = {
    arg_1: AccountAddress;
  };

  export class SetDelegatedVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "set_delegated_voter";
    public readonly args: SetDelegatedVoterPayloadBCSArguments;

    constructor(
      arg_1: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_1: AccountAddress.fromRelaxed(arg_1),
      };
    }
  }
  // let arg_0: AccountAuthenticator | undefined; // &signer
  export type SetOperatorPayloadBCSArguments = {
    arg_1: AccountAddress;
  };

  export class SetOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "set_operator";
    public readonly args: SetOperatorPayloadBCSArguments;

    constructor(
      arg_1: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_1: AccountAddress.fromRelaxed(arg_1),
      };
    }
  }
  // let owner: AccountAuthenticator | undefined; // &signer
  export type UnlockPayloadBCSArguments = {
    amount: U64;
  };

  export class Unlock extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "unlock";
    public readonly args: UnlockPayloadBCSArguments;

    constructor(
      amount: Uint64, // u64
    ) {
      super();
      this.args = {
        amount: new U64(amount),
      };
    }
  }
  // let operator: AccountAuthenticator | undefined; // &signer
  export type UpdateNetworkAndFullnodeAddressesPayloadBCSArguments = {
    pool_address: AccountAddress;
    new_network_addresses: MoveVector<U8>;
    new_fullnode_addresses: MoveVector<U8>;
  };

  export class UpdateNetworkAndFullnodeAddresses extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "update_network_and_fullnode_addresses";
    public readonly args: UpdateNetworkAndFullnodeAddressesPayloadBCSArguments;

    constructor(
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
  // let arg_0: AccountAuthenticator | undefined; // &signer
  export type WithdrawPayloadBCSArguments = {
    arg_1: U64;
  };

  export class Withdraw extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "withdraw";
    public readonly args: WithdrawPayloadBCSArguments;

    constructor(
      arg_1: Uint64, // u64
    ) {
      super();
      this.args = {
        arg_1: new U64(arg_1),
      };
    }
  }
}
