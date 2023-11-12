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

export type AddPropertyPayloadMoveArguments = {
  token: MoveObject;
  key: MoveString;
  type: MoveString;
  value: MoveVector<U8>;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun add_property<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *     key: String,
 *     type: String,
 *     value: vector<u8>,
 *   )
 **/
export class AddProperty extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "add_property";
  public readonly args: AddPropertyPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    key: string, // String
    type: string, // String
    value: HexInput, // vector<u8>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      key: new MoveString(key),
      type: new MoveString(type),
      value: MoveVector.U8(value),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type AddTypedPropertyPayloadMoveArguments = {
  token: MoveObject;
  key: MoveString;
  value: EntryFunctionArgumentTypes;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun add_typed_property<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *     key: String,
 *     value: T1,
 *   )
 **/
export class AddTypedProperty extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "add_typed_property";
  public readonly args: AddTypedPropertyPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    key: string, // String
    value: EntryFunctionArgumentTypes, // T1
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      key: new MoveString(key),
      value: value,
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type BurnPayloadMoveArguments = {
  token: MoveObject;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun burn<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *   )
 **/
export class Burn extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "burn";
  public readonly args: BurnPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type CreateCollectionPayloadMoveArguments = {
  description: MoveString;
  max_supply: U64;
  name: MoveString;
  uri: MoveString;
  mutable_description: Bool;
  mutable_royalty: Bool;
  mutable_uri: Bool;
  mutable_token_description: Bool;
  mutable_token_name: Bool;
  mutable_token_properties: Bool;
  mutable_token_uri: Bool;
  tokens_burnable_by_creator: Bool;
  tokens_freezable_by_creator: Bool;
  royalty_numerator: U64;
  royalty_denominator: U64;
};

/**
 *  public fun create_collection<>(
 *     creator: &signer,
 *     description: String,
 *     max_supply: u64,
 *     name: String,
 *     uri: String,
 *     mutable_description: bool,
 *     mutable_royalty: bool,
 *     mutable_uri: bool,
 *     mutable_token_description: bool,
 *     mutable_token_name: bool,
 *     mutable_token_properties: bool,
 *     mutable_token_uri: bool,
 *     tokens_burnable_by_creator: bool,
 *     tokens_freezable_by_creator: bool,
 *     royalty_numerator: u64,
 *     royalty_denominator: u64,
 *   )
 **/
export class CreateCollection extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "create_collection";
  public readonly args: CreateCollectionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // creator: &signer,
    description: string, // String
    max_supply: Uint64, // u64
    name: string, // String
    uri: string, // String
    mutable_description: boolean, // bool
    mutable_royalty: boolean, // bool
    mutable_uri: boolean, // bool
    mutable_token_description: boolean, // bool
    mutable_token_name: boolean, // bool
    mutable_token_properties: boolean, // bool
    mutable_token_uri: boolean, // bool
    tokens_burnable_by_creator: boolean, // bool
    tokens_freezable_by_creator: boolean, // bool
    royalty_numerator: Uint64, // u64
    royalty_denominator: Uint64, // u64
  ) {
    super();
    this.args = {
      description: new MoveString(description),
      max_supply: new U64(max_supply),
      name: new MoveString(name),
      uri: new MoveString(uri),
      mutable_description: new Bool(mutable_description),
      mutable_royalty: new Bool(mutable_royalty),
      mutable_uri: new Bool(mutable_uri),
      mutable_token_description: new Bool(mutable_token_description),
      mutable_token_name: new Bool(mutable_token_name),
      mutable_token_properties: new Bool(mutable_token_properties),
      mutable_token_uri: new Bool(mutable_token_uri),
      tokens_burnable_by_creator: new Bool(tokens_burnable_by_creator),
      tokens_freezable_by_creator: new Bool(tokens_freezable_by_creator),
      royalty_numerator: new U64(royalty_numerator),
      royalty_denominator: new U64(royalty_denominator),
    };
  }
}
export type FreezeTransferPayloadMoveArguments = {
  token: MoveObject;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun freeze_transfer<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *   )
 **/
export class FreezeTransfer extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "freeze_transfer";
  public readonly args: FreezeTransferPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type MintPayloadMoveArguments = {
  collection: MoveString;
  description: MoveString;
  name: MoveString;
  uri: MoveString;
  property_keys: MoveVector<MoveString>;
  property_types: MoveVector<MoveString>;
  property_values: MoveVector<MoveVector<U8>>;
};

/**
 *  public fun mint<>(
 *     creator: &signer,
 *     collection: String,
 *     description: String,
 *     name: String,
 *     uri: String,
 *     property_keys: vector<String>,
 *     property_types: vector<String>,
 *     property_values: vector<vector<u8>>,
 *   )
 **/
export class Mint extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "mint";
  public readonly args: MintPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // creator: &signer,
    collection: string, // String
    description: string, // String
    name: string, // String
    uri: string, // String
    property_keys: Array<string>, // vector<String>
    property_types: Array<string>, // vector<String>
    property_values: Array<HexInput>, // vector<vector<u8>>
  ) {
    super();
    this.args = {
      collection: new MoveString(collection),
      description: new MoveString(description),
      name: new MoveString(name),
      uri: new MoveString(uri),
      property_keys: new MoveVector(property_keys.map((argA) => new MoveString(argA))),
      property_types: new MoveVector(property_types.map((argA) => new MoveString(argA))),
      property_values: new MoveVector(property_values.map((argA) => MoveVector.U8(argA))),
    };
  }
}
export type MintSoulBoundPayloadMoveArguments = {
  collection: MoveString;
  description: MoveString;
  name: MoveString;
  uri: MoveString;
  property_keys: MoveVector<MoveString>;
  property_types: MoveVector<MoveString>;
  property_values: MoveVector<MoveVector<U8>>;
  soul_bound_to: AccountAddress;
};

/**
 *  public fun mint_soul_bound<>(
 *     creator: &signer,
 *     collection: String,
 *     description: String,
 *     name: String,
 *     uri: String,
 *     property_keys: vector<String>,
 *     property_types: vector<String>,
 *     property_values: vector<vector<u8>>,
 *     soul_bound_to: address,
 *   )
 **/
export class MintSoulBound extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "mint_soul_bound";
  public readonly args: MintSoulBoundPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; //

  constructor(
    // creator: &signer,
    collection: string, // String
    description: string, // String
    name: string, // String
    uri: string, // String
    property_keys: Array<string>, // vector<String>
    property_types: Array<string>, // vector<String>
    property_values: Array<HexInput>, // vector<vector<u8>>
    soul_bound_to: AccountAddressInput, // address
  ) {
    super();
    this.args = {
      collection: new MoveString(collection),
      description: new MoveString(description),
      name: new MoveString(name),
      uri: new MoveString(uri),
      property_keys: new MoveVector(property_keys.map((argA) => new MoveString(argA))),
      property_types: new MoveVector(property_types.map((argA) => new MoveString(argA))),
      property_values: new MoveVector(property_values.map((argA) => MoveVector.U8(argA))),
      soul_bound_to: AccountAddress.fromRelaxed(soul_bound_to),
    };
  }
}
export type RemovePropertyPayloadMoveArguments = {
  token: MoveObject;
  key: MoveString;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun remove_property<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *     key: String,
 *   )
 **/
export class RemoveProperty extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "remove_property";
  public readonly args: RemovePropertyPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    key: string, // String
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      key: new MoveString(key),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type SetCollectionDescriptionPayloadMoveArguments = {
  collection: MoveObject;
  description: MoveString;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun set_collection_description<T0: key>(
 *     creator: &signer,
 *     collection: Object<T0>,
 *     description: String,
 *   )
 **/
export class SetCollectionDescription extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "set_collection_description";
  public readonly args: SetCollectionDescriptionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    collection: ObjectAddress, // Object<T0>
    description: string, // String
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      collection: AccountAddress.fromRelaxed(collection),
      description: new MoveString(description),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type SetCollectionUriPayloadMoveArguments = {
  collection: MoveObject;
  uri: MoveString;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun set_collection_uri<T0: key>(
 *     creator: &signer,
 *     collection: Object<T0>,
 *     uri: String,
 *   )
 **/
export class SetCollectionUri extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "set_collection_uri";
  public readonly args: SetCollectionUriPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    collection: ObjectAddress, // Object<T0>
    uri: string, // String
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      collection: AccountAddress.fromRelaxed(collection),
      uri: new MoveString(uri),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type SetDescriptionPayloadMoveArguments = {
  token: MoveObject;
  description: MoveString;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun set_description<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *     description: String,
 *   )
 **/
export class SetDescription extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "set_description";
  public readonly args: SetDescriptionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    description: string, // String
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      description: new MoveString(description),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type SetNamePayloadMoveArguments = {
  token: MoveObject;
  name: MoveString;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun set_name<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *     name: String,
 *   )
 **/
export class SetName extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "set_name";
  public readonly args: SetNamePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    name: string, // String
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      name: new MoveString(name),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type SetUriPayloadMoveArguments = {
  token: MoveObject;
  uri: MoveString;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun set_uri<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *     uri: String,
 *   )
 **/
export class SetUri extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "set_uri";
  public readonly args: SetUriPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    uri: string, // String
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      uri: new MoveString(uri),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type UnfreezeTransferPayloadMoveArguments = {
  token: MoveObject;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun unfreeze_transfer<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *   )
 **/
export class UnfreezeTransfer extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "unfreeze_transfer";
  public readonly args: UnfreezeTransferPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type UpdatePropertyPayloadMoveArguments = {
  token: MoveObject;
  key: MoveString;
  type: MoveString;
  value: MoveVector<U8>;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun update_property<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *     key: String,
 *     type: String,
 *     value: vector<u8>,
 *   )
 **/
export class UpdateProperty extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "update_property";
  public readonly args: UpdatePropertyPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    key: string, // String
    type: string, // String
    value: HexInput, // vector<u8>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      key: new MoveString(key),
      type: new MoveString(type),
      value: MoveVector.U8(value),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type UpdateTypedPropertyPayloadMoveArguments = {
  token: MoveObject;
  key: MoveString;
  value: EntryFunctionArgumentTypes;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun update_typed_property<T0: key>(
 *     creator: &signer,
 *     token: Object<T0>,
 *     key: String,
 *     value: T1,
 *   )
 **/
export class UpdateTypedProperty extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "update_typed_property";
  public readonly args: UpdateTypedPropertyPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    token: ObjectAddress, // Object<T0>
    key: string, // String
    value: EntryFunctionArgumentTypes, // T1
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      key: new MoveString(key),
      value: value,
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type SetCollectionRoyaltiesCallPayloadMoveArguments = {
  collection: MoveObject;
  royalty_numerator: U64;
  royalty_denominator: U64;
  payee_address: AccountAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  private fun set_collection_royalties_call<T0: key>(
 *     creator: &signer,
 *     collection: Object<T0>,
 *     royalty_numerator: u64,
 *     royalty_denominator: u64,
 *     payee_address: address,
 *   )
 **/
export class SetCollectionRoyaltiesCall extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "set_collection_royalties_call";
  public readonly args: SetCollectionRoyaltiesCallPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    // creator: &signer,
    collection: ObjectAddress, // Object<T0>
    royalty_numerator: Uint64, // u64
    royalty_denominator: Uint64, // u64
    payee_address: AccountAddressInput, // address
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      collection: AccountAddress.fromRelaxed(collection),
      royalty_numerator: new U64(royalty_numerator),
      royalty_denominator: new U64(royalty_denominator),
      payee_address: AccountAddress.fromRelaxed(payee_address),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}

export type ArePropertiesMutablePayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun are_properties_mutable<T0: key>(
 *     token: Object<T0>,
 *   )
 **/
export class ArePropertiesMutable extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "are_properties_mutable";
  public readonly args: ArePropertiesMutablePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type IsBurnablePayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun is_burnable<T0: key>(
 *     token: Object<T0>,
 *   )
 **/
export class IsBurnable extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "is_burnable";
  public readonly args: IsBurnablePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type IsFreezableByCreatorPayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun is_freezable_by_creator<T0: key>(
 *     token: Object<T0>,
 *   )
 **/
export class IsFreezableByCreator extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "is_freezable_by_creator";
  public readonly args: IsFreezableByCreatorPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type IsMutableDescriptionPayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun is_mutable_description<T0: key>(
 *     token: Object<T0>,
 *   )
 **/
export class IsMutableDescription extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "is_mutable_description";
  public readonly args: IsMutableDescriptionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type IsMutableNamePayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun is_mutable_name<T0: key>(
 *     token: Object<T0>,
 *   )
 **/
export class IsMutableName extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "is_mutable_name";
  public readonly args: IsMutableNamePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type IsMutableUriPayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun is_mutable_uri<T0: key>(
 *     token: Object<T0>,
 *   )
 **/
export class IsMutableUri extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "aptos_token";
  public readonly functionName = "is_mutable_uri";
  public readonly args: IsMutableUriPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
