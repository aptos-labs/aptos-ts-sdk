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

export namespace StakingContract {
  // let staker: AccountAuthenticator | undefined; // &signer
  export type AddStakePayloadBCSArguments = {
    operator: AccountAddress;
    amount: U64;
  };

  export class AddStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "add_stake";
    public readonly args: AddStakePayloadBCSArguments;

    constructor(
      operator: AccountAddressInput, // address
      amount: Uint64, // u64
    ) {
      super();
      this.args = {
        operator: AccountAddress.fromRelaxed(operator),
        amount: new U64(amount),
      };
    }
  }
  // let arg_0: AccountAuthenticator | undefined; // &signer
  export type CreateStakingContractPayloadBCSArguments = {
    arg_1: AccountAddress;
    arg_2: AccountAddress;
    arg_3: U64;
    arg_4: U64;
    arg_5: MoveVector<U8>;
  };

  export class CreateStakingContract extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "create_staking_contract";
    public readonly args: CreateStakingContractPayloadBCSArguments;

    constructor(
      arg_1: AccountAddressInput, // address
      arg_2: AccountAddressInput, // address
      arg_3: Uint64, // u64
      arg_4: Uint64, // u64
      arg_5: HexInput, // vector<u8>
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
  export type DistributePayloadBCSArguments = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class Distribute extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "distribute";
    public readonly args: DistributePayloadBCSArguments;

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
  // let account: AccountAuthenticator | undefined; // &signer
  export type RequestCommissionPayloadBCSArguments = {
    staker: AccountAddress;
    operator: AccountAddress;
  };

  export class RequestCommission extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "request_commission";
    public readonly args: RequestCommissionPayloadBCSArguments;

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
  // let staker: AccountAuthenticator | undefined; // &signer
  export type ResetLockupPayloadBCSArguments = {
    operator: AccountAddress;
  };

  export class ResetLockup extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "reset_lockup";
    public readonly args: ResetLockupPayloadBCSArguments;

    constructor(
      operator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        operator: AccountAddress.fromRelaxed(operator),
      };
    }
  }
  // let operator: AccountAuthenticator | undefined; // &signer
  export type SetBeneficiaryForOperatorPayloadBCSArguments = {
    new_beneficiary: AccountAddress;
  };

  export class SetBeneficiaryForOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "set_beneficiary_for_operator";
    public readonly args: SetBeneficiaryForOperatorPayloadBCSArguments;

    constructor(
      new_beneficiary: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        new_beneficiary: AccountAddress.fromRelaxed(new_beneficiary),
      };
    }
  }
  // let arg_0: AccountAuthenticator | undefined; // &signer
  export type SwitchOperatorPayloadBCSArguments = {
    arg_1: AccountAddress;
    arg_2: AccountAddress;
    arg_3: U64;
  };

  export class SwitchOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "switch_operator";
    public readonly args: SwitchOperatorPayloadBCSArguments;

    constructor(
      arg_1: AccountAddressInput, // address
      arg_2: AccountAddressInput, // address
      arg_3: Uint64, // u64
    ) {
      super();
      this.args = {
        arg_1: AccountAddress.fromRelaxed(arg_1),
        arg_2: AccountAddress.fromRelaxed(arg_2),
        arg_3: new U64(arg_3),
      };
    }
  }
  // let staker: AccountAuthenticator | undefined; // &signer
  export type SwitchOperatorWithSameCommissionPayloadBCSArguments = {
    old_operator: AccountAddress;
    new_operator: AccountAddress;
  };

  export class SwitchOperatorWithSameCommission extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "switch_operator_with_same_commission";
    public readonly args: SwitchOperatorWithSameCommissionPayloadBCSArguments;

    constructor(
      old_operator: AccountAddressInput, // address
      new_operator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        old_operator: AccountAddress.fromRelaxed(old_operator),
        new_operator: AccountAddress.fromRelaxed(new_operator),
      };
    }
  }
  // let staker: AccountAuthenticator | undefined; // &signer
  export type UnlockRewardsPayloadBCSArguments = {
    operator: AccountAddress;
  };

  export class UnlockRewards extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "unlock_rewards";
    public readonly args: UnlockRewardsPayloadBCSArguments;

    constructor(
      operator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        operator: AccountAddress.fromRelaxed(operator),
      };
    }
  }
  // let staker: AccountAuthenticator | undefined; // &signer
  export type UnlockStakePayloadBCSArguments = {
    operator: AccountAddress;
    amount: U64;
  };

  export class UnlockStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "unlock_stake";
    public readonly args: UnlockStakePayloadBCSArguments;

    constructor(
      operator: AccountAddressInput, // address
      amount: Uint64, // u64
    ) {
      super();
      this.args = {
        operator: AccountAddress.fromRelaxed(operator),
        amount: new U64(amount),
      };
    }
  }
  // let staker: AccountAuthenticator | undefined; // &signer
  export type UpdateCommisionPayloadBCSArguments = {
    operator: AccountAddress;
    new_commission_percentage: U64;
  };

  export class UpdateCommision extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "update_commision";
    public readonly args: UpdateCommisionPayloadBCSArguments;

    constructor(
      operator: AccountAddressInput, // address
      new_commission_percentage: Uint64, // u64
    ) {
      super();
      this.args = {
        operator: AccountAddress.fromRelaxed(operator),
        new_commission_percentage: new U64(new_commission_percentage),
      };
    }
  }
  // let staker: AccountAuthenticator | undefined; // &signer
  export type UpdateVoterPayloadBCSArguments = {
    operator: AccountAddress;
    new_voter: AccountAddress;
  };

  export class UpdateVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "update_voter";
    public readonly args: UpdateVoterPayloadBCSArguments;

    constructor(
      operator: AccountAddressInput, // address
      new_voter: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        operator: AccountAddress.fromRelaxed(operator),
        new_voter: AccountAddress.fromRelaxed(new_voter),
      };
    }
  }
}
