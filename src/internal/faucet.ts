// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * This file contains the underlying implementations for exposed API surface in
 * the {@link api/faucet}. By moving the methods out into a separate file,
 * other namespaces and processes can access these methods without depending on the entire
 * faucet namespace and without having a dependency cycle error.
 */

import { AptosConfig } from "../api/aptosConfig";
import { postAptosFaucet } from "../client";
import { AccountAddress, AccountAddressInput } from "../core";
import { TransactionResponseType, UserTransactionResponse, WaitForTransactionOptions } from "../types";
import { DEFAULT_TXN_TIMEOUT_SEC } from "../utils/const";
import { waitForTransaction } from "./transaction";

export async

/**
 * Funds the specified account with the given amount of tokens.
 * This function is useful for providing initial tokens to an account for transaction purposes.
 * 
 * @param args - The arguments for funding the account.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.accountAddress - The address of the account to fund.
 * @param args.amount - The amount of tokens to fund the account with.
 * @param args.options - Optional parameters for the transaction.
 * @param args.options.timeoutSecs - The timeout in seconds for waiting for the transaction to complete.
 * @param args.options.checkSuccess - Whether to check if the transaction was successful.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Fund the account with 100 tokens
 *   const fundTxn = await aptos.fundAccount({
 *     aptosConfig: config,
 *     accountAddress: "0x1", // replace with a real account address
 *     amount: 100,
 *     options: { timeoutSecs: 30 } // specify your own timeout if needed
 *   });
 * 
 *   console.log("Funding transaction:", fundTxn);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function fundAccount(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  amount: number;
  options?: WaitForTransactionOptions;
}): Promise<UserTransactionResponse> {
  const { aptosConfig, accountAddress, amount, options } = args;
  const timeout = options?.timeoutSecs || DEFAULT_TXN_TIMEOUT_SEC;
  const { data } = await postAptosFaucet<any, { txn_hashes: Array<string> }>({
    aptosConfig,
    path: "fund",
    body: {
      address: AccountAddress.from(accountAddress).toString(),
      amount,
    },
    originMethod: "fundAccount",
  });

  const txnHash = data.txn_hashes[0];

  const res = await waitForTransaction({
    aptosConfig,
    transactionHash: txnHash,
    options: {
      timeoutSecs: timeout,
      checkSuccess: options?.checkSuccess,
    },
  });

  // Response is always User transaction for a user submitted transaction
  if (res.type === TransactionResponseType.User) {
    return res;
  }

  throw new Error(`Unexpected transaction received for fund account: ${res.type}`);
}