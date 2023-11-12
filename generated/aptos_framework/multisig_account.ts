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

export type ApproveTransactionPayloadMoveArguments = {
  multisig_account: AccountAddress;
  sequence_number: U64;
};

/**
 *  public fun approve_transaction<>(
 *     owner: &signer,
 *     multisig_account: address,
 *     sequence_number: u64,
 *   )
 **/
export class ApproveTransaction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "approve_transaction";
  public readonly args: ApproveTransactionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    owner: Account, // &signer
    multisig_account: AccountAddressInput, // address
    sequence_number: Uint64, // u64
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      sequence_number: new U64(sequence_number),
    };
  }
}
export type CreatePayloadMoveArguments = {
  num_signatures_required: U64;
  metadata_keys: MoveVector<MoveString>;
  metadata_values: MoveVector<MoveVector<U8>>;
};

/**
 *  public fun create<>(
 *     owner: &signer,
 *     num_signatures_required: u64,
 *     metadata_keys: vector<String>,
 *     metadata_values: vector<vector<u8>>,
 *   )
 **/
export class Create extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create";
  public readonly args: CreatePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    owner: Account, // &signer
    num_signatures_required: Uint64, // u64
    metadata_keys: Array<string>, // vector<String>
    metadata_values: Array<HexInput>, // vector<vector<u8>>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      num_signatures_required: new U64(num_signatures_required),
      metadata_keys: new MoveVector(metadata_keys.map((argA) => new MoveString(argA))),
      metadata_values: new MoveVector(metadata_values.map((argA) => MoveVector.U8(argA))),
    };
  }
}
export type CreateTransactionPayloadMoveArguments = {
  multisig_account: AccountAddress;
  payload: MoveVector<U8>;
};

/**
 *  public fun create_transaction<>(
 *     owner: &signer,
 *     multisig_account: address,
 *     payload: vector<u8>,
 *   )
 **/
export class CreateTransaction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_transaction";
  public readonly args: CreateTransactionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    owner: Account, // &signer
    multisig_account: AccountAddressInput, // address
    payload: HexInput, // vector<u8>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      payload: MoveVector.U8(payload),
    };
  }
}
export type CreateTransactionWithHashPayloadMoveArguments = {
  multisig_account: AccountAddress;
  payload_hash: MoveVector<U8>;
};

/**
 *  public fun create_transaction_with_hash<>(
 *     owner: &signer,
 *     multisig_account: address,
 *     payload_hash: vector<u8>,
 *   )
 **/
export class CreateTransactionWithHash extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_transaction_with_hash";
  public readonly args: CreateTransactionWithHashPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    owner: Account, // &signer
    multisig_account: AccountAddressInput, // address
    payload_hash: HexInput, // vector<u8>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      payload_hash: MoveVector.U8(payload_hash),
    };
  }
}
export type CreateWithExistingAccountPayloadMoveArguments = {
  multisig_address: AccountAddress;
  owners: MoveVector<AccountAddress>;
  num_signatures_required: U64;
  account_scheme: U8;
  account_public_key: MoveVector<U8>;
  create_multisig_account_signed_message: MoveVector<U8>;
  metadata_keys: MoveVector<MoveString>;
  metadata_values: MoveVector<MoveVector<U8>>;
};

/**
 *  public fun create_with_existing_account<>(
 *     multisig_address: address,
 *     owners: vector<address>,
 *     num_signatures_required: u64,
 *     account_scheme: u8,
 *     account_public_key: vector<u8>,
 *     create_multisig_account_signed_message: vector<u8>,
 *     metadata_keys: vector<String>,
 *     metadata_values: vector<vector<u8>>,
 *   )
 **/
export class CreateWithExistingAccount extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_with_existing_account";
  public readonly args: CreateWithExistingAccountPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_address: AccountAddressInput, // address
    owners: Array<AccountAddressInput>, // vector<address>
    num_signatures_required: Uint64, // u64
    account_scheme: Uint8, // u8
    account_public_key: HexInput, // vector<u8>
    create_multisig_account_signed_message: HexInput, // vector<u8>
    metadata_keys: Array<string>, // vector<String>
    metadata_values: Array<HexInput>, // vector<vector<u8>>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      multisig_address: AccountAddress.fromRelaxed(multisig_address),
      owners: new MoveVector(owners.map((argA) => AccountAddress.fromRelaxed(argA))),
      num_signatures_required: new U64(num_signatures_required),
      account_scheme: new U8(account_scheme),
      account_public_key: MoveVector.U8(account_public_key),
      create_multisig_account_signed_message: MoveVector.U8(create_multisig_account_signed_message),
      metadata_keys: new MoveVector(metadata_keys.map((argA) => new MoveString(argA))),
      metadata_values: new MoveVector(metadata_values.map((argA) => MoveVector.U8(argA))),
    };
  }
}
export type CreateWithExistingAccountAndRevokeAuthKeyPayloadMoveArguments = {
  multisig_address: AccountAddress;
  owners: MoveVector<AccountAddress>;
  num_signatures_required: U64;
  account_scheme: U8;
  account_public_key: MoveVector<U8>;
  create_multisig_account_signed_message: MoveVector<U8>;
  metadata_keys: MoveVector<MoveString>;
  metadata_values: MoveVector<MoveVector<U8>>;
};

/**
 *  public fun create_with_existing_account_and_revoke_auth_key<>(
 *     multisig_address: address,
 *     owners: vector<address>,
 *     num_signatures_required: u64,
 *     account_scheme: u8,
 *     account_public_key: vector<u8>,
 *     create_multisig_account_signed_message: vector<u8>,
 *     metadata_keys: vector<String>,
 *     metadata_values: vector<vector<u8>>,
 *   )
 **/
export class CreateWithExistingAccountAndRevokeAuthKey extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_with_existing_account_and_revoke_auth_key";
  public readonly args: CreateWithExistingAccountAndRevokeAuthKeyPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_address: AccountAddressInput, // address
    owners: Array<AccountAddressInput>, // vector<address>
    num_signatures_required: Uint64, // u64
    account_scheme: Uint8, // u8
    account_public_key: HexInput, // vector<u8>
    create_multisig_account_signed_message: HexInput, // vector<u8>
    metadata_keys: Array<string>, // vector<String>
    metadata_values: Array<HexInput>, // vector<vector<u8>>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      multisig_address: AccountAddress.fromRelaxed(multisig_address),
      owners: new MoveVector(owners.map((argA) => AccountAddress.fromRelaxed(argA))),
      num_signatures_required: new U64(num_signatures_required),
      account_scheme: new U8(account_scheme),
      account_public_key: MoveVector.U8(account_public_key),
      create_multisig_account_signed_message: MoveVector.U8(create_multisig_account_signed_message),
      metadata_keys: new MoveVector(metadata_keys.map((argA) => new MoveString(argA))),
      metadata_values: new MoveVector(metadata_values.map((argA) => MoveVector.U8(argA))),
    };
  }
}
export type CreateWithOwnersPayloadMoveArguments = {
  additional_owners: MoveVector<AccountAddress>;
  num_signatures_required: U64;
  metadata_keys: MoveVector<MoveString>;
  metadata_values: MoveVector<MoveVector<U8>>;
};

/**
 *  public fun create_with_owners<>(
 *     owner: &signer,
 *     additional_owners: vector<address>,
 *     num_signatures_required: u64,
 *     metadata_keys: vector<String>,
 *     metadata_values: vector<vector<u8>>,
 *   )
 **/
export class CreateWithOwners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_with_owners";
  public readonly args: CreateWithOwnersPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    owner: Account, // &signer
    additional_owners: Array<AccountAddressInput>, // vector<address>
    num_signatures_required: Uint64, // u64
    metadata_keys: Array<string>, // vector<String>
    metadata_values: Array<HexInput>, // vector<vector<u8>>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      additional_owners: new MoveVector(additional_owners.map((argA) => AccountAddress.fromRelaxed(argA))),
      num_signatures_required: new U64(num_signatures_required),
      metadata_keys: new MoveVector(metadata_keys.map((argA) => new MoveString(argA))),
      metadata_values: new MoveVector(metadata_values.map((argA) => MoveVector.U8(argA))),
    };
  }
}
export type CreateWithOwnersThenRemoveBootstrapperPayloadMoveArguments = {
  owners: MoveVector<AccountAddress>;
  num_signatures_required: U64;
  metadata_keys: MoveVector<MoveString>;
  metadata_values: MoveVector<MoveVector<U8>>;
};

/**
 *  public fun create_with_owners_then_remove_bootstrapper<>(
 *     bootstrapper: &signer,
 *     owners: vector<address>,
 *     num_signatures_required: u64,
 *     metadata_keys: vector<String>,
 *     metadata_values: vector<vector<u8>>,
 *   )
 **/
export class CreateWithOwnersThenRemoveBootstrapper extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_with_owners_then_remove_bootstrapper";
  public readonly args: CreateWithOwnersThenRemoveBootstrapperPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    bootstrapper: Account, // &signer
    owners: Array<AccountAddressInput>, // vector<address>
    num_signatures_required: Uint64, // u64
    metadata_keys: Array<string>, // vector<String>
    metadata_values: Array<HexInput>, // vector<vector<u8>>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      owners: new MoveVector(owners.map((argA) => AccountAddress.fromRelaxed(argA))),
      num_signatures_required: new U64(num_signatures_required),
      metadata_keys: new MoveVector(metadata_keys.map((argA) => new MoveString(argA))),
      metadata_values: new MoveVector(metadata_values.map((argA) => MoveVector.U8(argA))),
    };
  }
}
export type ExecuteRejectedTransactionPayloadMoveArguments = {
  multisig_account: AccountAddress;
};

/**
 *  public fun execute_rejected_transaction<>(
 *     owner: &signer,
 *     multisig_account: address,
 *   )
 **/
export class ExecuteRejectedTransaction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "execute_rejected_transaction";
  public readonly args: ExecuteRejectedTransactionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    owner: Account, // &signer
    multisig_account: AccountAddressInput, // address
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
    };
  }
}
export type RejectTransactionPayloadMoveArguments = {
  multisig_account: AccountAddress;
  sequence_number: U64;
};

/**
 *  public fun reject_transaction<>(
 *     owner: &signer,
 *     multisig_account: address,
 *     sequence_number: u64,
 *   )
 **/
export class RejectTransaction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "reject_transaction";
  public readonly args: RejectTransactionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    owner: Account, // &signer
    multisig_account: AccountAddressInput, // address
    sequence_number: Uint64, // u64
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      sequence_number: new U64(sequence_number),
    };
  }
}
export type VoteTransanctionPayloadMoveArguments = {
  multisig_account: AccountAddress;
  sequence_number: U64;
  approved: Bool;
};

/**
 *  public fun vote_transanction<>(
 *     owner: &signer,
 *     multisig_account: address,
 *     sequence_number: u64,
 *     approved: bool,
 *   )
 **/
export class VoteTransanction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "vote_transanction";
  public readonly args: VoteTransanctionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    owner: Account, // &signer
    multisig_account: AccountAddressInput, // address
    sequence_number: Uint64, // u64
    approved: boolean, // bool
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      sequence_number: new U64(sequence_number),
      approved: new Bool(approved),
    };
  }
}
export type AddOwnerPayloadMoveArguments = {
  new_owner: AccountAddress;
};

/**
 *  private fun add_owner<>(
 *     multisig_account: &signer,
 *     new_owner: address,
 *   )
 **/
export class AddOwner extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "add_owner";
  public readonly args: AddOwnerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    new_owner: AccountAddressInput, // address
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      new_owner: AccountAddress.fromRelaxed(new_owner),
    };
  }
}
export type AddOwnersPayloadMoveArguments = {
  new_owners: MoveVector<AccountAddress>;
};

/**
 *  private fun add_owners<>(
 *     multisig_account: &signer,
 *     new_owners: vector<address>,
 *   )
 **/
export class AddOwners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "add_owners";
  public readonly args: AddOwnersPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    new_owners: Array<AccountAddressInput>, // vector<address>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      new_owners: new MoveVector(new_owners.map((argA) => AccountAddress.fromRelaxed(argA))),
    };
  }
}
export type AddOwnersAndUpdateSignaturesRequiredPayloadMoveArguments = {
  new_owners: MoveVector<AccountAddress>;
  new_num_signatures_required: U64;
};

/**
 *  private fun add_owners_and_update_signatures_required<>(
 *     multisig_account: &signer,
 *     new_owners: vector<address>,
 *     new_num_signatures_required: u64,
 *   )
 **/
export class AddOwnersAndUpdateSignaturesRequired extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "add_owners_and_update_signatures_required";
  public readonly args: AddOwnersAndUpdateSignaturesRequiredPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    new_owners: Array<AccountAddressInput>, // vector<address>
    new_num_signatures_required: Uint64, // u64
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      new_owners: new MoveVector(new_owners.map((argA) => AccountAddress.fromRelaxed(argA))),
      new_num_signatures_required: new U64(new_num_signatures_required),
    };
  }
}
export type RemoveOwnerPayloadMoveArguments = {
  owner_to_remove: AccountAddress;
};

/**
 *  private fun remove_owner<>(
 *     multisig_account: &signer,
 *     owner_to_remove: address,
 *   )
 **/
export class RemoveOwner extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "remove_owner";
  public readonly args: RemoveOwnerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    owner_to_remove: AccountAddressInput, // address
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      owner_to_remove: AccountAddress.fromRelaxed(owner_to_remove),
    };
  }
}
export type RemoveOwnersPayloadMoveArguments = {
  owners_to_remove: MoveVector<AccountAddress>;
};

/**
 *  private fun remove_owners<>(
 *     multisig_account: &signer,
 *     owners_to_remove: vector<address>,
 *   )
 **/
export class RemoveOwners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "remove_owners";
  public readonly args: RemoveOwnersPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    owners_to_remove: Array<AccountAddressInput>, // vector<address>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      owners_to_remove: new MoveVector(owners_to_remove.map((argA) => AccountAddress.fromRelaxed(argA))),
    };
  }
}
export type SwapOwnerPayloadMoveArguments = {
  to_swap_in: AccountAddress;
  to_swap_out: AccountAddress;
};

/**
 *  private fun swap_owner<>(
 *     multisig_account: &signer,
 *     to_swap_in: address,
 *     to_swap_out: address,
 *   )
 **/
export class SwapOwner extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "swap_owner";
  public readonly args: SwapOwnerPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    to_swap_in: AccountAddressInput, // address
    to_swap_out: AccountAddressInput, // address
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      to_swap_in: AccountAddress.fromRelaxed(to_swap_in),
      to_swap_out: AccountAddress.fromRelaxed(to_swap_out),
    };
  }
}
export type SwapOwnersPayloadMoveArguments = {
  to_swap_in: MoveVector<AccountAddress>;
  to_swap_out: MoveVector<AccountAddress>;
};

/**
 *  private fun swap_owners<>(
 *     multisig_account: &signer,
 *     to_swap_in: vector<address>,
 *     to_swap_out: vector<address>,
 *   )
 **/
export class SwapOwners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "swap_owners";
  public readonly args: SwapOwnersPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    to_swap_in: Array<AccountAddressInput>, // vector<address>
    to_swap_out: Array<AccountAddressInput>, // vector<address>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      to_swap_in: new MoveVector(to_swap_in.map((argA) => AccountAddress.fromRelaxed(argA))),
      to_swap_out: new MoveVector(to_swap_out.map((argA) => AccountAddress.fromRelaxed(argA))),
    };
  }
}
export type SwapOwnersAndUpdateSignaturesRequiredPayloadMoveArguments = {
  new_owners: MoveVector<AccountAddress>;
  owners_to_remove: MoveVector<AccountAddress>;
  new_num_signatures_required: U64;
};

/**
 *  private fun swap_owners_and_update_signatures_required<>(
 *     multisig_account: &signer,
 *     new_owners: vector<address>,
 *     owners_to_remove: vector<address>,
 *     new_num_signatures_required: u64,
 *   )
 **/
export class SwapOwnersAndUpdateSignaturesRequired extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "swap_owners_and_update_signatures_required";
  public readonly args: SwapOwnersAndUpdateSignaturesRequiredPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    new_owners: Array<AccountAddressInput>, // vector<address>
    owners_to_remove: Array<AccountAddressInput>, // vector<address>
    new_num_signatures_required: Uint64, // u64
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      new_owners: new MoveVector(new_owners.map((argA) => AccountAddress.fromRelaxed(argA))),
      owners_to_remove: new MoveVector(owners_to_remove.map((argA) => AccountAddress.fromRelaxed(argA))),
      new_num_signatures_required: new U64(new_num_signatures_required),
    };
  }
}
export type UpdateMetadataPayloadMoveArguments = {
  keys: MoveVector<MoveString>;
  values: MoveVector<MoveVector<U8>>;
};

/**
 *  private fun update_metadata<>(
 *     multisig_account: &signer,
 *     keys: vector<String>,
 *     values: vector<vector<u8>>,
 *   )
 **/
export class UpdateMetadata extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "update_metadata";
  public readonly args: UpdateMetadataPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    keys: Array<string>, // vector<String>
    values: Array<HexInput>, // vector<vector<u8>>
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      keys: new MoveVector(keys.map((argA) => new MoveString(argA))),
      values: new MoveVector(values.map((argA) => MoveVector.U8(argA))),
    };
  }
}
export type UpdateSignaturesRequiredPayloadMoveArguments = {
  new_num_signatures_required: U64;
};

/**
 *  private fun update_signatures_required<>(
 *     multisig_account: &signer,
 *     new_num_signatures_required: u64,
 *   )
 **/
export class UpdateSignaturesRequired extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "update_signatures_required";
  public readonly args: UpdateSignaturesRequiredPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: Account, // &signer
    new_num_signatures_required: Uint64, // u64
    feePayer?: Account, // optional fee payer account to sponsor the transaction
  ) {
    super();
    this.args = {
      new_num_signatures_required: new U64(new_num_signatures_required),
    };
  }
}

export type CanBeExecutedPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
  sequence_number: string;
};

/**
 *  public fun can_be_executed<>(
 *     multisig_account: address,
 *     sequence_number: u64,
 *   )
 **/
export class CanBeExecuted extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "can_be_executed";
  public readonly args: CanBeExecutedPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
    sequence_number: Uint64, // u64
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      sequence_number: BigInt(sequence_number).toString(),
    };
  }
}
export type CanBeRejectedPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
  sequence_number: string;
};

/**
 *  public fun can_be_rejected<>(
 *     multisig_account: address,
 *     sequence_number: u64,
 *   )
 **/
export class CanBeRejected extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "can_be_rejected";
  public readonly args: CanBeRejectedPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
    sequence_number: Uint64, // u64
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      sequence_number: BigInt(sequence_number).toString(),
    };
  }
}
export type GetNextMultisigAccountAddressPayloadMoveArguments = {
  creator: AccountAddressInput;
};

/**
 *  public fun get_next_multisig_account_address<>(
 *     creator: address,
 *   )
 **/
export class GetNextMultisigAccountAddress extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "get_next_multisig_account_address";
  public readonly args: GetNextMultisigAccountAddressPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    creator: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      creator: AccountAddress.fromRelaxed(creator),
    };
  }
}
export type GetNextTransactionPayloadPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
  provided_payload: Uint8Array;
};

/**
 *  public fun get_next_transaction_payload<>(
 *     multisig_account: address,
 *     provided_payload: vector<u8>,
 *   )
 **/
export class GetNextTransactionPayload extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "get_next_transaction_payload";
  public readonly args: GetNextTransactionPayloadPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
    provided_payload: HexInput, // vector<u8>
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      provided_payload: Hex.fromHexInput(provided_payload).toUint8Array(),
    };
  }
}
export type GetPendingTransactionsPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
};

/**
 *  public fun get_pending_transactions<>(
 *     multisig_account: address,
 *   )
 **/
export class GetPendingTransactions extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "get_pending_transactions";
  public readonly args: GetPendingTransactionsPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
    };
  }
}
export type GetTransactionPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
  sequence_number: string;
};

/**
 *  public fun get_transaction<>(
 *     multisig_account: address,
 *     sequence_number: u64,
 *   )
 **/
export class GetTransaction extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "get_transaction";
  public readonly args: GetTransactionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
    sequence_number: Uint64, // u64
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      sequence_number: BigInt(sequence_number).toString(),
    };
  }
}
export type LastResolvedSequenceNumberPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
};

/**
 *  public fun last_resolved_sequence_number<>(
 *     multisig_account: address,
 *   )
 **/
export class LastResolvedSequenceNumber extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "last_resolved_sequence_number";
  public readonly args: LastResolvedSequenceNumberPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
    };
  }
}
export type MetadataPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
};

/**
 *  public fun metadata<>(
 *     multisig_account: address,
 *   )
 **/
export class Metadata extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "metadata";
  public readonly args: MetadataPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
    };
  }
}
export type NextSequenceNumberPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
};

/**
 *  public fun next_sequence_number<>(
 *     multisig_account: address,
 *   )
 **/
export class NextSequenceNumber extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "next_sequence_number";
  public readonly args: NextSequenceNumberPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
    };
  }
}
export type NumSignaturesRequiredPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
};

/**
 *  public fun num_signatures_required<>(
 *     multisig_account: address,
 *   )
 **/
export class NumSignaturesRequired extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "num_signatures_required";
  public readonly args: NumSignaturesRequiredPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
    };
  }
}
export type OwnersPayloadMoveArguments = {
  multisig_account: AccountAddressInput;
};

/**
 *  public fun owners<>(
 *     multisig_account: address,
 *   )
 **/
export class Owners extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "owners";
  public readonly args: OwnersPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
    };
  }
}
export type VotePayloadMoveArguments = {
  multisig_account: AccountAddressInput;
  sequence_number: string;
  owner: AccountAddressInput;
};

/**
 *  public fun vote<>(
 *     multisig_account: address,
 *     sequence_number: u64,
 *     owner: address,
 *   )
 **/
export class Vote extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "vote";
  public readonly args: VotePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    multisig_account: AccountAddressInput, // address
    sequence_number: Uint64, // u64
    owner: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      sequence_number: BigInt(sequence_number).toString(),
      owner: AccountAddress.fromRelaxed(owner),
    };
  }
}
