// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { post } from "../client/post.js";
import type { AccountAddressInput } from "../core/account-address.js";
import { AccountAddress } from "../core/account-address.js";
import { AptosApiType } from "../core/constants.js";
import type { AptosConfig } from "./config.js";
import { waitForTransaction } from "./transaction.js";
import type { UserTransactionResponse } from "./types.js";

/**
 * Funds an account with APT from the faucet. Only available on devnet and localnet networks.
 * Submits a faucet request and waits for the funding transaction to be committed.
 *
 * @param config - The Aptos configuration specifying which network and endpoints to use.
 * @param accountAddress - The address of the account to fund.
 * @param amount - The amount of APT to fund in Octas (1 APT = 10^8 Octas).
 * @param options - Optional parameters.
 * @param options.timeoutSecs - Maximum time to wait for the funding transaction to commit. Defaults to 20.
 * @param options.checkSuccess - If `true` (the default), throws if the funding transaction fails.
 * @returns The committed user transaction response for the funding transaction.
 * @throws Error if the network does not support a faucet (e.g. mainnet or testnet).
 *
 * @example
 * ```typescript
 * const config = new AptosConfig({ network: Network.DEVNET });
 * const txn = await fundAccount(config, "0x1", 100_000_000); // Fund 1 APT
 * ```
 */
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
    client: config.client,
  });

  const txnHash = response.data.txn_hashes[0];
  if (!txnHash) {
    throw new Error("Faucet response contained no transaction hashes");
  }
  const result = await waitForTransaction(config, txnHash, {
    timeoutSecs: options?.timeoutSecs,
    checkSuccess: options?.checkSuccess,
  });

  return result as UserTransactionResponse;
}
