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

export type CountPayloadMoveArguments = {
  collection: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun count<T0: key>(
 *     collection: Object<T0>,
 *   )
 **/
export class Count extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "collection";
  public readonly functionName = "count";
  public readonly args: CountPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    collection: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      collection: AccountAddress.fromRelaxed(collection).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type CreatorPayloadMoveArguments = {
  collection: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun creator<T0: key>(
 *     collection: Object<T0>,
 *   )
 **/
export class Creator extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "collection";
  public readonly functionName = "creator";
  public readonly args: CreatorPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    collection: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      collection: AccountAddress.fromRelaxed(collection).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type DescriptionPayloadMoveArguments = {
  collection: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun description<T0: key>(
 *     collection: Object<T0>,
 *   )
 **/
export class Description extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "collection";
  public readonly functionName = "description";
  public readonly args: DescriptionPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    collection: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      collection: AccountAddress.fromRelaxed(collection).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type NamePayloadMoveArguments = {
  collection: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun name<T0: key>(
 *     collection: Object<T0>,
 *   )
 **/
export class Name extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "collection";
  public readonly functionName = "name";
  public readonly args: NamePayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    collection: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      collection: AccountAddress.fromRelaxed(collection).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
export type UriPayloadMoveArguments = {
  collection: ObjectAddress;
  typeTags: Array<TypeTag>;
};

/**
 *  public fun uri<T0: key>(
 *     collection: Object<T0>,
 *   )
 **/
export class Uri extends ViewFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.fromRelaxed("0x4");
  public readonly moduleName = "collection";
  public readonly functionName = "uri";
  public readonly args: UriPayloadMoveArguments;
  public readonly typeArgs: Array<TypeTag> = []; // T0: key

  constructor(
    collection: ObjectAddress, // Object<T0>
    typeTags: Array<TypeTagInput>, // T0: key
  ) {
    super();
    this.args = {
      collection: AccountAddress.fromRelaxed(collection).toString(),
      typeTags: typeTags.map((typeTag) => (typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag)),
    };
  }
}
