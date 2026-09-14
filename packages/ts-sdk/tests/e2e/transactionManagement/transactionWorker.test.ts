import { longTestTimeout } from "../../unit/helper.js";
import { Account } from "../../../src/account/index.js";
import { InputGenerateTransactionPayloadData } from "../../../src/transactions/types.js";
import { TransactionWorker } from "../../../src/transactions/management/transactionWorker.js";
import { TransactionResponseType, TypeTagAddress, TypeTagU64 } from "../../../src/index.js";
import { getAptosClient, waitUntil } from "../helper.js";

const { aptos, config: aptosConfig } = getAptosClient();

const recipient = Account.generate();

describe("transactionWorker", () => {
  const workers: TransactionWorker[] = [];

  afterEach(() => {
    for (const worker of workers) {
      if (worker.started) {
        worker.stop();
      }
    }
    workers.length = 0;
  });

  function createWorker(account: Account): TransactionWorker {
    const worker = new TransactionWorker(aptosConfig, account);
    workers.push(worker);
    return worker;
  }

  test(
    "throws when starting an already started worker",
    async () => {
      const transactionWorker = createWorker(Account.generate());
      transactionWorker.start();
      await expect(async () => {
        transactionWorker.start();
      }).rejects.toThrow("worker has already started");
    },
    longTestTimeout,
  );

  test(
    "throws when stopping an already stopped worker",
    async () => {
      const transactionWorker = createWorker(Account.generate());
      transactionWorker.start();
      transactionWorker.stop();
      await expect(async () => {
        transactionWorker.stop();
      }).rejects.toThrow("worker has already stopped");
    },
    longTestTimeout,
  );

  test(
    "adds transaction into the transactionsQueue",
    async () => {
      // Push before start so the worker cannot dequeue the payload before we assert.
      const transactionWorker = createWorker(Account.generate());
      const txn: InputGenerateTransactionPayloadData = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipient.accountAddress, 1],
      };
      await transactionWorker.push(txn);
      expect(transactionWorker.transactionsQueue.queue).toHaveLength(1);
    },
    longTestTimeout,
  );

  test(
    "submits 5 transactions to chain for a single account",
    async () => {
      const sender = Account.generate();
      await aptos.fundAccount({ accountAddress: sender.accountAddress, amount: 1_000_000_000 });

      const txn: InputGenerateTransactionPayloadData = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipient.accountAddress, 1],
      };
      const txnWithAbi: InputGenerateTransactionPayloadData = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipient.accountAddress, 1],
        abi: { typeParameters: [], parameters: [new TypeTagAddress(), new TypeTagU64()] },
      };
      const payloads = [...new Array(5).fill(txn), ...new Array(5).fill(txnWithAbi)];

      const transactionWorker = createWorker(sender);
      transactionWorker.start();

      for (const payload of payloads) {
        await transactionWorker.push(payload);
      }

      await waitUntil(
        async () => {
          const accountData = await aptos.getAccountInfo({ accountAddress: sender.accountAddress });
          return accountData.sequence_number === "10";
        },
        {
          timeoutMs: 90_000,
          timeoutMessage: "Transaction worker did not commit 10 transactions within 90s",
        },
      );

      transactionWorker.stop();
      const accountData = await aptos.getAccountInfo({ accountAddress: sender.accountAddress });
      expect(accountData.sequence_number).toBe("10");

      const txns = await aptos.getAccountTransactions({ accountAddress: sender.accountAddress });
      txns.forEach((userTxn) => {
        if (userTxn.type === TransactionResponseType.User) {
          expect(userTxn.success).toBe(true);
        } else {
          throw new Error(`Transaction is not a user transaction ${userTxn.type}`);
        }
      });
    },
    longTestTimeout,
  );
});
