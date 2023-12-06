import { longTestTimeout } from "../../unit/helper";
import { Aptos } from "../../../src/api/aptos";
import { AptosConfig } from "../../../src/api/aptosConfig";
import { Account } from "../../../src/core";
import { Network } from "../../../src/utils/apiEndpoints";
import { InputGenerateTransactionPayloadData } from "../../../src/transactions/types";
import { TransactionWorker } from "../../../src/transactions/management/transactionWorker";

const aptosConfig = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(aptosConfig);

const sender = Account.generate();
const recipient = Account.generate();

describe("transactionWorker", () => {
  beforeAll(async () => {
    await aptos.fundAccount({ accountAddress: sender.accountAddress, amount: 1000000000 });
  });

  test(
    "throws when starting an already started worker",
    async () => {
      // start transactions worker
      const transactionWorker = new TransactionWorker(aptosConfig, sender);
      transactionWorker.start();
      expect(async () => {
        transactionWorker.start();
      }).rejects.toThrow("worker has already started");
    },
    longTestTimeout,
  );

  test(
    "throws when stopping an already stopped worker",
    async () => {
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
      const transactionWorker = new TransactionWorker(aptosConfig, sender);
      transactionWorker.start();
      const txn: InputGenerateTransactionPayloadData = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipient.accountAddress, 1],
      };
      transactionWorker.push(txn).then(() => {
        transactionWorker.stop();
        expect(transactionWorker.transactionsQueue.queue).toHaveLength(1);
      });
    },
    longTestTimeout,
  );

  test(
    "submits 5 transactions to chain for a single account",
    (done) => {
      // Specify the number of assertions expected
      expect.assertions(1);

      // create 5 transactions
      const txn: InputGenerateTransactionPayloadData = {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipient.accountAddress, 1],
      };
      const payloads = [...Array(5).fill(txn)];

      // start transactions worker
      const transactionWorker = new TransactionWorker(aptosConfig, sender);
      transactionWorker.start();

      // push transactions to queue
      for (const payload of payloads) {
        transactionWorker.push(payload);
      }

      // stop transaction worker for testing purposes.
      setTimeout(async () => {
        transactionWorker.stop();
        const accountData = await aptos.getAccountInfo({ accountAddress: sender.accountAddress });
        // call done() when all asynchronous operations are finished
        done();
        // expect sender sequence number to be 5
        expect(accountData.sequence_number).toBe("5");
      }, 1000 * 30);
    },
    longTestTimeout,
  );
});
