// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig, Aptos, Network, Account, TransactionResponse, UserTransactionResponse, U64 } from "../../../src";
import { FUND_AMOUNT } from "../../unit/helper";

// use it here since all tests use the same configuration
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

describe("transaction api", () => {
  test("it queries for the network estimated gas price", async () => {
    const data = await aptos.getGasPriceEstimation();
    expect(data).toHaveProperty("gas_estimate");
    expect(data).toHaveProperty("deprioritized_gas_estimate");
    expect(data).toHaveProperty("prioritized_gas_estimate");
  });

  test("returns true when transaction is pending", async () => {
    const senderAccount = Account.generate();
    await aptos.fundAccount({ accountAddress: senderAccount.accountAddress.toString(), amount: FUND_AMOUNT });
    const bob = Account.generate();
    const rawTxn = await aptos.generateTransaction({
      sender: senderAccount.accountAddress.toString(),
      data: {
        function: "0x1::aptos_account::transfer",
        arguments: [bob.accountAddress, new U64(10)],
      },
    });
    const authenticator = aptos.signTransaction({
      signer: senderAccount,
      transaction: rawTxn,
    });
    const response = await aptos.submitTransaction({
      transaction: rawTxn,
      senderAuthenticator: authenticator,
    });
    const isPending = await aptos.isPendingTransaction({ txnHash: response.hash });
    expect(isPending).toBeTruthy();
  });

  describe("fetch transaction queries", () => {
    let txn: TransactionResponse;
    beforeAll(async () => {
      const senderAccount = Account.generate();
      await aptos.fundAccount({ accountAddress: senderAccount.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const rawTxn = await aptos.generateTransaction({
        sender: senderAccount.accountAddress.toString(),
        data: {
          function: "0x1::aptos_account::transfer",
          arguments: [bob.accountAddress, new U64(10)],
        },
      });
      const authenticator = aptos.signTransaction({
        signer: senderAccount,
        transaction: rawTxn,
      });
      const response = await aptos.submitTransaction({
        transaction: rawTxn,
        senderAuthenticator: authenticator,
      });
      txn = await aptos.waitForTransaction({ txnHash: response.hash });
    });

    test("it queries for transactions on the chain", async () => {
      const transactions = await aptos.getTransactions();
      expect(transactions.length).toBeGreaterThan(0);
    });

    test("it queries for transactions by version", async () => {
      const transaction = await aptos.getTransactionByVersion({
        txnVersion: Number((txn as UserTransactionResponse).version),
      });
      expect(transaction).toStrictEqual(txn);
    });

    test("it queries for transactions by hash", async () => {
      const transaction = await aptos.getTransactionByHash({
        txnHash: (txn as UserTransactionResponse).hash,
      });
      expect(transaction).toStrictEqual(txn);
    });
  });
});
