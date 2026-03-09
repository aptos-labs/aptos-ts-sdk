// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { U64 } from "../bcs/move-primitives.js";
import type { AnyNumber } from "../bcs/types.js";
import type { AccountAddressInput } from "../core/account-address.js";
import { AccountAddress } from "../core/account-address.js";
import type { SimpleTransaction } from "../transactions/simple-transaction.js";
import type { AptosConfig } from "./config.js";
import { type BuildSimpleTransactionOptions, buildSimpleTransaction } from "./transaction.js";

/**
 * Builds a transaction to transfer APT coins from one account to another using `0x1::aptos_account::transfer_coins`.
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param sender - The address of the account sending the coins.
 * @param recipient - The address of the account receiving the coins.
 * @param amount - The amount of coins to transfer in Octas (1 APT = 10^8 Octas).
 * @param options - Optional transaction building parameters (gas, expiration, sequence number).
 * @returns A {@link SimpleTransaction} ready to be signed and submitted.
 */
export async function transferCoinTransaction(
  config: AptosConfig,
  sender: AccountAddressInput,
  recipient: AccountAddressInput,
  amount: AnyNumber,
  options?: BuildSimpleTransactionOptions,
): Promise<SimpleTransaction> {
  return buildSimpleTransaction(
    config,
    sender,
    {
      function: `0x1::aptos_account::transfer_coins`,
      typeArguments: [],
      functionArguments: [AccountAddress.from(recipient), new U64(amount)],
    },
    options,
  );
}
