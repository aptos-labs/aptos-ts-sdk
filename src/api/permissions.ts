// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account } from "../account";
import { AccountAddressInput } from "../core";
import { getPermissions, requestPermissions } from "../internal/permissions";
import { InputGenerateTransactionOptions } from "../transactions/types";
import { AptosConfig } from "./aptosConfig";
import { SimpleTransaction } from "../transactions/instances/simpleTransaction";

/**
 * A class to handle all `ANS` operations
 */
export class Permissions {
  constructor(readonly config: AptosConfig) {}

  /**
   * Retrieve the primary name for an account. An account can have
   * multiple names that target it, but only a single name that is primary. An
   * account also may not have a primary name.
   *
   * @example
   * const name = await aptos.getPrimaryName({address: alice.accountAddress})
   * // name = test.aptos
   *
   * @param args.address - A AccountAddressInput (address) of the account
   *
   * @returns a string if the account has a primary name, undefined otherwise
   */
  async getPermissions(args: { address: AccountAddressInput }): Promise<string | undefined> {
    return getPermissions({ aptosConfig: this.config, ...args });
  }

  /**
   * Sets the primary name for the sender. An account can have
   * multiple names that target it, but only a single name that is primary. An
   * account also may not have a primary name.
   *
   * @example
   * await aptos.setPrimaryName({sender: alice, name: "test.aptos"})
   * const primaryName = await aptos.getPrimaryName({address: alice.accountAddress})
   * // primaryName = test.aptos
   *
   * @param args.sender - The sender account
   * @param args.name - A string of the name: test, test.apt, test.aptos, test.aptos.apt, etc.
   *
   * @returns SimpleTransaction
   */
  async requestPermissions(args: {
    sender: Account;
    name?: string;
    options?: InputGenerateTransactionOptions;
  }): Promise<SimpleTransaction> {
    return requestPermissions({ aptosConfig: this.config, ...args });
  }
}
