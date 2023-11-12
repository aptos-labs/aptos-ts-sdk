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
  operator: AccountAddress;
  voter: AccountAddress;
  amount: U64;
  commission_percentage: U64;
  contract_creation_seed: MoveVector<U8>;
};

/**
 *  public fun create_staking_contract<>(
 *     staker: &signer,
 *     operator: address,
 *     voter: address,
 *     amount: u64,
 *     commission_percentage: u64,
 *     contract_creation_seed: vector<u8>,
 *   )
 **/
export class CreateStakingContract extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_contract";
  public readonly functionName = "create_staking_contract";
  public readonly args: CreateStakingContractPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    staker: Account, // &signer
    operator: AccountAddressInput, // address
    voter: AccountAddressInput, // address
    amount: Uint64, // u64
    commission_percentage: Uint64, // u64
    contract_creation_seed: HexInput, // vector<u8>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      operator: AccountAddress.fromRelaxed(operator),
      voter: AccountAddress.fromRelaxed(voter),
      amount: new U64(amount),
      commission_percentage: new U64(commission_percentage),
      contract_creation_seed: MoveVector.U8(contract_creation_seed),
    };
  }
}
export type DistributePayloadMoveArguments = {
  staker: AccountAddress;
  operator: AccountAddress;
};

/**
 *  public fun distribute<>(
 *     staker: address,
 *     operator: address,
 *   )
 **/
export class Distribute extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_contract";
  public readonly functionName = "distribute";
  public readonly args: DistributePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
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
export type SwitchOperatorPayloadMoveArguments = {
  old_operator: AccountAddress;
  new_operator: AccountAddress;
  new_commission_percentage: U64;
};

/**
 *  public fun switch_operator<>(
 *     staker: &signer,
 *     old_operator: address,
 *     new_operator: address,
 *     new_commission_percentage: u64,
 *   )
 **/
export class SwitchOperator extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_contract";
  public readonly functionName = "switch_operator";
  public readonly args: SwitchOperatorPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    staker: Account, // &signer
    old_operator: AccountAddressInput, // address
    new_operator: AccountAddressInput, // address
    new_commission_percentage: Uint64, // u64
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      old_operator: AccountAddress.fromRelaxed(old_operator),
      new_operator: AccountAddress.fromRelaxed(new_operator),
      new_commission_percentage: new U64(new_commission_percentage),
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
      contract_creation_seed: Hex.fromHexInput(contract_creation_seed).toUint8Array(),
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
  staker: AccountAddressInput;
  operator: AccountAddressInput;
};

/**
 *  public fun staking_contract_exists<>(
 *     staker: address,
 *     operator: address,
 *   )
 **/
export class StakingContractExists extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_contract";
  public readonly functionName = "staking_contract_exists";
  public readonly args: StakingContractExistsPayloadMoveArguments;
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
