// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountAddress } from "../core";
import { HexInput } from "../types";

export type OneOrNone<T> = [T] | [];
export type AccountAddressInput = HexInput | AccountAddress;
