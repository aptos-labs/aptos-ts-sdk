// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress } from "../core";
import { HexInput, MoveFunction } from "../types";

export type OneOrNone<T> = [T] | [];
export type AccountAddressInput = HexInput | AccountAddress;

export type AbiFunctions = {
    moduleAddress: AccountAddress;
    moduleName: string;
    publicEntryFunctions: Array<MoveFunction>;
    privateEntryFunctions: Array<MoveFunction>;
    viewFunctions: Array<MoveFunction>;
  };
  