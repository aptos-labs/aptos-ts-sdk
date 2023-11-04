
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace StakingProxy {
// let owner: AccountAuthenticator | undefined; // &signer
export type SetOperatorPayloadBCSArguments = {
  old_operator: AccountAddress;
  new_operator: AccountAddress;
};

export class SetOperator extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_proxy";
  public readonly functionName = "set_operator";
  public readonly args: SetOperatorPayloadBCSArguments;

  constructor(
    old_operator: AccountAddressInput, // address
    new_operator: AccountAddressInput // address
  ) {
    super();
    this.args = {
      old_operator: AccountAddress.fromRelaxed(old_operator),
      new_operator: AccountAddress.fromRelaxed(new_operator),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type SetStakePoolOperatorPayloadBCSArguments = {
  arg_1: AccountAddress;
};

export class SetStakePoolOperator extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_proxy";
  public readonly functionName = "set_stake_pool_operator";
  public readonly args: SetStakePoolOperatorPayloadBCSArguments;

  constructor(
    arg_1: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_1: AccountAddress.fromRelaxed(arg_1),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type SetStakePoolVoterPayloadBCSArguments = {
  arg_1: AccountAddress;
};

export class SetStakePoolVoter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_proxy";
  public readonly functionName = "set_stake_pool_voter";
  public readonly args: SetStakePoolVoterPayloadBCSArguments;

  constructor(
    arg_1: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_1: AccountAddress.fromRelaxed(arg_1),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type SetStakingContractOperatorPayloadBCSArguments = {
  arg_1: AccountAddress;
  arg_2: AccountAddress;
};

export class SetStakingContractOperator extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_proxy";
  public readonly functionName = "set_staking_contract_operator";
  public readonly args: SetStakingContractOperatorPayloadBCSArguments;

  constructor(
    arg_1: AccountAddressInput, // address
    arg_2: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_1: AccountAddress.fromRelaxed(arg_1),
      arg_2: AccountAddress.fromRelaxed(arg_2),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type SetStakingContractVoterPayloadBCSArguments = {
  arg_1: AccountAddress;
  arg_2: AccountAddress;
};

export class SetStakingContractVoter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_proxy";
  public readonly functionName = "set_staking_contract_voter";
  public readonly args: SetStakingContractVoterPayloadBCSArguments;

  constructor(
    arg_1: AccountAddressInput, // address
    arg_2: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_1: AccountAddress.fromRelaxed(arg_1),
      arg_2: AccountAddress.fromRelaxed(arg_2),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type SetVestingContractOperatorPayloadBCSArguments = {
  arg_1: AccountAddress;
  arg_2: AccountAddress;
};

export class SetVestingContractOperator extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_proxy";
  public readonly functionName = "set_vesting_contract_operator";
  public readonly args: SetVestingContractOperatorPayloadBCSArguments;

  constructor(
    arg_1: AccountAddressInput, // address
    arg_2: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_1: AccountAddress.fromRelaxed(arg_1),
      arg_2: AccountAddress.fromRelaxed(arg_2),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type SetVestingContractVoterPayloadBCSArguments = {
  arg_1: AccountAddress;
  arg_2: AccountAddress;
};

export class SetVestingContractVoter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_proxy";
  public readonly functionName = "set_vesting_contract_voter";
  public readonly args: SetVestingContractVoterPayloadBCSArguments;

  constructor(
    arg_1: AccountAddressInput, // address
    arg_2: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_1: AccountAddress.fromRelaxed(arg_1),
      arg_2: AccountAddress.fromRelaxed(arg_2),
    };
  }
}

// let owner: AccountAuthenticator | undefined; // &signer
export type SetVoterPayloadBCSArguments = {
  operator: AccountAddress;
  new_voter: AccountAddress;
};

export class SetVoter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "staking_proxy";
  public readonly functionName = "set_voter";
  public readonly args: SetVoterPayloadBCSArguments;

  constructor(
    operator: AccountAddressInput, // address
    new_voter: AccountAddressInput // address
  ) {
    super();
    this.args = {
      operator: AccountAddress.fromRelaxed(operator),
      new_voter: AccountAddress.fromRelaxed(new_voter),
    };
  }
}


}