
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0


/* eslint-disable max-len */
import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, Account, InputTypes, AccountAddressInput, Hex, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256, parseTypeTag } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject, ObjectAddress, TypeTagInput } from "../../src/abi/types";
import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilders";



export namespace Vesting {
  export namespace EntryFunctions {
    export type AdminWithdrawPayloadMoveArguments = {
      contract_address: AccountAddress;
    };

    /**
     *  public fun admin_withdraw<>(
     *     admin: &signer,
     *     contract_address: address,
     *   )
     **/
    export class AdminWithdraw extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "admin_withdraw";
      public readonly args: AdminWithdrawPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
        };
      }
    }
    export type DistributePayloadMoveArguments = {
      arg_0: AccountAddress;
    };

    /**
     *  public fun distribute<>(
     *     arg_0: address,
     *   )
     **/
    export class Distribute extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "distribute";
      public readonly args: DistributePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
        };
      }
    }
    export type DistributeManyPayloadMoveArguments = {
      contract_addresses: MoveVector<AccountAddress>;
    };

    /**
     *  public fun distribute_many<>(
     *     contract_addresses: vector<address>,
     *   )
     **/
    export class DistributeMany extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "distribute_many";
      public readonly args: DistributeManyPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        contract_addresses: Array<AccountAddressInput>, // vector<address>
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_addresses: new MoveVector(
            contract_addresses.map((argA) => AccountAddress.fromRelaxed(argA))
          ),
        };
      }
    }
    export type ResetBeneficiaryPayloadMoveArguments = {
      contract_address: AccountAddress;
      shareholder: AccountAddress;
    };

    /**
     *  public fun reset_beneficiary<>(
     *     account: &signer,
     *     contract_address: address,
     *     shareholder: address,
     *   )
     **/
    export class ResetBeneficiary extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "reset_beneficiary";
      public readonly args: ResetBeneficiaryPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        account: Account, // &signer
        contract_address: AccountAddressInput, // address
        shareholder: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
          shareholder: AccountAddress.fromRelaxed(shareholder),
        };
      }
    }
    export type ResetLockupPayloadMoveArguments = {
      contract_address: AccountAddress;
    };

    /**
     *  public fun reset_lockup<>(
     *     admin: &signer,
     *     contract_address: address,
     *   )
     **/
    export class ResetLockup extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "reset_lockup";
      public readonly args: ResetLockupPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
        };
      }
    }
    export type SetBeneficiaryPayloadMoveArguments = {
      contract_address: AccountAddress;
      shareholder: AccountAddress;
      new_beneficiary: AccountAddress;
    };

    /**
     *  public fun set_beneficiary<>(
     *     admin: &signer,
     *     contract_address: address,
     *     shareholder: address,
     *     new_beneficiary: address,
     *   )
     **/
    export class SetBeneficiary extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "set_beneficiary";
      public readonly args: SetBeneficiaryPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        shareholder: AccountAddressInput, // address
        new_beneficiary: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
          shareholder: AccountAddress.fromRelaxed(shareholder),
          new_beneficiary: AccountAddress.fromRelaxed(new_beneficiary),
        };
      }
    }
    export type SetBeneficiaryForOperatorPayloadMoveArguments = {
      new_beneficiary: AccountAddress;
    };

    /**
     *  public fun set_beneficiary_for_operator<>(
     *     operator: &signer,
     *     new_beneficiary: address,
     *   )
     **/
    export class SetBeneficiaryForOperator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "set_beneficiary_for_operator";
      public readonly args: SetBeneficiaryForOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        operator: Account, // &signer
        new_beneficiary: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          new_beneficiary: AccountAddress.fromRelaxed(new_beneficiary),
        };
      }
    }
    export type SetBeneficiaryResetterPayloadMoveArguments = {
      contract_address: AccountAddress;
      beneficiary_resetter: AccountAddress;
    };

    /**
     *  public fun set_beneficiary_resetter<>(
     *     admin: &signer,
     *     contract_address: address,
     *     beneficiary_resetter: address,
     *   )
     **/
    export class SetBeneficiaryResetter extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "set_beneficiary_resetter";
      public readonly args: SetBeneficiaryResetterPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        beneficiary_resetter: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
          beneficiary_resetter:
            AccountAddress.fromRelaxed(beneficiary_resetter),
        };
      }
    }
    export type SetManagementRolePayloadMoveArguments = {
      contract_address: AccountAddress;
      role: MoveString;
      role_holder: AccountAddress;
    };

    /**
     *  public fun set_management_role<>(
     *     admin: &signer,
     *     contract_address: address,
     *     role: String,
     *     role_holder: address,
     *   )
     **/
    export class SetManagementRole extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "set_management_role";
      public readonly args: SetManagementRolePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        role: string, // String
        role_holder: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
          role: new MoveString(role),
          role_holder: AccountAddress.fromRelaxed(role_holder),
        };
      }
    }
    export type TerminateVestingContractPayloadMoveArguments = {
      contract_address: AccountAddress;
    };

    /**
     *  public fun terminate_vesting_contract<>(
     *     admin: &signer,
     *     contract_address: address,
     *   )
     **/
    export class TerminateVestingContract extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "terminate_vesting_contract";
      public readonly args: TerminateVestingContractPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
        };
      }
    }
    export type UnlockRewardsPayloadMoveArguments = {
      arg_0: AccountAddress;
    };

    /**
     *  public fun unlock_rewards<>(
     *     arg_0: address,
     *   )
     **/
    export class UnlockRewards extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "unlock_rewards";
      public readonly args: UnlockRewardsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
        };
      }
    }
    export type UnlockRewardsManyPayloadMoveArguments = {
      contract_addresses: MoveVector<AccountAddress>;
    };

    /**
     *  public fun unlock_rewards_many<>(
     *     contract_addresses: vector<address>,
     *   )
     **/
    export class UnlockRewardsMany extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "unlock_rewards_many";
      public readonly args: UnlockRewardsManyPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        contract_addresses: Array<AccountAddressInput>, // vector<address>
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_addresses: new MoveVector(
            contract_addresses.map((argA) => AccountAddress.fromRelaxed(argA))
          ),
        };
      }
    }
    export type UpdateCommissionPercentagePayloadMoveArguments = {
      contract_address: AccountAddress;
      new_commission_percentage: U64;
    };

    /**
     *  public fun update_commission_percentage<>(
     *     admin: &signer,
     *     contract_address: address,
     *     new_commission_percentage: u64,
     *   )
     **/
    export class UpdateCommissionPercentage extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "update_commission_percentage";
      public readonly args: UpdateCommissionPercentagePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        new_commission_percentage: Uint64, // u64
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
          new_commission_percentage: new U64(new_commission_percentage),
        };
      }
    }
    export type UpdateOperatorPayloadMoveArguments = {
      contract_address: AccountAddress;
      new_operator: AccountAddress;
      commission_percentage: U64;
    };

    /**
     *  public fun update_operator<>(
     *     admin: &signer,
     *     contract_address: address,
     *     new_operator: address,
     *     commission_percentage: u64,
     *   )
     **/
    export class UpdateOperator extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "update_operator";
      public readonly args: UpdateOperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        new_operator: AccountAddressInput, // address
        commission_percentage: Uint64, // u64
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
          new_operator: AccountAddress.fromRelaxed(new_operator),
          commission_percentage: new U64(commission_percentage),
        };
      }
    }
    export type UpdateOperatorWithSameCommissionPayloadMoveArguments = {
      contract_address: AccountAddress;
      new_operator: AccountAddress;
    };

    /**
     *  public fun update_operator_with_same_commission<>(
     *     admin: &signer,
     *     contract_address: address,
     *     new_operator: address,
     *   )
     **/
    export class UpdateOperatorWithSameCommission extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "update_operator_with_same_commission";
      public readonly args: UpdateOperatorWithSameCommissionPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        new_operator: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
          new_operator: AccountAddress.fromRelaxed(new_operator),
        };
      }
    }
    export type UpdateVoterPayloadMoveArguments = {
      contract_address: AccountAddress;
      new_voter: AccountAddress;
    };

    /**
     *  public fun update_voter<>(
     *     admin: &signer,
     *     contract_address: address,
     *     new_voter: address,
     *   )
     **/
    export class UpdateVoter extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "update_voter";
      public readonly args: UpdateVoterPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: Account, // &signer
        contract_address: AccountAddressInput, // address
        new_voter: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          contract_address: AccountAddress.fromRelaxed(contract_address),
          new_voter: AccountAddress.fromRelaxed(new_voter),
        };
      }
    }
    export type VestPayloadMoveArguments = {
      arg_0: AccountAddress;
    };

    /**
     *  public fun vest<>(
     *     arg_0: address,
     *   )
     **/
    export class Vest extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "vest";
      public readonly args: VestPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        feePayer?: Account // optional fee payer account to sponsor the transaction
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
        };
      }
    }
    export type VestManyPayloadMoveArguments = {
      contract_addresses: MoveVector<AccountAddress>;
    };

    /**
     *  public fun vest_many<>(
     *     contract_addresses: vector<address>,
     *   )
     **/
    export class VestMany extends EntryFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "vest_many";
      public readonly args: VestManyPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        contract_addresses: Array<AccountAddressInput>, // vector<address>
        feePayer?: Account // optional fee payer account to sponsor the transaction
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
  export namespace ViewFunctions {
    export type BeneficiaryPayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
      shareholder: AccountAddressInput;
    };

    /**
     *  public fun beneficiary<>(
     *     vesting_contract_address: address,
     *     shareholder: address,
     *   )
     **/
    export class Beneficiary extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "beneficiary";
      public readonly args: BeneficiaryPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput, // address
        shareholder: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
          shareholder: AccountAddress.fromRelaxed(shareholder),
        };
      }
    }
    export type OperatorPayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun operator<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class Operator extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "operator";
      public readonly args: OperatorPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
    export type OperatorCommissionPercentagePayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun operator_commission_percentage<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class OperatorCommissionPercentage extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "operator_commission_percentage";
      public readonly args: OperatorCommissionPercentagePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
    export type PeriodDurationSecsPayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun period_duration_secs<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class PeriodDurationSecs extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "period_duration_secs";
      public readonly args: PeriodDurationSecsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
    export type RemainingGrantPayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun remaining_grant<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class RemainingGrant extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "remaining_grant";
      public readonly args: RemainingGrantPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
    export type ShareholderPayloadMoveArguments = {
      arg_0: AccountAddressInput;
      arg_1: AccountAddressInput;
    };

    /**
     *  public fun shareholder<>(
     *     arg_0: address,
     *     arg_1: address,
     *   )
     **/
    export class Shareholder extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "shareholder";
      public readonly args: ShareholderPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        arg_0: AccountAddressInput, // address
        arg_1: AccountAddressInput // address
      ) {
        super();
        this.args = {
          arg_0: AccountAddress.fromRelaxed(arg_0),
          arg_1: AccountAddress.fromRelaxed(arg_1),
        };
      }
    }
    export type ShareholdersPayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun shareholders<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class Shareholders extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "shareholders";
      public readonly args: ShareholdersPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
    export type StakePoolAddressPayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun stake_pool_address<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class StakePoolAddress extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "stake_pool_address";
      public readonly args: StakePoolAddressPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
    export type TotalAccumulatedRewardsPayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun total_accumulated_rewards<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class TotalAccumulatedRewards extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "total_accumulated_rewards";
      public readonly args: TotalAccumulatedRewardsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
    export type VestingContractsPayloadMoveArguments = {
      admin: AccountAddressInput;
    };

    /**
     *  public fun vesting_contracts<>(
     *     admin: address,
     *   )
     **/
    export class VestingContracts extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "vesting_contracts";
      public readonly args: VestingContractsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        admin: AccountAddressInput // address
      ) {
        super();
        this.args = {
          admin: AccountAddress.fromRelaxed(admin),
        };
      }
    }
    export type VestingSchedulePayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun vesting_schedule<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class VestingSchedule extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "vesting_schedule";
      public readonly args: VestingSchedulePayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
    export type VestingStartSecsPayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun vesting_start_secs<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class VestingStartSecs extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "vesting_start_secs";
      public readonly args: VestingStartSecsPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
    export type VoterPayloadMoveArguments = {
      vesting_contract_address: AccountAddressInput;
    };

    /**
     *  public fun voter<>(
     *     vesting_contract_address: address,
     *   )
     **/
    export class Voter extends ViewFunctionPayloadBuilder {
      public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
      public readonly moduleName = "vesting";
      public readonly functionName = "voter";
      public readonly args: VoterPayloadMoveArguments;
      public readonly typeArgs: Array<TypeTag> = []; //

      constructor(
        vesting_contract_address: AccountAddressInput // address
      ) {
        super();
        this.args = {
          vesting_contract_address: AccountAddress.fromRelaxed(
            vesting_contract_address
          ),
        };
      }
    }
  }
}
