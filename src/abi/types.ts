// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress } from "../core";
import { HexInput, MoveFunction } from "../types";
import { Bool, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../bcs";
import { AccountAuthenticator, TypeTagStruct } from "../transactions";

export type OneOrNone<T> = [T] | [];

export type AbiFunctions = {
  moduleAddress: AccountAddress;
  moduleName: string;
  publicEntryFunctions: Array<MoveFunctionWithArgumentNames>;
  privateEntryFunctions: Array<MoveFunctionWithArgumentNames>;
  viewFunctions: Array<MoveFunctionWithArgumentNames>;
};

export type ArgumentNamesWithTypes = {
  argName: string;
  typeTag: string;
};

export type ModuleFunctionArgNameMap = Record<string, Record<string, Array<ArgumentNamesWithTypes>>>;

export type BCSKinds = typeof BCSClassesTypes[keyof typeof BCSClassesTypes]["kind"] | "MoveObject";

export type MoveFunctionWithArgumentNames = MoveFunction & {
  arg_names: Array<string>;
};

export type ModuleMetadata = {
  name: string;
  source: string;
};

export type PackageMetadata = {
  name: string;
  modules: ModuleMetadata[];
};

export type PackageSourceCode = {
  name: string;
  source: string;
};

/**
 * Tracks information about the entry function argument
 * @kindArray - the type of each argument inwards, e.g. MoveOption<MoveVector<u64>>> would be [MoveOption, MoveVector, U64]
 * @kindString - the string representation of the kind, aka its type
 * @annotation - the original Move argument TypeTag string
 */
export type BCSClassAnnotated = {
  kindArray: Array<BCSKinds>;
  kindString: string;
  annotation: string;
};

export type EntryFunctionArgumentSignature = {
  signerArguments: Array<BCSClassAnnotated>;
  functionArguments: Array<BCSClassAnnotated>;
};

export const BCSClassesTypes = {
  Bool,
  U8,
  U16,
  U32,
  U64,
  U128,
  U256,
  AccountAddress,
  MoveString,
  MoveVector,
  MoveOption,
  TypeTagStruct,
  AccountAuthenticator,
};
