// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, TransactionResponse, U64 } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";
import { getAptosClient } from "../helper";
import { longWaitForTransaction } from "../../../src/internal/transaction";

// use it here since all tests use the same configuration
const { aptos } = getAptosClient();

describe("transaction api", () => {
  test("it queries for the network estimated gas price", async () => {
    const data = await aptos.getGasPriceEstimation();
    expect(data).toHaveProperty("gas_estimate");
    expect(data).toHaveProperty("deprioritized_gas_estimate");
    expect(data).toHaveProperty("prioritized_gas_estimate");
  });

  test("returns true when transaction is pending", async () => {
    const senderAccount = Account.generate();
    await aptos.fundAccount({ accountAddress: senderAccount.accountAddress, amount: FUND_AMOUNT });
    const bob = Account.generate();
    const rawTxn = await aptos.transaction.build.simple({
      sender: senderAccount.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [bob.accountAddress, new U64(10)],
      },
    });
    const authenticator = aptos.transaction.sign({
      signer: senderAccount,
      transaction: rawTxn,
    });
    const response = await aptos.transaction.submit.simple({
      transaction: rawTxn,
      senderAuthenticator: authenticator,
    });
    const isPending = await aptos.isPendingTransaction({ transactionHash: response.hash });
    expect(isPending).toBeTruthy();
  });

  describe("fetch transaction queries", () => {
    let txn: TransactionResponse;
    beforeAll(async () => {
      const senderAccount = Account.generate();
      await aptos.fundAccount({ accountAddress: senderAccount.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const rawTxn = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [bob.accountAddress, new U64(10)],
        },
      });
      const authenticator = aptos.transaction.sign({
        signer: senderAccount,
        transaction: rawTxn,
      });
      const response = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator: authenticator,
      });
      txn = await aptos.waitForTransaction({ transactionHash: response.hash });
    });

    test("it queries for transactions on the chain", async () => {
      const transactions = await aptos.getTransactions();
      expect(transactions.length).toBeGreaterThan(0);
    });

    test("it queries for transactions by version", async () => {
      if (!("version" in txn)) {
        throw new Error("Transaction is still pending!");
      }

      const transaction = await aptos.getTransactionByVersion({
        ledgerVersion: Number(txn.version),
      });
      expect(transaction).toStrictEqual(txn);
    });

    test("it queries for transactions by hash", async () => {
      const transaction = await aptos.getTransactionByHash({
        transactionHash: txn.hash,
      });
      expect(transaction).toStrictEqual(txn);
    });
  });

  describe("long poll", () => {
    let txn: TransactionResponse;
    beforeAll(async () => {
      const senderAccount = Account.generate();
      await aptos.fundAccount({ accountAddress: senderAccount.accountAddress, amount: FUND_AMOUNT });
      const bob = Account.generate();
      const rawTxn = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [bob.accountAddress, 10],
        },
      });
      const authenticator = aptos.transaction.sign({
        signer: senderAccount,
        transaction: rawTxn,
      });
      const response = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator: authenticator,
      });
      txn = await longWaitForTransaction({ aptosConfig: aptos.config, transactionHash: response.hash });
    });

    test("it queries for transactions by hash", async () => {
      const transaction = await aptos.getTransactionByHash({
        transactionHash: txn.hash,
      });
      expect(transaction).toStrictEqual(txn);
    });
  });
});
