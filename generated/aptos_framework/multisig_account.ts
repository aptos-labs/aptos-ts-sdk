
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, AccountAddressInput, HexInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from "../../src";
import { addressBytes } from "../../src/abi/utils";
import { OneOrNone, MoveObject } from "../../src/abi/types";
import { EntryFunctionPayloadBuilder } from "../../src/bcs/serializable/tx-builder/payloadBuilder";


export namespace MultisigAccount {
// let multisig_account: AccountAuthenticator | undefined; // &signer
export type AddOwnerPayloadBCSArguments = {
  new_owner: AccountAddress;
};

export class AddOwner extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "add_owner";
  public readonly args: AddOwnerPayloadBCSArguments;

  constructor(
    new_owner: AccountAddressInput // address
  ) {
    super();
    this.args = {
      new_owner: AccountAddress.fromRelaxed(new_owner),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type AddOwnersPayloadBCSArguments = {
  arg_1: MoveVector<AccountAddress>;
};

export class AddOwners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "add_owners";
  public readonly args: AddOwnersPayloadBCSArguments;

  constructor(
    arg_1: Array<AccountAddressInput> // vector<address>
  ) {
    super();
    this.args = {
      arg_1: new MoveVector(
        arg_1.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
    };
  }
}

// let multisig_account: AccountAuthenticator | undefined; // &signer
export type AddOwnersAndUpdateSignaturesRequiredPayloadBCSArguments = {
  new_owners: MoveVector<AccountAddress>;
  new_num_signatures_required: U64;
};

export class AddOwnersAndUpdateSignaturesRequired extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "add_owners_and_update_signatures_required";
  public readonly args: AddOwnersAndUpdateSignaturesRequiredPayloadBCSArguments;

  constructor(
    new_owners: Array<AccountAddressInput>, // vector<address>
    new_num_signatures_required: Uint64 // u64
  ) {
    super();
    this.args = {
      new_owners: new MoveVector(
        new_owners.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
      new_num_signatures_required: new U64(new_num_signatures_required),
    };
  }
}

// let owner: AccountAuthenticator | undefined; // &signer
export type ApproveTransactionPayloadBCSArguments = {
  multisig_account: AccountAddress;
  sequence_number: U64;
};

export class ApproveTransaction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "approve_transaction";
  public readonly args: ApproveTransactionPayloadBCSArguments;

  constructor(
    multisig_account: AccountAddressInput, // address
    sequence_number: Uint64 // u64
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      sequence_number: new U64(sequence_number),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type CreatePayloadBCSArguments = {
  arg_1: U64;
  arg_2: MoveVector<MoveString>;
  arg_3: MoveVector<MoveVector<U8>>;
};

export class Create extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create";
  public readonly args: CreatePayloadBCSArguments;

  constructor(
    arg_1: Uint64, // u64
    arg_2: Array<string>, // vector<0x1::string::String>
    arg_3: Array<HexInput> // vector<vector<u8>>
  ) {
    super();
    this.args = {
      arg_1: new U64(arg_1),
      arg_2: new MoveVector(arg_2.map((argA) => new MoveString(argA))),
      arg_3: new MoveVector(arg_3.map((argA) => MoveVector.U8(argA))),
    };
  }
}

// let owner: AccountAuthenticator | undefined; // &signer
export type CreateTransactionPayloadBCSArguments = {
  multisig_account: AccountAddress;
  payload: MoveVector<U8>;
};

export class CreateTransaction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_transaction";
  public readonly args: CreateTransactionPayloadBCSArguments;

  constructor(
    multisig_account: AccountAddressInput, // address
    payload: HexInput // vector<u8>
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      payload: MoveVector.U8(payload),
    };
  }
}

// let owner: AccountAuthenticator | undefined; // &signer
export type CreateTransactionWithHashPayloadBCSArguments = {
  multisig_account: AccountAddress;
  payload_hash: MoveVector<U8>;
};

export class CreateTransactionWithHash extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_transaction_with_hash";
  public readonly args: CreateTransactionWithHashPayloadBCSArguments;

  constructor(
    multisig_account: AccountAddressInput, // address
    payload_hash: HexInput // vector<u8>
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      payload_hash: MoveVector.U8(payload_hash),
    };
  }
}

export type CreateWithExistingAccountPayloadBCSArguments = {
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
  public readonly args: CreateWithExistingAccountPayloadBCSArguments;

  constructor(
    multisig_address: AccountAddressInput, // address
    owners: Array<AccountAddressInput>, // vector<address>
    num_signatures_required: Uint64, // u64
    account_scheme: Uint8, // u8
    account_public_key: HexInput, // vector<u8>
    create_multisig_account_signed_message: HexInput, // vector<u8>
    metadata_keys: Array<string>, // vector<0x1::string::String>
    metadata_values: Array<HexInput> // vector<vector<u8>>
  ) {
    super();
    this.args = {
      multisig_address: AccountAddress.fromRelaxed(multisig_address),
      owners: new MoveVector(
        owners.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
      num_signatures_required: new U64(num_signatures_required),
      account_scheme: new U8(account_scheme),
      account_public_key: MoveVector.U8(account_public_key),
      create_multisig_account_signed_message: MoveVector.U8(
        create_multisig_account_signed_message
      ),
      metadata_keys: new MoveVector(
        metadata_keys.map((argA) => new MoveString(argA))
      ),
      metadata_values: new MoveVector(
        metadata_values.map((argA) => MoveVector.U8(argA))
      ),
    };
  }
}

export type CreateWithExistingAccountAndRevokeAuthKeyPayloadBCSArguments = {
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
  public readonly functionName =
    "create_with_existing_account_and_revoke_auth_key";
  public readonly args: CreateWithExistingAccountAndRevokeAuthKeyPayloadBCSArguments;

  constructor(
    multisig_address: AccountAddressInput, // address
    owners: Array<AccountAddressInput>, // vector<address>
    num_signatures_required: Uint64, // u64
    account_scheme: Uint8, // u8
    account_public_key: HexInput, // vector<u8>
    create_multisig_account_signed_message: HexInput, // vector<u8>
    metadata_keys: Array<string>, // vector<0x1::string::String>
    metadata_values: Array<HexInput> // vector<vector<u8>>
  ) {
    super();
    this.args = {
      multisig_address: AccountAddress.fromRelaxed(multisig_address),
      owners: new MoveVector(
        owners.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
      num_signatures_required: new U64(num_signatures_required),
      account_scheme: new U8(account_scheme),
      account_public_key: MoveVector.U8(account_public_key),
      create_multisig_account_signed_message: MoveVector.U8(
        create_multisig_account_signed_message
      ),
      metadata_keys: new MoveVector(
        metadata_keys.map((argA) => new MoveString(argA))
      ),
      metadata_values: new MoveVector(
        metadata_values.map((argA) => MoveVector.U8(argA))
      ),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type CreateWithOwnersPayloadBCSArguments = {
  arg_1: MoveVector<AccountAddress>;
  arg_2: U64;
  arg_3: MoveVector<MoveString>;
  arg_4: MoveVector<MoveVector<U8>>;
};

export class CreateWithOwners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_with_owners";
  public readonly args: CreateWithOwnersPayloadBCSArguments;

  constructor(
    arg_1: Array<AccountAddressInput>, // vector<address>
    arg_2: Uint64, // u64
    arg_3: Array<string>, // vector<0x1::string::String>
    arg_4: Array<HexInput> // vector<vector<u8>>
  ) {
    super();
    this.args = {
      arg_1: new MoveVector(
        arg_1.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
      arg_2: new U64(arg_2),
      arg_3: new MoveVector(arg_3.map((argA) => new MoveString(argA))),
      arg_4: new MoveVector(arg_4.map((argA) => MoveVector.U8(argA))),
    };
  }
}

// let bootstrapper: AccountAuthenticator | undefined; // &signer
export type CreateWithOwnersThenRemoveBootstrapperPayloadBCSArguments = {
  owners: MoveVector<AccountAddress>;
  num_signatures_required: U64;
  metadata_keys: MoveVector<MoveString>;
  metadata_values: MoveVector<MoveVector<U8>>;
};

export class CreateWithOwnersThenRemoveBootstrapper extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "create_with_owners_then_remove_bootstrapper";
  public readonly args: CreateWithOwnersThenRemoveBootstrapperPayloadBCSArguments;

  constructor(
    owners: Array<AccountAddressInput>, // vector<address>
    num_signatures_required: Uint64, // u64
    metadata_keys: Array<string>, // vector<0x1::string::String>
    metadata_values: Array<HexInput> // vector<vector<u8>>
  ) {
    super();
    this.args = {
      owners: new MoveVector(
        owners.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
      num_signatures_required: new U64(num_signatures_required),
      metadata_keys: new MoveVector(
        metadata_keys.map((argA) => new MoveString(argA))
      ),
      metadata_values: new MoveVector(
        metadata_values.map((argA) => MoveVector.U8(argA))
      ),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type ExecuteRejectedTransactionPayloadBCSArguments = {
  arg_1: AccountAddress;
};

export class ExecuteRejectedTransaction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "execute_rejected_transaction";
  public readonly args: ExecuteRejectedTransactionPayloadBCSArguments;

  constructor(
    arg_1: AccountAddressInput // address
  ) {
    super();
    this.args = {
      arg_1: AccountAddress.fromRelaxed(arg_1),
    };
  }
}

// let owner: AccountAuthenticator | undefined; // &signer
export type RejectTransactionPayloadBCSArguments = {
  multisig_account: AccountAddress;
  sequence_number: U64;
};

export class RejectTransaction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "reject_transaction";
  public readonly args: RejectTransactionPayloadBCSArguments;

  constructor(
    multisig_account: AccountAddressInput, // address
    sequence_number: Uint64 // u64
  ) {
    super();
    this.args = {
      multisig_account: AccountAddress.fromRelaxed(multisig_account),
      sequence_number: new U64(sequence_number),
    };
  }
}

// let multisig_account: AccountAuthenticator | undefined; // &signer
export type RemoveOwnerPayloadBCSArguments = {
  owner_to_remove: AccountAddress;
};

export class RemoveOwner extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "remove_owner";
  public readonly args: RemoveOwnerPayloadBCSArguments;

  constructor(
    owner_to_remove: AccountAddressInput // address
  ) {
    super();
    this.args = {
      owner_to_remove: AccountAddress.fromRelaxed(owner_to_remove),
    };
  }
}

// let arg_0: AccountAuthenticator | undefined; // &signer
export type RemoveOwnersPayloadBCSArguments = {
  arg_1: MoveVector<AccountAddress>;
};

export class RemoveOwners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "remove_owners";
  public readonly args: RemoveOwnersPayloadBCSArguments;

  constructor(
    arg_1: Array<AccountAddressInput> // vector<address>
  ) {
    super();
    this.args = {
      arg_1: new MoveVector(
        arg_1.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
    };
  }
}

// let multisig_account: AccountAuthenticator | undefined; // &signer
export type SwapOwnerPayloadBCSArguments = {
  to_swap_in: AccountAddress;
  to_swap_out: AccountAddress;
};

export class SwapOwner extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "swap_owner";
  public readonly args: SwapOwnerPayloadBCSArguments;

  constructor(
    to_swap_in: AccountAddressInput, // address
    to_swap_out: AccountAddressInput // address
  ) {
    super();
    this.args = {
      to_swap_in: AccountAddress.fromRelaxed(to_swap_in),
      to_swap_out: AccountAddress.fromRelaxed(to_swap_out),
    };
  }
}

// let multisig_account: AccountAuthenticator | undefined; // &signer
export type SwapOwnersPayloadBCSArguments = {
  to_swap_in: MoveVector<AccountAddress>;
  to_swap_out: MoveVector<AccountAddress>;
};

export class SwapOwners extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "swap_owners";
  public readonly args: SwapOwnersPayloadBCSArguments;

  constructor(
    to_swap_in: Array<AccountAddressInput>, // vector<address>
    to_swap_out: Array<AccountAddressInput> // vector<address>
  ) {
    super();
    this.args = {
      to_swap_in: new MoveVector(
        to_swap_in.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
      to_swap_out: new MoveVector(
        to_swap_out.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
    };
  }
}

// let multisig_account: AccountAuthenticator | undefined; // &signer
export type SwapOwnersAndUpdateSignaturesRequiredPayloadBCSArguments = {
  new_owners: MoveVector<AccountAddress>;
  owners_to_remove: MoveVector<AccountAddress>;
  new_num_signatures_required: U64;
};

export class SwapOwnersAndUpdateSignaturesRequired extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "swap_owners_and_update_signatures_required";
  public readonly args: SwapOwnersAndUpdateSignaturesRequiredPayloadBCSArguments;

  constructor(
    new_owners: Array<AccountAddressInput>, // vector<address>
    owners_to_remove: Array<AccountAddressInput>, // vector<address>
    new_num_signatures_required: Uint64 // u64
  ) {
    super();
    this.args = {
      new_owners: new MoveVector(
        new_owners.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
      owners_to_remove: new MoveVector(
        owners_to_remove.map((argA) => AccountAddress.fromRelaxed(argA))
      ),
      new_num_signatures_required: new U64(new_num_signatures_required),
    };
  }
}

// let multisig_account: AccountAuthenticator | undefined; // &signer
export type UpdateMetadataPayloadBCSArguments = {
  keys: MoveVector<MoveString>;
  values: MoveVector<MoveVector<U8>>;
};

export class UpdateMetadata extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "update_metadata";
  public readonly args: UpdateMetadataPayloadBCSArguments;

  constructor(
    keys: Array<string>, // vector<0x1::string::String>
    values: Array<HexInput> // vector<vector<u8>>
  ) {
    super();
    this.args = {
      keys: new MoveVector(keys.map((argA) => new MoveString(argA))),
      values: new MoveVector(values.map((argA) => MoveVector.U8(argA))),
    };
  }
}


// let arg_0: AccountAuthenticator | undefined; // &signer
export type VoteTransanctionPayloadBCSArguments = {
  arg_1: AccountAddress;
  arg_2: U64;
  arg_3: Bool;
};

export class VoteTransanction extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
  public readonly moduleName = "multisig_account";
  public readonly functionName = "vote_transanction";
  public readonly args: VoteTransanctionPayloadBCSArguments;

  constructor(
    arg_1: AccountAddressInput, // address
    arg_2: Uint64, // u64
    arg_3: boolean // bool
  ) {
    super();
    this.args = {
      arg_1: AccountAddress.fromRelaxed(arg_1),
      arg_2: new U64(arg_2),
      arg_3: new Bool(arg_3),
    };
  }
}

// let multisig_account: AccountAuthenticator | undefined; // &signer
export type AddOwnerPayloadBCSArguments = {
new_owner: AccountAddress;
}

export class AddOwner extends EntryFunctionPayloadBuilder {
public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
public readonly moduleName = "multisig_account";
public readonly functionName = "add_owner";
public readonly args: AddOwnerPayloadBCSArguments;

constructor(
new_owner: AccountAddressInput,  // address
) {
super();
this.args = {
new_owner: AccountAddress.fromRelaxed(new_owner),
}
}

}
// let arg_0: AccountAuthenticator | undefined; // &signer
export type AddOwnersPayloadBCSArguments = {
arg_1: MoveVector<AccountAddress>;
}

export class AddOwners extends EntryFunctionPayloadBuilder {
public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
public readonly moduleName = "multisig_account";
public readonly functionName = "add_owners";
public readonly args: AddOwnersPayloadBCSArguments;

constructor(
arg_1: Array<AccountAddressInput>,  // vector<address>
) {
super();
this.args = {
arg_1: new MoveVector(arg_1.map(argA => AccountAddress.fromRelaxed(argA))),
}
}

}
// let multisig_account: AccountAuthenticator | undefined; // &signer
export type AddOwnersAndUpdateSignaturesRequiredPayloadBCSArguments = {
new_owners: MoveVector<AccountAddress>;
new_num_signatures_required: U64;
}

export class AddOwnersAndUpdateSignaturesRequired extends EntryFunctionPayloadBuilder {
public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
public readonly moduleName = "multisig_account";
public readonly functionName = "add_owners_and_update_signatures_required";
public readonly args: AddOwnersAndUpdateSignaturesRequiredPayloadBCSArguments;

constructor(
new_owners: Array<AccountAddressInput>,  // vector<address>
new_num_signatures_required: Uint64,  // u64
) {
super();
this.args = {
new_owners: new MoveVector(new_owners.map(argA => AccountAddress.fromRelaxed(argA))),
new_num_signatures_required: new U64(new_num_signatures_required),
}
}

}
// let multisig_account: AccountAuthenticator | undefined; // &signer
export type RemoveOwnerPayloadBCSArguments = {
owner_to_remove: AccountAddress;
}

export class RemoveOwner extends EntryFunctionPayloadBuilder {
public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
public readonly moduleName = "multisig_account";
public readonly functionName = "remove_owner";
public readonly args: RemoveOwnerPayloadBCSArguments;

constructor(
owner_to_remove: AccountAddressInput,  // address
) {
super();
this.args = {
owner_to_remove: AccountAddress.fromRelaxed(owner_to_remove),
}
}

}
// let arg_0: AccountAuthenticator | undefined; // &signer
export type RemoveOwnersPayloadBCSArguments = {
arg_1: MoveVector<AccountAddress>;
}

export class RemoveOwners extends EntryFunctionPayloadBuilder {
public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
public readonly moduleName = "multisig_account";
public readonly functionName = "remove_owners";
public readonly args: RemoveOwnersPayloadBCSArguments;

constructor(
arg_1: Array<AccountAddressInput>,  // vector<address>
) {
super();
this.args = {
arg_1: new MoveVector(arg_1.map(argA => AccountAddress.fromRelaxed(argA))),
}
}

}
// let multisig_account: AccountAuthenticator | undefined; // &signer
export type SwapOwnerPayloadBCSArguments = {
to_swap_in: AccountAddress;
to_swap_out: AccountAddress;
}

export class SwapOwner extends EntryFunctionPayloadBuilder {
public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
public readonly moduleName = "multisig_account";
public readonly functionName = "swap_owner";
public readonly args: SwapOwnerPayloadBCSArguments;

constructor(
to_swap_in: AccountAddressInput,  // address
to_swap_out: AccountAddressInput,  // address
) {
super();
this.args = {
to_swap_in: AccountAddress.fromRelaxed(to_swap_in),
to_swap_out: AccountAddress.fromRelaxed(to_swap_out),
}
}

}
// let multisig_account: AccountAuthenticator | undefined; // &signer
export type SwapOwnersPayloadBCSArguments = {
to_swap_in: MoveVector<AccountAddress>;
to_swap_out: MoveVector<AccountAddress>;
}

export class SwapOwners extends EntryFunctionPayloadBuilder {
public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
public readonly moduleName = "multisig_account";
public readonly functionName = "swap_owners";
public readonly args: SwapOwnersPayloadBCSArguments;

constructor(
to_swap_in: Array<AccountAddressInput>,  // vector<address>
to_swap_out: Array<AccountAddressInput>,  // vector<address>
) {
super();
this.args = {
to_swap_in: new MoveVector(to_swap_in.map(argA => AccountAddress.fromRelaxed(argA))),
to_swap_out: new MoveVector(to_swap_out.map(argA => AccountAddress.fromRelaxed(argA))),
}
}

}
// let multisig_account: AccountAuthenticator | undefined; // &signer
export type SwapOwnersAndUpdateSignaturesRequiredPayloadBCSArguments = {
new_owners: MoveVector<AccountAddress>;
owners_to_remove: MoveVector<AccountAddress>;
new_num_signatures_required: U64;
}

export class SwapOwnersAndUpdateSignaturesRequired extends EntryFunctionPayloadBuilder {
public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
public readonly moduleName = "multisig_account";
public readonly functionName = "swap_owners_and_update_signatures_required";
public readonly args: SwapOwnersAndUpdateSignaturesRequiredPayloadBCSArguments;

constructor(
new_owners: Array<AccountAddressInput>,  // vector<address>
owners_to_remove: Array<AccountAddressInput>,  // vector<address>
new_num_signatures_required: Uint64,  // u64
) {
super();
this.args = {
new_owners: new MoveVector(new_owners.map(argA => AccountAddress.fromRelaxed(argA))),
owners_to_remove: new MoveVector(owners_to_remove.map(argA => AccountAddress.fromRelaxed(argA))),
new_num_signatures_required: new U64(new_num_signatures_required),
}
}

}
// let multisig_account: AccountAuthenticator | undefined; // &signer
export type UpdateMetadataPayloadBCSArguments = {
keys: MoveVector<MoveString>;
values: MoveVector<MoveVector<U8>>;
}

export class UpdateMetadata extends EntryFunctionPayloadBuilder {
public readonly moduleAddress = AccountAddress.fromRelaxed("0x1");
public readonly moduleName = "multisig_account";
public readonly functionName = "update_metadata";
public readonly args: UpdateMetadataPayloadBCSArguments;

constructor(
keys: Array<string>,  // vector<0x1::string::String>
values: Array<HexInput>,  // vector<vector<u8>>
) {
super();
this.args = {
keys: new MoveVector(keys.map(argA => new MoveString(argA))),
values: new MoveVector(values.map(argA => MoveVector.U8(argA))),
}
}

}

}