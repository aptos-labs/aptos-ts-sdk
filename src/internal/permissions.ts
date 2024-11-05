// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/name}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * name namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { Account } from "../account";
import { AccountAddressInput } from "../core";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

export async function getPermissions(args: {
  aptosConfig: AptosConfig;
  address: AccountAddressInput;
}): Promise<string | undefined> {
  const { aptosConfig, address } = args;
}

export async function requestPermissions(args: {
  aptosConfig: AptosConfig;
  sender: Account;
}): Promise<SimpleTransaction> {
  const { aptosConfig, sender, name, options } = args;
  return transaction;
}
