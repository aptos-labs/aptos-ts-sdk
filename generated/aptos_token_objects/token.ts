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

export type CollectionNamePayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun collection_name<T0: key>(
 *     token: Object<T0><T0>,
 *   )
 **/
export class CollectionName extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "token";
  public readonly functionName = "collection_name";
  public readonly args: CollectionNamePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0><T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type CollectionObjectPayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun collection_object<T0: key>(
 *     token: Object<T0><T0>,
 *   )
 **/
export class CollectionObject extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "token";
  public readonly functionName = "collection_object";
  public readonly args: CollectionObjectPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0><T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type CreatorPayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun creator<T0: key>(
 *     token: Object<T0><T0>,
 *   )
 **/
export class Creator extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "token";
  public readonly functionName = "creator";
  public readonly args: CreatorPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0><T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type DescriptionPayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun description<T0: key>(
 *     token: Object<T0><T0>,
 *   )
 **/
export class Description extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "token";
  public readonly functionName = "description";
  public readonly args: DescriptionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0><T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type NamePayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun name<T0: key>(
 *     token: Object<T0><T0>,
 *   )
 **/
export class Name extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "token";
  public readonly functionName = "name";
  public readonly args: NamePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0><T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type RoyaltyPayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun royalty<T0: key>(
 *     token: Object<T0><T0>,
 *   )
 **/
export class Royalty extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "token";
  public readonly functionName = "royalty";
  public readonly args: RoyaltyPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0><T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type UriPayloadMoveArguments = {
  token: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun uri<T0: key>(
 *     token: Object<T0><T0>,
 *   )
 **/
export class Uri extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "token";
  public readonly functionName = "uri";
  public readonly args: UriPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    token: ObjectAddress, // Object<T0><T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      token: AccountAddress.fromRelaxed(token),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
