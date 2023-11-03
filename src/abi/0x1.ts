// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-classes-per-file */
import { MoveString, MoveVector, U64, U8 } from "..";
import { Bool } from "../bcs";
import { EntryFunctionPayloadBuilder } from "../bcs/serializable/tx-builder/payloadBuilder";
import { AccountAddress, AccountAddressInput } from "../core";
import { HexInput, Uint64 } from "../types";
import { addressBytes } from "./utils";

export namespace Code {
  export type PublishPackageTxnBCSTypes = {
    owner: MoveVector<U8>;
    metadata_serialized: MoveVector<MoveVector<U8>>;
  };

  export class PublishPackageTxn extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "code";
    public readonly functionName = "publish_package_txn";
    public readonly args: PublishPackageTxnBCSTypes;

    constructor(
      owner: HexInput, // vector<u8>
      metadata_serialized: Array<HexInput>, // vector<vector<u8>>
    ) {
      super();
      this.args = {
        owner: MoveVector.U8(owner),
        metadata_serialized: new MoveVector(metadata_serialized.map((argA) => MoveVector.U8(argA))),
      };
    }
  }
}

export namespace Coin {
  export type TransferBCSTypes = {
    from: AccountAddress;
    to: U64;
  };

  export class Transfer extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "coin";
    public readonly functionName = "transfer";
    public readonly args: TransferBCSTypes;

    constructor(
      from: AccountAddressInput, // address
      to: Uint64, // u64
    ) {
      super();
      this.args = {
        from: new AccountAddress(addressBytes(from)),
        to: new U64(to),
      };
    }
  }

  export class UpgradeSupply extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "coin";
    public readonly functionName = "upgrade_supply";
    public readonly args = {};

    constructor() {
      this.args = {};
    }
  }
}

export namespace Stake {
  export type AddStakeBCSTypes = {
    arg_0: U64;
  };

  export class AddStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "add_stake";
    public readonly args: AddStakeBCSTypes;

    constructor(
      arg_0: Uint64, // u64
    ) {
      super();
      this.args = {
        arg_0: new U64(arg_0),
      };
    }
  }

  export class IncreaseLockup extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "increase_lockup";
    public readonly args = {};

    constructor() {
      this.args = {};
    }
  }
  export type InitializeStakeOwnerBCSTypes = {
    owner: U64;
    initial_stake_amount: AccountAddress;
    operator: AccountAddress;
  };

  export class InitializeStakeOwner extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "initialize_stake_owner";
    public readonly args: InitializeStakeOwnerBCSTypes;

    constructor(
      owner: Uint64, // u64
      initial_stake_amount: AccountAddressInput, // address
      operator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        owner: new U64(owner),
        initial_stake_amount: new AccountAddress(addressBytes(initial_stake_amount)),
        operator: new AccountAddress(addressBytes(operator)),
      };
    }
  }
  export type InitializeValidatorBCSTypes = {
    account: MoveVector<U8>;
    consensus_pubkey: MoveVector<U8>;
    proof_of_possession: MoveVector<U8>;
    network_addresses: MoveVector<U8>;
  };

  export class InitializeValidator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "initialize_validator";
    public readonly args: InitializeValidatorBCSTypes;

    constructor(
      account: HexInput, // vector<u8>
      consensus_pubkey: HexInput, // vector<u8>
      proof_of_possession: HexInput, // vector<u8>
      network_addresses: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        account: MoveVector.U8(account),
        consensus_pubkey: MoveVector.U8(consensus_pubkey),
        proof_of_possession: MoveVector.U8(proof_of_possession),
        network_addresses: MoveVector.U8(network_addresses),
      };
    }
  }
  export type JoinValidatorSetBCSTypes = {
    arg_0: AccountAddress;
  };

  export class JoinValidatorSet extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "join_validator_set";
    public readonly args: JoinValidatorSetBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type LeaveValidatorSetBCSTypes = {
    operator: AccountAddress;
  };

  export class LeaveValidatorSet extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "leave_validator_set";
    public readonly args: LeaveValidatorSetBCSTypes;

    constructor(
      operator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        operator: new AccountAddress(addressBytes(operator)),
      };
    }
  }
  export type ReactivateStakeBCSTypes = {
    owner: U64;
  };

  export class ReactivateStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "reactivate_stake";
    public readonly args: ReactivateStakeBCSTypes;

    constructor(
      owner: Uint64, // u64
    ) {
      super();
      this.args = {
        owner: new U64(owner),
      };
    }
  }
  export type RotateConsensusKeyBCSTypes = {
    operator: AccountAddress;
    pool_address: MoveVector<U8>;
    new_consensus_pubkey: MoveVector<U8>;
  };

  export class RotateConsensusKey extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "rotate_consensus_key";
    public readonly args: RotateConsensusKeyBCSTypes;

    constructor(
      operator: AccountAddressInput, // address
      pool_address: HexInput, // vector<u8>
      new_consensus_pubkey: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        operator: new AccountAddress(addressBytes(operator)),
        pool_address: MoveVector.U8(pool_address),
        new_consensus_pubkey: MoveVector.U8(new_consensus_pubkey),
      };
    }
  }
  export type SetDelegatedVoterBCSTypes = {
    arg_0: AccountAddress;
  };

  export class SetDelegatedVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "set_delegated_voter";
    public readonly args: SetDelegatedVoterBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type SetOperatorBCSTypes = {
    arg_0: AccountAddress;
  };

  export class SetOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "set_operator";
    public readonly args: SetOperatorBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type UnlockBCSTypes = {
    owner: U64;
  };

  export class Unlock extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "unlock";
    public readonly args: UnlockBCSTypes;

    constructor(
      owner: Uint64, // u64
    ) {
      super();
      this.args = {
        owner: new U64(owner),
      };
    }
  }
  export type UpdateNetworkAndFullnodeAddressesBCSTypes = {
    operator: AccountAddress;
    pool_address: MoveVector<U8>;
    new_network_addresses: MoveVector<U8>;
  };

  export class UpdateNetworkAndFullnodeAddresses extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "update_network_and_fullnode_addresses";
    public readonly args: UpdateNetworkAndFullnodeAddressesBCSTypes;

    constructor(
      operator: AccountAddressInput, // address
      pool_address: HexInput, // vector<u8>
      new_network_addresses: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        operator: new AccountAddress(addressBytes(operator)),
        pool_address: MoveVector.U8(pool_address),
        new_network_addresses: MoveVector.U8(new_network_addresses),
      };
    }
  }
  export type WithdrawBCSTypes = {
    arg_0: U64;
  };

  export class Withdraw extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "stake";
    public readonly functionName = "withdraw";
    public readonly args: WithdrawBCSTypes;

    constructor(
      arg_0: Uint64, // u64
    ) {
      super();
      this.args = {
        arg_0: new U64(arg_0),
      };
    }
  }
}

export namespace Object$1 {
  export type TransferCallBCSTypes = {
    owner: AccountAddress;
    object: AccountAddress;
  };

  export class TransferCall extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "object";
    public readonly functionName = "transfer_call";
    public readonly args: TransferCallBCSTypes;

    constructor(
      owner: AccountAddressInput, // address
      object: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        owner: new AccountAddress(addressBytes(owner)),
        object: new AccountAddress(addressBytes(object)),
      };
    }
  }
}

export namespace Account {
  export type OfferRotationCapabilityBCSTypes = {
    account: MoveVector<U8>;
    rotation_capability_sig_bytes: U8;
    account_scheme: MoveVector<U8>;
    account_public_key_bytes: AccountAddress;
  };

  export class OfferRotationCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "offer_rotation_capability";
    public readonly args: OfferRotationCapabilityBCSTypes;

    constructor(
      account: HexInput, // vector<u8>
      rotation_capability_sig_bytes: Uint8, // u8
      account_scheme: HexInput, // vector<u8>
      account_public_key_bytes: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        account: MoveVector.U8(account),
        rotation_capability_sig_bytes: new U8(rotation_capability_sig_bytes),
        account_scheme: MoveVector.U8(account_scheme),
        account_public_key_bytes: new AccountAddress(addressBytes(account_public_key_bytes)),
      };
    }
  }
  export type OfferSignerCapabilityBCSTypes = {
    account: MoveVector<U8>;
    signer_capability_sig_bytes: U8;
    account_scheme: MoveVector<U8>;
    account_public_key_bytes: AccountAddress;
  };

  export class OfferSignerCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "offer_signer_capability";
    public readonly args: OfferSignerCapabilityBCSTypes;

    constructor(
      account: HexInput, // vector<u8>
      signer_capability_sig_bytes: Uint8, // u8
      account_scheme: HexInput, // vector<u8>
      account_public_key_bytes: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        account: MoveVector.U8(account),
        signer_capability_sig_bytes: new U8(signer_capability_sig_bytes),
        account_scheme: MoveVector.U8(account_scheme),
        account_public_key_bytes: new AccountAddress(addressBytes(account_public_key_bytes)),
      };
    }
  }

  export class RevokeAnyRotationCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "revoke_any_rotation_capability";
    public readonly args = {};

    constructor() {
      this.args = {};
    }
  }

  export class RevokeAnySignerCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "revoke_any_signer_capability";
    public readonly args = {};

    constructor() {
      this.args = {};
    }
  }
  export type RevokeRotationCapabilityBCSTypes = {
    account: AccountAddress;
  };

  export class RevokeRotationCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "revoke_rotation_capability";
    public readonly args: RevokeRotationCapabilityBCSTypes;

    constructor(
      account: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        account: new AccountAddress(addressBytes(account)),
      };
    }
  }
  export type RevokeSignerCapabilityBCSTypes = {
    account: AccountAddress;
  };

  export class RevokeSignerCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "revoke_signer_capability";
    public readonly args: RevokeSignerCapabilityBCSTypes;

    constructor(
      account: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        account: new AccountAddress(addressBytes(account)),
      };
    }
  }
  export type RotateAuthenticationKeyBCSTypes = {
    account: U8;
    from_scheme: MoveVector<U8>;
    from_public_key_bytes: U8;
    to_scheme: MoveVector<U8>;
    to_public_key_bytes: MoveVector<U8>;
    cap_rotate_key: MoveVector<U8>;
  };

  export class RotateAuthenticationKey extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "rotate_authentication_key";
    public readonly args: RotateAuthenticationKeyBCSTypes;

    constructor(
      account: Uint8, // u8
      from_scheme: HexInput, // vector<u8>
      from_public_key_bytes: Uint8, // u8
      to_scheme: HexInput, // vector<u8>
      to_public_key_bytes: HexInput, // vector<u8>
      cap_rotate_key: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        account: new U8(account),
        from_scheme: MoveVector.U8(from_scheme),
        from_public_key_bytes: new U8(from_public_key_bytes),
        to_scheme: MoveVector.U8(to_scheme),
        to_public_key_bytes: MoveVector.U8(to_public_key_bytes),
        cap_rotate_key: MoveVector.U8(cap_rotate_key),
      };
    }
  }
  export type RotateAuthenticationKeyWithRotationCapabilityBCSTypes = {
    delegate_signer: AccountAddress;
    rotation_cap_offerer_address: U8;
    new_scheme: MoveVector<U8>;
    new_public_key_bytes: MoveVector<U8>;
  };

  export class RotateAuthenticationKeyWithRotationCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "account";
    public readonly functionName = "rotate_authentication_key_with_rotation_capability";
    public readonly args: RotateAuthenticationKeyWithRotationCapabilityBCSTypes;

    constructor(
      delegate_signer: AccountAddressInput, // address
      rotation_cap_offerer_address: Uint8, // u8
      new_scheme: HexInput, // vector<u8>
      new_public_key_bytes: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        delegate_signer: new AccountAddress(addressBytes(delegate_signer)),
        rotation_cap_offerer_address: new U8(rotation_cap_offerer_address),
        new_scheme: MoveVector.U8(new_scheme),
        new_public_key_bytes: MoveVector.U8(new_public_key_bytes),
      };
    }
  }
}

export namespace Version {
  export type SetVersionBCSTypes = {
    account: U64;
  };

  export class SetVersion extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "version";
    public readonly functionName = "set_version";
    public readonly args: SetVersionBCSTypes;

    constructor(
      account: Uint64, // u64
    ) {
      super();
      this.args = {
        account: new U64(account),
      };
    }
  }
}

export namespace Vesting {
  export type AdminWithdrawBCSTypes = {
    admin: AccountAddress;
  };

  export class AdminWithdraw extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "admin_withdraw";
    public readonly args: AdminWithdrawBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
      };
    }
  }
  export type DistributeBCSTypes = {
    arg_0: AccountAddress;
  };

  export class Distribute extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "distribute";
    public readonly args: DistributeBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type DistributeManyBCSTypes = {
    contract_addresses: MoveVector<AccountAddress>;
  };

  export class DistributeMany extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "distribute_many";
    public readonly args: DistributeManyBCSTypes;

    constructor(
      contract_addresses: Array<AccountAddressInput>, // vector<address>
    ) {
      super();
      this.args = {
        contract_addresses: new MoveVector(contract_addresses.map((argA) => new AccountAddress(addressBytes(argA)))),
      };
    }
  }
  export type ResetBeneficiaryBCSTypes = {
    account: AccountAddress;
    contract_address: AccountAddress;
  };

  export class ResetBeneficiary extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "reset_beneficiary";
    public readonly args: ResetBeneficiaryBCSTypes;

    constructor(
      account: AccountAddressInput, // address
      contract_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        account: new AccountAddress(addressBytes(account)),
        contract_address: new AccountAddress(addressBytes(contract_address)),
      };
    }
  }
  export type ResetLockupBCSTypes = {
    admin: AccountAddress;
  };

  export class ResetLockup extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "reset_lockup";
    public readonly args: ResetLockupBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
      };
    }
  }
  export type SetBeneficiaryBCSTypes = {
    admin: AccountAddress;
    contract_address: AccountAddress;
    shareholder: AccountAddress;
  };

  export class SetBeneficiary extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "set_beneficiary";
    public readonly args: SetBeneficiaryBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
      contract_address: AccountAddressInput, // address
      shareholder: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
        contract_address: new AccountAddress(addressBytes(contract_address)),
        shareholder: new AccountAddress(addressBytes(shareholder)),
      };
    }
  }
  export type SetBeneficiaryResetterBCSTypes = {
    admin: AccountAddress;
    contract_address: AccountAddress;
  };

  export class SetBeneficiaryResetter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "set_beneficiary_resetter";
    public readonly args: SetBeneficiaryResetterBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
      contract_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
        contract_address: new AccountAddress(addressBytes(contract_address)),
      };
    }
  }
  export type SetManagementRoleBCSTypes = {
    admin: AccountAddress;
    contract_address: MoveString;
    role: AccountAddress;
  };

  export class SetManagementRole extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "set_management_role";
    public readonly args: SetManagementRoleBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
      contract_address: string, // 0x1::string::String
      role: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
        contract_address: new MoveString(contract_address),
        role: new AccountAddress(addressBytes(role)),
      };
    }
  }
  export type TerminateVestingContractBCSTypes = {
    admin: AccountAddress;
  };

  export class TerminateVestingContract extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "terminate_vesting_contract";
    public readonly args: TerminateVestingContractBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
      };
    }
  }
  export type UnlockRewardsBCSTypes = {
    arg_0: AccountAddress;
  };

  export class UnlockRewards extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "unlock_rewards";
    public readonly args: UnlockRewardsBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type UnlockRewardsManyBCSTypes = {
    contract_addresses: MoveVector<AccountAddress>;
  };

  export class UnlockRewardsMany extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "unlock_rewards_many";
    public readonly args: UnlockRewardsManyBCSTypes;

    constructor(
      contract_addresses: Array<AccountAddressInput>, // vector<address>
    ) {
      super();
      this.args = {
        contract_addresses: new MoveVector(contract_addresses.map((argA) => new AccountAddress(addressBytes(argA)))),
      };
    }
  }
  export type UpdateCommissionPercentageBCSTypes = {
    admin: AccountAddress;
    contract_address: U64;
  };

  export class UpdateCommissionPercentage extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "update_commission_percentage";
    public readonly args: UpdateCommissionPercentageBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
      contract_address: Uint64, // u64
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
        contract_address: new U64(contract_address),
      };
    }
  }
  export type UpdateOperatorBCSTypes = {
    admin: AccountAddress;
    contract_address: AccountAddress;
    new_operator: U64;
  };

  export class UpdateOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "update_operator";
    public readonly args: UpdateOperatorBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
      contract_address: AccountAddressInput, // address
      new_operator: Uint64, // u64
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
        contract_address: new AccountAddress(addressBytes(contract_address)),
        new_operator: new U64(new_operator),
      };
    }
  }
  export type UpdateOperatorWithSameCommissionBCSTypes = {
    admin: AccountAddress;
    contract_address: AccountAddress;
  };

  export class UpdateOperatorWithSameCommission extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "update_operator_with_same_commission";
    public readonly args: UpdateOperatorWithSameCommissionBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
      contract_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
        contract_address: new AccountAddress(addressBytes(contract_address)),
      };
    }
  }
  export type UpdateVoterBCSTypes = {
    admin: AccountAddress;
    contract_address: AccountAddress;
  };

  export class UpdateVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "update_voter";
    public readonly args: UpdateVoterBCSTypes;

    constructor(
      admin: AccountAddressInput, // address
      contract_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        admin: new AccountAddress(addressBytes(admin)),
        contract_address: new AccountAddress(addressBytes(contract_address)),
      };
    }
  }
  export type VestBCSTypes = {
    arg_0: AccountAddress;
  };

  export class Vest extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "vest";
    public readonly args: VestBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type VestManyBCSTypes = {
    contract_addresses: MoveVector<AccountAddress>;
  };

  export class VestMany extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "vesting";
    public readonly functionName = "vest_many";
    stManyBCSTypes;
    readonly args: Ve;

    constructor(
      contract_addresses: Array<AccountAddressInput>, // vector<address>
    ) {
      super();
      this.args = {
        contract_addresses: new MoveVector(contract_addresses.map((argA) => new AccountAddress(addressBytes(argA)))),
      };
    }
  }
}

export namespace AptosCoin {
  export class ClaimMintCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_coin";
    public readonly functionName = "claim_mint_capability";
    public readonly args = {};

    constructor() {
      this.args = {};
    }
  }
  export type DelegateMintCapabilityBCSTypes = {
    account: AccountAddress;
  };

  export class DelegateMintCapability extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_coin";
    public readonly functionName = "delegate_mint_capability";
    public readonly args: DelegateMintCapabilityBCSTypes;

    constructor(
      account: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        account: new AccountAddress(addressBytes(account)),
      };
    }
  }
  export type MintBCSTypes = {
    arg_0: AccountAddress;
    arg_1: U64;
  };

  export class Mint extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_coin";
    public readonly functionName = "mint";
    public readonly args: MintBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: Uint64, // u64
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: new U64(arg_1),
      };
    }
  }
}

export namespace ManagedCoin {
  export type BurnBCSTypes = {
    account: U64;
  };

  export class Burn extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "managed_coin";
    public readonly functionName = "burn";
    public readonly args: BurnBCSTypes;

    constructor(
      account: Uint64, // u64
    ) {
      super();
      this.args = {
        account: new U64(account),
      };
    }
  }
  export type InitializeBCSTypes = {
    account: MoveVector<U8>;
    name: MoveVector<U8>;
    symbol: U8;
    decimals: Bool;
  };

  export class Initialize extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "managed_coin";
    public readonly functionName = "initialize";
    public readonly args: InitializeBCSTypes;

    constructor(
      account: HexInput, // vector<u8>
      name: HexInput, // vector<u8>
      symbol: Uint8, // u8
      decimals: boolean, // bool
    ) {
      super();
      this.args = {
        account: MoveVector.U8(account),
        name: MoveVector.U8(name),
        symbol: new U8(symbol),
        decimals: new Bool(decimals),
      };
    }
  }
  export type MintBCSTypes = {
    account: AccountAddress;
    dst_addr: U64;
  };

  export class Mint extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "managed_coin";
    public readonly functionName = "mint";
    public readonly args: MintBCSTypes;

    constructor(
      account: AccountAddressInput, // address
      dst_addr: Uint64, // u64
    ) {
      super();
      this.args = {
        account: new AccountAddress(addressBytes(account)),
        dst_addr: new U64(dst_addr),
      };
    }
  }

  export class Register extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "managed_coin";
    public readonly functionName = "register";
    public readonly args = {};

    constructor() {
      this.args = {};
    }
  }
}

export namespace AptosAccount {
  export type BatchTransferBCSTypes = {
    source: MoveVector<AccountAddress>;
    recipients: MoveVector<U64>;
  };

  export class BatchTransfer extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "batch_transfer";
    public readonly args: BatchTransferBCSTypes;

    constructor(
      source: Array<AccountAddressInput>, // vector<address>
      recipients: Array<Uint64>, // vector<u64>
    ) {
      super();
      this.args = {
        source: new MoveVector(source.map((argA) => new AccountAddress(addressBytes(argA)))),
        recipients: new MoveVector(recipients.map((argA) => new U64(argA))),
      };
    }
  }
  export type BatchTransferCoinsBCSTypes = {
    from: MoveVector<AccountAddress>;
    recipients: MoveVector<U64>;
  };

  export class BatchTransferCoins extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "batch_transfer_coins";
    public readonly args: BatchTransferCoinsBCSTypes;

    constructor(
      from: Array<AccountAddressInput>, // vector<address>
      recipients: Array<Uint64>, // vector<u64>
    ) {
      super();
      this.args = {
        from: new MoveVector(from.map((argA) => new AccountAddress(addressBytes(argA)))),
        recipients: new MoveVector(recipients.map((argA) => new U64(argA))),
      };
    }
  }
  export type CreateAccountBCSTypes = {
    auth_key: AccountAddress;
  };

  export class CreateAccount extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "create_account";
    public readonly args: CreateAccountBCSTypes;

    constructor(
      auth_key: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        auth_key: new AccountAddress(addressBytes(auth_key)),
      };
    }
  }
  export type SetAllowDirectCoinTransfersBCSTypes = {
    account: Bool;
  };

  export class SetAllowDirectCoinTransfers extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "set_allow_direct_coin_transfers";
    public readonly args: SetAllowDirectCoinTransfersBCSTypes;

    constructor(
      account: boolean, // bool
    ) {
      super();
      this.args = {
        account: new Bool(account),
      };
    }
  }
  export type TransferBCSTypes = {
    source: AccountAddress;
    recipients: U64;
  };

  export class Transfer extends EntryFunctionPayloadBuilder {
    uleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "transfer";
    public readonly args: TransferBCSTypes;

    constructor(
      source: AccountAddressInput, // address
      recipients: Uint64, // u64
    ) {
      super();
      this.args = {
        source: new AccountAddress(addressBytes(source)),
        recipients: new U64(recipients),
      };
    }
  }
  export type TransferCoinsBCSTypes = {
    from: AccountAddress;
    recipients: U64;
  };

  export class TransferCoins extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_account";
    public readonly functionName = "transfer_coins";
    public readonly args: TransferCoinsBCSTypes;

    constructor(
      from: AccountAddressInput, // address
      recipients: Uint64, // u64
    ) {
      super();
      this.args = {
        from: new AccountAddress(addressBytes(from)),
        recipients: new U64(recipients),
      };
    }
  }
}

export namespace StakingProxy {
  export type SetOperatorBCSTypes = {
    owner: AccountAddress;
    old_operator: AccountAddress;
  };

  export class SetOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_proxy";
    public readonly functionName = "set_operator";
    public readonly args: SetOperatorBCSTypes;

    constructor(
      owner: AccountAddressInput, // address
      old_operator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        owner: new AccountAddress(addressBytes(owner)),
        old_operator: new AccountAddress(addressBytes(old_operator)),
      };
    }
  }
  export type SetStakePoolOperatorBCSTypes = {
    arg_0: AccountAddress;
  };

  export class SetStakePoolOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_proxy";
    public readonly functionName = "set_stake_pool_operator";
    public readonly args: SetStakePoolOperatorBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type SetStakePoolVoterBCSTypes = {
    arg_0: AccountAddress;
  };

  export class SetStakePoolVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_proxy";
    public readonly functionName = "set_stake_pool_voter";
    public readonly args: SetStakePoolVoterBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type SetStakingContractOperatorBCSTypes = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class SetStakingContractOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_proxy";
    public readonly functionName = "set_staking_contract_operator";
    public readonly args: SetStakingContractOperatorBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: new AccountAddress(addressBytes(arg_1)),
      };
    }
  }
  export type SetStakingContractVoterBCSTypes = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class SetStakingContractVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_proxy";
    public readonly functionName = "set_staking_contract_voter";
    public readonly args: SetStakingContractVoterBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: new AccountAddress(addressBytes(arg_1)),
      };
    }
  }
  export type SetVestingContractOperatorBCSTypes = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class SetVestingContractOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_proxy";
    public readonly functionName = "set_vesting_contract_operator";
    public readonly args: SetVestingContractOperatorBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: new AccountAddress(addressBytes(arg_1)),
      };
    }
  }
  export type SetVestingContractVoterBCSTypes = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class SetVestingContractVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_proxy";
    public readonly functionName = "set_vesting_contract_voter";
    public readonly args: SetVestingContractVoterBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: new AccountAddress(addressBytes(arg_1)),
      };
    }
  }
  export type SetVoterBCSTypes = {
    owner: AccountAddress;
    operator: AccountAddress;
  };

  export class SetVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_proxy";
    public readonly functionName = "set_voter";
    public readonly args: SetVoterBCSTypes;

    constructor(
      owner: AccountAddressInput, // address
      operator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        owner: new AccountAddress(addressBytes(owner)),
        operator: new AccountAddress(addressBytes(operator)),
      };
    }
  }
}

export namespace FungibleAsset {}

export namespace DelegationPool {
  export type AddStakeBCSTypes = {
    delegator: AccountAddress;
    pool_address: U64;
  };

  export class AddStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "add_stake";
    public readonly args: AddStakeBCSTypes;

    constructor(
      delegator: AccountAddressInput, // address
      pool_address: Uint64, // u64
    ) {
      super();
      this.args = {
        delegator: new AccountAddress(addressBytes(delegator)),
        pool_address: new U64(pool_address),
      };
    }
  }
  export type CreateProposalBCSTypes = {
    voter: AccountAddress;
    pool_address: MoveVector<U8>;
    execution_hash: MoveVector<U8>;
    metadata_location: MoveVector<U8>;
    metadata_hash: Bool;
  };

  export class CreateProposal extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "create_proposal";
    public readonly args: CreateProposalBCSTypes;

    constructor(
      voter: AccountAddressInput, // address
      pool_address: HexInput, // vector<u8>
      execution_hash: HexInput, // vector<u8>
      metadata_location: HexInput, // vector<u8>
      metadata_hash: boolean, // bool
    ) {
      super();
      this.args = {
        voter: new AccountAddress(addressBytes(voter)),
        pool_address: MoveVector.U8(pool_address),
        execution_hash: MoveVector.U8(execution_hash),
        metadata_location: MoveVector.U8(metadata_location),
        metadata_hash: new Bool(metadata_hash),
      };
    }
  }
  export type DelegateVotingPowerBCSTypes = {
    delegator: AccountAddress;
    pool_address: AccountAddress;
  };

  export class DelegateVotingPower extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "delegate_voting_power";
    public readonly args: DelegateVotingPowerBCSTypes;

    constructor(
      delegator: AccountAddressInput, // address
      pool_address: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        delegator: new AccountAddress(addressBytes(delegator)),
        pool_address: new AccountAddress(addressBytes(pool_address)),
      };
    }
  }
  export type EnablePartialGovernanceVotingBCSTypes = {
    arg_0: AccountAddress;
  };

  export class EnablePartialGovernanceVoting extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "enable_partial_governance_voting";
    public readonly args: EnablePartialGovernanceVotingBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type InitializeDelegationPoolBCSTypes = {
    owner: U64;
    operator_commission_percentage: MoveVector<U8>;
  };

  export class InitializeDelegationPool extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "initialize_delegation_pool";
    public readonly args: InitializeDelegationPoolBCSTypes;

    constructor(
      owner: Uint64, // u64
      operator_commission_percentage: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        owner: new U64(owner),
        operator_commission_percentage: MoveVector.U8(operator_commission_percentage),
      };
    }
  }
  export type ReactivateStakeBCSTypes = {
    delegator: AccountAddress;
    pool_address: U64;
  };

  export class ReactivateStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "reactivate_stake";
    public readonly args: ReactivateStakeBCSTypes;

    constructor(
      delegator: AccountAddressInput, // address
      pool_address: Uint64, // u64
    ) {
      super();
      this.args = {
        delegator: new AccountAddress(addressBytes(delegator)),
        pool_address: new U64(pool_address),
      };
    }
  }
  export type SetDelegatedVoterBCSTypes = {
    arg_0: AccountAddress;
  };

  export class SetDelegatedVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "set_delegated_voter";
    public readonly args: SetDelegatedVoterBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type SetOperatorBCSTypes = {
    owner: AccountAddress;
  };

  export class SetOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "set_operator";
    public readonly args: SetOperatorBCSTypes;

    constructor(
      owner: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        owner: new AccountAddress(addressBytes(owner)),
      };
    }
  }
  export type SynchronizeDelegationPoolBCSTypes = {
    arg_0: AccountAddress;
  };

  export class SynchronizeDelegationPool extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "synchronize_delegation_pool";
    public readonly args: SynchronizeDelegationPoolBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type UnlockBCSTypes = {
    delegator: AccountAddress;
    pool_address: U64;
  };

  export class Unlock extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "unlock";
    public readonly args: UnlockBCSTypes;

    constructor(
      delegator: AccountAddressInput, // address
      pool_address: Uint64, // u64
    ) {
      super();
      this.args = {
        delegator: new AccountAddress(addressBytes(delegator)),
        pool_address: new U64(pool_address),
      };
    }
  }
  export type VoteBCSTypes = {
    voter: AccountAddress;
    pool_address: U64;
    proposal_id: U64;
    voting_power: Bool;
  };

  export class Vote extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "vote";
    public readonly args: VoteBCSTypes;

    constructor(
      voter: AccountAddressInput, // address
      pool_address: Uint64, // u64
      proposal_id: Uint64, // u64
      voting_power: boolean, // bool
    ) {
      super();
      this.args = {
        voter: new AccountAddress(addressBytes(voter)),
        pool_address: new U64(pool_address),
        proposal_id: new U64(proposal_id),
        voting_power: new Bool(voting_power),
      };
    }
  }
  export type WithdrawBCSTypes = {
    delegator: AccountAddress;
    pool_address: U64;
  };

  export class Withdraw extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "delegation_pool";
    public readonly functionName = "withdraw";
    public readonly args: WithdrawBCSTypes;

    constructor(
      delegator: AccountAddressInput, // address
      pool_address: Uint64, // u64
    ) {
      super();
      this.args = {
        delegator: new AccountAddress(addressBytes(delegator)),
        pool_address: new U64(pool_address),
      };
    }
  }
}

export namespace AptosGovernance {
  export type AddApprovedScriptHashScriptBCSTypes = {
    proposal_id: U64;
  };

  export class AddApprovedScriptHashScript extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "add_approved_script_hash_script";
    public readonly args: AddApprovedScriptHashScriptBCSTypes;

    constructor(
      proposal_id: Uint64, // u64
    ) {
      super();
      this.args = {
        proposal_id: new U64(proposal_id),
      };
    }
  }
  export type CreateProposalBCSTypes = {
    proposer: AccountAddress;
    stake_pool: MoveVector<U8>;
    execution_hash: MoveVector<U8>;
    metadata_location: MoveVector<U8>;
  };

  export class CreateProposal extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "create_proposal";
    public readonly args: CreateProposalBCSTypes;

    constructor(
      proposer: AccountAddressInput, // address
      stake_pool: HexInput, // vector<u8>
      execution_hash: HexInput, // vector<u8>
      metadata_location: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        proposer: new AccountAddress(addressBytes(proposer)),
        stake_pool: MoveVector.U8(stake_pool),
        execution_hash: MoveVector.U8(execution_hash),
        metadata_location: MoveVector.U8(metadata_location),
      };
    }
  }
  export type CreateProposalV2BCSTypes = {
    arg_0: AccountAddress;
    arg_1: MoveVector<U8>;
    arg_2: MoveVector<U8>;
    arg_3: MoveVector<U8>;
    arg_4: Bool;
  };

  export class CreateProposalV2 extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "create_proposal_v2";
    public readonly args: CreateProposalV2BCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: HexInput, // vector<u8>
      arg_2: HexInput, // vector<u8>
      arg_3: HexInput, // vector<u8>
      arg_4: boolean, // bool
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: MoveVector.U8(arg_1),
        arg_2: MoveVector.U8(arg_2),
        arg_3: MoveVector.U8(arg_3),
        arg_4: new Bool(arg_4),
      };
    }
  }
  export type PartialVoteBCSTypes = {
    voter: AccountAddress;
    stake_pool: U64;
    proposal_id: U64;
    voting_power: Bool;
  };

  export class PartialVote extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "partial_vote";
    public readonly args: PartialVoteBCSTypes;

    constructor(
      voter: AccountAddressInput, // address
      stake_pool: Uint64, // u64
      proposal_id: Uint64, // u64
      voting_power: boolean, // bool
    ) {
      super();
      this.args = {
        voter: new AccountAddress(addressBytes(voter)),
        stake_pool: new U64(stake_pool),
        proposal_id: new U64(proposal_id),
        voting_power: new Bool(voting_power),
      };
    }
  }
  export type VoteBCSTypes = {
    voter: AccountAddress;
    stake_pool: U64;
    proposal_id: Bool;
  };

  export class Vote extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "aptos_governance";
    public readonly functionName = "vote";
    public readonly args: VoteBCSTypes;

    constructor(
      voter: AccountAddressInput, // address
      stake_pool: Uint64, // u64
      proposal_id: boolean, // bool
    ) {
      super();
      this.args = {
        voter: new AccountAddress(addressBytes(voter)),
        stake_pool: new U64(stake_pool),
        proposal_id: new Bool(proposal_id),
      };
    }
  }
}

export namespace MultisigAccount {
  export type AddOwnerBCSTypes = {
    multisig_account: AccountAddress;
  };

  export class AddOwner extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "add_owner";
    public readonly args: AddOwnerBCSTypes;

    constructor(
      multisig_account: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        multisig_account: new AccountAddress(addressBytes(multisig_account)),
      };
    }
  }
  export type AddOwnersBCSTypes = {
    arg_0: MoveVector<AccountAddress>;
  };

  export class AddOwners extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "add_owners";
    public readonly args: AddOwnersBCSTypes;

    constructor(
      arg_0: Array<AccountAddressInput>, // vector<address>
    ) {
      super();
      this.args = {
        arg_0: new MoveVector(arg_0.map((argA) => new AccountAddress(addressBytes(argA)))),
      };
    }
  }
  export type AddOwnersAndUpdateSignaturesRequiredBCSTypes = {
    multisig_account: MoveVector<AccountAddress>;
    new_owners: U64;
  };

  export class AddOwnersAndUpdateSignaturesRequired extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "add_owners_and_update_signatures_required";
    public readonly args: AddOwnersAndUpdateSignaturesRequiredBCSTypes;

    constructor(
      multisig_account: Array<AccountAddressInput>, // vector<address>
      new_owners: Uint64, // u64
    ) {
      super();
      this.args = {
        multisig_account: new MoveVector(multisig_account.map((argA) => new AccountAddress(addressBytes(argA)))),
        new_owners: new U64(new_owners),
      };
    }
  }
  export type ApproveTransactionBCSTypes = {
    owner: AccountAddress;
    multisig_account: U64;
  };

  export class ApproveTransaction extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    readonly moduleName = "multisig_account";
    public readonly functionName = "approve_transaction";
    public readonly args: ApproveTransactionBCSTypes;

    constructor(
      owner: AccountAddressInput, // address
      multisig_account: Uint64, // u64
    ) {
      super();
      this.args = {
        owner: new AccountAddress(addressBytes(owner)),
        multisig_account: new U64(multisig_account),
      };
    }
  }
  export type CreateBCSTypes = {
    arg_0: U64;
    arg_1: MoveVector<MoveString>;
    arg_2: MoveVector<MoveVector<U8>>;
  };

  export class Create extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "create";
    public readonly args: CreateBCSTypes;

    constructor(
      arg_0: Uint64, // u64
      arg_1: Array<string>, // vector<0x1::string::String>
      arg_2: Array<HexInput>, // vector<vector<u8>>
    ) {
      super();
      this.args = {
        arg_0: new U64(arg_0),
        arg_1: new MoveVector(arg_1.map((argA) => new MoveString(argA))),
        arg_2: new MoveVector(arg_2.map((argA) => MoveVector.U8(argA))),
      };
    }
  }
  export type CreateTransactionBCSTypes = {
    owner: AccountAddress;
    multisig_account: MoveVector<U8>;
  };

  export class CreateTransaction extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "create_transaction";
    public readonly args: CreateTransactionBCSTypes;

    constructor(
      owner: AccountAddressInput, // address
      multisig_account: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        owner: new AccountAddress(addressBytes(owner)),
        multisig_account: MoveVector.U8(multisig_account),
      };
    }
  }
  export type CreateTransactionWithHashBCSTypes = {
    owner: AccountAddress;
    multisig_account: MoveVector<U8>;
  };

  export class CreateTransactionWithHash extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "create_transaction_with_hash";
    public readonly args: CreateTransactionWithHashBCSTypes;

    constructor(
      owner: AccountAddressInput, // address
      multisig_account: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        owner: new AccountAddress(addressBytes(owner)),
        multisig_account: MoveVector.U8(multisig_account),
      };
    }
  }
  export type CreateWithExistingAccountBCSTypes = {
    multisig_address: AccountAddress;
    owners: MoveVector<AccountAddress>;
    num_signatures_required: U64;
    account_scheme: U8;
    account_public_key: MoveVector<U8>;
    create_multisig_account_signed_message: MoveVector<U8>;
    metadata_keys: MoveVector<MoveString>;
    metadata_values: MoveVector<MoveVector<U8>>;
  };

  export class CreateWithExistingAccount extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "create_with_existing_account";
    public readonly args: CreateWithExistingAccountBCSTypes;

    constructor(
      multisig_address: AccountAddressInput, // address
      owners: Array<AccountAddressInput>, // vector<address>
      num_signatures_required: Uint64, // u64
      account_scheme: Uint8, // u8
      account_public_key: HexInput, // vector<u8>
      create_multisig_account_signed_message: HexInput, // vector<u8>
      metadata_keys: Array<string>, // vector<0x1::string::String>
      metadata_values: Array<HexInput>, // vector<vector<u8>>
    ) {
      super();
      this.args = {
        multisig_address: new AccountAddress(addressBytes(multisig_address)),
        owners: new MoveVector(owners.map((argA) => new AccountAddress(addressBytes(argA)))),
        num_signatures_required: new U64(num_signatures_required),
        account_scheme: new U8(account_scheme),
        account_public_key: MoveVector.U8(account_public_key),
        create_multisig_account_signed_message: MoveVector.U8(create_multisig_account_signed_message),
        metadata_keys: new MoveVector(metadata_keys.map((argA) => new MoveString(argA))),
        metadata_values: new MoveVector(metadata_values.map((argA) => MoveVector.U8(argA))),
      };
    }
  }
  export type CreateWithExistingAccountAndRevokeAuthKeyBCSTypes = {
    multisig_address: AccountAddress;
    owners: MoveVector<AccountAddress>;
    num_signatures_required: U64;
    account_scheme: U8;
    account_public_key: MoveVector<U8>;
    create_multisig_account_signed_message: MoveVector<U8>;
    metadata_keys: MoveVector<MoveString>;
    metadata_values: MoveVector<MoveVector<U8>>;
  };

  export class CreateWithExistingAccountAndRevokeAuthKey extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "create_with_existing_account_and_revoke_auth_key";
    public readonly args: CreateWithExistingAccountAndRevokeAuthKeyBCSTypes;

    constructor(
      multisig_address: AccountAddressInput, // address
      owners: Array<AccountAddressInput>, // vector<address>
      num_signatures_required: Uint64, // u64
      account_scheme: Uint8, // u8
      account_public_key: HexInput, // vector<u8>
      create_multisig_account_signed_message: HexInput, // vector<u8>
      metadata_keys: Array<string>, // vector<0x1::string::String>
      metadata_values: Array<HexInput>, // vector<vector<u8>>
    ) {
      super();
      this.args = {
        multisig_address: new AccountAddress(addressBytes(multisig_address)),
        owners: new MoveVector(owners.map((argA) => new AccountAddress(addressBytes(argA)))),
        num_signatures_required: new U64(num_signatures_required),
        account_scheme: new U8(account_scheme),
        account_public_key: MoveVector.U8(account_public_key),
        create_multisig_account_signed_message: MoveVector.U8(create_multisig_account_signed_message),
        metadata_keys: new MoveVector(metadata_keys.map((argA) => new MoveString(argA))),
        metadata_values: new MoveVector(metadata_values.map((argA) => MoveVector.U8(argA))),
      };
    }
  }
  export type CreateWithOwnersBCSTypes = {
    arg_0: MoveVector<AccountAddress>;
    arg_1: U64;
    arg_2: MoveVector<MoveString>;
    arg_3: MoveVector<MoveVector<U8>>;
  };

  export class CreateWithOwners extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "create_with_owners";
    public readonly args: CreateWithOwnersBCSTypes;

    constructor(
      arg_0: Array<AccountAddressInput>, // vector<address>
      arg_1: Uint64, // u64
      arg_2: Array<string>, // vector<0x1::string::String>
      arg_3: Array<HexInput>, // vector<vector<u8>>
    ) {
      super();
      this.args = {
        arg_0: new MoveVector(arg_0.map((argA) => new AccountAddress(addressBytes(argA)))),
        arg_1: new U64(arg_1),
        arg_2: new MoveVector(arg_2.map((argA) => new MoveString(argA))),
        arg_3: new MoveVector(arg_3.map((argA) => MoveVector.U8(argA))),
      };
    }
  }
  export type CreateWithOwnersThenRemoveBootstrapperBCSTypes = {
    bootstrapper: MoveVector<AccountAddress>;
    owners: U64;
    num_signatures_required: MoveVector<MoveString>;
    metadata_keys: MoveVector<MoveVector<U8>>;
  };

  export class CreateWithOwnersThenRemoveBootstrapper extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "create_with_owners_then_remove_bootstrapper";
    public readonly args: CreateWithOwnersThenRemoveBootstrapperBCSTypes;

    constructor(
      bootstrapper: Array<AccountAddressInput>, // vector<address>
      owners: Uint64, // u64
      num_signatures_required: Array<string>, // vector<0x1::string::String>
      metadata_keys: Array<HexInput>, // vector<vector<u8>>
    ) {
      super();
      this.args = {
        bootstrapper: new MoveVector(bootstrapper.map((argA) => new AccountAddress(addressBytes(argA)))),
        owners: new U64(owners),
        num_signatures_required: new MoveVector(num_signatures_required.map((argA) => new MoveString(argA))),
        metadata_keys: new MoveVector(metadata_keys.map((argA) => MoveVector.U8(argA))),
      };
    }
  }
  export type ExecuteRejectedTransactionBCSTypes = {
    arg_0: AccountAddress;
  };

  export class ExecuteRejectedTransaction extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "execute_rejected_transaction";
    public readonly args: ExecuteRejectedTransactionBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
      };
    }
  }
  export type RejectTransactionBCSTypes = {
    owner: AccountAddress;
    multisig_account: U64;
  };

  export class RejectTransaction extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "reject_transaction";
    public readonly args: RejectTransactionBCSTypes;

    constructor(
      owner: AccountAddressInput, // address
      multisig_account: Uint64, // u64
    ) {
      super();
      this.args = {
        owner: new AccountAddress(addressBytes(owner)),
        multisig_account: new U64(multisig_account),
      };
    }
  }
  export type RemoveOwnerBCSTypes = {
    multisig_account: AccountAddress;
  };

  export class RemoveOwner extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "remove_owner";
    public readonly args: RemoveOwnerBCSTypes;

    constructor(
      multisig_account: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        multisig_account: new AccountAddress(addressBytes(multisig_account)),
      };
    }
  }
  export type RemoveOwnersBCSTypes = {
    arg_0: MoveVector<AccountAddress>;
  };

  export class RemoveOwners extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "remove_owners";
    public readonly args: RemoveOwnersBCSTypes;

    constructor(
      arg_0: Array<AccountAddressInput>, // vector<address>
    ) {
      super();
      this.args = {
        arg_0: new MoveVector(arg_0.map((argA) => new AccountAddress(addressBytes(argA)))),
      };
    }
  }
  export type SwapOwnerBCSTypes = {
    multisig_account: AccountAddress;
    to_swap_in: AccountAddress;
  };

  export class SwapOwner extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "swap_owner";
    public readonly args: SwapOwnerBCSTypes;

    constructor(
      multisig_account: AccountAddressInput, // address
      to_swap_in: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        multisig_account: new AccountAddress(addressBytes(multisig_account)),
        to_swap_in: new AccountAddress(addressBytes(to_swap_in)),
      };
    }
  }
  export type SwapOwnersBCSTypes = {
    multisig_account: MoveVector<AccountAddress>;
    to_swap_in: MoveVector<AccountAddress>;
  };

  export class SwapOwners extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "swap_owners";
    public readonly args: SwapOwnersBCSTypes;

    constructor(
      multisig_account: Array<AccountAddressInput>, // vector<address>
      to_swap_in: Array<AccountAddressInput>, // vector<address>
    ) {
      super();
      this.args = {
        multisig_account: new MoveVector(multisig_account.map((argA) => new AccountAddress(addressBytes(argA)))),
        to_swap_in: new MoveVector(to_swap_in.map((argA) => new AccountAddress(addressBytes(argA)))),
      };
    }
  }
  export type SwapOwnersAndUpdateSignaturesRequiredBCSTypes = {
    multisig_account: MoveVector<AccountAddress>;
    new_owners: MoveVector<AccountAddress>;
    owners_to_remove: U64;
  };

  export class SwapOwnersAndUpdateSignaturesRequired extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "swap_owners_and_update_signatures_required";
    public readonly args: SwapOwnersAndUpdateSignaturesRequiredBCSTypes;

    constructor(
      multisig_account: Array<AccountAddressInput>, // vector<address>
      new_owners: Array<AccountAddressInput>, // vector<address>
      owners_to_remove: Uint64, // u64
    ) {
      super();
      this.args = {
        multisig_account: new MoveVector(multisig_account.map((argA) => new AccountAddress(addressBytes(argA)))),
        new_owners: new MoveVector(new_owners.map((argA) => new AccountAddress(addressBytes(argA)))),
        owners_to_remove: new U64(owners_to_remove),
      };
    }
  }
  export type UpdateMetadataBCSTypes = {
    multisig_account: MoveVector<MoveString>;
    keys: MoveVector<MoveVector<U8>>;
  };

  export class UpdateMetadata extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "update_metadata";
    public readonly args: UpdateMetadataBCSTypes;

    constructor(
      multisig_account: Array<string>, // vector<0x1::string::String>
      keys: Array<HexInput>, // vector<vector<u8>>
    ) {
      super();
      this.args = {
        multisig_account: new MoveVector(multisig_account.map((argA) => new MoveString(argA))),
        keys: new MoveVector(keys.map((argA) => MoveVector.U8(argA))),
      };
    }
  }

  export type VoteTransanctionBCSTypes = {
    arg_0: AccountAddress;
    arg_1: U64;
    arg_2: Bool;
  };

  export class VoteTransanction extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "multisig_account";
    public readonly functionName = "vote_transanction";
    public readonly args: VoteTransanctionBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: Uint64, // u64
      arg_2: boolean, // bool
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: new U64(arg_1),
        arg_2: new Bool(arg_2),
      };
    }
  }
}

export namespace ResourceAccount {
  export type CreateResourceAccountBCSTypes = {
    origin: MoveVector<U8>;
    seed: MoveVector<U8>;
  };

  export class CreateResourceAccount extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "resource_account";
    public readonly functionName = "create_resource_account";
    public readonly args: CreateResourceAccountBCSTypes;

    constructor(
      origin: HexInput, // vector<u8>
      seed: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        origin: MoveVector.U8(origin),
        seed: MoveVector.U8(seed),
      };
    }
  }
  export type CreateResourceAccountAndFundBCSTypes = {
    origin: MoveVector<U8>;
    seed: MoveVector<U8>;
    optional_auth_key: U64;
  };

  export class CreateResourceAccountAndFund extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "resource_account";
    public readonly functionName = "create_resource_account_and_fund";
    public readonly args: CreateResourceAccountAndFundBCSTypes;

    constructor(
      origin: HexInput, // vector<u8>
      seed: HexInput, // vector<u8>
      optional_auth_key: Uint64, // u64
    ) {
      super();
      this.args = {
        origin: MoveVector.U8(origin),
        seed: MoveVector.U8(seed),
        optional_auth_key: new U64(optional_auth_key),
      };
    }
  }
  export type CreateResourceAccountAndPublishPackageBCSTypes = {
    origin: MoveVector<U8>;
    seed: MoveVector<U8>;
    metadata_serialized: MoveVector<MoveVector<U8>>;
  };

  export class CreateResourceAccountAndPublishPackage extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "resource_account";
    public readonly functionName = "create_resource_account_and_publish_package";
    public readonly args: CreateResourceAccountAndPublishPackageBCSTypes;

    constructor(
      origin: HexInput, // vector<u8>
      seed: HexInput, // vector<u8>
      metadata_serialized: Array<HexInput>, // vector<vector<u8>>
    ) {
      super();
      this.args = {
        origin: MoveVector.U8(origin),
        seed: MoveVector.U8(seed),
        metadata_serialized: new MoveVector(metadata_serialized.map((argA) => MoveVector.U8(argA))),
      };
    }
  }
}

export namespace StakingContract {
  export type AddStakeBCSTypes = {
    staker: AccountAddress;
    operator: U64;
  };

  export class AddStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "add_stake";
    public readonly args: AddStakeBCSTypes;

    constructor(
      staker: AccountAddressInput, // address
      operator: Uint64, // u64
    ) {
      super();
      this.args = {
        staker: new AccountAddress(addressBytes(staker)),
        operator: new U64(operator),
      };
    }
  }
  export type CreateStakingContractBCSTypes = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
    arg_2: U64;
    arg_3: U64;
    arg_4: MoveVector<U8>;
  };

  export class CreateStakingContract extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "create_staking_contract";
    public readonly args: CreateStakingContractBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: AccountAddressInput, // address
      arg_2: Uint64, // u64
      arg_3: Uint64, // u64
      arg_4: HexInput, // vector<u8>
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: new AccountAddress(addressBytes(arg_1)),
        arg_2: new U64(arg_2),
        arg_3: new U64(arg_3),
        arg_4: MoveVector.U8(arg_4),
      };
    }
  }
  export type DistributeBCSTypes = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
  };

  export class Distribute extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "distribute";
    public readonly args: DistributeBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: new AccountAddress(addressBytes(arg_1)),
      };
    }
  }
  export type RequestCommissionBCSTypes = {
    account: AccountAddress;
    staker: AccountAddress;
  };

  export class RequestCommission extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "request_commission";
    public readonly args: RequestCommissionBCSTypes;

    constructor(
      account: AccountAddressInput, // address
      staker: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        account: new AccountAddress(addressBytes(account)),
        staker: new AccountAddress(addressBytes(staker)),
      };
    }
  }
  export type ResetLockupBCSTypes = {
    staker: AccountAddress;
  };

  export class ResetLockup extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "reset_lockup";
    public readonly args: ResetLockupBCSTypes;

    constructor(
      staker: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        staker: new AccountAddress(addressBytes(staker)),
      };
    }
  }
  export type SwitchOperatorBCSTypes = {
    arg_0: AccountAddress;
    arg_1: AccountAddress;
    arg_2: U64;
  };

  export class SwitchOperator extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "switch_operator";
    public readonly args: SwitchOperatorBCSTypes;

    constructor(
      arg_0: AccountAddressInput, // address
      arg_1: AccountAddressInput, // address
      arg_2: Uint64, // u64
    ) {
      super();
      this.args = {
        arg_0: new AccountAddress(addressBytes(arg_0)),
        arg_1: new AccountAddress(addressBytes(arg_1)),
        arg_2: new U64(arg_2),
      };
    }
  }
  export type SwitchOperatorWithSameCommissionBCSTypes = {
    staker: AccountAddress;
    old_operator: AccountAddress;
  };

  export class SwitchOperatorWithSameCommission extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "switch_operator_with_same_commission";
    public readonly args: SwitchOperatorWithSameCommissionBCSTypes;

    constructor(
      staker: AccountAddressInput, // address
      old_operator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        staker: new AccountAddress(addressBytes(staker)),
        old_operator: new AccountAddress(addressBytes(old_operator)),
      };
    }
  }
  export type UnlockRewardsBCSTypes = {
    staker: AccountAddress;
  };

  export class UnlockRewards extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "unlock_rewards";
    public readonly args: UnlockRewardsBCSTypes;

    constructor(
      staker: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        staker: new AccountAddress(addressBytes(staker)),
      };
    }
  }
  export type UnlockStakeBCSTypes = {
    staker: AccountAddress;
    operator: U64;
  };

  export class UnlockStake extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "unlock_stake";
    public readonly args: UnlockStakeBCSTypes;

    constructor(
      staker: AccountAddressInput, // address
      operator: Uint64, // u64
    ) {
      super();
      this.args = {
        staker: new AccountAddress(addressBytes(staker)),
        operator: new U64(operator),
      };
    }
  }
  export type UpdateCommisionBCSTypes = {
    staker: AccountAddress;
    operator: U64;
  };

  export class UpdateCommision extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "update_commision";
    public readonly args: UpdateCommisionBCSTypes;

    constructor(
      staker: AccountAddressInput, // address
      operator: Uint64, // u64
    ) {
      super();
      this.args = {
        staker: new AccountAddress(addressBytes(staker)),
        operator: new U64(operator),
      };
    }
  }
  export type UpdateVoterBCSTypes = {
    staker: AccountAddress;
    operator: AccountAddress;
  };

  export class UpdateVoter extends EntryFunctionPayloadBuilder {
    public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
    public readonly moduleName = "staking_contract";
    public readonly functionName = "update_voter";
    public readonly args: UpdateVoterBCSTypes;

    constructor(
      staker: AccountAddressInput, // address
      operator: AccountAddressInput, // address
    ) {
      super();
      this.args = {
        staker: new AccountAddress(addressBytes(staker)),
        operator: new AccountAddress(addressBytes(operator)),
      };
    }
  }
}

export namespace PrimaryFungibleStore {}
