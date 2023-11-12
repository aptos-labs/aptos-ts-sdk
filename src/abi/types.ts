// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAddressInput } from "../core";
import {
  MoveAbility,
  MoveFunction,
  MoveFunctionGenericTypeParam,
  Uint128,
  Uint16,
  Uint256,
  Uint32,
  Uint64,
  Uint8,
} from "../types";
import { Bool, MoveOption, MoveString, MoveVector, U128, U16, U256, U32, U64, U8 } from "../bcs";
import { AccountAuthenticator, TypeTag, TypeTagStruct } from "../transactions";

export type OneOrNone<T> = [T] | [];

export type AbiFunctions = {
  moduleAddress: AccountAddress;
  moduleName: string;
  publicEntryFunctions: Array<MoveFunctionWithArgumentNamesAndGenericTypes>;
  privateEntryFunctions: Array<MoveFunctionWithArgumentNamesAndGenericTypes>;
  viewFunctions: Array<MoveFunctionWithArgumentNamesAndGenericTypes>;
};

export type ArgumentNamesWithTypesAndGenericTypes = {
  genericTypes: string | null;
  argumentNamesWithTypes: Array<ArgumentNamesWithTypes>;
};

export type ArgumentNamesWithTypes = {
  argName: string;
  typeTag: string;
};

export type ModuleFunctionArgNameMap = Record<string, Record<string, ArgumentNamesWithTypesAndGenericTypes>>;

export type BCSKinds =
  | (typeof BCSClassesTypes)[keyof typeof BCSClassesTypes]["kind"]
  | "MoveObject"
  | "GenericType"
  | "EntryFunctionArgumentTypes";

export type GenericKind = `T${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | ""}`;

export type ObjectAddress = AccountAddressInput;
export type InputTypes =
  | boolean
  | Uint8
  | Uint16
  | Uint32
  | Uint64
  | Uint128
  | Uint256
  | AccountAddressInput
  | string
  | ObjectAddress
  | Array<InputTypes>;
export type TypeTagInput = string | TypeTag;

export type MoveFunctionWithArgumentNamesAndGenericTypes = MoveFunction & {
  genericTypes: string | null;
  argNames: Array<string>;
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

export type BCSKindsWithGeneric = Array<BCSKinds | GenericKind>;

/**
 * Tracks information about the entry function argument
 * @kindArray - the type of each argument inwards, e.g. MoveOption<MoveVector<u64>>> would be [MoveOption, MoveVector, U64]
 * @kindString - the string representation of the kind, aka its type
 * @annotation - the original Move argument TypeTag string
 */
export type BCSClassAnnotated = {
  kindArray: BCSKindsWithGeneric;
  kindString: string;
  annotation: string;
};

export type EntryFunctionArgumentSignature = {
  signerArguments: Array<BCSClassAnnotated>;
  functionArguments: Array<BCSClassAnnotated>;
  genericsWithAbilities: Array<string>;
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

export type ABIGeneratedCode = {
  address: string;
  name: string;
  code: string;
};

export type ABIGeneratedCodeMap = Record<string, ABIGeneratedCode>;

export type MoveObject = AccountAddress;

export type codeGeneratorOptions = {
  moduleAddress: AccountAddress;
  moduleName: string;
  functionName: string;
  className: string;
  typeTags: Array<TypeTag>;
  genericTypeTags: string | null; // as a string, not parsed yet
  genericTypeParams: Array<MoveFunctionGenericTypeParam>;
  viewFunction?: boolean;
  displaySignerArgsAsComments?: boolean;
  suppliedFieldNames?: Array<string>;
  visibility?: "public" | "private";
  documentation?: {
    displayFunctionSignature?: boolean;
    fullStructNames?: boolean;
  };
};
