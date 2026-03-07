// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { post } from "../client/post.js";
import type { AccountAddressInput } from "../core/account-address.js";
import { AccountAddress } from "../core/account-address.js";
import { AptosApiType } from "../core/constants.js";
import type { AptosConfig } from "./config.js";
import { waitForTransaction } from "./transaction.js";
import type { UserTransactionResponse } from "./types.js";

export async function fundAccount(
  config: AptosConfig,
  accountAddress: AccountAddressInput,
  amount: number,
  options?: { timeoutSecs?: number; checkSuccess?: boolean },
): Promise<UserTransactionResponse> {
  const url = config.getRequestUrl(AptosApiType.FAUCET);
  const address = AccountAddress.from(accountAddress).toString();

  const response = await post<{ txn_hashes: string[] }>({
    url,
    apiType: AptosApiType.FAUCET,
    path: "fund",
    originMethod: "fundAccount",
    body: { address, amount },
    overrides: config.getMergedFaucetConfig(),
  });

  const txnHash = response.data.txn_hashes[0];
  const result = await waitForTransaction(config, txnHash, {
    timeoutSecs: options?.timeoutSecs,
    checkSuccess: options?.checkSuccess,
  });

  return result as UserTransactionResponse;
}
