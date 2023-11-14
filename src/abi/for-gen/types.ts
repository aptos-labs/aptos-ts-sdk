// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress, AccountAddressInput, Uint128, Uint16, Uint256, Uint32, Uint64, Uint8, TypeTag } from "../../";

export type Option<T> = [T] | [];

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

export type MoveObject = AccountAddress;
