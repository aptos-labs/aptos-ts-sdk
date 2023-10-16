// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/faucet}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptos_config";
import { postAptosFaucet } from "../client";
import { AccountAddress } from "../core";
import { HexInput } from "../types";
import { DEFAULT_TXN_TIMEOUT_SEC } from "../utils/const";
import { waitForTransaction } from "./transaction";

export async function fundAccount(args: {
  aptosConfig: AptosConfig;
  accountAddress: HexInput;
  amount: number;
  timeoutSecs?: number;
}): Promise<string> {
  const { aptosConfig, accountAddress, amount } = args;
  const timeoutSecs = args.timeoutSecs ?? DEFAULT_TXN_TIMEOUT_SEC;
  const { data } = await postAptosFaucet<any, { txn_hashes: Array<string> }>({
    aptosConfig,
    path: "fund",
    body: {
      address: AccountAddress.fromHexInput(accountAddress).toString(),
      amount,
    },
    originMethod: "fundAccount",
  });

  const txnHash = data.txn_hashes[0];

  await waitForTransaction({ aptosConfig, txnHash, extraArgs: { timeoutSecs } });

  return txnHash;
}
