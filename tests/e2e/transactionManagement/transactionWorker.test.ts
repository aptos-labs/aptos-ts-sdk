import { longTestTimeout } from "../../unit/helper";
import { Account } from "../../../src/account";
import { InputGenerateTransactionPayloadData } from "../../../src/transactions/types";
import { TransactionWorker } from "../../../src/transactions/management/transactionWorker";
import { TransactionResponseType, TypeTagAddress, TypeTagU64 } from "../../../src";
import { getAptosClient } from "../helper";

async function setup() {
  const { aptos, config: aptosConfig } = getAptosClient();
  const sender = Account.generate();
  const recipient = Account.generate();
  await aptos.fundAccount({ accountAddress: sender.accountAddress, amount: 1000000000 });
  return { aptos, aptosConfig, sender, recipient };
}

describe("transactionWorker", () => {
  test(
    "throws when starting an already started worker",
    async () => {
      const { aptosConfig, sender } = await setup();
      // start transactions worker
      const transactionWorker = new TransactionWorker(aptosConfig, sender);
      transactionWorker.start();
      expect(async () => {
        transactionWorker.start();
      }).rejects.toThrow("worker has already started");
      transactionWorker.stop();
    },
    longTestTimeout,
  );

  test(
    "throws when stopping an already stopped worker",
    async () => {
      const { aptosConfig, sender } = await setup();
      // start transactions worker
      const transactionWorker = new TransactionWorker(aptosConfig, sender);
      transactionWorker.start();
      transactionWorker.stop();
      expect(async () => {
        transactionWorker.stop();
      }).rejects.toThrow("worker has already stopped");
    },
    longTestTimeout,
  );

  test(
    "adds transaction into the transactionsQueue",
    async () => {
      const { aptosConfig, sender, recipient } = await setup();
      const transactionWorker = new TransactionWorker(aptosConfig, sender);
      transactionWorker.start();
      const txn: InputGenerateTransactionPayloadData = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipient.accountAddress, 1],
      };
      transactionWorker.push(txn);
      transactionWorker.stop();
      expect(transactionWorker.transactionsQueue.queue).toHaveLength(1);
    },
    longTestTimeout,
  );

  test(
    "submits 6 transactions to chain for a single account",
    async () => {
      const { aptos, aptosConfig, sender, recipient } = await setup();
      // Create transactions.
      const txn: InputGenerateTransactionPayloadData = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipient.accountAddress, 1],
      };
      // Create transactions with ABI.
      const txnWithAbi: InputGenerateTransactionPayloadData = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipient.accountAddress, 1],
        abi: { typeParameters: [], parameters: [new TypeTagAddress(), new TypeTagU64()] },
      };
      const txns = [...Array(3).fill(txn)];
      const txnsWithAbi = [...Array(3).fill(txnWithAbi)];
      const totalNumTxns = txns.length + txnsWithAbi.length;

      const transactionWorker = new TransactionWorker(aptosConfig, sender);

      // Push first half of transactions to queue.
      for (const payload of txns) {
        transactionWorker.push(payload);
      }

      // Start transactions worker.
      transactionWorker.start();

      // Push second half of transactions to queue, to demonstrate you can keep pushing
      // after the worker has started.
      for (const payload of txnsWithAbi) {
        transactionWorker.push(payload);
      }

      // Wait up to 30 seconds for all transactions to be sent and executed.
      const startTime = Date.now();
      const timeoutMs = 30 * 1000;
      while (transactionWorker.executedTransactions.length < totalNumTxns) {
        if (Date.now() > startTime + timeoutMs) {
          throw new Error(`Timed out waiting for transactions to be sent after ${timeoutMs / 1000} seconds`);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Stop the worker.
      transactionWorker.stop();

      // Ensure the sequence number is appropriate for the number of txn we submitted.
      const accountData = await aptos.getAccountInfo({ accountAddress: sender.accountAddress });
      expect(accountData.sequence_number).toBe(`${totalNumTxns}`);

      // Check all are successful
      const accountTxns = await aptos.getAccountTransactions({ accountAddress: sender.accountAddress });
      expect(accountTxns.length).toBe(totalNumTxns);
      accountTxns.forEach((userTxn) => {
        if (userTxn.type === TransactionResponseType.User) {
          expect(userTxn.success).toBe(true);
        } else {
          // All of these should be user transactions
          throw new Error(`Transaction is not a user transaction ${userTxn.type}`);
        }
      });
    },
    longTestTimeout,
  );
});
