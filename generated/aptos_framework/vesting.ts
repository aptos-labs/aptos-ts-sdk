
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace Vesting {
// let admin: AccountAuthenticator | undefined; // &signer
export type AdminWithdrawPayloadBCSArguments = {
  contract_address: AccountAddress;
};

export class AdminWithdraw extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "admin_withdraw";
  public readonly args: AdminWithdrawPayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput // address
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
    };
  }
}

export type DistributePayloadBCSArguments = {
  arg_0: AccountAddress;
};

export class Distribute extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "distribute";
  public readonly args: DistributePayloadBCSArguments;

  constructor(
    arg_0: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_0: AccountAddress.fromRelaxed(arg_0),
    };
  }
}

export type DistributeManyPayloadBCSArguments = {
  contract_addresses: MoveVector<AccountAddress>;
};

export class DistributeMany extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "distribute_many";
  public readonly args: DistributeManyPayloadBCSArguments;

  constructor(
    contract_addresses: Array<AccountAddressInput> // vector<address>
  ) {
    super();
    this.args = {
      contract_addresses: new MoveVector(
        contract_addresses.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
    };
  }
}

// let account: AccountAuthenticator | undefined; // &signer
export type ResetBeneficiaryPayloadBCSArguments = {
  contract_address: AccountAddress;
  shareholder: AccountAddress;
};

export class ResetBeneficiary extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "reset_beneficiary";
  public readonly args: ResetBeneficiaryPayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput, // address
    shareholder: AccountAddressInput // address
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
      shareholder: AccountAddress.fromRelaxed(shareholder),
    };
  }
}

// let admin: AccountAuthenticator | undefined; // &signer
export type ResetLockupPayloadBCSArguments = {
  contract_address: AccountAddress;
};

export class ResetLockup extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "reset_lockup";
  public readonly args: ResetLockupPayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput // address
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
    };
  }
}

// let admin: AccountAuthenticator | undefined; // &signer
export type SetBeneficiaryPayloadBCSArguments = {
  contract_address: AccountAddress;
  shareholder: AccountAddress;
  new_beneficiary: AccountAddress;
};

export class SetBeneficiary extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "set_beneficiary";
  public readonly args: SetBeneficiaryPayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput, // address
    shareholder: AccountAddressInput, // address
    new_beneficiary: AccountAddressInput // address
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
      shareholder: AccountAddress.fromRelaxed(shareholder),
      new_beneficiary: AccountAddress.fromRelaxed(new_beneficiary),
    };
  }
}

// let admin: AccountAuthenticator | undefined; // &signer
export type SetBeneficiaryResetterPayloadBCSArguments = {
  contract_address: AccountAddress;
  beneficiary_resetter: AccountAddress;
};

export class SetBeneficiaryResetter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "set_beneficiary_resetter";
  public readonly args: SetBeneficiaryResetterPayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput, // address
    beneficiary_resetter: AccountAddressInput // address
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
      beneficiary_resetter: AccountAddress.fromRelaxed(beneficiary_resetter),
    };
  }
}

// let admin: AccountAuthenticator | undefined; // &signer
export type SetManagementRolePayloadBCSArguments = {
  contract_address: AccountAddress;
  role: MoveString;
  role_holder: AccountAddress;
};

export class SetManagementRole extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "set_management_role";
  public readonly args: SetManagementRolePayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput, // address
    role: string, // 0x1::string::String
    role_holder: AccountAddressInput // address
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
      role: new MoveString(role),
      role_holder: AccountAddress.fromRelaxed(role_holder),
    };
  }
}

// let admin: AccountAuthenticator | undefined; // &signer
export type TerminateVestingContractPayloadBCSArguments = {
  contract_address: AccountAddress;
};

export class TerminateVestingContract extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "terminate_vesting_contract";
  public readonly args: TerminateVestingContractPayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput // address
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
    };
  }
}

export type UnlockRewardsPayloadBCSArguments = {
  arg_0: AccountAddress;
};

export class UnlockRewards extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "unlock_rewards";
  public readonly args: UnlockRewardsPayloadBCSArguments;

  constructor(
    arg_0: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_0: AccountAddress.fromRelaxed(arg_0),
    };
  }
}

export type UnlockRewardsManyPayloadBCSArguments = {
  contract_addresses: MoveVector<AccountAddress>;
};

export class UnlockRewardsMany extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "unlock_rewards_many";
  public readonly args: UnlockRewardsManyPayloadBCSArguments;

  constructor(
    contract_addresses: Array<AccountAddressInput> // vector<address>
  ) {
    super();
    this.args = {
      contract_addresses: new MoveVector(
        contract_addresses.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
    };
  }
}

// let admin: AccountAuthenticator | undefined; // &signer
export type UpdateCommissionPercentagePayloadBCSArguments = {
  contract_address: AccountAddress;
  new_commission_percentage: U64;
};

export class UpdateCommissionPercentage extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "update_commission_percentage";
  public readonly args: UpdateCommissionPercentagePayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput, // address
    new_commission_percentage: Uint64 // u64
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
      new_commission_percentage: new U64(new_commission_percentage),
    };
  }
}

// let admin: AccountAuthenticator | undefined; // &signer
export type UpdateOperatorPayloadBCSArguments = {
  contract_address: AccountAddress;
  new_operator: AccountAddress;
  commission_percentage: U64;
};

export class UpdateOperator extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "update_operator";
  public readonly args: UpdateOperatorPayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput, // address
    new_operator: AccountAddressInput, // address
    commission_percentage: Uint64 // u64
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
      new_operator: AccountAddress.fromRelaxed(new_operator),
      commission_percentage: new U64(commission_percentage),
    };
  }
}

// let admin: AccountAuthenticator | undefined; // &signer
export type UpdateOperatorWithSameCommissionPayloadBCSArguments = {
  contract_address: AccountAddress;
  new_operator: AccountAddress;
};

export class UpdateOperatorWithSameCommission extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "update_operator_with_same_commission";
  public readonly args: UpdateOperatorWithSameCommissionPayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput, // address
    new_operator: AccountAddressInput // address
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
      new_operator: AccountAddress.fromRelaxed(new_operator),
    };
  }
}

// let admin: AccountAuthenticator | undefined; // &signer
export type UpdateVoterPayloadBCSArguments = {
  contract_address: AccountAddress;
  new_voter: AccountAddress;
};

export class UpdateVoter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "update_voter";
  public readonly args: UpdateVoterPayloadBCSArguments;

  constructor(
    contract_address: AccountAddressInput, // address
    new_voter: AccountAddressInput // address
  ) {
    super();
    this.args = {
      contract_address: AccountAddress.fromRelaxed(contract_address),
      new_voter: AccountAddress.fromRelaxed(new_voter),
    };
  }
}

export type VestPayloadBCSArguments = {
  arg_0: AccountAddress;
};

export class Vest extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "vest";
  public readonly args: VestPayloadBCSArguments;

  constructor(
    arg_0: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_0: AccountAddress.fromRelaxed(arg_0),
    };
  }
}

export type VestManyPayloadBCSArguments = {
  contract_addresses: MoveVector<AccountAddress>;
};

export class VestMany extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "vesting";
  public readonly functionName = "vest_many";
  public readonly args: VestManyPayloadBCSArguments;

  constructor(
    contract_addresses: Array<AccountAddressInput> // vector<address>
  ) {
    super();
    this.args = {
      contract_addresses: new MoveVector(
        contract_addresses.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
    };
  }
}


}