// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { U64 } from "../bcs/move-primitives.js";
import type { AnyNumber } from "../bcs/types.js";
import type { AccountAddressInput } from "../core/account-address.js";
import { AccountAddress } from "../core/account-address.js";
import type { SimpleTransaction } from "../transactions/simple-transaction.js";
import type { AptosConfig } from "./config.js";
import { type BuildSimpleTransactionOptions, buildSimpleTransaction } from "./transaction.js";
import type { MoveStructId } from "./types.js";

export async function transferCoinTransaction(
  config: AptosConfig,
  sender: AccountAddressInput,
  recipient: AccountAddressInput,
  amount: AnyNumber,
  _coinType?: MoveStructId,
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
